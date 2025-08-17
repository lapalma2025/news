// src/api/news/content-types/news/lifecycles.ts
import { createClient } from "@supabase/supabase-js";

console.log("🚀 NEWS LIFECYCLE LOADED!");

const supabase = createClient(
	process.env.SUPABASE_URL || "https://ggtljdtdlhbdupjuednj.supabase.co",
	process.env.SUPABASE_SERVICE_KEY ||
		"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndGxqZHRkbGhiZHVwanVlZG5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDk5NTMyOSwiZXhwIjoyMDcwNTcxMzI5fQ.QjluUBpIoYXNh0JFuihDN8jvRoSOg8fuMVwqHEVqnww"
);

async function syncNewsToSupabase(strapiNews: any) {
	try {
		console.log("🔥 Syncing news to Supabase:", strapiNews.title);

		// Konwertuj Strapi Blocks na zwykły tekst
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

		const contentText = blocksToText(strapiNews.content);

		const newsData = {
			title: strapiNews.title,
			content: contentText, // Przekonwertowany tekst
			author: strapiNews.author,
			category: strapiNews.category || "Inne",
			created_at: strapiNews.publishedAt || new Date().toISOString(),
			updated_at: strapiNews.updatedAt || new Date().toISOString(),
			likes_count: 0,
			comments_count: 0,
			is_active: true,
			is_urgent: strapiNews.is_breaking || false,
			notification_sent: false,
			read_by: {},
		};

		// Sprawdź czy już istnieje w Supabase
		const { data: existing } = await supabase
			.from("infoapp_news")
			.select("id")
			.eq("title", strapiNews.title)
			.single();

		if (existing) {
			// Update existing
			const { data, error } = await supabase
				.from("infoapp_news")
				.update(newsData)
				.eq("title", strapiNews.title)
				.select();

			if (error) throw error;
			console.log("✅ News updated in Supabase:", data[0]?.id);
			return data[0];
		} else {
			// Insert new
			const { data, error } = await supabase
				.from("infoapp_news")
				.insert([newsData])
				.select();

			if (error) throw error;

			// Update Strapi with Supabase ID
			await strapi.entityService.update("api::news.news", strapiNews.id, {
				data: { supabase_id: data[0].id },
			});

			console.log("✅ News added to Supabase:", data[0]?.id);
			return data[0];
		}
	} catch (error) {
		console.error("❌ Error syncing news to Supabase:", error);
		throw error;
	}
}

export default {
	async afterCreate(event: any) {
		console.log("🔥 NEWS CREATE TRIGGERED");
		const { result } = event;

		if (result.publishedAt) {
			try {
				await syncNewsToSupabase(result);
				console.log(`✅ News "${result.title}" synced to Supabase`);
			} catch (error) {
				console.error("❌ Failed to sync news to Supabase:", error);
			}
		} else {
			console.log("⚠️ News not published yet, skipping sync");
		}
	},

	async afterUpdate(event: any) {
		console.log("🔥 NEWS UPDATE TRIGGERED");
		const { result } = event;

		if (result.publishedAt) {
			try {
				await syncNewsToSupabase(result);
				console.log(`✅ News "${result.title}" updated in Supabase`);
			} catch (error) {
				console.error("❌ Failed to update news in Supabase:", error);
			}
		} else {
			console.log("⚠️ News not published, skipping sync");
		}
	},
};
