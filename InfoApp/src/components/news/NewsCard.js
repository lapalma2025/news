// src/components/news/NewsCard.js - KOMPLETNIE POPRAWIONY z kolorowymi kategoriami
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
import { LinearGradient } from 'expo-linear-gradient';

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
    // W NewsCard.js
    useEffect(() => {
        console.log('NewsCard: props changed', {
            id: news.id,
            likes: news.likes_count,
            comments: news.comments_count,
            isLikedByUser: news.isLikedByUser
        });

        // zawsze synchronizuj lokalny stan ze świeżymi propsami
        setLikesCount(Number(news.likes_count) || 0);
        setCommentsCount(Number(news.comments_count) || 0);

        // like z propsów, a jeśli brak – z parametru isLiked
        if (typeof news.isLikedByUser === 'boolean') {
            setLiked(news.isLikedByUser);
        } else {
            setLiked(!!isLiked);
        }
    }, [
        news.id,                 // ważne, żeby reagował przy zmianie elementu
        news.likes_count,
        news.comments_count,
        news.isLikedByUser,
        isLiked
    ]);


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

    // W NewsCard.js
    const initializeCard = async () => {
        try {
            console.log('Initializing NewsCard for article:', news.id);

            let user = await getUserWithRetry();
            setCurrentUser(user);

            if (user) {
                if (typeof news.isLikedByUser === 'boolean') {
                    setLiked(news.isLikedByUser);
                } else {
                    const likeResp = await newsService.checkIfLiked(news.id, user.id);
                    if (likeResp.success) setLiked(!!likeResp.data);
                }

                try {
                    const isFav = await userService.isFavorite(news.id);
                    setIsFavorite(!!isFav);
                } catch {
                    setIsFavorite(false);
                }
            }

            // 🔥 KLUCZ: licz komentarze z infoapp_comments, a nie z infoapp_news
            const { count, error } = await supabase
                .from('infoapp_comments')
                .select('id', { count: 'exact', head: true })
                .eq('post_id', news.id)
                .eq('post_type', 'news')
                .eq('is_active', true);

            if (!error) {
                setCommentsCount(count || 0);
            }

            setIsInitialized(true);
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

    // Funkcja do pobierania koloru kategorii
    const getCategoryColor = (category) => {
        if (!category) return COLORS.gray;

        // Normalizuj nazwę kategorii do małych liter i usuń polskie znaki
        const normalizeCategory = (cat) => {
            return cat.toLowerCase()
                .replace('ą', 'a')
                .replace('ć', 'c')
                .replace('ę', 'e')
                .replace('ł', 'l')
                .replace('ń', 'n')
                .replace('ó', 'o')
                .replace('ś', 's')
                .replace('ź', 'z')
                .replace('ż', 'z')
                .trim();
        };

        const normalizedCategory = normalizeCategory(category);

        // Mapowanie kategorii do kolorów
        const categoryColors = {
            'polityka': '#ef4444',        // Czerwony
            'ekonomia': '#10b981',        // Zielony
            'gospodarka': '#10b981',      // Zielony (alias)
            'technologia': '#3b82f6',     // Niebieski
            'tech': '#3b82f6',            // Niebieski (alias)
            'spoleczenstwo': '#f59e0b',   // Pomarańczowy
            'spoleczne': '#f59e0b',       // Pomarańczowy (alias)
            'kultura': '#8b5cf6',         // Fioletowy
            'sport': '#06b6d4',           // Cyjan
            'sporty': '#06b6d4',          // Cyjan (alias)
            'zdrowie': '#ec4899',         // Różowy
            'nauka': '#14b8a6',           // Teal
            'swiat': '#f97316',           // Pomarańczowy ciemny
            'biznes': '#059669',          // Emerald
            'rozrywka': '#d946ef',        // Fuchsia
            'edukacja': '#7c3aed',        // Violet
            'lokalne': '#84cc16',         // Lime
            'inne': '#6b7280'             // Szary
        };

        return categoryColors[normalizedCategory] || categoryColors['inne'];
    };

    // Funkcja do pobierania ikony kategorii
    const getCategoryIcon = (category) => {
        if (!category) return 'document-text-outline';

        const normalizedCategory = category.toLowerCase()
            .replace('ą', 'a')
            .replace('ć', 'c')
            .replace('ę', 'e')
            .replace('ł', 'l')
            .replace('ń', 'n')
            .replace('ó', 'o')
            .replace('ś', 's')
            .replace('ź', 'z')
            .replace('ż', 'z')
            .trim();

        const categoryIcons = {
            'polityka': 'flag-outline',
            'ekonomia': 'trending-up-outline',
            'gospodarka': 'bar-chart-outline',
            'technologia': 'phone-portrait-outline',
            'tech': 'laptop-outline',
            'spoleczenstwo': 'people-outline',
            'spoleczne': 'heart-outline',
            'kultura': 'library-outline',
            'sport': 'fitness-outline',
            'sporty': 'football-outline',
            'zdrowie': 'medical-outline',
            'nauka': 'school-outline',
            'swiat': 'globe-outline',
            'biznes': 'briefcase-outline',
            'rozrywka': 'musical-notes-outline',
            'edukacja': 'book-outline',
            'lokalne': 'location-outline',
            'inne': 'ellipsis-horizontal-outline'
        };

        return categoryIcons[normalizedCategory] || categoryIcons['inne'];
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

    const categoryColor = getCategoryColor(news.category);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#ffffff', '#f8fafc']}
                style={styles.cardGradient}
            >
                <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
                    {/* Header z kategorią */}
                    <View style={styles.header}>
                        <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
                            <Ionicons
                                name={getCategoryIcon(news.category)}
                                size={14}
                                color={COLORS.white}
                                style={styles.categoryIcon}
                            />
                            <Text style={styles.categoryText}>{news.category}</Text>
                        </View>
                        <View style={styles.headerRight}>
                            <Text style={styles.time}>
                                {formatTime(news.created_at)}
                            </Text>
                            <TouchableOpacity onPress={handleFavorite} style={styles.favoriteButton}>
                                <Ionicons
                                    name={isFavorite ? "bookmark" : "bookmark-outline"}
                                    size={22}
                                    color={isFavorite ? categoryColor : COLORS.gray}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Tytuł */}
                    <Text style={styles.title}>{news.title}</Text>

                    {/* Treść */}
                    <Text style={styles.content}>
                        {truncateContent(news.content)}
                    </Text>

                    {/* Meta informacje */}
                    <View style={styles.meta}>
                        <View style={styles.authorContainer}>
                            <Ionicons name="person-circle-outline" size={16} color={COLORS.gray} />
                            <Text style={styles.author}>{news.author}</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Akcje */}
                <View style={styles.actionButtons}>
                    {/* Przycisk polubienia */}
                    <TouchableOpacity
                        style={[
                            styles.actionButton
                        ]}
                        onPress={() => {
                            console.log('Like button physical press detected at:', new Date().toISOString());
                            handleLike();
                        }}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={liked ? "heart" : "heart-outline"}
                            size={18}
                            color={liked ? COLORS.like : COLORS.gray}
                        />
                        <Text style={[
                            styles.actionText,
                            liked && { color: COLORS.like }
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
                            color={COLORS.comment}
                        />
                        <Text style={[styles.actionText, { color: COLORS.comment }]}>
                            {news.comments_count || 0}
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
                            color={COLORS.share}
                        />
                        <Text style={[styles.actionText, { color: COLORS.share }]}>
                            Udostępnij
                        </Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    cardGradient: {
        borderRadius: 20,
        shadowColor: COLORS.black,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 6,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 12,
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        shadowColor: COLORS.black,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    categoryIcon: {
        marginRight: 4,
    },
    categoryText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    time: {
        fontSize: 13,
        color: COLORS.textLight,
        fontWeight: '500',
        marginRight: 12,
    },
    favoriteButton: {
        padding: 4,
    },
    title: {
        fontSize: 19,
        fontWeight: '700',
        color: COLORS.textPrimary,
        paddingHorizontal: 20,
        marginBottom: 10,
        lineHeight: 26,
    },
    content: {
        fontSize: 15,
        color: COLORS.textSecondary,
        paddingHorizontal: 20,
        marginBottom: 16,
        lineHeight: 22,
    },
    meta: {
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    authorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    author: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontWeight: '600',
        marginLeft: 6,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: 'rgba(248, 250, 252, 0.8)',
        gap: 5,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 25,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
        minWidth: 80,
        justifyContent: 'center',
        shadowColor: COLORS.black,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    actionText: {
        marginLeft: 6,
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
});

export default NewsCard;