// src/services/commentService.js - ROZSZERZONY O POLUBIENIA
import { supabase, handleSupabaseError, handleSupabaseSuccess, getCurrentTimestamp } from './supabaseClient';

export const commentService = {
    // ISTNIEJĄCE FUNKCJE (nie zmieniaj)
    async fetchComments(postId, postType) {
        try {
            const { data, error } = await supabase
                .from('infoapp_comments')
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

    async addComment(commentData) {
        try {
            const { data, error } = await supabase
                .from('infoapp_comments')
                .insert([{
                    post_id: commentData.post_id,
                    post_type: commentData.post_type,
                    author_name: commentData.author_name,
                    content: commentData.content,
                    user_id: commentData.user_id,
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

    async deleteComment(commentId) {
        try {
            const { error } = await supabase
                .from('infoapp_comments')
                .update({ is_active: false })
                .eq('id', commentId);

            if (error) throw error;
            return handleSupabaseSuccess(null, 'deleteComment');
        } catch (error) {
            return handleSupabaseError(error, 'deleteComment');
        }
    },

    // NOWE FUNKCJE DLA POLUBIEŃ KOMENTARZY
    async getCommentLikesCount(commentId) {
        try {
            const { count, error } = await supabase
                .from('infoapp_comment_likes')
                .select('*', { count: 'exact', head: true })
                .eq('comment_id', commentId);

            if (error) throw error;
            return handleSupabaseSuccess(count || 0, 'getCommentLikesCount');
        } catch (error) {
            return handleSupabaseError(error, 'getCommentLikesCount');
        }
    },

    async checkCommentLike(commentId, userId) {
        try {
            const { data, error } = await supabase
                .from('infoapp_comment_likes')
                .select('id')
                .eq('comment_id', commentId)
                .eq('user_id', userId)
                .limit(1);

            if (error) throw error;
            return handleSupabaseSuccess(data.length > 0, 'checkCommentLike');
        } catch (error) {
            return handleSupabaseError(error, 'checkCommentLike');
        }
    },

    async toggleCommentLike(commentId, userId, currentlyLiked) {
        try {
            // Konwertuj userId na string
            const userIdString = String(userId);

            if (currentlyLiked) {
                // Usuń polubienie
                const { error } = await supabase
                    .from('infoapp_comment_likes')
                    .delete()
                    .eq('comment_id', commentId)
                    .eq('user_id', userIdString);

                if (error) throw error;
            } else {
                // Dodaj polubienie
                const { error } = await supabase
                    .from('infoapp_comment_likes')
                    .insert([{
                        comment_id: commentId,
                        user_id: userIdString,
                        created_at: getCurrentTimestamp()
                    }]);

                if (error) throw error;
            }

            return handleSupabaseSuccess(null, 'toggleCommentLike');
        } catch (error) {
            return handleSupabaseError(error, 'toggleCommentLike');
        }
    },

    // REAL-TIME SUBSCRIPTIONS
    subscribeToComments(postId, postType, callback) {
        try {
            const channel = supabase
                .channel(`comments_${postId}_${postType}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'infoapp_comments',
                        filter: `post_id=eq.${postId}`
                    },
                    callback
                )
                .subscribe();

            return channel;
        } catch (error) {
            console.error('Error subscribing to comments:', error);
            return null;
        }
    },

    unsubscribeFromComments(subscription) {
        if (subscription) {
            try {
                supabase.removeChannel(subscription);
            } catch (error) {
                console.error('Error unsubscribing from comments:', error);
            }
        }
    },

    // DODATKOWE FUNKCJE POMOCNICZE
    async getCommentsCount(postId, postType) {
        try {
            const { count, error } = await supabase
                .from('infoapp_comments')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', postId)
                .eq('post_type', postType)
                .eq('is_active', true);

            if (error) throw error;
            return handleSupabaseSuccess(count || 0, 'getCommentsCount');
        } catch (error) {
            return handleSupabaseError(error, 'getCommentsCount');
        }
    },

    async updateComment(commentId, content) {
        try {
            const { data, error } = await supabase
                .from('infoapp_comments')
                .update({
                    content: content,
                    updated_at: getCurrentTimestamp()
                })
                .eq('id', commentId)
                .select();

            if (error) throw error;
            return handleSupabaseSuccess(data[0], 'updateComment');
        } catch (error) {
            return handleSupabaseError(error, 'updateComment');
        }
    },

    // FUNKCJE MODERACYJNE
    async reportComment(commentId, reason, reporterId) {
        try {
            // Konwertuj reporterId na string
            const reporterIdString = String(reporterId);

            const { data, error } = await supabase
                .from('infoapp_comment_reports')
                .insert([{
                    comment_id: commentId,
                    reason: reason,
                    reporter_id: reporterIdString,
                    created_at: getCurrentTimestamp()
                }])
                .select();

            if (error) throw error;
            return handleSupabaseSuccess(data[0], 'reportComment');
        } catch (error) {
            return handleSupabaseError(error, 'reportComment');
        }
    },

    async getUserComments(userId, limit = 20) {
        try {
            // Pobierz komentarze użytkownika przez author_name (jeśli nie ma user_id)
            const currentUser = await userService.getCurrentUser();
            if (!currentUser?.displayName) {
                return handleSupabaseSuccess([], 'getUserComments');
            }

            const { data, error } = await supabase
                .from('infoapp_comments')
                .select(`
                    *,
                    infoapp_news!inner(title, author),
                    politician_posts!inner(title, politicians(name, party))
                `)
                .eq('author_name', currentUser.displayName)
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return handleSupabaseSuccess(data, 'getUserComments');
        } catch (error) {
            return handleSupabaseError(error, 'getUserComments');
        }
    }
};