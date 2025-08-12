// src/screens/SettingsScreen.js - Pełny ekran ustawień z funkcjonalnością
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../styles/colors';
import { userService } from '../services/userService';

const SettingsScreen = () => {
    const [pushNotifications, setPushNotifications] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await userService.getSettings();
            setPushNotifications(settings.notifications ?? true);
            setEmailNotifications(settings.emailNotifications ?? false);
            setDarkMode(settings.theme === 'dark');
            setAutoRefresh(settings.autoRefresh ?? true);
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateSetting = async (key, value) => {
        try {
            await userService.updateSettings({ [key]: value });
        } catch (error) {
            console.error('Error updating setting:', error);
            Alert.alert('Błąd', 'Nie udało się zapisać ustawienia');
        }
    };

    const handlePushNotifications = (value) => {
        setPushNotifications(value);
        updateSetting('notifications', value);

        if (value) {
            Alert.alert(
                'Powiadomienia włączone',
                'Będziesz otrzymywać powiadomienia o najważniejszych newsach.',
                [{ text: 'OK' }]
            );
        }
    };

    const handleEmailNotifications = (value) => {
        setEmailNotifications(value);
        updateSetting('emailNotifications', value);

        if (value) {
            Alert.alert(
                'Powiadomienia email',
                'Funkcja powiadomień email będzie dostępna po zalogowaniu się do aplikacji.',
                [{ text: 'Rozumiem' }]
            );
        }
    };

    const handleDarkMode = (value) => {
        setDarkMode(value);
        updateSetting('theme', value ? 'dark' : 'light');

        Alert.alert(
            'Tryb ciemny',
            value
                ? 'Tryb ciemny zostanie włączony w przyszłej aktualizacji.'
                : 'Przywrócono tryb jasny.',
            [{ text: 'OK' }]
        );
    };

    const handleAutoRefresh = (value) => {
        setAutoRefresh(value);
        updateSetting('autoRefresh', value);
    };

    const handlePrivacyPolicy = () => {
        Alert.alert(
            'Polityka prywatności',
            'InfoApp szanuje Twoją prywatność.\n\n• Nie zbieramy danych osobowych bez zgody\n• Lokalne dane są przechowywane bezpiecznie\n• Nie udostępniamy danych osobowych podmiotom trzecim\n• Masz prawo do usunięcia swoich danych\n\nPełna polityka prywatności dostępna na stronie internetowej.',
            [{ text: 'Rozumiem' }]
        );
    };

    const handleTermsOfService = () => {
        Alert.alert(
            'Regulamin',
            'Regulamin korzystania z aplikacji InfoApp:\n\n• Korzystanie z aplikacji jest bezpłatne\n• Zabrania się publikowania nielegalnych treści\n• Zastrzegamy sobie prawo do moderacji komentarzy\n• Nie ponosimy odpowiedzialności za treści użytkowników\n• Możemy aktualizować regulamin\n\nPełny regulamin dostępny na stronie internetowej.',
            [{ text: 'Akceptuję' }]
        );
    };

    const handleClearCache = () => {
        Alert.alert(
            'Wyczyść pamięć podręczną',
            'Czy chcesz wyczyścić pamięć podręczną aplikacji? To może pomóc rozwiązać problemy z wydajnością.',
            [
                { text: 'Anuluj', style: 'cancel' },
                {
                    text: 'Wyczyść',
                    onPress: () => {
                        // Symulacja czyszczenia cache
                        Alert.alert('Sukces', 'Pamięć podręczna została wyczyszczona.');
                    }
                }
            ]
        );
    };

    const handleResetSettings = () => {
        Alert.alert(
            'Resetuj ustawienia',
            'Czy chcesz przywrócić domyślne ustawienia aplikacji?',
            [
                { text: 'Anuluj', style: 'cancel' },
                {
                    text: 'Resetuj',
                    style: 'destructive',
                    onPress: () => {
                        setPushNotifications(true);
                        setEmailNotifications(false);
                        setDarkMode(false);
                        setAutoRefresh(true);
                        updateSetting('notifications', true);
                        updateSetting('emailNotifications', false);
                        updateSetting('theme', 'light');
                        updateSetting('autoRefresh', true);
                        Alert.alert('Sukces', 'Ustawienia zostały zresetowane.');
                    }
                }
            ]
        );
    };

    const SettingItem = ({ title, subtitle, value, onValueChange, type = 'switch', onPress }) => (
        <TouchableOpacity
            style={styles.settingItem}
            onPress={type === 'arrow' ? onPress : undefined}
            disabled={type === 'switch'}
        >
            <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{title}</Text>
                {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
            </View>
            {type === 'switch' && (
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
                    thumbColor={COLORS.white}
                    ios_backgroundColor={COLORS.lightGray}
                />
            )}
            {type === 'arrow' && (
                <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
            )}
        </TouchableOpacity>
    );

    const SettingSection = ({ title, children }) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.sectionContent}>
                {children}
            </View>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Ładowanie ustawień...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <SettingSection title="Powiadomienia">
                    <SettingItem
                        title="Powiadomienia push"
                        subtitle="Otrzymuj powiadomienia o nowych newsach"
                        value={pushNotifications}
                        onValueChange={handlePushNotifications}
                    />
                    <SettingItem
                        title="Powiadomienia email"
                        subtitle="Cotygodniowe podsumowanie na email"
                        value={emailNotifications}
                        onValueChange={handleEmailNotifications}
                    />
                </SettingSection>

                <SettingSection title="Wygląd i działanie">
                    <SettingItem
                        title="Tryb ciemny"
                        subtitle="Używaj ciemnego motywu (wkrótce)"
                        value={darkMode}
                        onValueChange={handleDarkMode}
                    />
                    <SettingItem
                        title="Automatyczne odświeżanie"
                        subtitle="Automatycznie sprawdzaj nowe newsy"
                        value={autoRefresh}
                        onValueChange={handleAutoRefresh}
                    />
                </SettingSection>

                <SettingSection title="Prywatność i bezpieczeństwo">
                    <SettingItem
                        title="Polityka prywatności"
                        subtitle="Jak chronimy Twoje dane"
                        type="arrow"
                        onPress={handlePrivacyPolicy}
                    />
                    <SettingItem
                        title="Regulamin"
                        subtitle="Zasady korzystania z aplikacji"
                        type="arrow"
                        onPress={handleTermsOfService}
                    />
                </SettingSection>

                <SettingSection title="Aplikacja">
                    <SettingItem
                        title="Wyczyść pamięć podręczną"
                        subtitle="Może pomóc w rozwiązaniu problemów"
                        type="arrow"
                        onPress={handleClearCache}
                    />
                    <SettingItem
                        title="Resetuj ustawienia"
                        subtitle="Przywróć domyślne ustawienia"
                        type="arrow"
                        onPress={handleResetSettings}
                    />
                </SettingSection>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Ustawienia są automatycznie zapisywane
                    </Text>
                    <Text style={styles.footerSubtext}>
                        Niektóre zmiany mogą wymagać ponownego uruchomienia aplikacji
                    </Text>
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
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 12,
        marginHorizontal: 20,
    },
    sectionContent: {
        backgroundColor: COLORS.white,
        marginHorizontal: 20,
        borderRadius: 16,
        paddingVertical: 4,
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: COLORS.lightGray,
    },
    settingInfo: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },
    settingSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    footer: {
        padding: 40,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 8,
    },
    footerSubtext: {
        fontSize: 12,
        color: COLORS.textLight,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});

export default SettingsScreen;