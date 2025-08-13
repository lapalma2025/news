// src/screens/profile/ReadingHistoryScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../styles/colors';
import { userService } from '../../services/userService';
import { groupByDate } from '../../utils/dateUtils';

const ReadingHistoryScreen = () => {
    const [history, setHistory] = useState([]);
    const [groupedHistory, setGroupedHistory] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const user = await userService.getCurrentUser();

            if (user?.stats?.readHistory) {
                setHistory(user.stats.readHistory);
                const grouped = groupByDate(user.stats.readHistory, 'readAt');
                setGroupedHistory(grouped);
            } else {
                setHistory([]);
                setGroupedHistory({});
            }
        } catch (error) {
            console.error('Error loading reading history:', error);
            Alert.alert('Błąd', 'Nie udało się załadować historii czytania');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadHistory();
        setRefreshing(false);
    };

    const clearHistory = () => {
        Alert.alert(
            'Wyczyść historię',
            'Czy na pewno chcesz usunąć całą historię czytania? Ta operacja jest nieodwracalna.',
            [
                { text: 'Anuluj', style: 'cancel' },
                {
                    text: 'Wyczyść',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await userService.clearReadingHistory();
                            setHistory([]);
                            setGroupedHistory({});
                            Alert.alert('Sukces', 'Historia czytania została wyczyszczona');
                        } catch (error) {
                            Alert.alert('Błąd', 'Nie udało się wyczyścić historii');
                        }
                    }
                }
            ]
        );
    };

    const removeFromHistory = async (itemId) => {
        try {
            await userService.removeFromReadingHistory(itemId);
            await loadHistory();
        } catch (error) {
            Alert.alert('Błąd', 'Nie udało się usunąć elementu z historii');
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('pl-PL', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderHistoryItem = ({ item }) => (
        <TouchableOpacity style={styles.historyItem} activeOpacity={0.7}>
            <View style={styles.itemLeft}>
                <View style={[
                    styles.typeIndicator,
                    { backgroundColor: item.type === 'news' ? COLORS.blue : COLORS.green }
                ]}>
                    <Ionicons
                        name={item.type === 'news' ? 'newspaper' : 'person'}
                        size={14}
                        color={COLORS.white}
                    />
                </View>
                <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle} numberOfLines={2}>
                        {item.title}
                    </Text>
                    <Text style={styles.readTime}>
                        Przeczytano o {formatTime(item.readAt)}
                    </Text>
                </View>
            </View>
            <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeFromHistory(item.id)}
            >
                <Ionicons name="close" size={18} color={COLORS.gray} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const renderSection = ({ item: section }) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <FlatList
                data={section.items}
                renderItem={renderHistoryItem}
                keyExtractor={(item) => `${item.type}-${item.id}-${item.readAt}`}
                scrollEnabled={false}
            />
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
                <Ionicons name="time-outline" size={64} color={COLORS.gray} />
            </View>
            <Text style={styles.emptyTitle}>Brak historii czytania</Text>
            <Text style={styles.emptyDescription}>
                Artykuły, które przeczytasz, będą pojawiać się tutaj.
                Zacznij czytać, aby zobaczyć swoją historię!
            </Text>
        </View>
    );

    const getSections = () => {
        return Object.values(groupedHistory).filter(section => section !== null);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Ładowanie historii...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerSubtitle}>
                    {history.length === 0 ? 'Brak przeczytanych artykułów' :
                        `${history.length} ${history.length === 1 ? 'artykuł' : 'artykułów'} przeczytanych`}
                </Text>
                {history.length > 0 && (
                    <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
                        <Text style={styles.clearButtonText}>Wyczyść</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={getSections()}
                renderItem={renderSection}
                keyExtractor={(item) => item.title}
                contentContainerStyle={history.length === 0 ? styles.emptyContainer : styles.listContainer}
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray,
    },
    headerSubtitle: {
        fontSize: 14,
        color: COLORS.gray,
    },
    clearButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: COLORS.red + '20',
    },
    clearButtonText: {
        color: COLORS.red,
        fontSize: 14,
        fontWeight: '600',
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
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.black,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    typeIndicator: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    itemInfo: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 15,
        fontWeight: '500',
        color: COLORS.black,
        marginBottom: 4,
        lineHeight: 20,
    },
    readTime: {
        fontSize: 13,
        color: COLORS.gray,
    },
    removeButton: {
        padding: 8,
        marginLeft: 8,
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
    },
});

export default ReadingHistoryScreen;