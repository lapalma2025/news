// src/screens/HomeScreen.js – FINAL
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';

import { COLORS } from '../styles/colors';
import { newsService } from '../services/newsService';
import { politicianService } from '../services/politicianService';
import { supabase } from '../services/supabaseClient';

import NewsCard from '../components/news/NewsCard';
import PoliticianCard from '../components/politician/PoliticianCard';
import CommentModal from '../components/modals/CommentModal';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
    const firstLoad = useRef(true);
    const [news, setNews] = useState([]);
    const [originalNews, setOriginalNews] = useState([]); // pełna lista (źródło prawdy dla wyszukiwania)
    const [politicianPosts, setPoliticianPosts] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // realtime kanały + debounce
    const newsChannelRef = useRef(null);
    const polChannelRef = useRef(null);
    const realtimeRefreshTimer = useRef(null);

    // debounce dla wyszukiwarki
    const searchTimeoutRef = useRef(null);
    const mountedRef = useRef(false);

    // === UTILS ===
    const debounce = (fn, delay = 300) => {
        return (...args) => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = setTimeout(() => fn(...args), delay);
        };
    };

    const softRefreshAfterRealtime = useCallback(() => {
        if (realtimeRefreshTimer.current) clearTimeout(realtimeRefreshTimer.current);
        // drobny bufor, żeby uniknąć spamowania zapytaniami przy wielu zmianach
        realtimeRefreshTimer.current = setTimeout(() => {
            loadData({ showLoader: false });
        }, 300);
    }, []);

    // === LOAD DATA ===
    const loadData = useCallback(async ({ showLoader = true } = {}) => {
        if (showLoader) setLoading(true);
        try {
            const [newsResponse, postsResponse] = await Promise.all([
                newsService.fetchNews(),                // już sortuje po created_at desc
                politicianService.fetchPoliticianPosts()
            ]);

            if (newsResponse.success) {
                // weź np. top 5 na Home
                const data = (newsResponse.data || []).slice(0, 5);
                setOriginalNews(data);
                setNews((prev) => {
                    // jeżeli nie ma aktywnego wyszukiwania — pokaż świeże
                    if (!searchQuery.trim()) return data;
                    // jeżeli jest, przefiltruj świeże dane po query
                    return filterLocal(data, searchQuery);
                });
            } else {
                Alert.alert('Błąd', 'Nie udało się załadować newsów');
            }

            if (postsResponse.success) {
                // np. top 3 posty polityków
                setPoliticianPosts((postsResponse.data || []).slice(0, 3));
            } else {
                Alert.alert('Błąd', 'Nie udało się załadować wpisów polityków');
            }
        } catch (e) {
            console.error('Home loadData error:', e);
            Alert.alert('Błąd', 'Wystąpił problem z połączeniem');
        } finally {
            if (showLoader) setLoading(false);
        }
    }, [searchQuery]);

    // === FOCUS-REFETCH ===
    // Odśwież dane ZA KAŻDYM razem, gdy wchodzisz na zakładkę Home
    useFocusEffect(
        useCallback(() => {
            if (firstLoad.current) {
                // 🚀 pierwsze uruchomienie
                loadData({ showLoader: true }).finally(() => {
                    firstLoad.current = false;
                });
            } else {
                // 🚀 każde kolejne wejście na Home
                loadData({ showLoader: false });
            }
        }, [])
    );


    // === REALTIME ===
    useEffect(() => {
        // NEWS realtime
        const newsChannel = supabase
            .channel('realtime_home_news')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'infoapp_news' },
                () => softRefreshAfterRealtime()
            )
            .subscribe();
        newsChannelRef.current = newsChannel;

        // POLITICIAN POSTS realtime
        const polChannel = supabase
            .channel('realtime_home_politician_posts')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'infoapp_politician_posts' },
                () => softRefreshAfterRealtime()
            )
            .subscribe();
        polChannelRef.current = polChannel;

        return () => {
            if (newsChannelRef.current) supabase.removeChannel(newsChannelRef.current);
            if (polChannelRef.current) supabase.removeChannel(polChannelRef.current);
            newsChannelRef.current = null;
            polChannelRef.current = null;

            if (realtimeRefreshTimer.current) {
                clearTimeout(realtimeRefreshTimer.current);
                realtimeRefreshTimer.current = null;
            }
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
                searchTimeoutRef.current = null;
            }
        };
    }, [softRefreshAfterRealtime]);

    // === SEARCH ===
    const filterLocal = (list, query) => {
        if (!query.trim()) return list;
        const q = query.toLowerCase();
        return list.filter(
            (item) =>
                item.title?.toLowerCase().includes(q) ||
                item.content?.toLowerCase().includes(q) ||
                item.author?.toLowerCase().includes(q)
        );
    };

    const runSearch = useCallback(async () => {
        const q = searchQuery.trim();
        if (!q) {
            // przy pustym query wracamy do oryginalnej listy
            setNews(originalNews);
            return;
        }

        // 1) szybkie filtrowanie lokalne (natychmiastowy feedback)
        const locally = filterLocal(originalNews, q);
        setNews(locally);

        // 2) dobijamy do bazy (pełniejsze wyniki)
        try {
            const resp = await newsService.searchNews(q);
            if (resp.success) {
                // aby najnowsze były na górze (gdyby backend nie sortował)
                const sorted = [...resp.data].sort(
                    (a, b) => new Date(b.created_at) - new Date(a.created_at)
                );
                setNews(sorted.slice(0, 20)); // przytnij jeśli chcesz
            }
        } catch (e) {
            console.warn('Search error (fallback to local only):', e);
        }
    }, [searchQuery, originalNews]);

    // debounce dla wyszukiwania
    const debouncedSearch = useCallback(debounce(runSearch, 300), [runSearch]);

    useEffect(() => {
        if (firstLoad.current) return; // 🚀 nie wyszukuj przy pierwszym renderze
        debouncedSearch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]);

    const onRefresh = async () => {
        setRefreshing(true);
        setSearchQuery(''); // wyczyść wyszukiwarkę przy pull-to-refresh
        await loadData({ showLoader: false });
        setRefreshing(false);
    };

    const clearSearch = () => {
        setSearchQuery('');
        setNews(originalNews);
    };

    // === MODAL ===
    const openComments = (item, type = 'news') => {
        // upewnij się, że przekazujesz typ ('news' | 'politician_post'), żeby CommentModal
        // działał poprawnie dla obu rodzajów postów
        setSelectedItem({ ...item, type });
        setModalVisible(true);
    };

    const handleCommentAdded = (postId, newCount) => {
        // update liczników w newsach
        setNews((prev) =>
            prev.map((n) => (n.id === postId ? { ...n, comments_count: newCount } : n))
        );
        setOriginalNews((prev) =>
            prev.map((n) => (n.id === postId ? { ...n, comments_count: newCount } : n))
        );
        // update liczników w postach polityków
        setPoliticianPosts((prev) =>
            prev.map((p) => (p.id === postId ? { ...p, comments_count: newCount } : p))
        );
    };

    // (opcjonalnie) jeśli chcesz też łapać polubienia z CommentModal:
    const handleLikeUpdate = (postId, newLikesCount, isLiked) => {
        // news
        setNews((prev) =>
            prev.map((n) =>
                n.id === postId ? { ...n, likes_count: newLikesCount, isLikedByUser: isLiked } : n
            )
        );
        setOriginalNews((prev) =>
            prev.map((n) =>
                n.id === postId ? { ...n, likes_count: newLikesCount, isLikedByUser: isLiked } : n
            )
        );
        // politycy
        setPoliticianPosts((prev) =>
            prev.map((p) =>
                p.id === postId ? { ...p, likes_count: newLikesCount, isLikedByUser: isLiked } : p
            )
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Ładowanie…</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* HEADER */}
                <LinearGradient
                    colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                    style={styles.header}
                >
                    <Text style={styles.welcomeText}>Witaj w InfoApp</Text>
                    <Text style={styles.subtitleText}>
                        Bądź na bieżąco z najważniejszymi wydarzeniami
                    </Text>

                    {/* SEARCH */}
                    <View style={styles.searchContainer}>
                        <View style={styles.searchInputContainer}>
                            <Ionicons name="search" size={20} color={COLORS.gray} style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Szukaj newsów..."
                                placeholderTextColor={COLORS.gray}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                returnKeyType="search"
                                autoCorrect={false}
                                autoCapitalize="none"
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                                    <Ionicons name="close-circle" size={20} color={COLORS.gray} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {searchQuery.length > 0 && (
                        <View style={styles.searchResults}>
                            <Text style={styles.searchResultsText}>
                                {news.length} {news.length === 1 ? 'wynik' : 'wyników'} dla "{searchQuery}"
                            </Text>
                        </View>
                    )}
                </LinearGradient>

                {/* NEWS SECTION */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            {searchQuery ? 'Wyniki wyszukiwania' : 'Najnowsze Newsy'}
                        </Text>
                        {!searchQuery && (
                            <TouchableOpacity onPress={() => loadData({ showLoader: true })}>
                                <Text style={styles.seeAllText}>Odśwież</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {news.length > 0 ? (
                        news.map((item) => (
                            <NewsCard
                                key={item.id}
                                news={item}
                                onPress={() => openComments(item, 'news')}
                                onComment={() => openComments(item, 'news')}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="search-outline" size={48} color={COLORS.gray} />
                            <Text style={styles.emptyStateText}>
                                {searchQuery ? 'Brak wyników wyszukiwania' : 'Brak newsów'}
                            </Text>
                            {searchQuery && (
                                <TouchableOpacity onPress={clearSearch} style={styles.clearSearchButton}>
                                    <Text style={styles.clearSearchText}>Wyczyść wyszukiwanie</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>

                {/* POLITICIANS SECTION (ukryj przy wyszukiwaniu) */}
                {!searchQuery && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Komunikaty Polityków</Text>
                            <TouchableOpacity onPress={() => loadData({ showLoader: true })}>
                                <Text style={styles.seeAllText}>Odśwież</Text>
                            </TouchableOpacity>
                        </View>

                        {politicianPosts.length > 0 ? (
                            politicianPosts.map((item) => (
                                <PoliticianCard
                                    key={item.id}
                                    post={item}
                                    onPress={() => openComments(item, 'politician_post')}
                                    onComment={() => openComments(item, 'politician_post')}
                                />
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="person-outline" size={48} color={COLORS.gray} />
                                <Text style={styles.emptyStateText}>Brak komunikatów polityków</Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* MODAL */}
            <CommentModal
                key={selectedItem?.id}
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                item={selectedItem}
                onCommentAdded={handleCommentAdded}
                onLikeUpdate={handleLikeUpdate}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollView: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { fontSize: 16, color: COLORS.gray },
    header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30 },
    welcomeText: { fontSize: 28, fontWeight: '700', color: COLORS.white, textAlign: 'center', marginBottom: 8 },
    subtitleText: { fontSize: 16, color: COLORS.white, textAlign: 'center', opacity: 0.9, marginBottom: 25 },
    searchContainer: { marginBottom: 10 },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 12,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 16, color: COLORS.black },
    clearButton: { padding: 4 },
    searchResults: { paddingTop: 10 },
    searchResultsText: { color: COLORS.white, fontSize: 14, textAlign: 'center', opacity: 0.9 },
    section: { paddingHorizontal: 20, paddingTop: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 20, fontWeight: '700', color: COLORS.black },
    seeAllText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
    emptyState: { alignItems: 'center', paddingVertical: 40 },
    emptyStateText: { fontSize: 16, color: COLORS.gray, textAlign: 'center', marginTop: 10 },
    clearSearchButton: { marginTop: 15, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: COLORS.primary, borderRadius: 20 },
    clearSearchText: { color: COLORS.white, fontWeight: '600' },
});

export default HomeScreen;
