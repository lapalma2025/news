// src/hooks/useNews.js - Hook do zarządzania newsami
import { useState, useEffect } from 'react';
import { newsService } from '../services/newsService';

export const useNews = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const loadNews = async () => {
        try {
            setError(null);
            const response = await newsService.fetchNews();
            if (response.success) {
                setNews(response.data);
            } else {
                setError(response.error);
            }
        } catch (err) {
            setError('Wystąpił problem z połączeniem');
        } finally {
            setLoading(false);
        }
    };

    const refreshNews = async () => {
        setRefreshing(true);
        await loadNews();
        setRefreshing(false);
    };

    const searchNews = async (query) => {
        try {
            setLoading(true);
            const response = await newsService.searchNews(query);
            if (response.success) {
                setNews(response.data);
            }
        } catch (err) {
            setError('Błąd podczas wyszukiwania');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNews();
    }, []);

    return {
        news,
        loading,
        refreshing,
        error,
        loadNews,
        refreshNews,
        searchNews,
    };
};