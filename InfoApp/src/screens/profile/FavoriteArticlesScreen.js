// src/screens/profile/FavoriteArticlesScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    RefreshControl,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../styles/colors';
import { userService } from '../../services/userService';
import { newsService } from '../../services/newsService';
import { politicianService } from '../../services/politicianService';

const FavoriteArticlesScreen = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        try {
            setLoading(true);
            const user = await userService.getCurrentUser();

            if (user?.stats?.favoriteArticles) {
                // Pobierz szczegóły ulubionych artykułów
                const favoriteDetails = await Promise.all(
                    user.stats.favoriteArticles.map(async (fav) => {
                        try {
                            if (fav.type === 'news') {
                                const response = await newsService.getNewsById(fav.id);
                                return response.success ? { ...response.data, type: 'news', favoriteId: fav.id } : null;
                            } else {
                                const response = await politicianService.getPostById(fav.id);
                                return response.success ? { ...response.data, type: 'politician_post', favoriteId: fav.id } : null;
                            }
                        } catch (error) {
                            console.error('Error loading favorite article:', error);
                            return null;
                        }
                    })
                );

                setFavorites(favoriteDetails.filter(item => item !== null));
            } else {
                setFavorites([]);
            }
        } catch (error) {
            console.error('Error loading favorites:', error);
            Alert.alert('Błąd', 'Nie udało się załadować ulubionych artykułów');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadFavorites();
        setRefreshing(false);
    };

    const removeFromFavorites = async (item) => {
        Alert.alert(
            'Usuń z ulubionych',
            'Czy na pewno chcesz usunąć ten artykuł z ulubionych?',
            [
                { text: 'Anuluj', style: 'cancel' },
                {
                    text: 'Usuń',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await userService.removeFromFavorites(item.favoriteId || item.id);
                            setFavorites(prev => prev.filter(fav => fav.id !== item.id));
                            Alert.alert('Sukces', 'Artykuł został usunięty z ulubionych');
                        } catch (error) {
                            Alert.alert('Błąd', 'Nie udało się usunąć artykułu z ulubionych');
                        }
                    }
                }
            ]
        );
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

        if (diffInHours < 24) {
            return `${diffInHours}h temu`;
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays}d temu`;
        }
    };

    const renderFavoriteItem = ({ item }) => (
        <TouchableOpacity style={styles.favoriteItem} activeOpacity={0.7}>
            <View style={styles.itemContent}>
                <View style={styles.itemHeader}>
                    <View style={styles.categoryContainer}>
                        <View style={[
                            styles.categoryBadge,
                            { backgroundColor: item.type === 'news' ? COLORS.blue : COLORS.green }
                        ]}>
                            <Text style={styles.categoryText}>
                                {item.type === 'news' ? 'News' : 'Polityk'}
                            </Text>
                        </View>
                        <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeFromFavorites(item)}
                    >
                        <Ionicons name="heart" size={20} color={COLORS.red} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.itemTitle} numberOfLines={2}>
                    {item.title}
                </Text>

                <Text style={styles.itemContent} numberOfLines={3}>
                    {item.content}
                </Text>

                <View style={styles.itemFooter}>
                    <Text style={styles.itemAuthor}>
                        {item.author || item.politician_name || 'Nieznany autor'}
                    </Text>
                    <View style={styles.itemStats}>
                        <View style={styles.statItem}>
                            <Ionicons name="heart-outline" size={14} color={COLORS.gray} />
                            <Text style={styles.statText}>{item.likes_count || 0}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Ionicons name="chatbubble-outline" size={14} color={COLORS.gray} />
                            <Text style={styles.statText}>{item.comments_count || 0}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
                <Ionicons name="heart-outline" size={64} color={COLORS.gray} />
            </View>
            <Text style={styles.emptyTitle}>Brak ulubionych artykułów</Text>
            <Text style={styles.emptyDescription}>
                Artykuły, które dodasz do ulubionych, pojawią się tutaj.
                Kliknij ikonę serca przy artykule, aby go zapisać.
            </Text>
            <TouchableOpacity style={styles.browseButton}>
                <Text style={styles.browseButtonText}>Przeglądaj artykuły</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Ładowanie ulubionych...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerSubtitle}>
                    {favorites.length === 0 ? 'Brak zapisanych artykułów' :
                        `${favorites.length} ${favorites.length === 1 ? 'artykuł' : 'artykułów'}`}
                </Text>
            </View>

            <FlatList
                data={favorites}
                renderItem={renderFavoriteItem}
                keyExtractor={(item) => `${item.type}-${item.id}`}
                contentContainerStyle={favorites.length === 0 ? styles.emptyContainer : styles.listContainer}
                ListEmptyComponent={renderEmptyState}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[COLORS.primary]}
                        tintColor={COLORS.primary}
                    />
                }
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray,
    },
    headerSubtitle: {
        fontSize: 14,
        color: COLORS.gray,
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: COLORS.gray,
    },
    listContainer: {
        padding: 16,
    },
    emptyContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    favoriteItem: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    itemContent: {
        padding: 16,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    categoryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 8,
    },
    categoryText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '600',
    },
    timeText: {
        fontSize: 12,
        color: COLORS.gray,
    },
    removeButton: {
        padding: 4,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.black,
        marginBottom: 8,
        lineHeight: 22,
    },
    itemContent: {
        fontSize: 14,
        color: COLORS.gray,
        lineHeight: 20,
        marginBottom: 12,
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemAuthor: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '500',
    },
    itemStats: {
        flexDirection: 'row',
        gap: 12,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 12,
        color: COLORS.gray,
    },
    emptyState: {
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 60,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.lightGray,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.black,
        marginBottom: 12,
        textAlign: 'center',
    },
    emptyDescription: {
        fontSize: 16,
        color: COLORS.gray,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    browseButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    browseButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
});

export default FavoriteArticlesScreen;