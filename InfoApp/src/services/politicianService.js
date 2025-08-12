import { supabase, handleSupabaseError, handleSupabaseSuccess, getCurrentTimestamp } from './supabaseClient';

export const politicianService = {
    async fetchPoliticians() {
        try {
            const { data, error } = await supabase
                .from('politicians')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return handleSupabaseSuccess(data, 'fetchPoliticians');
        } catch (error) {
            return handleSupabaseError(error, 'fetchPoliticians');
        }
    },

    async fetchPoliticianPosts() {
        try {
            const { data, error } = await supabase
                .from('politician_posts')
                .select(`
          *,
          politicians (
            name,
            party,
            photo_url
          )
        `)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const transformedData = data.map(post => ({
                ...post,
                politician_name: post.politicians?.name,
                politician_party: post.politicians?.party,
                politician_photo: post.politicians?.photo_url,
            }));

            return handleSupabaseSuccess(transformedData, 'fetchPoliticianPosts');
        } catch (error) {
            return handleSupabaseError(error, 'fetchPoliticianPosts');
        }
    },

    // Dodaj nowego polityka
    async addPolitician(politicianData) {
        try {
            const { data, error } = await supabase
                .from('politicians')
                .insert([{
                    name: politicianData.name,
                    party: politicianData.party,
                    photo_url: politicianData.photo_url || null,
                    created_at: getCurrentTimestamp(),
                    is_active: true
                }])
                .select();

            if (error) throw error;
            return handleSupabaseSuccess(data[0], 'addPolitician');
        } catch (error) {
            return handleSupabaseError(error, 'addPolitician');
        }
    },

    async addPoliticianPost(postData) {
        try {
            const { data, error } = await supabase
                .from('politician_posts')
                .insert([{
                    politician_id: postData.politician_id,
                    title: postData.title,
                    content: postData.content,
                    created_at: getCurrentTimestamp(),
                    updated_at: getCurrentTimestamp(),
                    likes_count: 0,
                    comments_count: 0,
                    is_active: true
                }])
                .select();

            if (error) throw error;
            return handleSupabaseSuccess(data[0], 'addPoliticianPost');
        } catch (error) {
            return handleSupabaseError(error, 'addPoliticianPost');
        }
    },

    async getPoliticianPosts(politicianId) {
        try {
            const { data, error } = await supabase
                .from('politician_posts')
                .select(`
          *,
          politicians (
            name,
            party,
            photo_url
          )
        `)
                .eq('politician_id', politicianId)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const transformedData = data.map(post => ({
                ...post,
                politician_name: post.politicians?.name,
                politician_party: post.politicians?.party,
                politician_photo: post.politicians?.photo_url,
            }));

            return handleSupabaseSuccess(transformedData, 'getPoliticianPosts');
        } catch (error) {
            return handleSupabaseError(error, 'getPoliticianPosts');
        }
    },

    async updatePostLikesCount(postId, increment = true) {
        try {
            const { data, error } = await supabase.rpc('update_likes_count', {
                table_name: 'politician_posts',
                post_id: postId,
                increment_value: increment ? 1 : -1
            });

            if (error) throw error;
            return handleSupabaseSuccess(data, 'updatePostLikesCount');
        } catch (error) {
            return handleSupabaseError(error, 'updatePostLikesCount');
        }
    },

    // Aktualizuj liczbę komentarzy wpisu polityka
    async updatePostCommentsCount(postId, increment = true) {
        try {
            const { data, error } = await supabase.rpc('update_comments_count', {
                table_name: 'politician_posts',
                post_id: postId,
                increment_value: increment ? 1 : -1
            });

            if (error) throw error;
            return handleSupabaseSuccess(data, 'updatePostCommentsCount');
        } catch (error) {
            return handleSupabaseError(error, 'updatePostCommentsCount');
        }
    },

    // Subskrypcja wpisów polityków w czasie rzeczywistym
    subscribeToPoliticianPosts(callback) {
        const subscription = supabase
            .channel('politician_posts_changes')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'politician_posts',
                    filter: 'is_active=eq.true'
                },
                callback
            )
            .subscribe();

        return subscription;
    },

    // Anuluj subskrypcję
    unsubscribeFromPoliticianPosts(subscription) {
        if (subscription) {
            supabase.removeChannel(subscription);
        }
    },

    // Wyszukaj wpisy polityków
    async searchPoliticianPosts(query) {
        try {
            const { data, error } = await supabase
                .from('politician_posts')
                .select(`
          *,
          politicians (
            name,
            party,
            photo_url
          )
        `)
                .eq('is_active', true)
                .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const transformedData = data.map(post => ({
                ...post,
                politician_name: post.politicians?.name,
                politician_party: post.politicians?.party,
                politician_photo: post.politicians?.photo_url,
            }));

            return handleSupabaseSuccess(transformedData, 'searchPoliticianPosts');
        } catch (error) {
            return handleSupabaseError(error, 'searchPoliticianPosts');
        }
    },

    async getPoliticianStats(politicianId) {
        try {
            const { data, error } = await supabase
                .from('politician_posts')
                .select('likes_count, comments_count')
                .eq('politician_id', politicianId)
                .eq('is_active', true);

            if (error) throw error;

            const stats = data.reduce((acc, post) => ({
                totalLikes: acc.totalLikes + (post.likes_count || 0),
                totalComments: acc.totalComments + (post.comments_count || 0),
                totalPosts: acc.totalPosts + 1
            }), { totalLikes: 0, totalComments: 0, totalPosts: 0 });

            return handleSupabaseSuccess(stats, 'getPoliticianStats');
        } catch (error) {
            return handleSupabaseError(error, 'getPoliticianStats');
        }
    }
};