// src/services/newsService.js
import { supabase, handleSupabaseError, handleSupabaseSuccess, getCurrentTimestamp } from './supabaseClient';

export const newsService = {
    // === LISTA / ODCZYT ===
    async fetchNews() {
        try {
            const { data, error } = await supabase
                .from('infoapp_news')
                .select('*')
                // .eq('is_active', true) // jeśli chcesz filtrować tylko aktywne, odkomentuj
                .order('created_at', { ascending: false });

            if (error) throw error;
            return handleSupabaseSuccess(data, 'fetchNews');
        } catch (error) {
            return handleSupabaseError(error, 'fetchNews');
        }
    },

    // === DODAWANIE NEWSA ===
    async addNews(newsData) {
        try {
            const { data, error } = await supabase
                .from('infoapp_news')
                .insert([{
                    title: newsData.title,
                    content: newsData.content,
                    author: newsData.author,
                    category: newsData.category,
                    created_at: getCurrentTimestamp(),
                    updated_at: getCurrentTimestamp(),
                    likes_count: 0,
                    comments_count: 0,
                    is_active: true
                }])
                .select();

            if (error) throw error;
            return handleSupabaseSuccess(data[0], 'addNews');
        } catch (error) {
            return handleSupabaseError(error, 'addNews');
        }
    },

    // === (DEPRECATED) UPDATE LIKES — NIE DOTYKA LICZNIKA, TYLKO GO CZYTA ===
    // Zostawione, by nie psuć istniejących wywołań. Nie zmienia DB.
    async updateLikesCount(newsId /*, increment = true */) {
        try {
            const { data, error } = await supabase
                .from('infoapp_news')
                .select('likes_count')
                .eq('id', newsId)
                .single();

            if (error) throw error;
            // Zwracamy to, co jest w bazie (trigger dba o prawdę)
            return handleSupabaseSuccess({ likes_count: data?.likes_count ?? 0 }, 'updateLikesCount');
        } catch (error) {
            return handleSupabaseError(error, 'updateLikesCount');
        }
    },

    // === KOMENTARZE (pozostawione bez zmian — jeśli masz trigger także na comments, usuń raw-update) ===
    async updateCommentsCount(newsId, increment = true) {
        try {
            const { data, error } = await supabase
                .from('infoapp_news')
                .update({
                    // Uwaga: supabase.raw może nie być dostępne w Twojej wersji SDK.
                    // Jeśli używasz Postgresa z triggerem na comments, przenieś logikę do DB jak w lajkach.
                    comments_count: increment
                        ? supabase.raw('comments_count + 1')
                        : supabase.raw('GREATEST(comments_count - 1, 0)')
                })
                .eq('id', newsId)
                .select();

            if (error) throw error;
            return handleSupabaseSuccess(data[0], 'updateCommentsCount');
        } catch (error) {
            return handleSupabaseError(error, 'updateCommentsCount');
        }
    },

    // === SUBSKRYPCJA ZMIAN (opcjonalnie filtruj po is_active) ===
    subscribeToNews(callback) {
        const subscription = supabase
            .channel('news_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'infoapp_news',
                    // filter: 'is_active=eq.true'
                },
                callback
            )
            .subscribe();

        return subscription;
    },

    unsubscribeFromNews(subscription) {
        if (subscription) supabase.removeChannel(subscription);
    },

    // === WYSZUKIWANIE ===
    async searchNews(query) {
        try {
            const { data, error } = await supabase
                .from('infoapp_news')
                .select('*')
                .eq('is_active', true)
                .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return handleSupabaseSuccess(data, 'searchNews');
        } catch (error) {
            return handleSupabaseError(error, 'searchNews');
        }
    },

    // === KATEGORIE ===
    async getNewsByCategory(category) {
        try {
            const { data, error } = await supabase
                .from('infoapp_news')
                .select('*')
                .eq('is_active', true)
                .eq('category', category)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return handleSupabaseSuccess(data, 'getNewsByCategory');
        } catch (error) {
            return handleSupabaseError(error, 'getNewsByCategory');
        }
    },

    // === LIKE / UNLIKE — TYLKO INSERT/DELETE W infoapp_likes, BEZ UPDATE LICZNIKA ===
    async toggleLike(newsId, userId, isCurrentlyLiked) {
        try {
            console.log('toggleLike called:', { newsId, userId, isCurrentlyLiked });

            if (isCurrentlyLiked) {
                // --- UNLIKE ---
                const { error: deleteError } = await supabase
                    .from('infoapp_likes')
                    .delete()
                    .eq('post_id', newsId)
                    .eq('post_type', 'news')
                    .eq('user_id', userId);

                if (deleteError) throw deleteError;
            } else {
                // --- LIKE ---
                // Anti-dup: jeśli już istnieje, nie wstawiamy
                const { data: existingLike, error: checkErr } = await supabase
                    .from('infoapp_likes')
                    .select('id')
                    .eq('post_id', newsId)
                    .eq('post_type', 'news')
                    .eq('user_id', userId)
                    .limit(1);

                if (checkErr) throw checkErr;

                if (!existingLike || existingLike.length === 0) {
                    const { error: insertError } = await supabase
                        .from('infoapp_likes')
                        .insert([{
                            post_id: newsId,
                            post_type: 'news',
                            user_id: userId,
                            created_at: getCurrentTimestamp()
                        }]);

                    // 23505 = unique_violation — gdyby user kliknął 2x
                    if (insertError && insertError?.code !== '23505') throw insertError;
                } else {
                    console.log('Like already exists, skipping insert');
                }
            }

            // Po zadziałaniu triggera czytamy świeżą wartość (opcjonalne, Ty i tak robisz refetch)
            const { data: fresh, error: freshErr } = await supabase
                .from('infoapp_news')
                .select('likes_count')
                .eq('id', newsId)
                .single();

            if (freshErr) {
                console.warn('toggleLike fresh fetch warn:', freshErr);
                return handleSupabaseSuccess(null, 'toggleLike');
            }

            return handleSupabaseSuccess({ likes_count: fresh?.likes_count ?? null }, 'toggleLike');
        } catch (error) {
            console.error('toggleLike error:', error);
            return handleSupabaseError(error, 'toggleLike');
        }
    },

    // === SPRAWDZENIE STATUSU LIKE DLA UŻYTKOWNIKA ===
    async checkIfLiked(newsId, userId) {
        try {
            const { data, error } = await supabase
                .from('infoapp_likes')
                .select('id')
                .eq('post_id', newsId)
                .eq('post_type', 'news')
                .eq('user_id', userId)
                .limit(1);

            if (error) throw error;
            return handleSupabaseSuccess((data?.length ?? 0) > 0, 'checkIfLiked');
        } catch (error) {
            return handleSupabaseError(error, 'checkIfLiked');
        }
    }
};
