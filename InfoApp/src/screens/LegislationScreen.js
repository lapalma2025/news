// src/screens/LegislationScreen.js - Ekran prac legislacyjnych
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
    Linking,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS } from '../styles/colors';
import { legislationService } from '../services/legislationService';
import { legislationVotingService } from '../services/legislationVotingService';
import LegislationCard from '../components/legislation/LegislationCard';
import FilterBar from '../components/legislation/FilterBar';
import LoadingSpinner from '../components/common/LoadingSpinner';

const LegislationScreen = () => {
    const [prints, setPrints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [filters, setFilters] = useState({
        type: 'all',
        status: 'all'
    });
    const [votingStats, setVotingStats] = useState({}); // Statystyki głosowania dla wszystkich dokumentów
    const [userVotes, setUserVotes] = useState({}); // Głosy użytkownika dla wszystkich dokumentów

    // Paginacja
    const [currentOffset, setCurrentOffset] = useState(0);
    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        loadPrints(true);
    }, [filters]);

    const loadPrints = async (reset = false) => {
        try {
            if (reset) {
                setLoading(true);
                setCurrentOffset(0);
                setPrints([]);
            } else {
                setLoadingMore(true);
            }

            setError(null);

            const offset = reset ? 0 : currentOffset;
            const response = await legislationService.fetchPrints({
                limit: ITEMS_PER_PAGE,
                offset,
                ...filters
            });

            if (response.success) {
                const newPrints = reset ? response.data : [...prints, ...response.data];
                setPrints(newPrints);
                setHasMore(response.pagination.hasMore);
                setCurrentOffset(offset + ITEMS_PER_PAGE);

                // Załaduj statystyki głosowania dla nowych dokumentów
                await loadVotingData(newPrints);
            } else {
                setError(response.error);
            }
        } catch (err) {
            console.error('Error loading prints:', err);
            setError('Wystąpił problem z połączeniem');
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    };

    const loadVotingData = async (printsData) => {
        try {
            const printNumbers = printsData.map(print => print.number);

            // Pobierz statystyki i głosy użytkownika równolegle
            const [statsResponse, userVotesResponse] = await Promise.all([
                legislationVotingService.getMultipleVotingStats(printNumbers),
                legislationVotingService.getMultipleUserVotes(printNumbers)
            ]);

            if (statsResponse.success) {
                setVotingStats(prev => ({ ...prev, ...statsResponse.data }));
            }

            if (userVotesResponse.success) {
                setUserVotes(prev => ({ ...prev, ...userVotesResponse.data }));
            }
        } catch (error) {
            console.error('Error loading voting data:', error);
        }
    };

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        loadPrints(true);
    }, [filters]);

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            loadPrints(false);
        }
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    const handleVote = async (printNumber, vote, stats) => {
        // Zaktualizuj lokalne statystyki
        setVotingStats(prev => ({
            ...prev,
            [printNumber]: stats
        }));

        // Zaktualizuj głos użytkownika
        setUserVotes(prev => ({
            ...prev,
            [printNumber]: vote
        }));
    };

    const handleCardPress = async (print) => {
        try {
            const response = await legislationService.fetchPrintDetails(print.number);
            if (response.success) {
                // Nawigacja do szczegółów (można dodać stack navigator)
                showPrintDetails(response.data);
            }
        } catch (error) {
            console.error('Error fetching print details:', error);
            Alert.alert('Błąd', 'Nie udało się pobrać szczegółów dokumentu');
        }
    };

    const showPrintDetails = (printDetails) => {
        Alert.alert(
            printDetails.title,
            `${printDetails.summary}\n\nData: ${printDetails.formattedDate}\nStatus: ${getStatusLabel(printDetails.status)}\n\nCo chcesz zrobić?`,
            [
                { text: 'Anuluj', style: 'cancel' },
                {
                    text: 'Zobacz PDF',
                    onPress: () => openPDF(printDetails.fullPdfUrl)
                },
                {
                    text: 'Proces legislacyjny',
                    onPress: () => openProcess(printDetails.processUrl)
                }
            ]
        );
    };

    const openPDF = async (pdfUrl) => {
        try {
            const supported = await Linking.canOpenURL(pdfUrl);
            if (supported) {
                await Linking.openURL(pdfUrl);
            } else {
                Alert.alert('Błąd', 'Nie można otworzyć dokumentu PDF');
            }
        } catch (error) {
            console.error('Error opening PDF:', error);
            Alert.alert('Błąd', 'Wystąpił problem podczas otwierania dokumentu');
        }
    };

    const openProcess = async (processUrl) => {
        if (!processUrl) {
            Alert.alert('Informacja', 'Brak dostępnych informacji o procesie legislacyjnym');
            return;
        }

        try {
            const supported = await Linking.canOpenURL(processUrl);
            if (supported) {
                await Linking.openURL(processUrl);
            } else {
                Alert.alert('Błąd', 'Nie można otworzyć strony procesu legislacyjnego');
            }
        } catch (error) {
            console.error('Error opening process URL:', error);
            Alert.alert('Błąd', 'Wystąpił problem podczas otwierania strony');
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'nowe': return 'Nowe';
            case 'aktywne': return 'W trakcie';
            case 'w_trakcie': return 'W procedowaniu';
            case 'stare': return 'Długotrwałe';
            case 'archiwalne': return 'Archiwalne';
            default: return 'Nieznany';
        }
    };

    const renderPrintItem = ({ item }) => (
        <LegislationCard
            print={{
                ...item,
                votingStats: votingStats[item.number] || { likes: 0, dislikes: 0, total: 0 },
                userVote: userVotes[item.number] || null
            }}
            onPress={() => handleCardPress(item)}
            onVote={(vote, stats) => handleVote(item.number, vote, stats)}
        />
    );

    const renderListFooter = () => {
        if (!loadingMore) return null;

        return (
            <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingMoreText}>Ładowanie kolejnych...</Text>
            </View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>Brak dokumentów</Text>
            <Text style={styles.emptySubtitle}>
                Nie znaleziono dokumentów spełniających wybrane kryteria
            </Text>
            <TouchableOpacity
                style={styles.retryButton}
                onPress={() => loadPrints(true)}
            >
                <Text style={styles.retryButtonText}>Spróbuj ponownie</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading && prints.length === 0) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <LoadingSpinner text="Ładowanie prac legislacyjnych..." />
            </SafeAreaView>
        );
    }

    if (error && prints.length === 0) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color={COLORS.red} />
                    <Text style={styles.errorTitle}>Błąd połączenia</Text>
                    <Text style={styles.errorSubtitle}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => loadPrints(true)}
                    >
                        <Text style={styles.retryButtonText}>Spróbuj ponownie</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} >
            <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Prace Legislacyjne</Text>
                    <Text style={styles.headerSubtitle}>
                        Aktualne projekty ustaw i dokumenty sejmowe
                    </Text>
                </View>
            </LinearGradient>

            <FilterBar
                filters={filters}
                onFilterChange={handleFilterChange}
            />

            <FlatList
                data={prints}
                renderItem={renderPrintItem}
                keyExtractor={(item) => `print-${item.number}`}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[COLORS.primary]}
                        tintColor={COLORS.primary}
                    />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.3}
                ListFooterComponent={renderListFooter}
                ListEmptyComponent={!loading ? renderEmptyState : null}
                contentContainerStyle={[
                    styles.listContainer,
                    prints.length === 0 && styles.listContainerEmpty
                ]}
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
        paddingVertical: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerContent: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: COLORS.white,
        opacity: 0.9,
        textAlign: 'center',
    },
    listContainer: {
        padding: 16,
    },
    listContainerEmpty: {
        flex: 1,
        justifyContent: 'center',
    },
    loadingMore: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    loadingMoreText: {
        marginLeft: 8,
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 32,
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.red,
        marginTop: 16,
        marginBottom: 8,
    },
    errorSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
    },
});

export default LegislationScreen;