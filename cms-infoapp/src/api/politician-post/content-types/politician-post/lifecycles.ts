// src/api/politician-post/content-types/politician-post/lifecycles.ts
console.log("🚀 POLITICIAN POST LIFECYCLE LOADED!");

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

				const supabaseService = strapi.service("common.supabase-sync" as any);
				await supabaseService.syncPoliticianPostToSupabase(fullPost);
				console.log(`✅ Politician post "${result.title}" synced to Supabase`);
			} catch (error) {
				console.error("❌ Failed to sync politician post to Supabase:", error);
			}
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

				const supabaseService = strapi.service("common.supabase-sync" as any);
				await supabaseService.syncPoliticianPostToSupabase(fullPost);
				console.log(`✅ Politician post "${result.title}" updated in Supabase`);
			} catch (error) {
				console.error(
					"❌ Failed to update politician post in Supabase:",
					error
				);
			}
		}
	},
};
