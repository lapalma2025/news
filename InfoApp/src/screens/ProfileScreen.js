// src/screens/ProfileScreen.js - Z prawdziwymi statystykami
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native'; // DODANE
import { COLORS } from '../styles/colors';
import { APP_CONFIG } from '../utils/constants';
import { userService } from '../services/userService';
import { readingHistoryService } from '../services/readingHistoryService'; // DODANE

import NotificationSettingsScreen from './profile/NotificationSettingsScreen';
import FavoriteArticlesScreen from './profile/FavoriteArticlesScreen';
import ReadingHistoryScreen from './profile/ReadingHistoryScreen';
import DataManagementScreen from './profile/DataManagementScreen';
import AboutAppScreen from './profile/AboutAppScreen';
import HelpSupportScreen from './profile/HelpSupportScreen';
import ShareAppScreen from './profile/ShareAppScreen';
import RateAppScreen from './profile/RateAppScreen';

const ProfileScreen = () => {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({ // DODANE - osobny state dla statystyk
        readArticles: 0,
        favoriteArticles: 0,
        comments: 0,
        likedPosts: 0
    });
    const [loading, setLoading] = useState(true);
    const [activeScreen, setActiveScreen] = useState('main');

    // Załaduj dane gdy ekran się focusuje (wraca z innych ekranów)
    useFocusEffect(
        React.useCallback(() => {
            if (activeScreen === 'main') {
                loadUserData();
                loadRealStats(); // DODANE
            }
        }, [activeScreen])
    );

    useEffect(() => {
        loadUserData();
        loadRealStats(); // DODANE
    }, []);

    const loadUserData = async () => {
        try {
            const userData = await userService.getCurrentUser();
            setUser(userData);
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setLoading(false);
        }
    };

    // NAPRAWIONA FUNKCJA - Pobierz prawdziwe statystyki z właściwych miejsc
    const loadRealStats = async () => {
        try {
            const currentUser = await userService.getCurrentUser();
            if (!currentUser) return;

            console.log('📊 Loading real stats for user:', currentUser.id);

            // 1. HISTORIA CZYTANIA - z nowego systemu (read_by w tabelach)
            const historyResult = await readingHistoryService.getReadingHistory(currentUser.id);
            const readArticlesCount = historyResult.success ? historyResult.data.length : 0;

            // 2. ULUBIONE - z AsyncStorage (currentUser.stats.favoriteArticles)
            const favoriteArticlesCount = currentUser.stats?.favoriteArticles?.length || 0;

            // 3. KOMENTARZE - z AsyncStorage (currentUser.stats.comments)
            const commentsCount = currentUser.stats?.comments || 0;

            // 4. POLUBIENIA - z AsyncStorage (currentUser.stats.likedPosts)
            const likedPostsCount = currentUser.stats?.likedPosts || 0;

            const newStats = {
                readArticles: readArticlesCount,
                favoriteArticles: favoriteArticlesCount,
                comments: commentsCount,
                likedPosts: likedPostsCount
            };

            console.log('📈 Current user stats from AsyncStorage:', {
                favoriteArticles: currentUser.stats?.favoriteArticles,
                favoriteCount: favoriteArticlesCount,
                comments: commentsCount,
                likedPosts: likedPostsCount
            });

            console.log('📈 Updated stats:', newStats);
            setStats(newStats);

        } catch (error) {
            console.error('Error loading real stats:', error);
            // Fallback do wszystkich statystyk z AsyncStorage
            const currentUser = await userService.getCurrentUser();
            if (currentUser) {
                setStats({
                    readArticles: currentUser.stats?.readArticles || 0,
                    favoriteArticles: currentUser.stats?.favoriteArticles?.length || 0,
                    comments: currentUser.stats?.comments || 0,
                    likedPosts: currentUser.stats?.likedPosts || 0
                });
            }
        }
    };

    const navigateToScreen = (screenName) => {
        setActiveScreen(screenName);
    };

    const navigateBack = () => {
        setActiveScreen('main');
        // Odśwież statystyki po powrocie z innych ekranów
        loadRealStats();
    };

    const handleShare = () => {
        setActiveScreen('ShareApp');
    };

    const handleRate = () => {
        setActiveScreen('RateApp');
    };

    const handleLogin = () => {
        Alert.alert(
            'Logowanie',
            'Funkcja logowania będzie dostępna wkrótce!\n\n✨ Korzyści z logowania:\n• Synchronizacja danych między urządzeniami\n• Backup ulubionych artykułów\n• Personalizowane rekomendacje\n• Możliwość obserwowania polityków',
            [
                { text: 'OK', style: 'default' },
                { text: 'Powiadom mnie', onPress: () => Alert.alert('Super!', 'Powiadomimy Cię gdy funkcja będzie gotowa!') }
            ]
        );
    };

    const handleDataManagement = () => {
        Alert.alert(
            'Zarządzanie danymi',
            'Co chcesz zrobić z danymi aplikacji?',
            [
                { text: 'Anuluj', style: 'cancel' },
                { text: 'Eksportuj dane', onPress: exportUserData },
                { text: 'Resetuj dane', style: 'destructive', onPress: confirmReset },
                { text: 'Zarządzaj danymi', onPress: () => navigateToScreen('DataManagement') }
            ]
        );
    };

    const exportUserData = async () => {
        const userData = await userService.exportUserData();
        Alert.alert(
            'Eksport danych',
            `Dane użytkownika:\n\nID: ${userData?.id}\nUtworzono: ${new Date(userData?.createdAt).toLocaleDateString()}\nPrzeczytane artykuły: ${stats.readArticles}\nKomentarze: ${stats.comments}\nPolubienia: ${stats.likedPosts}`,
            [{ text: 'OK' }]
        );
    };

    const confirmReset = () => {
        Alert.alert(
            'Resetuj dane',
            'Czy na pewno chcesz usunąć wszystkie dane aplikacji? Ta operacja jest nieodwracalna.',
            [
                { text: 'Anuluj', style: 'cancel' },
                { text: 'Resetuj', style: 'destructive', onPress: resetUserData }
            ]
        );
    };

    const resetUserData = async () => {
        await userService.resetUser();
        await loadUserData();
        await loadRealStats(); // DODANE
        Alert.alert('Sukces', 'Dane zostały zresetowane. Zostałeś oznaczony jako nowy użytkownik.');
    };

    // Renderowanie różnych ekranów
    const renderCurrentScreen = () => {
        switch (activeScreen) {
            case 'NotificationSettings':
                return <NotificationSettingsScreen />;
            case 'FavoriteArticles':
                return <FavoriteArticlesScreen />;
            case 'ReadingHistory':
                return <ReadingHistoryScreen />;
            case 'DataManagement':
                return <DataManagementScreen />;
            case 'ShareApp':
                return <ShareAppScreen />;
            case 'RateApp':
                return <RateAppScreen />;
            case 'HelpSupport':
                return <HelpSupportScreen />;
            case 'AboutApp':
                return <AboutAppScreen />;
            default:
                return renderMainScreen();
        }
    };

    const renderMainScreen = () => {
        const menuItems = [
            {
                id: 1,
                title: 'Ustawienia powiadomień',
                icon: 'notifications',
                onPress: () => navigateToScreen('NotificationSettings'),
                description: 'Zarządzaj powiadomieniami'
            },
            {
                id: 2,
                title: 'Ulubione artykuły',
                icon: 'heart',
                onPress: () => navigateToScreen('FavoriteArticles'),
                description: 'Zobacz zapisane artykuły'
            },
            {
                id: 3,
                title: 'Historia czytania',
                icon: 'time',
                onPress: () => navigateToScreen('ReadingHistory'),
                description: 'Ostatnio przeczytane'
            },
            {
                id: 4,
                title: 'Zarządzanie danymi',
                icon: 'cloud-download',
                onPress: handleDataManagement,
                description: 'Eksportuj lub resetuj dane'
            },
            {
                id: 5,
                title: 'Podziel się aplikacją',
                icon: 'share',
                onPress: handleShare,
                description: 'Poleć znajomym'
            },
            {
                id: 6,
                title: 'Oceń aplikację',
                icon: 'star',
                onPress: handleRate,
                description: 'Twoja opinia się liczy'
            },
            {
                id: 7,
                title: 'Pomoc i wsparcie',
                icon: 'help-circle',
                onPress: () => navigateToScreen('HelpSupport'),
                description: 'Skontaktuj się z nami'
            },
            {
                id: 8,
                title: 'O aplikacji',
                icon: 'information-circle',
                onPress: () => navigateToScreen('AboutApp'),
                description: 'Informacje o wersji'
            },
        ];

        const renderMenuItem = (item) => (
            <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.7}
            >
                <View style={styles.menuItemLeft}>
                    <View style={styles.iconContainer}>
                        <Ionicons name={item.icon} size={22} color={COLORS.primary} />
                    </View>
                    <View style={styles.menuItemTextContainer}>
                        <Text style={styles.menuItemText}>{item.title}</Text>
                        {item.description && (
                            <Text style={styles.menuItemDescription}>{item.description}</Text>
                        )}
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
            </TouchableOpacity>
        );

        return (
            <ScrollView showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    style={styles.header}
                >
                    <View style={styles.profileInfo}>
                        <View style={styles.avatar}>
                            <Ionicons name="person" size={40} color={COLORS.white} />
                        </View>
                        <Text style={styles.userName}>{user?.displayName || 'Anonim'}</Text>
                        <Text style={styles.userEmail}>
                            {user?.isAnonymous ? 'Korzystasz bez logowania' : user?.email || 'Brak adresu email'}
                        </Text>

                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={handleLogin}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="log-in-outline" size={18} color={COLORS.white} style={{ marginRight: 8 }} />
                            <Text style={styles.loginButtonText}>
                                {user?.isAnonymous ? 'Zaloguj się' : 'Zarządzaj kontem'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {/* ZAKTUALIZOWANE STATYSTYKI - używają nowego state */}
                <View style={styles.statsContainer}>
                    <TouchableOpacity
                        style={styles.statItem}
                        onPress={() => {
                            console.log('🔄 Refreshing stats manually...');
                            loadRealStats();
                        }}
                    >
                        <Text style={styles.statNumber}>{stats.readArticles}</Text>
                        <Text style={styles.statLabel}>Przeczytane</Text>
                    </TouchableOpacity>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{stats.favoriteArticles}</Text>
                        <Text style={styles.statLabel}>Ulubione</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{stats.comments}</Text>
                        <Text style={styles.statLabel}>Komentarze</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{stats.likedPosts}</Text>
                        <Text style={styles.statLabel}>Polubienia</Text>
                    </View>
                </View>

                <View style={styles.menuContainer}>
                    <Text style={styles.menuSectionTitle}>Ustawienia</Text>
                    {menuItems.map(renderMenuItem)}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.appVersion}>
                        {APP_CONFIG.NAME} v{APP_CONFIG.VERSION}
                    </Text>
                    <Text style={styles.footerNote}>
                        {user?.isAnonymous
                            ? 'Zaloguj się, aby synchronizować dane między urządzeniami'
                            : 'Dane są synchronizowane w chmurze'
                        }
                    </Text>
                    {user?.createdAt && (
                        <Text style={styles.memberSince}>
                            Użytkownik od: {new Date(user.createdAt).toLocaleDateString('pl-PL')}
                        </Text>
                    )}

                    {/* DEBUG INFO - ROZSZERZONY */}
                    <TouchableOpacity
                        onPress={async () => {
                            console.log('🔄 Manual stats refresh...');

                            // Debug: sprawdź co jest w AsyncStorage
                            const currentUser = await userService.getCurrentUser();
                            console.log('🗃️ FULL USER DATA from AsyncStorage:', JSON.stringify(currentUser, null, 2));
                            console.log('📊 FAVORITES ARRAY:', currentUser?.stats?.favoriteArticles);
                            console.log('📊 FAVORITES COUNT:', currentUser?.stats?.favoriteArticles?.length);
                            console.log('📊 COMMENTS:', currentUser?.stats?.comments);
                            console.log('📊 LIKED POSTS:', currentUser?.stats?.likedPosts);

                            // Sprawdź historię czytania
                            const historyResult = await readingHistoryService.getReadingHistory(currentUser.id);
                            console.log('📚 READING HISTORY COUNT:', historyResult.success ? historyResult.data.length : 0);

                            loadRealStats();
                        }}
                        style={{ marginTop: 10, padding: 10, backgroundColor: '#e3f2fd', borderRadius: 5 }}
                    >
                        <Text style={{ fontSize: 10, textAlign: 'center', color: '#1976d2' }}>
                            🔄 Debug: Refresh Stats & Show AsyncStorage Data
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    };

    const getScreenTitle = () => {
        switch (activeScreen) {
            case 'NotificationSettings':
                return 'Ustawienia powiadomień';
            case 'FavoriteArticles':
                return 'Ulubione artykuły';
            case 'ReadingHistory':
                return 'Historia czytania';
            case 'DataManagement':
                return 'Zarządzanie danymi';
            case 'ShareApp':
                return 'Podziel się aplikacją';
            case 'RateApp':
                return 'Oceń aplikację';
            case 'HelpSupport':
                return 'Pomoc i wsparcie';
            case 'AboutApp':
                return 'O aplikacji';
            default:
                return '';
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Ładowanie profilu...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {activeScreen !== 'main' && (
                <View style={styles.navigationHeader}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={navigateBack}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                    <Text style={styles.navigationTitle}>{getScreenTitle()}</Text>
                    <View style={styles.headerSpacer} />
                </View>
            )}
            {renderCurrentScreen()}
        </SafeAreaView>
    );
};

// Style pozostają bez zmian...
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
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
    navigationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 12,
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 8,
    },
    navigationTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.white,
        textAlign: 'center',
    },
    headerSpacer: {
        width: 40,
    },
    header: {
        paddingVertical: 40,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    profileInfo: {
        alignItems: 'center',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 20,
        textAlign: 'center',
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    loginButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        marginHorizontal: 20,
        marginTop: -20,
        borderRadius: 16,
        padding: 20,
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 4,
        textAlign: 'center',
    },
    menuContainer: {
        backgroundColor: COLORS.white,
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 16,
        padding: 8,
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    menuSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginLeft: 12,
        marginTop: 8,
        marginBottom: 8,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: COLORS.lightGray,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.lightGray,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuItemTextContainer: {
        flex: 1,
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },
    menuItemDescription: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    footer: {
        padding: 40,
        alignItems: 'center',
    },
    appVersion: {
        fontSize: 14,
        color: COLORS.textLight,
        marginBottom: 8,
    },
    footerNote: {
        fontSize: 12,
        color: COLORS.textLight,
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: 8,
    },
    memberSince: {
        fontSize: 11,
        color: COLORS.textLight,
        textAlign: 'center',
    },
});

export default ProfileScreen;