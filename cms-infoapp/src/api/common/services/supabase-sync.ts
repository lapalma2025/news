// src/api/common/services/supabase-sync.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
	process.env.SUPABASE_URL || "https://ggtljdtdlhbdupjuednj.supabase.co",
	process.env.SUPABASE_SERVICE_KEY ||
		"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndGxqZHRkbGhiZHVwanVlZG5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDk5NTMyOSwiZXhwIjoyMDcwNTcxMzI5fQ.QjluUBpIoYXNh0JFuihDN8jvRoSOg8fuMVwqHEVqnww"
);

export default () => ({
	// Synchronizuj news ze Strapi do Supabase
	async syncNewsToSupabase(strapiNews: any) {
		try {
			console.log("🔥 Syncing news to Supabase:", strapiNews.title);

			const newsData = {
				title: strapiNews.title,
				content: strapiNews.content,
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
	},

	// Synchronizuj polityka ze Strapi do Supabase
	async syncPoliticianToSupabase(strapiPolitician: any) {
		try {
			console.log("🔥 Syncing politician to Supabase:", strapiPolitician.name);

			const politicianData = {
				name: strapiPolitician.name,
				party: strapiPolitician.party,
				photo_url: strapiPolitician.photo?.url,
				created_at: strapiPolitician.publishedAt || new Date().toISOString(),
				is_active: true,
			};

			const { data: existing } = await supabase
				.from("infoapp_politicians")
				.select("id")
				.eq("name", strapiPolitician.name)
				.single();

			if (existing) {
				const { data, error } = await supabase
					.from("infoapp_politicians")
					.update(politicianData)
					.eq("name", strapiPolitician.name)
					.select();

				if (error) throw error;
				console.log("✅ Politician updated in Supabase");
				return data[0];
			} else {
				const { data, error } = await supabase
					.from("infoapp_politicians")
					.insert([politicianData])
					.select();

				if (error) throw error;

				await strapi.entityService.update(
					"api::politician.politician",
					strapiPolitician.id,
					{
						data: { supabase_id: data[0].id },
					}
				);

				console.log("✅ Politician added to Supabase");
				return data[0];
			}
		} catch (error) {
			console.error("❌ Error syncing politician to Supabase:", error);
			throw error;
		}
	},

	// Synchronizuj wpis polityka ze Strapi do Supabase
	async syncPoliticianPostToSupabase(strapiPost: any) {
		try {
			console.log("🔥 Syncing politician post to Supabase:", strapiPost.title);

			// Znajdź supabase_id polityka po nazwie
			const { data: politicianInSupabase } = await supabase
				.from("infoapp_politicians")
				.select("id")
				.eq("name", strapiPost.politician.name)
				.single();

			if (!politicianInSupabase) {
				throw new Error(
					`Politician "${strapiPost.politician.name}" not found in Supabase`
				);
			}

			const postData = {
				politician_id: politicianInSupabase.id,
				title: strapiPost.title,
				content: strapiPost.content,
				created_at: strapiPost.publishedAt || new Date().toISOString(),
				updated_at: strapiPost.updatedAt || new Date().toISOString(),
				likes_count: 0,
				comments_count: 0,
				is_active: true,
				notification_sent: false,
				read_by: {},
			};

			const { data: existing } = await supabase
				.from("infoapp_politician_posts")
				.select("id")
				.eq("title", strapiPost.title)
				.single();

			if (existing) {
				const { data, error } = await supabase
					.from("infoapp_politician_posts")
					.update(postData)
					.eq("title", strapiPost.title)
					.select();

				if (error) throw error;
				console.log("✅ Politician post updated in Supabase");
				return data[0];
			} else {
				const { data, error } = await supabase
					.from("infoapp_politician_posts")
					.insert([postData])
					.select();

				if (error) throw error;

				await strapi.entityService.update(
					"api::politician-post.politician-post",
					strapiPost.id,
					{
						data: { supabase_id: data[0].id },
					}
				);

				console.log("✅ Politician post added to Supabase");
				return data[0];
			}
		} catch (error) {
			console.error("❌ Error syncing politician post to Supabase:", error);
			throw error;
		}
	},
});
