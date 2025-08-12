// src/components/news/NewsCard.js - Ostateczna naprawa polubień
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/colors';
import { userService } from '../../services/userService';
import { newsService } from '../../services/newsService';

const { width } = Dimensions.get('window');

const NewsCard = ({ news, onPress, onLike, onComment }) => {
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(news.likes_count || 0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isLiking, setIsLiking] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        initializeUser();
        checkIfFavorite();
    }, [news.id]);

    useEffect(() => {
        if (currentUser) {
            checkIfLiked();
        }
    }, [currentUser, news.id]);

    const initializeUser = async () => {
        const user = await userService.getCurrentUser();
        setCurrentUser(user);
    };

    const checkIfFavorite = async () => {
        const favorite = await userService.isFavorite(news.id);
        setIsFavorite(favorite);
    };

    const checkIfLiked = async () => {
        if (!currentUser) return;

        try {
            const response = await newsService.checkIfLiked(news.id, currentUser.id);
            if (response.success) {
                setLiked(response.data);
            }
        } catch (error) {
            console.error('Error checking like status:', error);
        }
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

    const getCategoryColor = (category) => {
        const categoryLower = category.toLowerCase();
        return COLORS.categories[categoryLower] || COLORS.categories.inne;
    };

    const handleLike = async () => {
        if (isLiking || !currentUser) {
            if (!currentUser) {
                Alert.alert('Info', 'Funkcja polubień wymaga zalogowania');
            }
            return;
        }

        setIsLiking(true);

        // Optymistyczna aktualizacja UI
        const newLikedState = !liked;
        const newLikesCount = newLikedState ? likesCount + 1 : likesCount - 1;

        setLiked(newLikedState);
        setLikesCount(newLikesCount);

        try {
            const response = await newsService.toggleLike(news.id, currentUser.id, liked);

            if (response.success) {
                if (newLikedState) {
                    await userService.incrementLikes();
                }

                // Powiadom rodzica o zmianie
                if (onLike) {
                    onLike(news.id, newLikedState);
                }
            } else {
                // Rollback w przypadku błędu
                setLiked(liked);
                setLikesCount(likesCount);
                Alert.alert('Błąd', 'Nie udało się zaktualizować polubienia');
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            // Rollback w przypadku błędu
            setLiked(liked);
            setLikesCount(likesCount);
            Alert.alert('Błąd', 'Wystąpił problem z polubieniam');
        } finally {
            setIsLiking(false);
        }
    };

    const handleComment = async () => {
        // Dodaj do historii czytania
        await userService.addToReadHistory(news.id, news.title, 'news');

        if (onComment) {
            onComment(news);
        }
    };

    const handleFavorite = async () => {
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
        await userService.addToReadHistory(news.id, news.title, 'news');

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
                        Alert.alert('Udostępniono!', 'Artykuł został udostępniony (funkcja w rozwoju)');
                    }
                }
            ]
        );
    };

    const CommentBadge = ({ count }) => (
        <TouchableOpacity
            style={styles.engagementButton}
            onPress={handleComment}
            activeOpacity={0.7}
        >
            <View style={styles.commentIconContainer}>
                <Ionicons name="chatbubble-outline" size={16} color={COLORS.comment} />
                {count > 0 && (
                    <View style={styles.commentBadge}>
                        <Text style={styles.commentBadgeText}>
                            {count > 99 ? '99+' : count}
                        </Text>
                    </View>
                )}
            </View>
            <Text style={[styles.engagementText, { color: COLORS.comment }]}>
                {count}
            </Text>
        </TouchableOpacity>
    );

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={handlePress}
            activeOpacity={0.7}
        >
            <LinearGradient
                colors={['#ffffff', '#f8faff']}
                style={styles.card}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View
                        style={[
                            styles.categoryTag,
                            { backgroundColor: getCategoryColor(news.category) }
                        ]}
                    >
                        <Text style={styles.categoryText}>{news.category}</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <Text style={styles.timestamp}>{formatTime(news.created_at)}</Text>
                        <TouchableOpacity onPress={handleFavorite} style={styles.favoriteButton}>
                            <Ionicons
                                name={isFavorite ? "heart" : "heart-outline"}
                                size={20}
                                color={isFavorite ? COLORS.like : COLORS.gray}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Content */}
                <Text style={styles.title}>{news.title}</Text>
                <Text style={styles.preview} numberOfLines={3}>
                    {news.content}
                </Text>

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={styles.authorSection}>
                        <Ionicons name="person-circle" size={20} color={COLORS.primary} />
                        <Text style={styles.author}>{news.author}</Text>
                    </View>

                    <View style={styles.engagement}>
                        <TouchableOpacity
                            style={[
                                styles.engagementButton,
                                isLiking && styles.engagementButtonDisabled
                            ]}
                            onPress={handleLike}
                            activeOpacity={0.7}
                            disabled={isLiking}
                        >
                            <Ionicons
                                name={liked ? "heart" : "heart-outline"}
                                size={18}
                                color={liked ? COLORS.like : COLORS.gray}
                            />
                            <Text style={[
                                styles.engagementText,
                                { color: liked ? COLORS.like : COLORS.gray }
                            ]}>
                                {likesCount}
                            </Text>
                        </TouchableOpacity>

                        <CommentBadge count={news.comments_count || 0} />

                        <TouchableOpacity
                            style={styles.engagementButton}
                            activeOpacity={0.7}
                            onPress={handleShare}
                        >
                            <Ionicons name="share-outline" size={16} color={COLORS.share} />
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 15,
    },
    card: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 16,
        padding: 20,
        shadowColor: COLORS.cardShadow,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryTag: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    categoryText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    timestamp: {
        fontSize: 12,
        color: COLORS.textLight,
        fontWeight: '500',
        marginRight: 12,
    },
    favoriteButton: {
        padding: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 8,
        lineHeight: 24,
    },
    preview: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
        marginBottom: 16,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    authorSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    author: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '500',
        marginLeft: 6,
    },
    engagement: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    engagementButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 16,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    engagementButtonDisabled: {
        opacity: 0.6,
    },
    engagementText: {
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 4,
    },
    commentIconContainer: {
        position: 'relative',
        marginRight: 4,
    },
    commentBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: COLORS.error,
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.white,
    },
    commentBadgeText: {
        color: COLORS.white,
        fontSize: 9,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default NewsCard;