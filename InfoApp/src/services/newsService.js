// src/services/newsService.js
import { supabase, handleSupabaseError, handleSupabaseSuccess, getCurrentTimestamp } from './supabaseClient';

export const newsService = {
    // Pobierz wszystkie aktywne newsy
    async fetchNews() {
        try {
            const { data, error } = await supabase
                .from('infoapp_news')
                .select('*')
                .eq('is_active', true)
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

    // Aktualizuj liczbę polubień
    async updateLikesCount(newsId, increment = true) {
        try {
            const { data, error } = await supabase.rpc('update_likes_count', {
                table_name: 'news',
                post_id: newsId,
                increment_value: increment ? 1 : -1
            });

            if (error) throw error;
            return handleSupabaseSuccess(data, 'updateLikesCount');
        } catch (error) {
            return handleSupabaseError(error, 'updateLikesCount');
        }
    },

    // Aktualizuj liczbę komentarzy
    async updateCommentsCount(newsId, increment = true) {
        try {
            const { data, error } = await supabase.rpc('update_comments_count', {
                table_name: 'news',
                post_id: newsId,
                increment_value: increment ? 1 : -1
            });

            if (error) throw error;
            return handleSupabaseSuccess(data, 'updateCommentsCount');
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
                    table: 'news',
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

    // Pobierz newsy według kategorii
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
    }
};