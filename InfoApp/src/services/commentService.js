// src/services/commentService.js - Serwis komentarzy
import { supabase, handleSupabaseError, handleSupabaseSuccess, getCurrentTimestamp } from './supabaseClient';

export const commentService = {
    // Pobierz komentarze dla konkretnego posta
    async fetchComments(postId, postType) {
        try {
            const { data, error } = await supabase
                .from('comments')
                .select('*')
                .eq('post_id', postId)
                .eq('post_type', postType)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return handleSupabaseSuccess(data, 'fetchComments');
        } catch (error) {
            return handleSupabaseError(error, 'fetchComments');
        }
    },

    // Dodaj komentarz
    async addComment(commentData) {
        try {
            const { data, error } = await supabase
                .from('comments')
                .insert([{
                    post_id: commentData.post_id,
                    post_type: commentData.post_type,
                    author_name: commentData.author_name,
                    content: commentData.content,
                    created_at: getCurrentTimestamp(),
                    is_active: true
                }])
                .select();

            if (error) throw error;
            return handleSupabaseSuccess(data[0], 'addComment');
        } catch (error) {
            return handleSupabaseError(error, 'addComment');
        }
    },

    // Usuń komentarz
    async deleteComment(commentId) {
        try {
            const { data, error } = await supabase
                .from('comments')
                .update({ is_active: false })
                .eq('id', commentId)
                .select();

            if (error) throw error;
            return handleSupabaseSuccess(data[0], 'deleteComment');
        } catch (error) {
            return handleSupabaseError(error, 'deleteComment');
        }
    },

    // Subskrypcja komentarzy w czasie rzeczywistym
    subscribeToComments(postId, postType, callback) {
        const subscription = supabase
            .channel('comments_changes')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'comments',
                    filter: `post_id=eq.${postId} AND post_type=eq.${postType} AND is_active=eq.true`
                },
                callback
            )
            .subscribe();

        return subscription;
    },

    // Anuluj subskrypcję
    unsubscribeFromComments(subscription) {
        if (subscription) {
            supabase.removeChannel(subscription);
        }
    }
};