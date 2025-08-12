// src/services/politicianService.js - Naprawiony z prefiksami tabel
import { supabase, handleSupabaseError, handleSupabaseSuccess, getCurrentTimestamp } from './supabaseClient';

export const politicianService = {
    // Pobierz wszystkich aktywnych polityków
    async fetchPoliticians() {
        try {
            const { data, error } = await supabase
                .from('infoapp_politicians')  // ← ZMIENIONE
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return handleSupabaseSuccess(data, 'fetchPoliticians');
        } catch (error) {
            return handleSupabaseError(error, 'fetchPoliticians');
        }
    },

    // Pobierz wpisy polityków z danymi o politykach
    async fetchPoliticianPosts() {
        try {
            const { data, error } = await supabase
                .from('infoapp_politician_posts')  // ← ZMIENIONE
                .select(`
          *,
          infoapp_politicians (  
            name,
            party,
            photo_url
          )
        `)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Przekształć dane do płaskiej struktury
            const transformedData = data.map(post => ({
                ...post,
                politician_name: post.infoapp_politicians?.name,  // ← ZMIENIONE
                politician_party: post.infoapp_politicians?.party,  // ← ZMIENIONE
                politician_photo: post.infoapp_politicians?.photo_url,  // ← ZMIENIONE
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
                .from('infoapp_politicians')  // ← ZMIENIONE
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

    // Dodaj wpis polityka
    async addPoliticianPost(postData) {
        try {
            const { data, error } = await supabase
                .from('infoapp_politician_posts')  // ← ZMIENIONE
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

    // Pobierz wpisy konkretnego polityka
    async getPoliticianPosts(politicianId) {
        try {
            const { data, error } = await supabase
                .from('infoapp_politician_posts')  // ← ZMIENIONE
                .select(`
          *,
          infoapp_politicians (  
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
                politician_name: post.infoapp_politicians?.name,  // ← ZMIENIONE
                politician_party: post.infoapp_politicians?.party,  // ← ZMIENIONE
                politician_photo: post.infoapp_politicians?.photo_url,  // ← ZMIENIONE
            }));

            return handleSupabaseSuccess(transformedData, 'getPoliticianPosts');
        } catch (error) {
            return handleSupabaseError(error, 'getPoliticianPosts');
        }
    },

    // Aktualizuj liczbę polubień wpisu polityka
    async updatePostLikesCount(postId, increment = true) {
        try {
            const { data, error } = await supabase
                .from('infoapp_politician_posts')  // ← ZMIENIONE
                .update({
                    likes_count: increment
                        ? supabase.raw('likes_count + 1')
                        : supabase.raw('likes_count - 1')
                })
                .eq('id', postId)
                .select();

            if (error) throw error;
            return handleSupabaseSuccess(data[0], 'updatePostLikesCount');
        } catch (error) {
            return handleSupabaseError(error, 'updatePostLikesCount');
        }
    },

    // Aktualizuj liczbę komentarzy wpisu polityka
    async updatePostCommentsCount(postId, increment = true) {
        try {
            const { data, error } = await supabase
                .from('infoapp_politician_posts')  // ← ZMIENIONE
                .update({
                    comments_count: increment
                        ? supabase.raw('comments_count + 1')
                        : supabase.raw('comments_count - 1')
                })
                .eq('id', postId)
                .select();

            if (error) throw error;
            return handleSupabaseSuccess(data[0], 'updatePostCommentsCount');
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
                    table: 'infoapp_politician_posts',  // ← ZMIENIONE
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
                .from('infoapp_politician_posts')  // ← ZMIENIONE
                .select(`
          *,
          infoapp_politicians (  
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
                politician_name: post.infoapp_politicians?.name,  // ← ZMIENIONE
                politician_party: post.infoapp_politicians?.party,  // ← ZMIENIONE
                politician_photo: post.infoapp_politicians?.photo_url,  // ← ZMIENIONE
            }));

            return handleSupabaseSuccess(transformedData, 'searchPoliticianPosts');
        } catch (error) {
            return handleSupabaseError(error, 'searchPoliticianPosts');
        }
    },

    // Pobierz statystyki polityka
    async getPoliticianStats(politicianId) {
        try {
            const { data, error } = await supabase
                .from('infoapp_politician_posts')  // ← ZMIENIONE
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