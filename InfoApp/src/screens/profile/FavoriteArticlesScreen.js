import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { COLORS } from '../../styles/colors';
import { userService } from '../../services/userService';
import { supabase } from '../../services/supabaseClient';
import CommentModal from '../../components/modals/CommentModal';

const FavoriteArticlesScreen = () => {
    const navigation = useNavigation();
    const [likedArticles, setLikedArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // Stan dla modala komentarzy
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        initializeScreen();
    }, []);

    const initializeScreen = async () => {
        try {
            const user = await userService.getCurrentUser();
            setCurrentUser(user);
            if (user) {
                await loadLikedArticles(user.id);
            }
        } catch (error) {
            console.error('Error initializing screen:', error);
            setLoading(false);
        }
    };

    const loadLikedArticles = async (userId) => {
        try {
            setLoading(true);
            console.log('Loading liked articles for user:', userId);

            // KROK 1: Pobierz wszystkie likes użytkownika
            const { data: userLikes, error: likesError } = await supabase
                .from('infoapp_likes')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (likesError) {
                console.error('Error fetching user likes:', likesError);
                throw likesError;
            }

            console.log('Found user likes:', userLikes?.length || 0);

            if (!userLikes || userLikes.length === 0) {
                setLikedArticles([]);
                return;
            }

            // KROK 2: Pobierz szczegóły artykułów
            const allArticles = [];

            // Pobierz newsy
            const newsLikes = userLikes.filter(like => like.post_type === 'news');
            if (newsLikes.length > 0) {
                const newsIds = newsLikes.map(like => like.post_id);

                const { data: newsData, error: newsError } = await supabase
                    .from('infoapp_news')
                    .select('*')
                    .in('id', newsIds)
                    .eq('is_active', true);

                if (newsError) {
                    console.error('Error fetching news data:', newsError);
                } else {
                    // Połącz dane newsów z informacjami o like'ach
                    const newsWithLikes = newsData.map(news => {
                        const like = newsLikes.find(l => l.post_id === news.id);
                        return {
                            ...news,
                            type: 'news',
                            likeId: like.id,
                            likedAt: like.created_at,
                            isLiked: true
                        };
                    });
                    allArticles.push(...newsWithLikes);
                }
            }

            // Pobierz wpisy polityków (jeśli istnieją)
            const politicianLikes = userLikes.filter(like => like.post_type === 'politician_post');
            if (politicianLikes.length > 0) {
                const postIds = politicianLikes.map(like => like.post_id);

                try {
                    const { data: postsData, error: postsError } = await supabase
                        .from('infoapp_politician_posts')
                        .select('*')
                        .in('id', postIds)
                        .eq('is_active', true);

                    if (postsError) {
                        console.log('Politician posts table might not exist or be accessible');
                    } else {
                        // Pobierz informacje o politykach
                        const politicianIds = [...new Set(postsData.map(post => post.politician_id))];
                        const { data: politiciansData } = await supabase
                            .from('infoapp_politicians')
                            .select('*')
                            .in('id', politicianIds);

                        // Połącz dane wpisów z politykami i like'ami
                        const postsWithLikes = postsData.map(post => {
                            const like = politicianLikes.find(l => l.post_id === post.id);
                            const politician = politiciansData?.find(p => p.id === post.politician_id);
                            return {
                                ...post,
                                type: 'politician_post',
                                likeId: like.id,
                                likedAt: like.created_at,
                                isLiked: true,
                                politician_name: politician?.name || 'Nieznany polityk',
                                politician_party: politician?.party || ''
                            };
                        });
                        allArticles.push(...postsWithLikes);
                    }
                } catch (error) {
                    console.log('Skipping politician posts:', error.message);
                }
            }

            // Sortuj wszystkie artykuły według daty polubienia
            allArticles.sort((a, b) => new Date(b.likedAt) - new Date(a.likedAt));

            console.log('Loaded liked articles:', allArticles.length);
            setLikedArticles(allArticles);

        } catch (error) {
            console.error('Error loading liked articles:', error);
            Alert.alert('Błąd', 'Nie udało się załadować polubionych artykułów');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        if (!currentUser) return;

        setRefreshing(true);
        await loadLikedArticles(currentUser.id);
        setRefreshing(false);
    };

    // Funkcja do otwierania artykułu w modallu komentarzy
    const openArticle = (item) => {
        console.log('Opening article:', item.title);
        setSelectedItem(item);
        setModalVisible(true);
    };

    // Funkcja do nawigacji do odpowiedniego ekranu
    const navigateToArticle = (item) => {
        if (item.type === 'news') {
            // Przejdź do ekranu newsów i otwórz konkretny news
            navigation.navigate('NewsScreen', {
                openArticleId: item.id,
                article: item
            });
        } else if (item.type === 'politician_post') {
            // Przejdź do ekranu polityków lub otwórz wpis w modallu
            navigation.navigate('PoliticiansScreen', {
                openPostId: item.id,
                post: item
            });
        }
    };

    const removeFromLiked = async (item) => {
        Alert.alert(
            'Usuń polubienie',
            'Czy na pewno chcesz usunąć polubienie tego artykułu?',
            [
                { text: 'Anuluj', style: 'cancel' },
                {
                    text: 'Usuń',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            console.log('Removing like:', item.likeId);

                            // Usuń like z bazy danych
                            const { error: deleteError } = await supabase
                                .from('infoapp_likes')
                                .delete()
                                .eq('id', item.likeId);

                            if (deleteError) {
                                throw deleteError;
                            }

                            // Zmniejsz licznik polubień w odpowiedniej tabeli
                            const tableName = item.type === 'news' ? 'infoapp_news' : 'infoapp_politician_posts';

                            const { data: currentData } = await supabase
                                .from(tableName)
                                .select('likes_count')
                                .eq('id', item.id)
                                .single();

                            if (currentData) {
                                const newCount = Math.max((currentData.likes_count || 0) - 1, 0);

                                await supabase
                                    .from(tableName)
                                    .update({ likes_count: newCount })
                                    .eq('id', item.id);
                            }

                            // Usuń z lokalnej listy
                            setLikedArticles(prev => prev.filter(article => article.likeId !== item.likeId));

                            Alert.alert('Sukces', 'Polubienie zostało usunięte');
                        } catch (error) {
                            console.error('Error removing like:', error);
                            Alert.alert('Błąd', 'Nie udało się usunąć polubienia');
                        }
                    }
                }
            ]
        );
    };

    const handleCommentAdded = (postId, newCommentCount) => {
        // Aktualizuj licznik komentarzy w lokalnej liście
        setLikedArticles(prev =>
            prev.map(item =>
                item.id === postId
                    ? { ...item, comments_count: newCommentCount }
                    : item
            )
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

    const getCategoryColor = (category, type) => {
        if (type === 'politician_post') return '#e74c3c'; // Czerwony dla polityków

        const categoryColors = {
            'polityka': '#3498db',
            'ekonomia': '#2ecc71',
            'technologia': '#9b59b6',
            'społeczeństwo': '#e74c3c',
            'kultura': '#f39c12',
            'sport': '#1abc9c'
        };
        return categoryColors[category?.toLowerCase()] || '#34495e';
    };

    const renderLikedItem = ({ item }) => (
        <TouchableOpacity
            style={styles.articleItem}
            activeOpacity={0.7}
            onPress={() => openArticle(item)} // Otwórz w modallu komentarzy
        >
            <View style={styles.itemContent}>
                <View style={styles.itemHeader}>
                    <View style={styles.categoryContainer}>
                        <View style={[
                            styles.categoryBadge,
                            { backgroundColor: getCategoryColor(item.category, item.type) }
                        ]}>
                            <Text style={styles.categoryText}>
                                {item.type === 'news' ? (item.category || 'News') : 'Polityk'}
                            </Text>
                        </View>
                        <Text style={styles.timeText}>
                            Polubiono {formatTime(item.likedAt)}
                        </Text>
                    </View>

                    <View style={styles.actionButtons}>
                        {/* Przycisk nawigacji do ekranu */}
                        <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => removeFromLiked(item)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="heart" size={20} color="#e74c3c" />
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.itemTitle} numberOfLines={2}>
                    {item.title}
                </Text>

                <Text style={styles.itemPreview} numberOfLines={3}>
                    {item.content}
                </Text>

                <View style={styles.itemFooter}>
                    <Text style={styles.itemAuthor}>
                        {item.author || item.politician_name || 'Nieznany autor'}
                        {item.politician_party && ` (${item.politician_party})`}
                    </Text>
                    <View style={styles.itemStats}>
                        <View style={styles.statItem}>
                            <Ionicons name="heart" size={14} color="#e74c3c" />
                            <Text style={styles.statText}>{item.likes_count || 0}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Ionicons name="chatbubble-outline" size={14} color="#7f8c8d" />
                            <Text style={styles.statText}>{item.comments_count || 0}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.originalDate}>
                    <Text style={styles.originalDateText}>
                        Opublikowano {formatTime(item.created_at)}
                    </Text>
                </View>

                {/* Wskazówka dla użytkownika */}
                <View style={styles.actionHint}>
                    <Text style={styles.actionHintText}>
                        Dotknij aby zobaczyć komentarze
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
                <Ionicons name="heart-outline" size={64} color="#bdc3c7" />
            </View>
            <Text style={styles.emptyTitle}>Brak polubionych artykułów</Text>
            <Text style={styles.emptyDescription}>
                Artykuły, które polubisz, pojawią się tutaj.
                Kliknij ikonę serca przy artykule, aby go polubić.
            </Text>
            <TouchableOpacity
                style={styles.browseButton}
                onPress={() => navigation.navigate('NewsScreen')}
            >
                <Text style={styles.browseButtonText}>Przeglądaj artykuły</Text>
            </TouchableOpacity>
        </View>
    );

    const renderLoadingState = () => (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Ładowanie polubionych artykułów...</Text>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                {renderLoadingState()}
            </SafeAreaView>
        );
    }

    return (
        <>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Polubione artykuły</Text>
                <Text style={styles.headerSubtitle}>
                    {likedArticles.length === 0 ? 'Brak polubionych artykułów' :
                        `${likedArticles.length} ${likedArticles.length === 1 ? 'artykuł' :
                            likedArticles.length < 5 ? 'artykuły' : 'artykułów'}`}
                </Text>
            </View>

            <FlatList
                data={likedArticles}
                renderItem={renderLikedItem}
                keyExtractor={(item) => `${item.type}-${item.id}-${item.likeId}`}
                contentContainerStyle={likedArticles.length === 0 ? styles.emptyContainer : styles.listContainer}
                ListEmptyComponent={renderEmptyState}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#3498db']}
                        tintColor="#3498db"
                    />
                }
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={10}
            />

            {/* Modal komentarzy */}
            <CommentModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                item={selectedItem}
                onCommentAdded={handleCommentAdded}
            />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background || '#f8f9fa',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: COLORS.white || '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray || '#ecf0f1',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.black || '#2c3e50',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: COLORS.gray || '#7f8c8d',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    loadingText: {
        fontSize: 16,
        color: COLORS.gray || '#7f8c8d',
        marginTop: 16,
        textAlign: 'center',
    },
    listContainer: {
        padding: 16,
    },
    emptyContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    articleItem: {
        backgroundColor: COLORS.white || '#ffffff',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: COLORS.black || '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: COLORS.lightGray || '#ecf0f1',
    },
    itemContent: {
        padding: 20,
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
        flex: 1,
    },
    categoryBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 10,
    },
    categoryText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    timeText: {
        fontSize: 12,
        color: '#95a5a6',
        fontStyle: 'italic',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    navigationButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#e3f2fd',
    },
    removeButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#fff5f5',
    },
    itemTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.black || '#2c3e50',
        marginBottom: 8,
        lineHeight: 24,
    },
    itemPreview: {
        fontSize: 14,
        color: COLORS.gray || '#7f8c8d',
        lineHeight: 20,
        marginBottom: 16,
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    itemAuthor: {
        fontSize: 14,
        color: COLORS.primary || '#3498db',
        fontWeight: '600',
        flex: 1,
    },
    itemStats: {
        flexDirection: 'row',
        gap: 16,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 12,
        color: COLORS.gray || '#7f8c8d',
        fontWeight: '500',
    },
    originalDate: {
        borderTopWidth: 1,
        borderTopColor: COLORS.lightGray || '#ecf0f1',
        paddingTop: 8,
        marginBottom: 8,
    },
    originalDateText: {
        fontSize: 12,
        color: '#bdc3c7',
        textAlign: 'center',
    },
    actionHint: {
        backgroundColor: '#f8f9fa',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginTop: 4,
    },
    actionHintText: {
        fontSize: 11,
        color: '#95a5a6',
        textAlign: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 80,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.lightGray || '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        borderWidth: 2,
        borderColor: COLORS.lightGray || '#ecf0f1',
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.black || '#2c3e50',
        marginBottom: 16,
        textAlign: 'center',
    },
    emptyDescription: {
        fontSize: 16,
        color: COLORS.gray || '#7f8c8d',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    browseButton: {
        backgroundColor: COLORS.primary || '#3498db',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    browseButtonText: {
        color: COLORS.white || '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default FavoriteArticlesScreen;