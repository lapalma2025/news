// src/screens/NewsScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    TextInput,
    Alert,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS } from '../styles/colors';
import { newsService } from '../services/newsService';
import NewsCard from '../components/news/NewsCard';
import CommentModal from '../components/modals/CommentModal';

const { width } = Dimensions.get('window');

const CATEGORIES = [
    { id: 'all', name: 'Wszystkie', icon: 'apps' },
    { id: 'Polityka', name: 'Polityka', icon: 'people' },
    { id: 'Ekonomia', name: 'Ekonomia', icon: 'trending-up' },
    { id: 'Technologia', name: 'Tech', icon: 'phone-portrait' },
    { id: 'Społeczeństwo', name: 'Społeczeństwo', icon: 'home' },
    { id: 'Kultura', name: 'Kultura', icon: 'library' },
    { id: 'Sport', name: 'Sport', icon: 'football' },
];

const NewsScreen = () => {
    const [news, setNews] = useState([]);
    const [filteredNews, setFilteredNews] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [newsSubscription, setNewsSubscription] = useState(null);

    useEffect(() => {
        loadNews();
        setupRealtimeSubscription();

        return () => {
            if (newsSubscription) {
                newsService.unsubscribeFromNews(newsSubscription);
            }
        };
    }, []);

    useEffect(() => {
        filterNews();
    }, [news, searchQuery, selectedCategory]);

    const loadNews = async () => {
        setLoading(true);
        try {
            const response = await newsService.fetchNews();
            if (response.success) {
                setNews(response.data);
            } else {
                Alert.alert('Błąd', 'Nie udało się załadować newsów');
            }
        } catch (error) {
            Alert.alert('Błąd', 'Wystąpił problem z połączeniem');
        } finally {
            setLoading(false);
        }
    };

    const setupRealtimeSubscription = () => {
        const subscription = newsService.subscribeToNews((payload) => {
            console.log('Real-time news update:', payload);
            if (payload.eventType === 'INSERT') {
                setNews(prev => [payload.new, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
                setNews(prev =>
                    prev.map(item =>
                        item.id === payload.new.id ? payload.new : item
                    )
                );
            }
        });
        setNewsSubscription(subscription);
    };

    const filterNews = () => {
        let filtered = news;

        // Filtruj według kategorii
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(item => item.category === selectedCategory);
        }

        // Filtruj według wyszukiwania
        if (searchQuery.trim()) {
            filtered = filtered.filter(item =>
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.author.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredNews(filtered);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadNews();
        setRefreshing(false);
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            filterNews();
            return;
        }

        const response = await newsService.searchNews(searchQuery);
        if (response.success) {
            setNews(response.data);
        } else {
            Alert.alert('Błąd', 'Nie udało się wyszukać newsów');
        }
    };

    const openComments = (item) => {
        setSelectedItem(item);
        setModalVisible(true);
    };

    const handleLike = async (newsId, isLiked) => {
        try {
            await newsService.updateLikesCount(newsId, isLiked);
            // Optymistyczna aktualizacja UI
            setNews(prev =>
                prev.map(item =>
                    item.id === newsId
                        ? { ...item, likes_count: (item.likes_count || 0) + (isLiked ? 1 : -1) }
                        : item
                )
            );
        } catch (error) {
            console.error('Error updating like:', error);
        }
    };

    const renderCategoryFilter = () => (
        <View style={styles.categoriesContainer}>
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={CATEGORIES}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.categoriesList}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.categoryButton,
                            selectedCategory === item.id && styles.categoryButtonActive
                        ]}
                        onPress={() => setSelectedCategory(item.id)}
                    >
                        <Ionicons
                            name={item.icon}
                            size={18}
                            color={selectedCategory === item.id ? COLORS.white : COLORS.primary}
                        />
                        <Text
                            style={[
                                styles.categoryText,
                                selectedCategory === item.id && styles.categoryTextActive
                            ]}
                        >
                            {item.name}
                        </Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );

    const renderHeader = () => (
        <View>
            {/* Wyszukiwarka */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Ionicons name="search" size={20} color={COLORS.gray} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Szukaj newsów..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearch}
                        placeholderTextColor={COLORS.gray}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity
                            onPress={() => setSearchQuery('')}
                            style={styles.clearButton}
                        >
                            <Ionicons name="close-circle" size={20} color={COLORS.gray} />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                    <Ionicons name="search" size={20} color={COLORS.white} />
                </TouchableOpacity>
            </View>

            {/* Filtry kategorii */}
            {renderCategoryFilter()}

            {/* Licznik wyników */}
            <View style={styles.resultsContainer}>
                <Text style={styles.resultsText}>
                    {filteredNews.length} {filteredNews.length === 1 ? 'news' : 'newsów'}
                    {selectedCategory !== 'all' && ` w kategorii ${CATEGORIES.find(c => c.id === selectedCategory)?.name}`}
                </Text>
            </View>
        </View>
    );

    const renderNewsItem = ({ item }) => (
        <NewsCard
            news={item}
            onPress={openComments}
            onLike={handleLike}
            onComment={openComments}
        />
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="newspaper-outline" size={64} color={COLORS.gray} />
            <Text style={styles.emptyStateTitle}>
                {searchQuery ? 'Brak wyników' : 'Brak newsów'}
            </Text>
            <Text style={styles.emptyStateText}>
                {searchQuery
                    ? `Nie znaleziono newsów dla "${searchQuery}"`
                    : 'Aktualnie nie ma opublikowanych newsów'
                }
            </Text>
            {searchQuery && (
                <TouchableOpacity
                    style={styles.clearSearchButton}
                    onPress={() => setSearchQuery('')}
                >
                    <Text style={styles.clearSearchText}>Wyczyść wyszukiwanie</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={filteredNews}
                renderItem={renderNewsItem}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={!loading ? renderEmptyState : null}
                contentContainerStyle={styles.listContainer}
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

            {loading && (
                <View style={styles.loadingOverlay}>
                    <Text style={styles.loadingText}>Ładowanie newsów...</Text>
                </View>
            )}

            <CommentModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                item={selectedItem}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    listContainer: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginRight: 12,
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        marginLeft: 10,
        color: COLORS.textPrimary,
    },
    clearButton: {
        padding: 4,
    },
    searchButton: {
        backgroundColor: COLORS.primary,
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    categoriesContainer: {
        marginBottom: 20,
    },
    categoriesList: {
        paddingVertical: 10,
    },
    categoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 12,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    categoryButtonActive: {
        backgroundColor: COLORS.primary,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
        marginLeft: 6,
    },
    categoryTextActive: {
        color: COLORS.white,
    },
    resultsContainer: {
        marginBottom: 20,
    },
    resultsText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginTop: 20,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 20,
    },
    clearSearchButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
    },
    clearSearchText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        backgroundColor: COLORS.white,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
});

export default NewsScreen;