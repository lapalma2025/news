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
import { readingHistoryService } from '../../services/readingHistoryService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { COLORS } from '../../styles/colors';
import { userService } from '../../services/userService';
import { supabase } from '../../services/supabaseClient';
import CommentModal from '../../components/modals/CommentModal';

const ReadingHistoryScreen = () => {
    const navigation = useNavigation();
    const [readHistory, setReadHistory] = useState([]);
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
                await loadReadingHistory(user.id);
            }
        } catch (error) {
            console.error('Error initializing screen:', error);
            setLoading(false);
        }
    };

    const loadReadingHistory = async (userId) => {
        try {
            setLoading(true);
            console.log('Loading reading history for user:', userId);

            // Użyj uproszczonego serwisu historii czytania
            const historyResponse = await readingHistoryService.getReadingHistory(userId);

            if (!historyResponse.success) {
                throw new Error(historyResponse.error);
            }

            const historyItems = historyResponse.data || [];
            console.log('Found reading history items:', historyItems.length);

            setReadHistory(historyItems);

        } catch (error) {
            console.error('Error loading reading history:', error);
            Alert.alert('Błąd', 'Nie udało się załadować historii czytania');
        } finally {
            setLoading(false);
        }
    };


    const onRefresh = async () => {
        if (!currentUser) return;

        setRefreshing(true);
        await loadReadingHistory(currentUser.id);
        setRefreshing(false);
    };

    const clearHistory = () => {
        if (readHistory.length === 0) {
            Alert.alert('Info', 'Brak historii do wyczyszczenia');
            return;
        }

        Alert.alert(
            'Wyczyść historię',
            `Czy na pewno chcesz usunąć całą historię czytania (${readHistory.length} artykułów)? Ta operacja jest nieodwracalna.`,
            [
                { text: 'Anuluj', style: 'cancel' },
                {
                    text: 'Wyczyść',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            console.log('🗑️ Starting to clear reading history...');
                            console.log('📊 Current history count:', readHistory.length);

                            setLoading(true); // Pokaż loading podczas czyszczenia

                            const response = await readingHistoryService.clearReadingHistory(currentUser.id);

                            if (response.success) {
                                console.log('✅ History cleared successfully');
                                setReadHistory([]); // Wyczyść lokalny stan
                                Alert.alert('Sukces', 'Historia czytania została wyczyszczona');
                            } else {
                                console.error('❌ Failed to clear history:', response.error);
                                throw new Error(response.error);
                            }
                        } catch (error) {
                            console.error('❌ Error clearing history:', error);
                            Alert.alert('Błąd', `Nie udało się wyczyścić historii: ${error.message}`);
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const removeFromHistory = async (item) => {
        try {
            const response = await readingHistoryService.removeFromHistory(
                item.id,
                item.type,
                currentUser.id
            );

            if (response.success) {
                // Usuń z lokalnego stanu
                setReadHistory(prev => prev.filter(historyItem => historyItem.historyId !== item.historyId));
            } else {
                throw new Error(response.error);
            }

        } catch (error) {
            console.error('Error removing from history:', error);
            Alert.alert('Błąd', 'Nie udało się usunąć elementu z historii');
        }
    };

    const openArticle = (item) => {
        if (item.isDeleted) {
            Alert.alert('Artykuł niedostępny', 'Ten artykuł mógł zostać usunięty lub nie jest już dostępny');
            return;
        }

        console.log('Opening article from history:', item.title);
        setSelectedItem(item);
        setModalVisible(true);
    };

    const navigateToArticle = (item) => {
        if (item.isDeleted) {
            Alert.alert('Artykuł niedostępny', 'Ten artykuł mógł zostać usunięty lub nie jest już dostępny');
            return;
        }

        // Naprawiona nawigacja - sprawdź dostępne route
        try {
            if (item.type === 'news') {
                // Sprawdź różne możliwe nazwy screen'ów dla newsów
                const possibleNewsRoutes = ['NewsScreen', 'News', 'NewsTab', 'NewsList'];

                for (const routeName of possibleNewsRoutes) {
                    try {
                        navigation.navigate(routeName, {
                            openArticleId: item.id,
                            article: item
                        });
                        return;
                    } catch (navError) {
                        console.log(`Route ${routeName} not found, trying next...`);
                    }
                }

                // Fallback - tylko pokaż artykuł w modalu
                openArticle(item);

            } else if (item.type === 'politician_post') {
                // Sprawdź różne możliwe nazwy screen'ów dla postów polityków
                const possiblePoliticianRoutes = ['PoliticiansScreen', 'Politicians', 'PoliticiansTab', 'PoliticiansList'];

                for (const routeName of possiblePoliticianRoutes) {
                    try {
                        navigation.navigate(routeName, {
                            openPostId: item.id,
                            post: item
                        });
                        return;
                    } catch (navError) {
                        console.log(`Route ${routeName} not found, trying next...`);
                    }
                }

                // Fallback - tylko pokaż artykuł w modalu
                openArticle(item);
            }
        } catch (error) {
            console.error('Navigation error:', error);
            // Fallback - pokaż w modalu
            openArticle(item);
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
            if (diffInDays === 1) return 'wczoraj';
            if (diffInDays < 7) return `${diffInDays} dni temu`;
            if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} tyg. temu`;
            return date.toLocaleDateString('pl-PL');
        }
    };

    const getCategoryColor = (category, type) => {
        if (type === 'politician_post') return '#e74c3c';

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

    const groupHistoryByDate = (history) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const thisWeek = new Date(today);
        thisWeek.setDate(thisWeek.getDate() - 7);

        const groups = {
            today: { title: 'Dzisiaj', items: [] },
            yesterday: { title: 'Wczoraj', items: [] },
            thisWeek: { title: 'Ten tydzień', items: [] },
            older: { title: 'Starsze', items: [] }
        };

        history.forEach(item => {
            const itemDate = new Date(item.readAt);
            itemDate.setHours(0, 0, 0, 0);

            if (itemDate.getTime() === today.getTime()) {
                groups.today.items.push(item);
            } else if (itemDate.getTime() === yesterday.getTime()) {
                groups.yesterday.items.push(item);
            } else if (itemDate > thisWeek) {
                groups.thisWeek.items.push(item);
            } else {
                groups.older.items.push(item);
            }
        });

        return Object.values(groups).filter(group => group.items.length > 0);
    };

    const renderHistoryItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.historyItem, item.isDeleted && styles.deletedItem]}
            activeOpacity={0.7}
            onPress={() => openArticle(item)}
        >
            <View style={styles.itemContent}>
                <View style={styles.itemHeader}>
                    <View style={styles.categoryContainer}>
                        <View style={[
                            styles.categoryBadge,
                            { backgroundColor: item.isDeleted ? '#95a5a6' : getCategoryColor(item.category, item.type) }
                        ]}>
                            <Ionicons
                                name={item.type === 'news' ? 'newspaper' : 'person'}
                                size={12}
                                color="#ffffff"
                            />
                        </View>
                        <Text style={styles.timeText}>
                            {formatTime(item.readAt)}
                        </Text>
                    </View>

                    <View style={styles.actionButtons}>
                        {!item.isDeleted && (
                            <TouchableOpacity
                                style={styles.navigationButton}
                                onPress={() => navigateToArticle(item)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="open-outline" size={16} color="#3498db" />
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => removeFromHistory(item)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close" size={16} color="#e74c3c" />
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={[styles.itemTitle, item.isDeleted && styles.deletedText]} numberOfLines={2}>
                    {item.title}
                </Text>

                {item.content && !item.isDeleted && (
                    <Text style={styles.itemPreview} numberOfLines={2}>
                        {item.content}
                    </Text>
                )}

                <View style={styles.itemFooter}>
                    <Text style={styles.itemAuthor}>
                        {item.author || item.politician_name || 'Nieznany autor'}
                        {item.politician_party && ` (${item.politician_party})`}
                    </Text>

                    {!item.isDeleted && (
                        <View style={styles.itemStats}>
                            <View style={styles.statItem}>
                                <Ionicons name="heart-outline" size={12} color="#7f8c8d" />
                                <Text style={styles.statText}>{item.likes_count || 0}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Ionicons name="chatbubble-outline" size={12} color="#7f8c8d" />
                                <Text style={styles.statText}>{item.comments_count || 0}</Text>
                            </View>
                        </View>
                    )}
                </View>

                {item.isDeleted && (
                    <View style={styles.deletedNotice}>
                        <Ionicons name="alert-circle-outline" size={14} color="#e74c3c" />
                        <Text style={styles.deletedNoticeText}>Artykuł niedostępny</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    const renderSection = ({ item: section }) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <FlatList
                data={section.items}
                renderItem={renderHistoryItem}
                keyExtractor={(item) => item.historyId}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
                <Ionicons name="time-outline" size={64} color="#bdc3c7" />
            </View>
            <Text style={styles.emptyTitle}>Brak historii czytania</Text>
            <Text style={styles.emptyDescription}>
                Artykuły, które przeczytasz, będą pojawiać się tutaj.
                Zacznij czytać, aby zobaczyć swoją historię!
            </Text>
            <TouchableOpacity
                style={styles.browseButton}
                onPress={() => {
                    // Naprawiona nawigacja - sprawdź różne możliwe route
                    const possibleRoutes = ['News', 'NewsScreen', 'NewsTab', 'Home', 'HomeTab', 'MainTab'];

                    for (const routeName of possibleRoutes) {
                        try {
                            navigation.navigate(routeName);
                            return;
                        } catch (error) {
                            console.log(`Route ${routeName} not found, trying next...`);
                        }
                    }

                    // Sprawdź czy to tab navigator
                    try {
                        navigation.jumpTo('News');
                        return;
                    } catch (error) {
                        console.log('jumpTo News failed');
                    }

                    // Fallback - pokaż alert
                    Alert.alert(
                        'Nawigacja niedostępna',
                        'Nie można przejść do ekranu newsów. Spróbuj użyć przycisków nawigacji.',
                        [{ text: 'OK' }]
                    );
                }}
            >
                <Text style={styles.browseButtonText}>Przeglądaj artykuły</Text>
            </TouchableOpacity>
        </View>
    );

    const renderLoadingState = () => (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Ładowanie historii czytania...</Text>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                {renderLoadingState()}
            </SafeAreaView>
        );
    }

    const groupedHistory = groupHistoryByDate(readHistory);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.headerTitle}>Historia czytania</Text>
                    <Text style={styles.headerSubtitle}>
                        {readHistory.length === 0 ? 'Brak przeczytanych artykułów' :
                            `${readHistory.length} ${readHistory.length === 1 ? 'artykuł' :
                                readHistory.length < 5 ? 'artykuły' : 'artykułów'} przeczytanych`}
                    </Text>
                </View>

                {readHistory.length > 0 && (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => {
                            console.log('🔴 Clear button pressed - calling NEW function!');
                            clearHistory();
                        }}
                    >
                        <Ionicons name="trash-outline" size={16} color="#e74c3c" />
                        <Text style={styles.clearButtonText}>Wyczyść</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={groupedHistory}
                renderItem={renderSection}
                keyExtractor={(item) => item.title}
                contentContainerStyle={readHistory.length === 0 ? styles.emptyContainer : styles.listContainer}
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
            />

            {/* Modal komentarzy */}
            <CommentModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                item={selectedItem}
                onCommentAdded={(postId, newCount) => {
                    setReadHistory(prev =>
                        prev.map(item =>
                            item.id === postId
                                ? { ...item, comments_count: newCount }
                                : item
                        )
                    );
                }}
                onLikeUpdate={(postId, newCount) => {
                    setReadHistory(prev =>
                        prev.map(item =>
                            item.id === postId
                                ? { ...item, likes_count: newCount }
                                : item
                        )
                    );
                }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background || '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: COLORS.white || '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray || '#ecf0f1',
    },
    headerLeft: {
        flex: 1,
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
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#fff5f5',
        gap: 4,
    },
    clearButtonText: {
        color: '#e74c3c',
        fontSize: 14,
        fontWeight: '600',
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
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.black || '#2c3e50',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    historyItem: {
        backgroundColor: COLORS.white || '#ffffff',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        shadowColor: COLORS.black || '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: COLORS.lightGray || '#ecf0f1',
    },
    deletedItem: {
        opacity: 0.6,
        backgroundColor: '#f8f9fa',
    },
    itemContent: {
        padding: 16,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    categoryBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    timeText: {
        fontSize: 12,
        color: '#95a5a6',
        fontWeight: '500',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    navigationButton: {
        padding: 6,
        borderRadius: 16,
        backgroundColor: '#e3f2fd',
    },
    removeButton: {
        padding: 6,
        borderRadius: 16,
        backgroundColor: '#fff5f5',
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.black || '#2c3e50',
        marginBottom: 6,
        lineHeight: 22,
    },
    deletedText: {
        color: '#95a5a6',
    },
    itemPreview: {
        fontSize: 14,
        color: COLORS.gray || '#7f8c8d',
        lineHeight: 18,
        marginBottom: 10,
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemAuthor: {
        fontSize: 13,
        color: COLORS.primary || '#3498db',
        fontWeight: '500',
        flex: 1,
    },
    itemStats: {
        flexDirection: 'row',
        gap: 12,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    statText: {
        fontSize: 11,
        color: '#7f8c8d',
        fontWeight: '500',
    },
    deletedNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#ecf0f1',
        gap: 4,
    },
    deletedNoticeText: {
        fontSize: 12,
        color: '#e74c3c',
        fontStyle: 'italic',
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

export default ReadingHistoryScreen;