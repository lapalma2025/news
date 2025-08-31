// src/components/news/NewsCard.js - KOMPLETNIE POPRAWIONY
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../styles/colors';
import { newsService } from '../../services/newsService';
import { userService } from '../../services/userService';
import { readingHistoryService } from '../../services/readingHistoryService';

const NewsCard = ({ news, onPress, onComment, onLike, isLiked = false }) => {
    const [likesCount, setLikesCount] = useState(news.likes_count || 0);
    const [commentsCount, setCommentsCount] = useState(news.comments_count || 0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [liked, setLiked] = useState(isLiked);
    const [isInitialized, setIsInitialized] = useState(false);

    // Reaguj na zmiany w props news
    useEffect(() => {
        console.log('NewsCard: news props changed', {
            id: news.id,
            likes: news.likes_count,
            comments: news.comments_count,
            isLikedByUser: news.isLikedByUser
        });

        setLikesCount(news.likes_count || 0);
        setCommentsCount(news.comments_count || 0);

        // Użyj isLikedByUser z props jeśli dostępne
        if (news.isLikedByUser !== undefined) {
            setLiked(news.isLikedByUser);
        } else {
            setLiked(isLiked);
        }
    }, [news.likes_count, news.comments_count, news.isLikedByUser, isLiked]);

    // Inicjalizacja komponentu
    useEffect(() => {
        initializeCard();
        setupAuthListener();
    }, [news.id]);

    // Opóźniona inicjalizacja dla SSO
    useEffect(() => {
        if (!isInitialized) {
            const delayedInit = setTimeout(() => {
                console.log('Delayed initialization check...');
                initializeCard();
            }, 2000);

            return () => clearTimeout(delayedInit);
        }
    }, [isInitialized]);

    const setupAuthListener = () => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.id);

            if (event === 'SIGNED_IN' && session?.user) {
                console.log('User signed in, reinitializing...');
                await initializeCard();
            } else if (event === 'SIGNED_OUT') {
                console.log('User signed out, clearing state...');
                setCurrentUser(null);
                setLiked(false);
                setIsFavorite(false);
                setIsInitialized(false);
            }
        });

        return () => subscription?.unsubscribe();
    };

    const initializeCard = async () => {
        try {
            console.log('Initializing NewsCard for article:', news.id);

            // Pobierz użytkownika z retry logic
            let user = await getUserWithRetry();
            console.log('Current user after retry:', user?.id);

            setCurrentUser(user);

            if (user) {
                // Sprawdź status polubienia
                if (news.isLikedByUser !== undefined) {
                    console.log('Using like status from props:', news.isLikedByUser);
                    setLiked(news.isLikedByUser);
                } else {
                    console.log('Checking like status in database...');
                    const response = await newsService.checkIfLiked(news.id, user.id);
                    if (response.success) {
                        console.log('Like status from DB:', response.data);
                        setLiked(response.data);
                    }
                }

                // Sprawdź ulubione
                console.log('Checking favorite status...');
                try {
                    const isFav = await userService.isFavorite(news.id);
                    console.log('Favorite status:', isFav);
                    setIsFavorite(isFav);
                } catch (error) {
                    console.error('Error checking favorite status:', error);
                    setIsFavorite(false);
                }
            }

            setIsInitialized(true);
            console.log('NewsCard initialization completed');

        } catch (error) {
            console.error('Error initializing card:', error);
            setIsInitialized(true);
        }
    };

    const getUserWithRetry = async (retries = 3) => {
        for (let i = 0; i < retries; i++) {
            try {
                const user = await userService.getCurrentUser();
                if (user) {
                    console.log(`Got user on attempt ${i + 1}:`, user.id);
                    return user;
                }

                // Sprawdź sesję Supabase
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    console.log(`Found Supabase session on attempt ${i + 1}`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    const retryUser = await userService.getCurrentUser();
                    if (retryUser) return retryUser;
                }

                if (i < retries - 1) {
                    console.log(`User not found, retrying in ${(i + 1) * 1000}ms...`);
                    await new Promise(resolve => setTimeout(resolve, (i + 1) * 1000));
                }
            } catch (error) {
                console.error(`Error getting user on attempt ${i + 1}:`, error);
                if (i === retries - 1) throw error;
            }
        }
        return null;
    };

    // POPRAWIONY handleLike - zawsze działa
    const handleLike = () => {
        console.log('Like button pressed:', {
            newsId: news.id,
            currentUser: currentUser?.id,
            currentLiked: liked,
            onLikeExists: !!onLike
        });

        // Pokaż alert jeśli nie ma użytkownika, ale nie blokuj
        if (!currentUser) {
            Alert.alert('Info', 'Zaloguj się, aby polubić artykuł');
        }

        // ZAWSZE deleguj do parent
        if (onLike && typeof onLike === 'function') {
            console.log('Delegating to parent onLike...');
            onLike(news.id, !liked);
        } else {
            console.error('onLike is not available:', typeof onLike);
            Alert.alert('Błąd', 'Funkcja polubienia nie jest dostępna');
        }
    };

    const handleComment = async () => {
        console.log('Comment button pressed for article:', news.id);

        if (!news) return;

        try {
            // Zapisz do historii czytania
            console.log('Marking article as read...');
            await readingHistoryService.markAsRead(news.id, 'news');

            if (onComment) {
                console.log('Calling parent onComment...');
                onComment(news);
            }
        } catch (error) {
            console.error('Error handling comment:', error);
            if (onComment) {
                onComment(news);
            }
        }
    };

    const handleFavorite = async () => {
        console.log('Favorite button pressed:', { newsId: news.id, currentUser: currentUser?.id });

        if (!currentUser) {
            Alert.alert('Info', 'Zaloguj się, aby dodać do ulubionych');
            return;
        }

        try {
            if (isFavorite) {
                console.log('Removing from favorites...');
                await userService.removeFromFavorites(news.id);
                setIsFavorite(false);
                Alert.alert('Usunięto', 'Artykuł został usunięty z ulubionych');
            } else {
                console.log('Adding to favorites...');
                await userService.addToFavorites(news.id, 'news');
                setIsFavorite(true);
                Alert.alert('Dodano', 'Artykuł został dodany do ulubionych');
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            Alert.alert('Błąd', 'Nie udało się zaktualizować ulubionych');
        }
    };

    const handlePress = async () => {
        console.log('Article pressed:', news.id);

        try {
            // Zapisz do historii czytania
            console.log('Marking as read on press...');
            await readingHistoryService.markAsRead(news.id, 'news');
            await userService.addToReadHistory(news.id, news.title, 'news');
        } catch (error) {
            console.error('Error marking as read:', error);
        }

        if (onPress) {
            console.log('Calling parent onPress...');
            onPress(news);
        }
    };

    const handleShare = () => {
        Alert.alert(
            'Udostępnij artykuł',
            `"${news.title}" - ${news.author}\n\nChcesz udostępnić ten artykuł?`,
            [
                { text: 'Anuluj', style: 'cancel' },
                {
                    text: 'Udostępnij',
                    onPress: () => {
                        Alert.alert('Udostępniono!', 'Artykuł został udostępniony');
                    }
                }
            ]
        );
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

        if (diffInHours < 1) {
            const diffInMinutes = Math.floor((now - date) / (1000 * 60));
            return `${diffInMinutes}m temu`;
        } else if (diffInHours < 24) {
            return `${diffInHours}h temu`;
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays}d temu`;
        }
    };

    const truncateContent = (content, maxLength = 120) => {
        if (!content) return '';
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + '...';
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
                {/* Header z kategorią */}
                <View style={styles.header}>
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{news.category}</Text>
                    </View>
                    <TouchableOpacity onPress={handleFavorite}>
                        <Ionicons
                            name={isFavorite ? "bookmark" : "bookmark-outline"}
                            size={20}
                            color={isFavorite ? COLORS.primary : COLORS.gray}
                        />
                    </TouchableOpacity>
                </View>

                {/* Tytuł */}
                <Text style={styles.title}>{news.title}</Text>

                {/* Treść */}
                <Text style={styles.content}>
                    {truncateContent(news.content)}
                </Text>

                {/* Meta informacje */}
                <View style={styles.meta}>
                    <Text style={styles.author}>
                        <Ionicons name="person-outline" size={14} color={COLORS.gray} />
                        {' '}{news.author}
                    </Text>
                    <Text style={styles.time}>
                        <Ionicons name="time-outline" size={14} color={COLORS.gray} />
                        {' '}{formatTime(news.created_at)}
                    </Text>
                </View>
            </TouchableOpacity>

            {/* Akcje */}
            <View style={styles.actionButtons}>
                {/* Przycisk polubienia */}
                <TouchableOpacity
                    style={[styles.actionButton, liked && styles.actionButtonLiked]}
                    onPress={() => {
                        console.log('Like button physical press detected at:', new Date().toISOString());
                        handleLike();
                    }}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name={liked ? "heart" : "heart-outline"}
                        size={18}
                        color={liked ? COLORS.white : COLORS.gray}
                    />
                    <Text style={[
                        styles.actionText,
                        liked && styles.actionTextLiked
                    ]}>
                        {likesCount || 0}
                    </Text>
                </TouchableOpacity>

                {/* Przycisk komentarza */}
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleComment}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name="chatbubble-outline"
                        size={18}
                        color={COLORS.gray}
                    />
                    <Text style={styles.actionText}>
                        {commentsCount || 0}
                    </Text>
                </TouchableOpacity>

                {/* Przycisk udostępniania */}
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleShare}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name="share-outline"
                        size={18}
                        color={COLORS.gray}
                    />
                    <Text style={styles.actionText}>Udostępnij</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: COLORS.black,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 12,
    },
    categoryBadge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    categoryText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '600',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.black,
        paddingHorizontal: 16,
        marginBottom: 8,
        lineHeight: 24,
    },
    content: {
        fontSize: 14,
        color: COLORS.gray,
        paddingHorizontal: 16,
        marginBottom: 12,
        lineHeight: 20,
    },
    meta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    author: {
        fontSize: 12,
        color: COLORS.gray,
        fontWeight: '500',
    },
    time: {
        fontSize: 12,
        color: COLORS.gray,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.lightGray,
        backgroundColor: COLORS.background,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
        minWidth: 70,
        justifyContent: 'center',
    },
    actionButtonLiked: {
        backgroundColor: COLORS.red,
        borderColor: COLORS.red,
    },
    actionText: {
        marginLeft: 6,
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.gray,
    },
    actionTextLiked: {
        color: COLORS.white,
    },
});

export default NewsCard;