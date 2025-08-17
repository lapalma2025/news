// src/api/politician/content-types/politician/lifecycles.ts
console.log("🚀 POLITICIAN LIFECYCLE LOADED!");

export default {
	async afterCreate(event: any) {
		console.log("🔥 POLITICIAN CREATE TRIGGERED");
		const { result } = event;

		if (result.publishedAt) {
			try {
				const supabaseService = strapi.service("common.supabase-sync" as any);
				await supabaseService.syncPoliticianToSupabase(result);
				console.log(`✅ Politician "${result.name}" synced to Supabase`);
			} catch (error) {
				console.error("❌ Failed to sync politician to Supabase:", error);
			}
		}
	},

	async afterUpdate(event: any) {
		console.log("🔥 POLITICIAN UPDATE TRIGGERED");
		const { result } = event;

		if (result.publishedAt) {
			try {
				const supabaseService = strapi.service("common.supabase-sync" as any);
				await supabaseService.syncPoliticianToSupabase(result);
				console.log(`✅ Politician "${result.name}" updated in Supabase`);
			} catch (error) {
				console.error("❌ Failed to update politician in Supabase:", error);
			}
		}
	},
};
