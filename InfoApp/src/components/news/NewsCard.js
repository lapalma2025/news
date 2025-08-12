import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/colors';

const { width } = Dimensions.get('window');

const NewsCard = ({ news, onPress, onLike, onComment }) => {
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(news.likes_count || 0);

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

    const handleLike = () => {
        setLiked(!liked);
        setLikesCount(prev => liked ? prev - 1 : prev + 1);
        if (onLike) {
            onLike(news.id, !liked);
        }
    };

    const handleComment = () => {
        if (onComment) {
            onComment(news);
        }
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => onPress && onPress(news)}
            activeOpacity={0.7}
        >
            <LinearGradient
                colors={['#ffffff', '#f8faff']}
                style={styles.card}
            >
                <View style={styles.header}>
                    <View
                        style={[
                            styles.categoryTag,
                            { backgroundColor: getCategoryColor(news.category) }
                        ]}
                    >
                        <Text style={styles.categoryText}>{news.category}</Text>
                    </View>
                    <Text style={styles.timestamp}>{formatTime(news.created_at)}</Text>
                </View>

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
                            style={styles.engagementButton}
                            onPress={handleLike}
                            activeOpacity={0.7}
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

                        <TouchableOpacity
                            style={styles.engagementButton}
                            onPress={handleComment}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="chatbubble-outline" size={16} color={COLORS.comment} />
                            <Text style={[styles.engagementText, { color: COLORS.comment }]}>
                                {news.comments_count || 0}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.engagementButton}
                            activeOpacity={0.7}
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
    engagementText: {
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 4,
    },
});

export default NewsCard;