// src/components/news/NewsCard.js - OSTATECZNIE POPRAWIONY
import React, { useState, useEffect } from 'react';
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

const NewsCard = ({ news, onPress, onComment, onLike, isLiked = false }) => {
    const [likesCount, setLikesCount] = useState(news.likes_count || 0);
    const [commentsCount, setCommentsCount] = useState(news.comments_count || 0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [liked, setLiked] = useState(isLiked);

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
        setLiked(news.isLikedByUser || isLiked);
    }, [news.likes_count, news.comments_count, news.isLikedByUser]);

    // Reaguj na zmiany w props isLiked
    useEffect(() => {
        console.log('NewsCard: isLiked prop changed', isLiked);
        setLiked(isLiked);
    }, [isLiked]);

    useEffect(() => {
        initializeCard();
        setupRealtimeSubscription();

        return () => {
            if (subscription) {
                newsService.unsubscribeFromNews(subscription);
            }
        };
    }, [news.id]);

    const initializeCard = async () => {
        try {
            const user = await userService.getCurrentUser();
            setCurrentUser(user);

            if (user) {
                // Sprawdź czy już mamy informację o polubienium w props
                if (news.isLikedByUser !== undefined) {
                    console.log('NewsCard: Using isLikedByUser from props', news.isLikedByUser);
                    setLiked(news.isLikedByUser);
                } else {
                    // Sprawdź w bazie tylko jeśli nie ma informacji w props
                    console.log('NewsCard: Checking like status from database');
                    const likedResponse = await newsService.checkIfLiked(news.id, user.id);
                    if (likedResponse.success) {
                        setLiked(likedResponse.data);
                    }
                }

                // Sprawdź czy artykuł jest w ulubionych
                const favorites = user.stats?.favoriteArticles || [];
                setIsFavorite(favorites.some(fav => fav.id === news.id));
            }
        } catch (error) {
            console.error('Error initializing card:', error);
        }
    };

    const setupRealtimeSubscription = () => {
        const sub = newsService.subscribeToNews((payload) => {
            if (payload.eventType === 'UPDATE' && payload.new.id === news.id) {
                console.log('NewsCard: Real-time update received', payload.new);
                // Aktualizuj liczniki w czasie rzeczywistym
                setLikesCount(payload.new.likes_count || 0);
                setCommentsCount(payload.new.comments_count || 0);
            }
        });
        setSubscription(sub);
    };

    // TYLKO deleguj do parent - ZERO lokalnej logiki API
    // W NewsCard.js - ZASTĄP handleLike() tym prostym kodem:

    const handleLike = () => {
        if (!currentUser) {
            Alert.alert('Info', 'Zaloguj się, aby polubić artykuł');
            return;
        }

        console.log('NewsCard: Delegating to parent - news.id:', news.id, 'current liked:', liked);

        // ❌ USUŃ CAŁĄ LOGIKĘ API - zostaw tylko delegację:
        /*
        // Usuń to wszystko:
        const newLikedState = !liked;
        const newLikesCount = newLikedState ? likesCount + 1 : likesCount - 1;
        setLiked(newLikedState);
        setLikesCount(newLikesCount);
        
        try {
            const response = await newsService.toggleLike(news.id, currentUser.id, liked);
            // ... cała reszta logiki
        }
        */

        // ✅ ZOSTAW TYLKO TO - cała logika w NewsScreen:
        if (onLike) {
            onLike(news.id, !liked);
        }
    };

    const handleComment = async () => {
        // Dodaj do historii czytania
        try {
            await userService.addToReadHistory(news.id, news.title, 'news');
        } catch (error) {
            console.error('Error adding to read history:', error);
        }

        if (onComment) {
            onComment(news);
        }
    };

    const handleFavorite = async () => {
        if (!currentUser) {
            Alert.alert('Info', 'Zaloguj się, aby dodać do ulubionych');
            return;
        }

        try {
            if (isFavorite) {
                await userService.removeFromFavorites(news.id);
                setIsFavorite(false);
                Alert.alert('Usunięto', 'Artykuł został usunięty z ulubionych');
            } else {
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
        // Dodaj do historii czytania przy kliknięciu
        try {
            await userService.addToReadHistory(news.id, news.title, 'news');
        } catch (error) {
            console.error('Error adding to read history:', error);
        }

        if (onPress) {
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

            {/* Akcje - SEKCJA Z REAKTYWNYM SERDUSZKIEM */}
            <View style={styles.actionButtons}>
                {/* Przycisk polubienia */}
                <TouchableOpacity
                    style={[styles.actionButton, liked && styles.actionButtonLiked]}
                    onPress={handleLike}
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
    // STYLE DLA REAKTYWNYCH AKCJI
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