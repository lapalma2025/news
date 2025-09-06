// src/screens/ProfileScreen.js - Z prawdziwymi statystykami
import React, { useState, useEffect } from 'react';
import * as AuthSession from 'expo-auth-session';
import { makeRedirectUri, ResponseType } from 'expo-auth-session';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native'; // DODANE
import { COLORS } from '../styles/colors';
import * as Google from 'expo-auth-session/providers/google';
import { APP_CONFIG } from '../utils/constants';
import { userService } from '../services/userService';
import { readingHistoryService } from '../services/readingHistoryService'; // DODANE
import { supabase } from '../services/supabaseClient'; // DODANE dla sprawdzania ulubionych
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useGoogleLoginNative } from '../hooks/useGoogleLoginNative ';
import NotificationSettingsScreen from './profile/NotificationSettingsScreen';
import FavoriteArticlesScreen from './profile/FavoriteArticlesScreen';
import ReadingHistoryScreen from './profile/ReadingHistoryScreen';
import DataManagementScreen from './profile/DataManagementScreen';
import AboutAppScreen from './profile/AboutAppScreen';
import HelpSupportScreen from './profile/HelpSupportScreen';
import ShareAppScreen from './profile/ShareAppScreen';
import RateAppScreen from './profile/RateAppScreen';
import * as WebBrowser from "expo-web-browser";

/*
let GoogleSignin = null;
let useGoogleLoginNative = () => ({
    login: () => {
        console.log("Google login mocked in Expo Go");
    }
});

try {
    GoogleSignin = require("@react-native-google-signin/google-signin").GoogleSignin;
    useGoogleLoginNative = require("../hooks/useGoogleLoginNative").useGoogleLoginNative;
} catch (e) {
    console.log("⚠️ RNGoogleSignin niedostępny w Expo Go – mockuję logowanie.");
}
*/

WebBrowser.maybeCompleteAuthSession();

