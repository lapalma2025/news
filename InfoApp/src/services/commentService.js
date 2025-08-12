import { supabase, handleSupabaseError, handleSupabaseSuccess, getCurrentTimestamp } from './supabaseClient';

export const commentService = {
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
            const { data, error } = await supabase
                .from('infoapp_comments')
                .update({ is_active: false })
                .eq('id', commentId)
                .select();

            if (error) throw error;
            return handleSupabaseSuccess(data[0], 'deleteComment');
        } catch (error) {
            return handleSupabaseError(error, 'deleteComment');
        }
    },

    async toggleCommentLike(commentId, userId, isLiked) {
        try {
            if (isLiked) {
                const { error } = await supabase
                    .from('infoapp_comment_likes')
                    .delete()
                    .eq('comment_id', commentId)
                    .eq('user_id', userId);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('infoapp_comment_likes')
                    .insert([{
                        comment_id: commentId,
                        user_id: userId,
                        created_at: getCurrentTimestamp()
                    }]);

                if (error) throw error;
            }

            return handleSupabaseSuccess(null, 'toggleCommentLike');
        } catch (error) {
            return handleSupabaseError(error, 'toggleCommentLike');
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

    async getCommentLikesCount(commentId) {
        try {
            const { data, error } = await supabase
                .from('infoapp_comment_likes')
                .select('id', { count: 'exact' })
                .eq('comment_id', commentId);

            if (error) throw error;
            return handleSupabaseSuccess(data.length, 'getCommentLikesCount');
        } catch (error) {
            return handleSupabaseError(error, 'getCommentLikesCount');
        }
    },

    subscribeToComments(postId, postType, callback) {
        const subscription = supabase
            .channel('comments_changes')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'infoapp_comments',
                    filter: `post_id=eq.${postId} AND post_type=eq.${postType} AND is_active=eq.true`
                },
                callback
            )
            .subscribe();

        return subscription;
    },

    unsubscribeFromComments(subscription) {
        if (subscription) {
            supabase.removeChannel(subscription);
        }
    }
};