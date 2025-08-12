// src/screens/ProfileScreen.js - Z prawdziwymi statystykami użytkownika
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../styles/colors';
import { APP_CONFIG } from '../utils/constants';
import { userService } from '../services/userService';

const ProfileScreen = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUserData();
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

    const handleMenuPress = (title) => {
        Alert.alert(title, `Funkcja "${title}" będzie dostępna w przyszłej wersji aplikacji.`, [
            { text: 'OK', style: 'default' }
        ]);
    };

    const handleShare = () => {
        Alert.alert(
            'Podziel się aplikacją',
            'Pobierz InfoApp i bądź na bieżąco z najważniejszymi newsami!\n\n📱 Dostępna za darmo w sklepach z aplikacjami.',
            [
                { text: 'Anuluj', style: 'cancel' },
                { text: 'Udostępnij', onPress: () => console.log('Udostępnianie...') }
            ]
        );
    };

    const handleRate = () => {
        Alert.alert(
            'Oceń aplikację',
            'Czy podoba Ci się nasza aplikacja? Twoja opinia jest dla nas bardzo ważna!',
            [
                { text: 'Może później', style: 'cancel' },
                { text: 'Oceń teraz', onPress: () => console.log('Przekierowanie do sklepu...') }
            ]
        );
    };

    const handleAbout = () => {
        Alert.alert(
            'O aplikacji',
            `${APP_CONFIG.NAME} v${APP_CONFIG.VERSION}\n\n${APP_CONFIG.DESCRIPTION}\n\nDeweloper: Twoja Firma\nKontakt: ${APP_CONFIG.SUPPORT_EMAIL}\n\nDziękujemy za korzystanie z naszej aplikacji! 🙏`,
            [{ text: 'OK' }]
        );
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
                { text: 'Resetuj dane', style: 'destructive', onPress: confirmReset }
            ]
        );
    };

    const exportUserData = async () => {
        const userData = await userService.exportUserData();
        Alert.alert(
            'Eksport danych',
            `Dane użytkownika:\n\nID: ${userData?.id}\nUtworzono: ${new Date(userData?.createdAt).toLocaleDateString()}\nPrzeczytane artykuły: ${userData?.stats?.readArticles || 0}\nKomentarze: ${userData?.stats?.comments || 0}\nPolubienia: ${userData?.stats?.likedPosts || 0}`,
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
        Alert.alert('Sukces', 'Dane zostały zresetowane. Zostałeś oznaczony jako nowy użytkownik.');
    };

    const menuItems = [
        {
            id: 1,
            title: 'Ustawienia powiadomień',
            icon: 'notifications',
            onPress: () => handleMenuPress('Ustawienia powiadomień'),
            description: 'Zarządzaj powiadomieniami'
        },
        {
            id: 2,
            title: 'Ulubione artykuły',
            icon: 'heart',
            onPress: () => handleMenuPress('Ulubione artykuły'),
            description: 'Zobacz zapisane artykuły'
        },
        {
            id: 3,
            title: 'Historia czytania',
            icon: 'time',
            onPress: () => handleMenuPress('Historia czytania'),
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
            onPress: () => handleMenuPress('Pomoc i wsparcie'),
            description: 'Skontaktuj się z nami'
        },
        {
            id: 8,
            title: 'O aplikacji',
            icon: 'information-circle',
            onPress: handleAbout,
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

                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{user?.stats?.readArticles || 0}</Text>
                        <Text style={styles.statLabel}>Przeczytane</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{user?.stats?.favoriteArticles?.length || 0}</Text>
                        <Text style={styles.statLabel}>Ulubione</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{user?.stats?.comments || 0}</Text>
                        <Text style={styles.statLabel}>Komentarze</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{user?.stats?.likedPosts || 0}</Text>
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
                </View>
            </ScrollView>
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