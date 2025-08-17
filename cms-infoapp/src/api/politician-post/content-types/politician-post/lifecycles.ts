// src/api/politician-post/content-types/politician-post/lifecycles.ts
import { createClient } from "@supabase/supabase-js";

console.log("🚀 POLITICIAN POST LIFECYCLE LOADED!");

const supabase = createClient(
	process.env.SUPABASE_URL || "https://ggtljdtdlhbdupjuednj.supabase.co",
	process.env.SUPABASE_SERVICE_KEY ||
		"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndGxqZHRkbGhiZHVwanVlZG5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDk5NTMyOSwiZXhwIjoyMDcwNTcxMzI5fQ.QjluUBpIoYXNh0JFuihDN8jvRoSOg8fuMVwqHEVqnww"
);

async function syncPoliticianPostToSupabase(strapiPost: any) {
	try {
		console.log("🔥 Syncing politician post to Supabase:", strapiPost.title);
		console.log("📋 Post data received:", JSON.stringify(strapiPost, null, 2));

		// Konwertuj Strapi Blocks na zwykły tekst (podobnie jak w news)
		function blocksToText(blocks: any[]): string {
			if (!blocks || !Array.isArray(blocks)) return "";

			return blocks
				.map((block) => {
					if (block.type === "paragraph" && block.children) {
						return block.children
							.map((child: any) => child.text || "")
							.join("");
					}
					return "";
				})
				.join("\n\n");
		}

		const contentText = blocksToText(strapiPost.content);

		// Sprawdź czy polityk istnieje, a jeśli nie - dodaj go
		let politicianInSupabase = null;

		if (strapiPost.politician) {
			console.log("👤 Processing politician:", strapiPost.politician.name);

			// Sprawdź czy polityk już istnieje w Supabase
			const { data: existingPolitician } = await supabase
				.from("infoapp_politicians")
				.select("id")
				.eq("name", strapiPost.politician.name)
				.single();

			if (existingPolitician) {
				politicianInSupabase = existingPolitician;
				console.log("✅ Politician found in Supabase:", existingPolitician.id);
			} else {
				// Dodaj polityka do Supabase
				console.log(
					"➕ Adding politician to Supabase:",
					strapiPost.politician.name
				);
				const { data: newPolitician, error: politicianError } = await supabase
					.from("infoapp_politicians")
					.insert([
						{
							name: strapiPost.politician.name,
							party: strapiPost.politician.party,
							photo_url: strapiPost.politician.photo?.url || null,
							created_at:
								strapiPost.politician.publishedAt || new Date().toISOString(),
							is_active: true,
						},
					])
					.select()
					.single();

				if (politicianError) {
					console.error("❌ Error adding politician:", politicianError);
					throw politicianError;
				}

				politicianInSupabase = newPolitician;
				console.log("✅ Politician added to Supabase:", newPolitician.id);
			}
		}

		if (!politicianInSupabase) {
			throw new Error("No politician data found or created");
		}

		const postData = {
			politician_id: politicianInSupabase.id,
			title: strapiPost.title,
			content: contentText, // Przekonwertowany tekst
			created_at: strapiPost.publishedAt || new Date().toISOString(),
			updated_at: strapiPost.updatedAt || new Date().toISOString(),
			likes_count: 0,
			comments_count: 0,
			is_active: true,
			notification_sent: false,
			read_by: [], // ← PUSTA TABLICA zamiast obiektu
		};

		console.log("📝 Post data to insert:", JSON.stringify(postData, null, 2));

		// Sprawdź czy wpis już istnieje
		const { data: existing } = await supabase
			.from("infoapp_politician_posts")
			.select("id")
			.eq("title", strapiPost.title)
			.eq("politician_id", politicianInSupabase.id)
			.single();

		if (existing) {
			// Update existing
			const { data, error } = await supabase
				.from("infoapp_politician_posts")
				.update(postData)
				.eq("id", existing.id)
				.select();

			if (error) {
				console.error("❌ Error updating politician post:", error);
				throw error;
			}

			console.log("✅ Politician post updated in Supabase:", data[0]?.id);
			return data[0];
		} else {
			// Insert new
			const { data, error } = await supabase
				.from("infoapp_politician_posts")
				.insert([postData])
				.select();

			if (error) {
				console.error("❌ Error inserting politician post:", error);
				throw error;
			}

			// Update Strapi with Supabase ID
			try {
				await strapi.entityService.update(
					"api::politician-post.politician-post",
					strapiPost.id,
					{
						data: { supabase_id: data[0].id },
					}
				);
			} catch (updateError) {
				console.warn(
					"⚠️ Could not update Strapi with Supabase ID:",
					updateError
				);
			}

			console.log("✅ Politician post added to Supabase:", data[0]?.id);
			return data[0];
		}
	} catch (error) {
		console.error("❌ Error syncing politician post to Supabase:", error);
		throw error;
	}
}

export default {
	async afterCreate(event: any) {
		console.log("🔥 POLITICIAN POST CREATE TRIGGERED");
		const { result } = event;

		if (result.publishedAt) {
			try {
				// Pobierz pełne dane z relacjami
				const fullPost = await strapi.entityService.findOne(
					"api::politician-post.politician-post",
					result.id,
					{ populate: ["politician"] }
				);

				await syncPoliticianPostToSupabase(fullPost);
				console.log(`✅ Politician post "${result.title}" synced to Supabase`);
			} catch (error) {
				console.error("❌ Failed to sync politician post to Supabase:", error);
			}
		} else {
			console.log("⚠️ Politician post not published yet, skipping sync");
		}
	},

	async afterUpdate(event: any) {
		console.log("🔥 POLITICIAN POST UPDATE TRIGGERED");
		const { result } = event;

		if (result.publishedAt) {
			try {
				const fullPost = await strapi.entityService.findOne(
					"api::politician-post.politician-post",
					result.id,
					{ populate: ["politician"] }
				);

				await syncPoliticianPostToSupabase(fullPost);
				console.log(`✅ Politician post "${result.title}" updated in Supabase`);
			} catch (error) {
				console.error(
					"❌ Failed to update politician post in Supabase:",
					error
				);
			}
		} else {
			console.log("⚠️ Politician post not published, skipping sync");
		}
	},
};
