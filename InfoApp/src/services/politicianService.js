// src/services/politicianService.js
import { supabase, handleSupabaseError, handleSupabaseSuccess, getCurrentTimestamp } from './supabaseClient';

export const politicianService = {
    // === POLITICY ===
    async fetchPoliticians() {
        try {
            const { data, error } = await supabase
                .from('infoapp_politicians')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return handleSupabaseSuccess(data, 'fetchPoliticians');
        } catch (error) {
            return handleSupabaseError(error, 'fetchPoliticians');
        }
    },

    // === POSTY POLITYKÓW (z joinem do polityków) ===
    async fetchPoliticianPosts() {
        try {
            const { data, error } = await supabase
                .from('infoapp_politician_posts')
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

            const transformed = (data || []).map((post) => ({
                ...post,
                politician_name: post.infoapp_politicians?.name,
                politician_party: post.infoapp_politicians?.party,
                politician_photo: post.infoapp_politicians?.photo_url,
            }));

            return handleSupabaseSuccess(transformed, 'fetchPoliticianPosts');
        } catch (error) {
            return handleSupabaseError(error, 'fetchPoliticianPosts');
        }
    },

    // === DODAWANIE POLITYKA ===
    async addPolitician(politicianData) {
        try {
            const { data, error } = await supabase
                .from('infoapp_politicians')
                .insert([{
                    name: politicianData.name,
                    party: politicianData.party,
                    photo_url: politicianData.photo_url || null,
                    created_at: getCurrentTimestamp(),
                    is_active: true
                }])
                .select();

            if (error) throw error;
            return handleSupabaseSuccess(data?.[0], 'addPolitician');
        } catch (error) {
            return handleSupabaseError(error, 'addPolitician');
        }
    },

    // === DODAWANIE POSTA POLITYKA ===
    async addPoliticianPost(postData) {
        try {
            const { data, error } = await supabase
                .from('infoapp_politician_posts')
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
            return handleSupabaseSuccess(data?.[0], 'addPoliticianPost');
        } catch (error) {
            return handleSupabaseError(error, 'addPoliticianPost');
        }
    },

    // === POSTY KONKRETNEGO POLITYKA ===
    async getPoliticianPosts(politicianId) {
        try {
            const { data, error } = await supabase
                .from('infoapp_politician_posts')
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

            const transformed = (data || []).map((post) => ({
                ...post,
                politician_name: post.infoapp_politicians?.name,
                politician_party: post.infoapp_politicians?.party,
                politician_photo: post.infoapp_politicians?.photo_url,
            }));

            return handleSupabaseSuccess(transformed, 'getPoliticianPosts');
        } catch (error) {
            return handleSupabaseError(error, 'getPoliticianPosts');
        }
    },

    // === LIKE/UNLIKE DLA POLITYCZNYCH POSTÓW (BEZ 406) ===
    async toggleLike(postId, userId, isCurrentlyLiked) {
        try {
            console.log('politicianService.toggleLike:', { postId, userId, isCurrentlyLiked });

            // 1) Wstaw/usuń z infoapp_likes
            if (isCurrentlyLiked) {
                // UNLIKE
                const { error: delErr } = await supabase
                    .from('infoapp_likes')
                    .delete()
                    .eq('post_id', postId)
                    .eq('post_type', 'politician_post')
                    .eq('user_id', userId);

                if (delErr) throw delErr;
            } else {
                // LIKE (anti-dup)
                const { data: exists, error: checkErr } = await supabase
                    .from('infoapp_likes')
                    .select('id')
                    .eq('post_id', postId)
                    .eq('post_type', 'politician_post')
                    .eq('user_id', userId)
                    .limit(1);

                if (checkErr) throw checkErr;

                if (!exists || exists.length === 0) {
                    const { error: insErr } = await supabase
                        .from('infoapp_likes')
                        .insert([{
                            post_id: postId,
                            post_type: 'politician_post',
                            user_id: userId,
                            created_at: getCurrentTimestamp()
                        }]);
                    // 23505 = duplicate unique (gdyby klik podwójny)
                    if (insErr && insErr.code !== '23505') throw insErr;
                }
            }

            // 2) Policz świeży licznik z infoapp_likes
            const { count, error: cntErr } = await supabase
                .from('infoapp_likes')
                .select('id', { count: 'exact', head: true })
                .eq('post_id', postId)
                .eq('post_type', 'politician_post');

            if (cntErr) throw cntErr;
            const newCount = count ?? 0;

            // 3) Zapisz licznik do infoapp_politician_posts (TU JEST PRAWDZIWY PATCH z body)
            const { error: updErr } = await supabase
                .from('infoapp_politician_posts')
                .update({ likes_count: newCount })
                .eq('id', postId);

            if (updErr) throw updErr;

            // 4) Zwróć świeżą wartość
            return handleSupabaseSuccess({ likes_count: newCount }, 'toggleLike');
        } catch (error) {
            return handleSupabaseError(error, 'toggleLike');
        }
    },

    // === SPRAWDŹ CZY USER POLUBIŁ DANY POST POLITYKA ===
    async checkIfLiked(postId, userId) {
        try {
            const { data, error } = await supabase
                .from('infoapp_likes')
                .select('id')
                .eq('post_id', postId)
                .eq('post_type', 'politician_post')
                .eq('user_id', userId)
                .limit(1);

            if (error) throw error;
            return handleSupabaseSuccess((data?.length ?? 0) > 0, 'checkIfLiked');
        } catch (error) {
            return handleSupabaseError(error, 'checkIfLiked');
        }
    },

    // === KOMENTARZE LICZNIK (opcjonalnie) ===
    async updatePostCommentsCount(postId, increment = true) {
        try {
            const { data, error } = await supabase
                .from('infoapp_politician_posts')
                .update({
                    comments_count: increment
                        ? supabase.raw('COALESCE(comments_count,0) + 1')
                        : supabase.raw('GREATEST(COALESCE(comments_count,0) - 1, 0)'),
                })
                .eq('id', postId)
                .select();

            if (error) throw error;
            return handleSupabaseSuccess(data?.[0], 'updatePostCommentsCount');
        } catch (error) {
            return handleSupabaseError(error, 'updatePostCommentsCount');
        }
    },

    // === SUBSKRYPCJE (opcjonalnie) ===
    subscribeToPoliticianPosts(callback) {
        const subscription = supabase
            .channel('politician_posts_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'infoapp_politician_posts' },
                callback
            )
            .subscribe();
        return subscription;
    },

    unsubscribeFromPoliticianPosts(subscription) {
        if (subscription) supabase.removeChannel(subscription);
    },

    // === WYSZUKIWANIE ===
    async searchPoliticianPosts(query) {
        try {
            const { data, error } = await supabase
                .from('infoapp_politician_posts')
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

            const transformed = (data || []).map((post) => ({
                ...post,
                politician_name: post.infoapp_politicians?.name,
                politician_party: post.infoapp_politicians?.party,
                politician_photo: post.infoapp_politicians?.photo_url,
            }));

            return handleSupabaseSuccess(transformed, 'searchPoliticianPosts');
        } catch (error) {
            return handleSupabaseError(error, 'searchPoliticianPosts');
        }
    },

    // === PROSTE STATY ===
    async getPoliticianStats(politicianId) {
        try {
            const { data, error } = await supabase
                .from('infoapp_politician_posts')
                .select('likes_count, comments_count')
                .eq('politician_id', politicianId)
                .eq('is_active', true);

            if (error) throw error;

            const stats = (data || []).reduce(
                (acc, post) => ({
                    totalLikes: acc.totalLikes + (post.likes_count || 0),
                    totalComments: acc.totalComments + (post.comments_count || 0),
                    totalPosts: acc.totalPosts + 1,
                }),
                { totalLikes: 0, totalComments: 0, totalPosts: 0 }
            );

            return handleSupabaseSuccess(stats, 'getPoliticianStats');
        } catch (error) {
            return handleSupabaseError(error, 'getPoliticianStats');
        }
    },
};