const ProfileScreen = () => {
    const { login } = useGoogleLoginNative();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({ // DODANE - osobny state dla statystyk
        readArticles: 0,
        favoriteArticles: 0,
        comments: 0,
        likedPosts: 0
    });
    const [loading, setLoading] = useState(true);
    const [activeScreen, setActiveScreen] = useState('main');
    const [signingIn, setSigningIn] = useState(false);
    WebBrowser.maybeCompleteAuthSession();
    const GOOGLE_WEB_CLIENT_ID =
        '443651685443-vgrjqdqlqtch3btggsturp5vsdq03mna.apps.googleusercontent.com';

    // --- TWARDO: redirect do Expo Proxy (musi zgadzać się z Google Console) ---
    const REDIRECT_URI = 'https://auth.expo.io/@mzborowski/wiem';

    // Discovery Google (OIDC)
    const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
        revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
    };

    const nonce = Math.random().toString(36).slice(2);

    useFocusEffect(
        React.useCallback(() => {
            setActiveScreen('main');
            checkUser();
            loadRealStats();
        }, [])
    );

    const checkUser = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                setUser({
                    id: session.user.id,
                    email: session.user.email,
                    displayName: session.user.user_metadata.full_name || session.user.email,
                    photoURL: session.user.user_metadata.avatar_url,
                    isAnonymous: false,
                    createdAt: session.user.created_at,
                    provider: session.user.app_metadata.provider,
                    stats: await getUserStats(session.user.id)
                });
            } else {
                // Użytkownik anonimowy
                setUser({
                    isAnonymous: true,
                    displayName: 'Anonim',
                    stats: { readArticles: 0, favoriteArticles: [], comments: 0, likedPosts: 0 }
                });
            }
        } catch (error) {
            console.error('Error checking user:', error);
        } finally {
            setLoading(false);
        }
    };

    const getUserStats = async (userId) => {
        try {
            const [commentsResult, ratingsResult] = await Promise.all([
                supabase
                    .from('infoapp_comments')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('is_active', true),
                supabase
                    .from('app_ratings')
                    .select('id')
                    .eq('user_id', userId)
            ]);

            return {
                readArticles: 0,
                favoriteArticles: [],
                comments: commentsResult.data?.length || 0,
                likedPosts: 0,
                ratings: ratingsResult.data?.length || 0
            };
        } catch (error) {
            console.error('Error getting user stats:', error);
            return { readArticles: 0, favoriteArticles: [], comments: 0, likedPosts: 0 };
        }
    };

    const handleSignOut = async () => {
        console.log('[SignOut] start');

        try {
            // 1) Wyloguj z Supabase
            const { error: sbErr } = await supabase.auth.signOut();
            if (sbErr) {
                console.log('[SignOut] supabase error:', sbErr);
                Alert.alert('Błąd', 'Nie udało się wylogować z Supabase');
                return;
            }
            console.log('[SignOut] supabase signed out');

            // 2) Wyczyść sesję Google + cofnij dostęp (wymusi ponowny wybór konta)
            try {
                await GoogleSignin.signOut().catch(() => { });
                await GoogleSignin.revokeAccess().catch(() => { }); // ⬅️ najważniejsze
                console.log('[SignOut] google revokeAccess ok');
            } catch (e) {
                console.log('[SignOut] google revokeAccess warn:', e?.message || e);
            }

            // 3) Natychmiast wyzeruj UI
            setUser({
                isAnonymous: true,
                displayName: 'Anonim',
                stats: { readArticles: 0, favoriteArticles: [], comments: 0, likedPosts: 0 },
            });
            setStats({ readArticles: 0, favoriteArticles: 0, comments: 0, likedPosts: 0 });

            // 4) (Opcjonalnie) sprawdź sesję
            const { data: { session } } = await supabase.auth.getSession();
            console.log('[SignOut] session after signOut =', session);

            Alert.alert('Wylogowano', 'Pomyślnie wylogowano z konta.');
        } catch (error) {
            console.log('[SignOut] fatal error:', error);
            Alert.alert('Błąd', 'Nie udało się wylogować.');
        }
    };


    // NOWA FUNKCJA - sprawdza liczbę ulubionych z bazy danych (podobnie jak loadLikedArticles)
    const loadFavoriteCount = async (userId) => {
        try {
            console.log('Loading favorite count for user:', userId);

            // Możliwe nazwy tabel dla ulubionych w Supabase
            const possibleTables = ['infoapp_favorites', 'infoapp_bookmarks', 'favorites', 'bookmarks'];

            for (const tableName of possibleTables) {
                try {
                    const { count, error } = await supabase
                        .from(tableName)
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', userId);

                    if (!error) {
                        console.log(`Found favorites in table ${tableName}:`, count || 0);
                        return count || 0;
                    }
                } catch (tableError) {
                    // Kontynuuj próby z następną tabelą
                    continue;
                }
            }

            // Jeśli nie znaleziono żadnej tabeli ulubionych w Supabase
            console.log('No favorites table found in Supabase, using AsyncStorage');
            return null; // będziemy używać AsyncStorage jako fallback

        } catch (error) {
            console.error('Error loading favorite count from Supabase:', error);
            return null; // będziemy używać AsyncStorage jako fallback
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

            // 2. ULUBIONE - NOWE: sprawdź najpierw w Supabase, potem AsyncStorage
            let favoriteArticlesCount = 0;
            const supabaseFavoriteCount = await loadFavoriteCount(currentUser.id);

            if (supabaseFavoriteCount !== null) {
                // Znaleziono w Supabase
                favoriteArticlesCount = supabaseFavoriteCount;
                console.log('💖 Using favorites count from Supabase:', favoriteArticlesCount);
            } else {
                // Fallback do AsyncStorage
                favoriteArticlesCount = currentUser.stats?.favoriteArticles?.length || 0;
                console.log('💾 Using favorites count from AsyncStorage:', favoriteArticlesCount);
            }

            // 3. KOMENTARZE - z AsyncStorage (currentUser.stats.comments)
            const commentsCount = currentUser.stats?.comments || 0;

            // 4. POLUBIENIA - z Supabase (infoapp_likes) ⭐ NOWE
            let likedPostsCount = 0;
            try {
                const { data: likesData, error: likesError } = await supabase
                    .from('infoapp_likes')
                    .select('id')
                    .eq('user_id', currentUser.id);

                if (likesError) {
                    console.error('Error fetching likes from Supabase:', likesError);
                    // Fallback do AsyncStorage
                    likedPostsCount = currentUser.stats?.likedPosts || 0;
                } else {
                    likedPostsCount = likesData?.length || 0;
                    console.log('💖 Likes from Supabase:', likedPostsCount);
                }
            } catch (error) {
                console.error('Error querying likes:', error);
                // Fallback do AsyncStorage
                likedPostsCount = currentUser.stats?.likedPosts || 0;
            }

            const newStats = {
                readArticles: readArticlesCount,
                favoriteArticles: favoriteArticlesCount, // POPRAWIONE - używa nowej funkcji
                comments: commentsCount,
                likedPosts: likedPostsCount
            };

            console.log('📈 Current user stats from AsyncStorage:', {
                favoriteArticles: currentUser.stats?.favoriteArticles,
                favoriteCount: currentUser.stats?.favoriteArticles?.length || 0,
                comments: commentsCount,
                asyncStorageLikedPosts: currentUser.stats?.likedPosts
            });

            console.log('📈 Updated stats (with Supabase data):', newStats);
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


    useEffect(() => {
        let mounted = true;

        // pierwszy odczyt sesji po starcie
        (async () => {
            try {
                await checkUser();
            } catch (e) {
                console.log('[Auth] checkUser on mount error:', e);
            }
        })();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state changed:', event, session?.user?.email);
                if (!mounted) return;

                switch (event) {
                    case 'SIGNED_IN': {
                        Alert.alert('Sukces', 'Pomyślnie zalogowano!');
                        await checkUser();
                        break;
                    }
                    case 'SIGNED_OUT': {
                        // natychmiast zresetuj UI — bez czekania na checkUser()
                        setUser({
                            isAnonymous: true,
                            displayName: 'Anonim',
                            stats: { readArticles: 0, favoriteArticles: [], comments: 0, likedPosts: 0 },
                        });
                        setStats({ readArticles: 0, favoriteArticles: 0, comments: 0, likedPosts: 0 });
                        setLoading(false);
                        break;
                    }
                    case 'USER_UPDATED':
                    case 'TOKEN_REFRESHED':
                    case 'INITIAL_SESSION': {
                        await checkUser();
                        break;
                    }
                    default:
                        // no-op
                        break;
                }
            }
        );

        return () => {
            mounted = false;
            subscription?.unsubscribe(); // cleanup
        };
    }, []);

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
            `Dane użytkownika:\n\nID: ${userData?.id}\nUtworzono: ${new Date(userData?.createdAt).toLocaleDateString()}\nPrzeczytane artykuły: ${stats.readArticles}\nUlubione artykuły: ${stats.favoriteArticles}\nKomentarze: ${stats.comments}\nPolubienia: ${stats.likedPosts}`,
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

    const loadUserData = async () => {
        try {
            await loadRealStats();
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setLoading(false);
        }
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
                title: 'Podziel się aplikacją',
                icon: 'share',
                onPress: handleShare,
                description: 'Poleć znajomym'
            },
            {
                id: 5,
                title: 'Oceń aplikację',
                icon: 'star',
                onPress: handleRate,
                description: 'Twoja opinia się liczy'
            },
            {
                id: 6,
                title: 'Pomoc i wsparcie',
                icon: 'help-circle',
                onPress: () => navigateToScreen('HelpSupport'),
                description: 'Skontaktuj się z nami'
            },
            {
                id: 7,
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
                        <Text style={styles.userName}>{user?.displayName || 'Anonim'}</Text>
                        <Text style={styles.userEmail}>
                            {user?.isAnonymous ? 'Korzystasz bez logowania' : user?.email || 'Brak adresu email'}
                        </Text>
                        {user?.provider && (
                            <Text style={styles.providerInfo}>
                                Zalogowano przez: {user.provider === 'google' ? 'Google' : user.provider}
                            </Text>
                        )}
                        {user?.isAnonymous ? (
                            <TouchableOpacity
                                style={[styles.loginButton, signingIn && styles.loginButtonDisabled]}
                                onPress={login}
                                activeOpacity={0.8}

                            >
                                {signingIn ? (
                                    <ActivityIndicator size="small" color={COLORS.white} />
                                ) : (
                                    <>
                                        <Ionicons
                                            name="logo-google"
                                            size={18}
                                            color={COLORS.white}
                                            style={{ marginRight: 8 }}
                                        />
                                        <Text style={styles.loginButtonText}>Zaloguj się przez Google</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={styles.loginButton}
                                onPress={handleSignOut}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.loginButtonText}>Wyloguj się</Text>
                            </TouchableOpacity>
                        )}

                    </View>
                </LinearGradient>

                {/* STATYSTYKI - używają nowego state z poprawną logiką */}
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
                        <Text style={styles.statNumber}>{stats.likedPosts}</Text>
                        <Text style={styles.statLabel}>Ulubione</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{stats.comments}</Text>
                        <Text style={styles.statLabel}>Komentarze</Text>
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
                    {user?.createdAt && (
                        <Text style={styles.memberSince}>
                            Użytkownik od: {new Date(user.createdAt).toLocaleDateString('pl-PL')}
                        </Text>
                    )}
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
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Ładowanie profilu...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
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
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
    },
    providerInfo: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 16,
    },
    loginButtonDisabled: {
        opacity: 0.5,
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