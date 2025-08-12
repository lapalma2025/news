// src/hooks/usePoliticians.js - Hook do zarządzania politykami
import { useState, useEffect } from 'react';
import { politicianService } from '../services/politicianService';

export const usePoliticians = () => {
    const [politicians, setPoliticians] = useState([]);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const loadPoliticians = async () => {
        try {
            setError(null);
            const response = await politicianService.fetchPoliticians();
            if (response.success) {
                setPoliticians(response.data);
            } else {
                setError(response.error);
            }
        } catch (err) {
            setError('Wystąpił problem z połączeniem');
        }
    };

    const loadPosts = async () => {
        try {
            setError(null);
            const response = await politicianService.fetchPoliticianPosts();
            if (response.success) {
                setPosts(response.data);
            } else {
                setError(response.error);
            }
        } catch (err) {
            setError('Wystąpił problem z połączeniem');
        } finally {
            setLoading(false);
        }
    };

    const refreshData = async () => {
        setRefreshing(true);
        await Promise.all([loadPoliticians(), loadPosts()]);
        setRefreshing(false);
    };

    useEffect(() => {
        Promise.all([loadPoliticians(), loadPosts()]);
    }, []);

    return {
        politicians,
        posts,
        loading,
        refreshing,
        error,
        loadPoliticians,
        loadPosts,
        refreshData,
    };
};