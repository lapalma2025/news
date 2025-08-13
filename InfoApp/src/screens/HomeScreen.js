// src/screens/HomeScreen.js - NAPRAWIONY
import React, { useState, useEffect, useRef } from 'react';
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
import NewsCard from '../components/news/NewsCard';
import PoliticianCard from '../components/politician/PoliticianCard';
import CommentModal from '../components/modals/CommentModal';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
    const [news, setNews] = useState([]);
    const [originalNews, setOriginalNews] = useState([]); // Oryginalne newsy
    const [politicianPosts, setPoliticianPosts] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [newsSubscription, setNewsSubscription] = useState(null);

    // Ref dla debounce search
    const searchTimeoutRef = useRef(null);
    const isSearching = useRef(false);

    useEffect(() => {
        loadData();

        return () => {
            if (newsSubscription) {
                newsService.unsubscribeFromNews(newsSubscription);
            }
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    // Real-time search effect
    useEffect(() => {
        handleSearchDebounced();
    }, [searchQuery]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [newsResponse, postsResponse] = await Promise.all([
                newsService.fetchNews(),
                politicianService.fetchPoliticianPosts()
            ]);

            if (newsResponse.success) {
                const newsData = newsResponse.data.slice(0, 5);
                setNews(newsData);
                setOriginalNews(newsData); // Zachowaj oryginalne
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


    const handleSearchDebounced = () => {
        // Wyczyść poprzedni timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Ustaw nowy timeout
        searchTimeoutRef.current = setTimeout(() => {
            handleSearch();
        }, 300); // 300ms debounce
    };

    const handleSearch = async () => {
        const query = searchQuery.trim();

        // Jeśli puste, przywróć oryginalne newsy
        if (!query) {
            setNews(originalNews);
            isSearching.current = false;
            return;
        }

        try {
            isSearching.current = true;

            // Najpierw filtruj lokalnie dla szybkiej odpowiedzi
            const localFiltered = originalNews.filter(item =>
                item.title.toLowerCase().includes(query.toLowerCase()) ||
                item.content.toLowerCase().includes(query.toLowerCase()) ||
                item.author.toLowerCase().includes(query.toLowerCase())
            );
            setNews(localFiltered);

            // Następnie wyszukaj w bazie danych
            const response = await newsService.searchNews(query);
            if (response.success) {
                setNews(response.data);
            }
        } catch (error) {
            console.error('Search error:', error);
            // W przypadku błędu, zostaw lokalne filtrowanie
        } finally {
            isSearching.current = false;
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        setSearchQuery(''); // Wyczyść wyszukiwanie
        await loadData();
        setRefreshing(false);
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

        setOriginalNews(prev =>
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
    };


    const clearSearch = () => {
        setSearchQuery('');
        setNews(originalNews);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Ładowanie...</Text>
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
                {/* Header z wyszukiwaniem */}
                <LinearGradient
                    colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                    style={styles.header}
                >
                    <Text style={styles.welcomeText}>Witaj w InfoApp</Text>
                    <Text style={styles.subtitleText}>Bądź na bieżąco z najważniejszymi wydarzeniami</Text>

                    {/* NAPRAWIONY SEARCH INPUT */}
                    <View style={styles.searchContainer}>
                        <View style={styles.searchInputContainer}>
                            <Ionicons name="search" size={20} color={COLORS.gray} style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Szukaj newsów..."
                                placeholderTextColor={COLORS.gray}
                                value={searchQuery}
                                onChangeText={setSearchQuery} // REAL-TIME SEARCH
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

                    {/* Wyniki wyszukiwania */}
                    {searchQuery.length > 0 && (
                        <View style={styles.searchResults}>
                            <Text style={styles.searchResultsText}>
                                {news.length} {news.length === 1 ? 'wynik' : 'wyników'} dla "{searchQuery}"
                            </Text>
                        </View>
                    )}
                </LinearGradient>

                {/* Sekcja najnowszych newsów */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            {searchQuery ? 'Wyniki wyszukiwania' : 'Najnowsze Newsy'}
                        </Text>
                        {!searchQuery && (
                            <TouchableOpacity>
                                <Text style={styles.seeAllText}>Zobacz więcej</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {news.length > 0 ? (
                        news.map((item) => (
                            <NewsCard
                                key={item.id}
                                news={item}
                                onPress={() => openComments(item)}
                                onComment={() => openComments(item)}
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

                {/* Sekcja wpisów polityków - ukryj podczas wyszukiwania */}
                {!searchQuery && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Komunikaty Polityków</Text>
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

            {/* Modal komentarzy */}
            <CommentModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                item={selectedItem}
                onCommentAdded={handleCommentAdded}
            />
        </SafeAreaView>
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
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 30,
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.white,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitleText: {
        fontSize: 16,
        color: COLORS.white,
        textAlign: 'center',
        opacity: 0.9,
        marginBottom: 25,
    },
    searchContainer: {
        marginBottom: 10,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 12,
        shadowColor: COLORS.black,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: COLORS.black,
    },
    clearButton: {
        padding: 4,
    },
    searchResults: {
        paddingTop: 10,
    },
    searchResultsText: {
        color: COLORS.white,
        fontSize: 14,
        textAlign: 'center',
        opacity: 0.9,
    },
    section: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
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
        textAlign: 'center',
        marginTop: 10,
    },
    clearSearchButton: {
        marginTop: 15,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: COLORS.primary,
        borderRadius: 20,
    },
    clearSearchText: {
        color: COLORS.white,
        fontWeight: '600',
    },
});

export default HomeScreen;