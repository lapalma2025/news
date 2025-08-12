// src/hooks/useComments.js - Hook do zarządzania komentarzami
import { useState, useEffect } from 'react';
import { commentService } from '../services/commentService';

export const useComments = (postId, postType) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadComments = async () => {
        if (!postId || !postType) return;

        try {
            setError(null);
            const response = await commentService.fetchComments(postId, postType);
            if (response.success) {
                setComments(response.data);
            } else {
                setError(response.error);
            }
        } catch (err) {
            setError('Wystąpił problem z połączeniem');
        } finally {
            setLoading(false);
        }
    };

    const addComment = async (authorName, content) => {
        try {
            const response = await commentService.addComment({
                post_id: postId,
                post_type: postType,
                author_name: authorName,
                content: content,
            });

            if (response.success) {
                setComments(prev => [response.data, ...prev]);
                return { success: true };
            } else {
                return { success: false, error: response.error };
            }
        } catch (err) {
            return { success: false, error: 'Wystąpił problem z połączeniem' };
        }
    };

    useEffect(() => {
        loadComments();
    }, [postId, postType]);

    return {
        comments,
        loading,
        error,
        loadComments,
        addComment,
    };
};