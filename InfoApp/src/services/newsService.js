// src/services/newsService.js - Naprawiony z prefiksami tabel
import { supabase, handleSupabaseError, handleSupabaseSuccess, getCurrentTimestamp } from './supabaseClient';

export const newsService = {
    // Pobierz wszystkie aktywne newsy
    // W newsService.js - fetchNews() TYMCZASOWO usuń filtr is_active:
    async fetchNews() {
        try {
            const { data, error } = await supabase
                .from('infoapp_news')
                .select('*')
                // .eq('is_active', true)  // ← TYMCZASOWO ZAKOMENTUJ TĘ LINIĘ
                .order('created_at', { ascending: false });

            if (error) throw error;
            return handleSupabaseSuccess(data, 'fetchNews');
        } catch (error) {
            return handleSupabaseError(error, 'fetchNews');
        }
    },

    // Dodaj nowy news
    async addNews(newsData) {
        try {
            const { data, error } = await supabase
                .from('infoapp_news')  // ← ZMIENIONE
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

    // Aktualizuj liczbę polubień
    // W newsService.js - zastąp updateLikesCount:

    async updateLikesCount(newsId, increment = true) {
        try {
            // Pobierz aktualną wartość
            const { data: current, error: fetchError } = await supabase
                .from('infoapp_news')
                .select('likes_count')
                .eq('id', newsId)
                .single();

            if (fetchError) throw fetchError;

            const currentCount = current.likes_count || 0;
            const newCount = increment
                ? currentCount + 1
                : Math.max(currentCount - 1, 0);

            console.log(`Updating likes count: ${currentCount} -> ${newCount}`);

            // Aktualizuj
            const { data, error } = await supabase
                .from('infoapp_news')
                .update({ likes_count: newCount })
                .eq('id', newsId)
                .select();

            if (error) throw error;
            return handleSupabaseSuccess(data[0], 'updateLikesCount');
        } catch (error) {
            return handleSupabaseError(error, 'updateLikesCount');
        }
    },
    // Aktualizuj liczbę komentarzy
    async updateCommentsCount(newsId, increment = true) {
        try {
            const { data, error } = await supabase
                .from('infoapp_news')  // ← ZMIENIONE
                .update({
                    comments_count: increment
                        ? supabase.raw('comments_count + 1')
                        : supabase.raw('comments_count - 1')
                })
                .eq('id', newsId)
                .select();

            if (error) throw error;
            return handleSupabaseSuccess(data[0], 'updateCommentsCount');
        } catch (error) {
            return handleSupabaseError(error, 'updateCommentsCount');
        }
    },

    // Pobierz newsy w czasie rzeczywistym
    subscribeToNews(callback) {
        const subscription = supabase
            .channel('news_changes')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'infoapp_news',  // ← ZMIENIONE
                    filter: 'is_active=eq.true'
                },
                callback
            )
            .subscribe();

        return subscription;
    },

    // Anuluj subskrypcję
    unsubscribeFromNews(subscription) {
        if (subscription) {
            supabase.removeChannel(subscription);
        }
    },

    // Wyszukaj newsy
    async searchNews(query) {
        try {
            const { data, error } = await supabase
                .from('infoapp_news')  // ← ZMIENIONE
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

    // Pobierz newsy według kategorii
    async getNewsByCategory(category) {
        try {
            const { data, error } = await supabase
                .from('infoapp_news')  // ← ZMIENIONE
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

    // Dodaj/usuń polubienie
    async toggleLike(newsId, userId, isLiked) {
        try {
            if (isLiked) {
                // USUŃ polubienie
                console.log('Removing like for:', newsId, userId);

                const { error } = await supabase
                    .from('infoapp_likes')
                    .delete()
                    .eq('post_id', newsId)
                    .eq('post_type', 'news')
                    .eq('user_id', userId);

                if (error) throw error;

                // Zmniejsz licznik
                await this.updateLikesCount(newsId, false);
            } else {
                // DODAJ polubienie
                console.log('Adding like for:', newsId, userId);

                // NAJPIERW sprawdź czy już nie istnieje
                const { data: existing } = await supabase
                    .from('infoapp_likes')
                    .select('id')
                    .eq('post_id', newsId)
                    .eq('post_type', 'news')
                    .eq('user_id', userId)
                    .limit(1);

                if (existing && existing.length > 0) {
                    console.log('Like already exists, skipping insert');
                    return handleSupabaseSuccess(null, 'toggleLike');
                }

                // Dodaj polubienie
                const { error } = await supabase
                    .from('infoapp_likes')
                    .insert([{
                        post_id: newsId,
                        post_type: 'news',
                        user_id: userId,
                        created_at: getCurrentTimestamp()
                    }]);

                // Jeśli jest duplikat (409), zignoruj błąd
                if (error && error.code !== '23505') {
                    throw error;
                }

                // Zwiększ licznik tylko jeśli nie było błędu duplikatu
                if (!error) {
                    await this.updateLikesCount(newsId, true);
                }
            }

            return handleSupabaseSuccess(null, 'toggleLike');
        } catch (error) {
            return handleSupabaseError(error, 'toggleLike');
        }
    },

    // Sprawdź czy użytkownik polubił post
    async checkIfLiked(newsId, userId) {
        try {
            const { data, error } = await supabase
                .from('infoapp_likes')  // ← ZMIENIONE
                .select('id')
                .eq('post_id', newsId)
                .eq('post_type', 'news')
                .eq('user_id', userId)
                .limit(1);

            if (error) throw error;
            return handleSupabaseSuccess(data.length > 0, 'checkIfLiked');
        } catch (error) {
            return handleSupabaseError(error, 'checkIfLiked');
        }
    }
};