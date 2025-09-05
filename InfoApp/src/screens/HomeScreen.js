// src/screens/HomeScreen.js - KOMPLETNY Z DZIAŁAJĄCĄ FUNKCJĄ handleLike
import React, { useState, useEffect } from 'react';
import { Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../services/supabaseClient';
import { eventBus, EVENTS } from '../utils/eventBus';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    TextInput,
    Alert,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../styles/colors';
import { newsService } from '../services/newsService';
import { politicianService } from '../services/politicianService';
import { userService } from '../services/userService';
import NewsCard from '../components/news/NewsCard';
import PoliticianCard from '../components/politician/PoliticianCard';
import CommentModal from '../components/modals/CommentModal';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
    const [news, setNews] = useState([]);
    const [politicianPosts, setPoliticianPosts] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [newsSubscription, setNewsSubscription] = useState(null);

    useFocusEffect(
        React.useCallback(() => {
            loadData();
        }, [])
    );


    useEffect(() => {
        loadData();
        setupRealtimeSubscription();

        return () => {
            if (newsSubscription) {
                newsService.unsubscribeFromNews(newsSubscription);
            }
        };
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [newsResponse, postsResponse] = await Promise.all([
                newsService.fetchNews(),
                politicianService.fetchPoliticianPosts()
            ]);

            if (newsResponse.success) {
                const user = await userService.getCurrentUser();

                const newsWithActualData = await Promise.all(
                    newsResponse.data.slice(0, 5).map(async (item) => {
                        try {
                            const { data: counts, error } = await supabase
                                .from('infoapp_news')
                                .select('likes_count, comments_count')
                                .eq('id', item.id)
                                .single();

                            let isLikedByUser = false;
                            if (user?.id) {
                                const likeResp = await newsService.checkIfLiked(item.id, user.id);
                                isLikedByUser = likeResp.success ? likeResp.data : false;
                            }

                            return {
                                ...item,
                                likes_count: counts?.likes_count ?? item.likes_count ?? 0,
                                comments_count: counts?.comments_count ?? item.comments_count ?? 0,
                                isLikedByUser
                            };
                        } catch {
                            return {
                                ...item,
                                likes_count: item.likes_count ?? 0,
                                comments_count: item.comments_count ?? 0,
                                isLikedByUser: false
                            };
                        }
                    })
                );

                setNews(newsWithActualData);
            }

            if (postsResponse.success) {
                setPoliticianPosts(postsResponse.data.slice(0, 3));
            }
        } catch (error) {
            Alert.alert('Błąd', 'Nie udało się załadować danych');
        } finally {
            setLoading(false);
        }
    };

    // W HomeScreen.js, dodaj po loadData():

    useEffect(() => {
        console.log('HomeScreen: Setting up event listeners...');

        const handleNewsUpdate = (data) => {
            console.log('HomeScreen: Received news update event:', data);

            // Aktualizuj news
            setNews(prev => prev.map(item =>
                item.id === data.newsId
                    ? {
                        ...item,
                        likes_count: data.likes_count !== undefined ? data.likes_count : item.likes_count,
                        comments_count: data.comments_count !== undefined ? data.comments_count : item.comments_count,
                        isLikedByUser: data.isLikedByUser !== undefined ? data.isLikedByUser : item.isLikedByUser
                    }
                    : item
            ));

            // Aktualizuj politician posts też
            setPoliticianPosts(prev => prev.map(item =>
                item.id === data.newsId
                    ? {
                        ...item,
                        likes_count: data.likes_count !== undefined ? data.likes_count : item.likes_count,
                        comments_count: data.comments_count !== undefined ? data.comments_count : item.comments_count,
                        isLikedByUser: data.isLikedByUser !== undefined ? data.isLikedByUser : item.isLikedByUser
                    }
                    : item
            ));
        };

        eventBus.on(EVENTS.NEWS_UPDATED, handleNewsUpdate);
        eventBus.on(EVENTS.COMMENT_ADDED, handleNewsUpdate);

        return () => {
            eventBus.off(EVENTS.NEWS_UPDATED, handleNewsUpdate);
            eventBus.off(EVENTS.COMMENT_ADDED, handleNewsUpdate);
        };

    }, []);

    const setupRealtimeSubscription = () => {
        const subscription = newsService.subscribeToNews((payload) => {
            console.log('Real-time update:', payload);
            if (payload.eventType === 'INSERT') {
                setNews(prev => [payload.new, ...prev.slice(0, 4)]);
            } else if (payload.eventType === 'UPDATE') {
                // Aktualizuj liczniki w czasie rzeczywistym
                setNews(prev =>
                    prev.map(item =>
                        item.id === payload.new.id ? payload.new : item
                    )
                );
            }
        });
        setNewsSubscription(subscription);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleSearch = async () => {
        setTimeout(async () => {
            if (!searchQuery.trim()) {
                await loadData();
                return;
            }

            const response = await newsService.searchNews(searchQuery);
            if (response.success) {
                setNews(response.data);
            } else {
                Alert.alert('Błąd', 'Nie udało się wyszukać newsów');
            }
        }, 100); // 100ms opóźnienia
    };

    const clearSearch = async () => {
        setSearchQuery('');
        await loadData();
    };

    const openComments = (item, type = 'news') => {
        setSelectedItem({ ...item, type });
        setModalVisible(true);
    };

    const handleCommentAdded = (postId, newCommentCount) => {
        // Aktualizuj licznik komentarzy w odpowiednim poście
        setNews(prev =>
            prev.map(item =>
                item.id === postId
                    ? { ...item, comments_count: newCommentCount }
                    : item
            )
        );

        setPoliticianPosts(prev =>
            prev.map(item =>
                item.id === postId
                    ? { ...item, comments_count: newCommentCount }
                    : item
            )
        );
        // DODAJ TO: Wyemituj event
        eventBus.emit(EVENTS.NEWS_UPDATED, {
            newsId: postId,
            comments_count: newCommentCount
        });

    };

    // GŁÓWNA FUNKCJA handleLike - DODANA
    const handleLike = async (postId, isLiked, postType = 'news') => {
        console.log('🏠 HomeScreen handleLike called:', {
            postId,
            isLiked,
            postType,
            timestamp: new Date().toISOString()
        });

        try {
            // 1. Optymistyczna aktualizacja UI
            if (postType === 'news') {
                setNews(prev =>
                    prev.map(item =>
                        item.id === postId
                            ? {
                                ...item,
                                likes_count: Math.max(0, (item.likes_count || 0) + (isLiked ? 1 : -1)),
                                isLikedByUser: isLiked
                            }
                            : item
                    )
                );
            } else {
                setPoliticianPosts(prev =>
                    prev.map(item =>
                        item.id === postId
                            ? {
                                ...item,
                                likes_count: Math.max(0, (item.likes_count || 0) + (isLiked ? 1 : -1)),
                                isLikedByUser: isLiked
                            }
                            : item
                    )
                );
            }

            // 2. Sprawdź użytkownika
            const currentUser = await userService.getCurrentUser();
            if (!currentUser) {
                console.log('⚠️ No user logged in - UI updated but no API call');
                return;
            }

            console.log('🔐 User is logged in, making API call...', currentUser.id);

            // 3. API call
            let apiResponse;
            if (postType === 'news') {
                apiResponse = await newsService.toggleLike(postId, currentUser.id, !isLiked);
            } else {
                apiResponse = await politicianService.togglePostLike(postId, currentUser.id, !isLiked);
            }

            // 4. Obsługa odpowiedzi
            if (apiResponse && apiResponse.success) {
                console.log('✅ API call successful');

                // pobierz świeże dane z DB
                const { data: freshData, error } = await supabase
                    .from(postType === 'news' ? 'infoapp_news' : 'infoapp_politician_posts')
                    .select('likes_count')
                    .eq('id', postId)
                    .single();

                if (!error && freshData) {
                    eventBus.emit(EVENTS.LIKE_UPDATED, {
                        newsId: postId,
                        likes_count: freshData.likes_count,
                        isLikedByUser: isLiked
                    });

                    if (postType === 'news') {
                        setNews(prev =>
                            prev.map(item =>
                                item.id === postId
                                    ? { ...item, likes_count: freshData.likes_count, isLikedByUser: isLiked }
                                    : item
                            )
                        );
                    } else {
                        setPoliticianPosts(prev =>
                            prev.map(item =>
                                item.id === postId
                                    ? { ...item, likes_count: freshData.likes_count, isLikedByUser: isLiked }
                                    : item
                            )
                        );
                    }
                }

                if (isLiked) {
                    try {
                        await userService.incrementLikes();
                        console.log('📈 User likes incremented');
                    } catch (error) {
                        console.error('❌ Error incrementing user likes:', error);
                    }
                }
            } else {
                console.error('❌ API call failed:', apiResponse);
                Alert.alert('Błąd', 'Nie udało się zaktualizować polubienia');
            }

        } catch (error) {
            console.error('❌ Error in handleLike:', error);

            // rollback
            if (postType === 'news') {
                setNews(prev =>
                    prev.map(item =>
                        item.id === postId
                            ? {
                                ...item,
                                likes_count: Math.max(0, (item.likes_count || 0) + (isLiked ? -1 : 1)),
                                isLikedByUser: !isLiked
                            }
                            : item
                    )
                );
            } else {
                setPoliticianPosts(prev =>
                    prev.map(item =>
                        item.id === postId
                            ? {
                                ...item,
                                likes_count: Math.max(0, (item.likes_count || 0) + (isLiked ? -1 : 1)),
                                isLikedByUser: !isLiked
                            }
                            : item
                    )
                );
            }

            Alert.alert('Błąd', 'Wystąpił problem z polubieniem');
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['bottom']}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Ładowanie...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <>
            <ScrollView
                style={styles.scrollView}
                contentInsetAdjustmentBehavior="never"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header z wyszukiwaniem */}
                {/* Header z wyszukiwaniem */}
                <LinearGradient
                    colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                    style={styles.header}
                >
                    <Text style={styles.subtitleText}>Bądź na bieżąco z najważniejszymi wydarzeniami</Text>

                    {/* DODAJ TO - Badges z liczbami */}
                    <View style={styles.headerBadges}>
                        <View style={styles.headerBadge}>
                            <Ionicons name="newspaper" size={16} color={COLORS.white} />
                            <Text style={styles.headerBadgeText}>{news.length} newsów</Text>
                        </View>
                        <View style={styles.headerBadge}>
                            <Ionicons name="people" size={16} color={COLORS.white} />
                            <Text style={styles.headerBadgeText}>
                                {politicianPosts.length} {politicianPosts.length < 10 ? 'wpisy polityków' : 'wpisów polityków'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.searchContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Szukaj newsów..."
                            placeholderTextColor={COLORS.gray}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={handleSearch}
                        />

                        {/* Przycisk X do czyszczenia */}
                        {searchQuery.length > 0 && (
                            <TouchableOpacity
                                style={styles.clearButton}
                                onPress={clearSearch}
                            >
                                <Ionicons name="close-circle" size={20} color={COLORS.gray} />
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                            <Ionicons name="search" size={20} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>

                </LinearGradient>
                {/* Sekcja najnowszych newsów */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Najnowsze Newsy</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAllText}>Zobacz więcej</Text>
                        </TouchableOpacity>
                    </View>

                    {news.length > 0 ? (
                        news.map((item) => (
                            <NewsCard
                                key={item.id}
                                news={item}
                                onPress={() => openComments(item, 'news')}
                                onLike={(postId, isLiked) => handleLike(postId, isLiked, 'news')}
                                onComment={() => openComments(item, 'news')}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="newspaper-outline" size={48} color={COLORS.gray} />
                            <Text style={styles.emptyStateText}>Brak newsów do wyświetlenia</Text>
                        </View>
                    )}
                </View>

                {/* Sekcja wpisów polityków */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Politycy na żywo</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAllText}>Zobacz więcej</Text>
                        </TouchableOpacity>
                    </View>

                    {politicianPosts.length > 0 ? (
                        politicianPosts.map((item) => (
                            <PoliticianCard
                                key={item.id}
                                post={item}
                                onPress={() => openComments(item, 'politician_post')}
                                onLike={(postId, isLiked) => handleLike(postId, isLiked, 'politician_post')}
                                onComment={() => openComments(item, 'politician_post')}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="people-outline" size={48} color={COLORS.gray} />
                            <Text style={styles.emptyStateText}>Brak wpisów polityków</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Modal komentarzy */}
            <CommentModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                item={selectedItem}
                onCommentAdded={handleCommentAdded}
                onLikeUpdate={handleLike}
            />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollView: {
        flex: 1,
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
    header: {
        padding: 20,
        paddingTop: 10,
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 8,
    },
    subtitleText: {
        fontSize: 16,
        color: COLORS.white,
        opacity: 0.9,
        marginBottom: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 5,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: COLORS.black,
        paddingVertical: 10,
    },
    searchButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 20,
        padding: 8,
        marginLeft: 10,
    },

    clearButton: {
        padding: 5,
        marginRight: 8,
    },
    headerBadges: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
        gap: 12,
    },
    headerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    headerBadgeText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
    },
    section: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.black,
    },
    seeAllText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyStateText: {
        fontSize: 16,
        color: COLORS.gray,
        marginTop: 10,
    },
    statsSection: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    statsCard: {
        borderRadius: 16,
        padding: 20,
    },
    statsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 15,
        textAlign: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    statLabel: {
        fontSize: 14,
        color: COLORS.white,
        opacity: 0.9,
        marginTop: 4,
        textAlign: 'center',
    },
});

export default HomeScreen;