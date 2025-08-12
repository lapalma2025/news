// src/components/politician/PoliticianCard.js - Z działającym przyciskiem Śledź
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

const { width } = Dimensions.get('window');

const PoliticianCard = ({ post, onPress, onLike, onComment }) => {
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(post.likes_count || 0);
    const [isFollowing, setIsFollowing] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        initializeUser();
        checkIfFollowing();
    }, [post.politician_id]);

    const initializeUser = async () => {
        const user = await userService.getCurrentUser();
        setCurrentUser(user);
    };

    const checkIfFollowing = async () => {
        // Sprawdź czy użytkownik śledzi tego polityka (lokalnie)
        const user = await userService.getCurrentUser();
        if (user && user.followedPoliticians) {
            const following = user.followedPoliticians.includes(post.politician_id);
            setIsFollowing(following);
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

    const handleLike = () => {
        setLiked(!liked);
        setLikesCount(prev => liked ? prev - 1 : prev + 1);
        if (onLike) {
            onLike(post.id, !liked);
        }
    };

    const handleComment = () => {
        if (onComment) {
            onComment(post);
        }
    };

    const handleFollow = async () => {
        if (!currentUser) {
            Alert.alert('Info', 'Funkcja śledzenia wymaga zalogowania');
            return;
        }

        try {
            const newFollowingState = !isFollowing;
            setIsFollowing(newFollowingState);

            // Aktualizuj listę śledzonych polityków w profilu użytkownika
            const user = await userService.getCurrentUser();
            const followedPoliticians = user.followedPoliticians || [];

            if (newFollowingState) {
                // Dodaj do śledzonych
                if (!followedPoliticians.includes(post.politician_id)) {
                    followedPoliticians.push(post.politician_id);
                }

                Alert.alert(
                    'Śledzisz polityka!',
                    `Będziesz otrzymywać powiadomienia o nowych wpisach od ${post.politician_name || 'tego polityka'}.`,
                    [{ text: 'Super!' }]
                );
            } else {
                // Usuń ze śledzonych
                const index = followedPoliticians.indexOf(post.politician_id);
                if (index > -1) {
                    followedPoliticians.splice(index, 1);
                }

                Alert.alert(
                    'Przestałeś śledzić',
                    `Nie będziesz już otrzymywać powiadomień od ${post.politician_name || 'tego polityka'}.`,
                    [{ text: 'OK' }]
                );
            }

            // Zapisz w AsyncStorage
            await userService.updateUser({ followedPoliticians });

        } catch (error) {
            console.error('Error following politician:', error);
            // Rollback w przypadku błędu
            setIsFollowing(!isFollowing);
            Alert.alert('Błąd', 'Nie udało się zaktualizować śledzenia');
        }
    };

    const handleShare = () => {
        Alert.alert(
            'Udostępnij wpis',
            `"${post.title}" - ${post.politician_name} (${post.politician_party})\n\nChcesz udostępnić ten wpis?`,
            [
                { text: 'Anuluj', style: 'cancel' },
                {
                    text: 'Udostępnij',
                    onPress: () => {
                        // Tu będzie funkcja udostępniania
                        Alert.alert('Udostępniono!', 'Wpis został udostępniony (funkcja w rozwoju)');
                    }
                }
            ]
        );
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => onPress && onPress(post)}
            activeOpacity={0.8}
        >
            <LinearGradient
                colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                style={styles.card}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Header z informacjami o polityku */}
                <View style={styles.header}>
                    <View style={styles.politicianInfo}>
                        <View style={styles.avatarContainer}>
                            <Ionicons name="person" size={24} color={COLORS.white} />
                        </View>
                        <View style={styles.nameContainer}>
                            <Text style={styles.politicianName}>
                                {post.politician_name || post.politicians?.name || 'Nieznany polityk'}
                            </Text>
                            <Text style={styles.partyName}>
                                {post.politician_party || post.politicians?.party || 'Niezależny'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.timeContainer}>
                        <Text style={styles.timestamp}>{formatTime(post.created_at)}</Text>
                        <View style={styles.officialBadge}>
                            <Ionicons name="checkmark-circle" size={16} color={COLORS.white} />
                            <Text style={styles.officialText}>Oficjalny</Text>
                        </View>
                    </View>
                </View>

                {/* Treść wpisu */}
                <View style={styles.content}>
                    <Text style={styles.title}>{post.title}</Text>
                    <Text style={styles.postContent} numberOfLines={4}>
                        {post.content}
                    </Text>
                </View>

                {/* Footer z interakcjami */}
                <View style={styles.footer}>
                    <View style={styles.engagement}>
                        <TouchableOpacity
                            style={styles.engagementButton}
                            onPress={handleLike}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={liked ? "heart" : "heart-outline"}
                                size={20}
                                color={COLORS.white}
                            />
                            <Text style={styles.engagementText}>{likesCount}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.engagementButton}
                            onPress={handleComment}
                            activeOpacity={0.7}
                        >
                            <View style={styles.commentIconContainer}>
                                <Ionicons name="chatbubble-outline" size={18} color={COLORS.white} />
                                {(post.comments_count || 0) > 0 && (
                                    <View style={styles.commentBadge}>
                                        <Text style={styles.commentBadgeText}>
                                            {post.comments_count > 99 ? '99+' : post.comments_count}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.engagementText}>{post.comments_count || 0}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.engagementButton}
                            onPress={handleShare}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="share-outline" size={18} color={COLORS.white} />
                            <Text style={styles.engagementText}>Udostępnij</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.followButton,
                            isFollowing && styles.followButtonActive
                        ]}
                        onPress={handleFollow}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name={isFollowing ? "checkmark" : "add"}
                            size={16}
                            color={isFollowing ? COLORS.white : COLORS.primary}
                        />
                        <Text style={[
                            styles.followText,
                            isFollowing && styles.followTextActive
                        ]}>
                            {isFollowing ? 'Śledzisz' : 'Śledź'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Dekoracyjne elementy */}
                <View style={styles.decorativeElement1} />
                <View style={styles.decorativeElement2} />
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    card: {
        borderRadius: 20,
        padding: 24,
        shadowColor: COLORS.primary,
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
        position: 'relative',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    politicianInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    nameContainer: {
        flex: 1,
    },
    politicianName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 2,
    },
    partyName: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '500',
    },
    timeContainer: {
        alignItems: 'flex-end',
    },
    timestamp: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        marginBottom: 4,
    },
    officialBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    officialText: {
        fontSize: 10,
        color: COLORS.white,
        marginLeft: 2,
        fontWeight: '600',
    },
    content: {
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 12,
        lineHeight: 26,
    },
    postContent: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 22,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    engagement: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    engagementButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    engagementText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    commentIconContainer: {
        position: 'relative',
        marginRight: 6,
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
    followButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    followButtonActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderColor: COLORS.white,
    },
    followText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 4,
    },
    followTextActive: {
        color: COLORS.white,
    },
    decorativeElement1: {
        position: 'absolute',
        top: -20,
        right: -20,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    decorativeElement2: {
        position: 'absolute',
        bottom: -30,
        left: -30,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
});

export default PoliticianCard;