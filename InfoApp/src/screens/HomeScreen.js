// src/screens/HomeScreen.js - Z aktualizacjami liczników
import React, { useState, useEffect } from 'react';
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
    const [politicianPosts, setPoliticianPosts] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [newsSubscription, setNewsSubscription] = useState(null);

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
                setNews(newsResponse.data.slice(0, 5)); // Pokaż tylko 5 najnowszych
            }

            if (postsResponse.success) {
                setPoliticianPosts(postsResponse.data.slice(0, 3)); // Pokaż tylko 3 najnowsze
            }
        } catch (error) {
            Alert.alert('Błąd', 'Nie udało się załadować danych');
        } finally {
            setLoading(false);
        }
    };

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
        if (!searchQuery.trim()) return;

        const response = await newsService.searchNews(searchQuery);
        if (response.success) {
            setNews(response.data);
        } else {
            Alert.alert('Błąd', 'Nie udało się wyszukać newsów');
        }
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
    };

    const handleLike = async (postId, isLiked, postType = 'news') => {
        try {
            if (postType === 'news') {
                // Optymistyczna aktualizacja UI dla newsów
                setNews(prev =>
                    prev.map(item =>
                        item.id === postId
                            ? { ...item, likes_count: (item.likes_count || 0) + (isLiked ? 1 : -1) }
                            : item
                    )
                );
            } else {
                // Optymistyczna aktualizacja UI dla wpisów polityków
                setPoliticianPosts(prev =>
                    prev.map(item =>
                        item.id === postId
                            ? { ...item, likes_count: (item.likes_count || 0) + (isLiked ? 1 : -1) }
                            : item
                    )
                );
            }
        } catch (error) {
            console.error('Error updating like in UI:', error);
        }
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

                    <View style={styles.searchContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Szukaj newsów..."
                            placeholderTextColor={COLORS.gray}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={handleSearch}
                        />
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

                {/* Statystyki */}
                <View style={styles.statsSection}>
                    <LinearGradient
                        colors={[COLORS.primary, COLORS.secondary]}
                        style={styles.statsCard}
                    >
                        <Text style={styles.statsTitle}>Dzisiaj w InfoApp</Text>
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{news.length}</Text>
                                <Text style={styles.statLabel}>Nowych newsów</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{politicianPosts.length}</Text>
                                <Text style={styles.statLabel}>Wpisów polityków</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>
                                    {news.reduce((sum, item) => sum + (item.comments_count || 0), 0) +
                                        politicianPosts.reduce((sum, item) => sum + (item.comments_count || 0), 0)}
                                </Text>
                                <Text style={styles.statLabel}>Komentarzy</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </View>
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
        color: COLORS.textSecondary,
    },
    header: {
        padding: 20,
        paddingBottom: 30,
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 5,
    },
    subtitleText: {
        fontSize: 16,
        color: COLORS.white,
        opacity: 0.9,
        marginBottom: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 5,
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 10,
        color: COLORS.textPrimary,
    },
    searchButton: {
        backgroundColor: COLORS.primary,
        padding: 10,
        borderRadius: 20,
        marginLeft: 10,
    },
    section: {
        marginTop: 20,
        paddingHorizontal: 20,
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
        color: COLORS.textPrimary,
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
        color: COLORS.textSecondary,
        marginTop: 10,
    },
    statsSection: {
        paddingHorizontal: 20,
        marginTop: 20,
        marginBottom: 30,
    },
    statsCard: {
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
    },
    statsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 15,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
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
        fontSize: 12,
        color: COLORS.white,
        opacity: 0.9,
        marginTop: 5,
    },
});

export default HomeScreen;