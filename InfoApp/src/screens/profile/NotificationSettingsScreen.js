// src/screens/profile/NotificationSettingsScreen.js - Zaktualizowany z Supabase
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Switch,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLORS } from '../../styles/colors';
import { userService } from '../../services/userService';
import { supabase } from '../../services/supabaseClient';

const NotificationSettingsScreen = () => {
    const [settings, setSettings] = useState({
        newsNotifications: true,
        politicianPosts: true,
        comments: false,
        likes: false,
        dailySummary: true,
        breakingNews: true,
        soundEnabled: true,
        vibrationEnabled: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        initializeSettings();
    }, []);

    const initializeSettings = async () => {
        try {
            // Pobierz aktualnego użytkownika
            const currentUser = await userService.getCurrentUser();
            setUser(currentUser);

            if (currentUser?.id) {
                // Spróbuj pobrać ustawienia z Supabase
                const supabaseSettings = await loadSettingsFromSupabase(currentUser.id);
                if (supabaseSettings) {
                    setSettings(supabaseSettings);
                } else {
                    // Jeśli nie ma w Supabase, spróbuj z AsyncStorage
                    const localSettings = await loadLocalSettings();
                    if (localSettings) {
                        setSettings(localSettings);
                        // Zapisz lokalne ustawienia do Supabase
                        await saveSettingsToSupabase(currentUser.id, localSettings);
                    }
                }
            } else {
                // Dla anonimowych użytkowników użyj AsyncStorage
                const localSettings = await loadLocalSettings();
                if (localSettings) {
                    setSettings(localSettings);
                }
            }
        } catch (error) {
            console.error('Error initializing settings:', error);
            Alert.alert('Błąd', 'Nie udało się załadować ustawień');
        } finally {
            setLoading(false);
        }
    };

    const loadSettingsFromSupabase = async (userId) => {
        try {
            console.log('Loading settings from Supabase for user:', userId);

            const { data, error } = await supabase
                .from('user_notification_settings')
                .select('settings')
                .eq('user_id', userId)
                .maybeSingle(); // Zmieniono z .single() na .maybeSingle()

            console.log('Supabase response:', { data, error });

            if (error) {
                console.log('Supabase error details:', error);
                return null;
            }

            return data?.settings || null;
        } catch (error) {
            console.error('Error loading settings from Supabase:', error);
            return null;
        }
    };

    const saveSettingsToSupabase = async (userId, newSettings) => {
        try {
            console.log('Saving settings to Supabase for user:', userId, newSettings);

            const { data, error } = await supabase
                .from('user_notification_settings')
                .upsert({
                    user_id: userId,
                    settings: newSettings,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id' // Specify conflict resolution
                })
                .select()
                .single();

            console.log('Supabase save response:', { data, error });

            if (error) {
                console.error('Supabase save error:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error saving settings to Supabase:', error);
            return false;
        }
    };

    const loadLocalSettings = async () => {
        try {
            const savedSettings = await AsyncStorage.getItem('@notification_settings');
            return savedSettings ? JSON.parse(savedSettings) : null;
        } catch (error) {
            console.error('Error loading local settings:', error);
            return null;
        }
    };

    const saveLocalSettings = async (newSettings) => {
        try {
            await AsyncStorage.setItem('@notification_settings', JSON.stringify(newSettings));
            return true;
        } catch (error) {
            console.error('Error saving local settings:', error);
            return false;
        }
    };

    const saveSettings = async (newSettings) => {
        setSaving(true);
        try {
            // Zawsze zapisz lokalnie
            await saveLocalSettings(newSettings);

            // Jeśli użytkownik jest zalogowany, zapisz też w Supabase
            if (user?.id) {
                const supabaseSuccess = await saveSettingsToSupabase(user.id, newSettings);
                if (!supabaseSuccess) {
                    Alert.alert(
                        'Ostrzeżenie',
                        'Ustawienia zostały zapisane lokalnie, ale nie udało się zsynchronizować z chmurą. Spróbuj ponownie później.'
                    );
                }
            }

            setSettings(newSettings);

            // Jeśli włączono pilne wiadomości, sprawdź czy są jakieś nowe
            if (newSettings.breakingNews && !settings.breakingNews) {
                checkForUrgentNews();
            }

        } catch (error) {
            console.error('Error saving settings:', error);
            Alert.alert('Błąd', 'Nie udało się zapisać ustawień');
        } finally {
            setSaving(false);
        }
    };

    const toggleSetting = (key) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        saveSettings(newSettings);
    };

    const checkForUrgentNews = async () => {
        try {
            const { data, error } = await supabase
                .from('infoapp_news') // Zmienione z 'news_articles' na 'infoapp_news'
                .select('id, title, created_at')
                .eq('is_urgent', true)
                .eq('is_active', true) // Zmienione z 'published' na 'is_active'
                .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // ostatnie 24h
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;

            if (data && data.length > 0) {
                Alert.alert(
                    '🚨 Pilne wiadomości!',
                    `Mamy ${data.length} pilną wiadomość z ostatnich 24 godzin. Sprawdź najnowsze newsy!`,
                    [
                        { text: 'Później', style: 'cancel' },
                        {
                            text: 'Zobacz teraz', onPress: () => {
                                // Tu można dodać nawigację do newsów
                                console.log('Navigate to urgent news');
                            }
                        }
                    ]
                );
            }
        } catch (error) {
            console.error('Error checking urgent news:', error);
        }
    };

    const resetToDefaults = () => {
        Alert.alert(
            'Resetuj ustawienia',
            'Czy na pewno chcesz przywrócić domyślne ustawienia powiadomień?',
            [
                { text: 'Anuluj', style: 'cancel' },
                {
                    text: 'Resetuj',
                    style: 'destructive',
                    onPress: () => {
                        const defaultSettings = {
                            newsNotifications: true,
                            politicianPosts: true,
                            comments: false,
                            likes: false,
                            dailySummary: true,
                            breakingNews: true,
                            soundEnabled: true,
                            vibrationEnabled: true,
                        };
                        saveSettings(defaultSettings);
                        Alert.alert('Sukces', 'Ustawienia zostały przywrócone do domyślnych');
                    }
                }
            ]
        );
    };

    const testNotification = () => {
        Alert.alert(
            '🔔 Test powiadomienia',
            'To jest przykładowe powiadomienie z aplikacji InfoApp!',
            [{ text: 'OK' }]
        );
    };

    const SettingItem = ({ icon, title, description, value, onToggle, iconColor = COLORS.primary, disabled = false }) => (
        <View style={[styles.settingItem, disabled && styles.settingItemDisabled]}>
            <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: iconColor + '20' }]}>
                    <Ionicons name={icon} size={20} color={disabled ? COLORS.gray : iconColor} />
                </View>
                <View style={styles.settingInfo}>
                    <Text style={[styles.settingTitle, disabled && styles.disabledText]}>{title}</Text>
                    <Text style={[styles.settingDescription, disabled && styles.disabledText]}>{description}</Text>
                </View>
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: COLORS.lightGray, true: COLORS.primary + '50' }}
                thumbColor={value ? COLORS.primary : COLORS.gray}
                disabled={disabled || saving}
            />
        </View>
    );

    const SectionHeader = ({ title, icon }) => (
        <View style={styles.sectionHeader}>
            <Ionicons name={icon} size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Ładowanie ustawień...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {saving && (
                    <View style={styles.savingBanner}>
                        <ActivityIndicator size="small" color={COLORS.white} />
                        <Text style={styles.savingText}>Zapisywanie ustawień...</Text>
                    </View>
                )}

                {/* Status użytkownika */}
                <View style={styles.userStatusContainer}>
                    <View style={styles.userStatus}>
                        <Ionicons
                            name={user?.id ? "cloud-done" : "cloud-offline"}
                            size={20}
                            color={user?.id ? COLORS.green : COLORS.orange}
                        />
                        <Text style={styles.userStatusText}>
                            {user?.id
                                ? 'Ustawienia synchronizowane z chmurą'
                                : 'Ustawienia zapisane lokalnie'
                            }
                        </Text>
                    </View>
                </View>

                {/* Powiadomienia o treści */}
                <View style={styles.section}>
                    <SectionHeader title="Powiadomienia o treści" icon="newspaper-outline" />

                    <SettingItem
                        icon="newspaper"
                        title="Nowe artykuły"
                        description="Powiadomienia o najnowszych newsach"
                        value={settings.newsNotifications}
                        onToggle={() => toggleSetting('newsNotifications')}
                    />

                    <SettingItem
                        icon="people"
                        title="Wpisy polityków"
                        description="Powiadomienia o nowych komunikatach"
                        value={settings.politicianPosts}
                        onToggle={() => toggleSetting('politicianPosts')}
                    />

                    <SettingItem
                        icon="flash"
                        title="Pilne wiadomości"
                        description="Natychmiastowe powiadomienia o ważnych wydarzeniach"
                        value={settings.breakingNews}
                        onToggle={() => toggleSetting('breakingNews')}
                        iconColor={COLORS.red}
                    />

                    <SettingItem
                        icon="time"
                        title="Podsumowanie dnia"
                        description="Codzienne podsumowanie najważniejszych wydarzeń"
                        value={settings.dailySummary}
                        onToggle={() => toggleSetting('dailySummary')}
                        iconColor={COLORS.green}
                    />
                </View>

                {/* Powiadomienia społecznościowe */}
                <View style={styles.section}>
                    <SectionHeader title="Aktywność społecznościowa" icon="heart-outline" />

                    <SettingItem
                        icon="chatbubble"
                        title="Nowe komentarze"
                        description="Powiadomienia o odpowiedziach na Twoje komentarze"
                        value={settings.comments}
                        onToggle={() => toggleSetting('comments')}
                    />

                    <SettingItem
                        icon="heart"
                        title="Polubienia"
                        description="Powiadomienia o polubieniach Twoich komentarzy"
                        value={settings.likes}
                        onToggle={() => toggleSetting('likes')}
                        iconColor={COLORS.red}
                    />
                </View>

                {/* Ustawienia dźwięku i wibracji */}
                <View style={styles.section}>
                    <SectionHeader title="Dźwięk i wibracje" icon="volume-high-outline" />

                    <SettingItem
                        icon="volume-high"
                        title="Dźwięk powiadomień"
                        description="Odtwarzaj dźwięk przy otrzymaniu powiadomienia"
                        value={settings.soundEnabled}
                        onToggle={() => toggleSetting('soundEnabled')}
                        iconColor={COLORS.blue}
                    />

                    <SettingItem
                        icon="phone-portrait"
                        title="Wibracje"
                        description="Wibruj przy otrzymaniu powiadomienia"
                        value={settings.vibrationEnabled}
                        onToggle={() => toggleSetting('vibrationEnabled')}
                        iconColor={COLORS.blue}
                    />
                </View>

                {/* Test powiadomień */}
                <TouchableOpacity style={styles.testButton} onPress={testNotification}>
                    <Ionicons name="notifications" size={20} color={COLORS.white} />
                    <Text style={styles.testButtonText}>Testuj powiadomienie</Text>
                </TouchableOpacity>

                {/* Info */}
                <View style={styles.infoContainer}>
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={24} color={COLORS.blue} />
                        <Text style={styles.infoText}>
                            Powiadomienia mogą być ograniczone przez ustawienia systemowe Twojego urządzenia.
                            {!user?.id && ' Zaloguj się, aby synchronizować ustawienia między urządzeniami.'}
                        </Text>
                    </View>
                </View>

                {/* Przycisk reset */}
                <TouchableOpacity
                    style={[styles.resetButton, saving && styles.disabledButton]}
                    onPress={resetToDefaults}
                    disabled={saving}
                >
                    <Ionicons name="refresh" size={20} color={COLORS.white} />
                    <Text style={styles.resetButtonText}>Przywróć domyślne</Text>
                </TouchableOpacity>
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
        color: COLORS.gray,
        marginTop: 12,
    },
    scrollView: {
        flex: 1,
    },
    savingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    savingText: {
        color: COLORS.white,
        fontSize: 14,
        marginLeft: 8,
        fontWeight: '500',
    },
    userStatusContainer: {
        margin: 16,
    },
    userStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
    },
    userStatusText: {
        fontSize: 14,
        color: COLORS.gray,
        marginLeft: 8,
    },
    section: {
        backgroundColor: COLORS.white,
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.lightGray,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.black,
        marginLeft: 8,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: COLORS.lightGray,
    },
    settingItemDisabled: {
        opacity: 0.5,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingInfo: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.black,
        marginBottom: 2,
    },
    settingDescription: {
        fontSize: 13,
        color: COLORS.gray,
        lineHeight: 18,
    },
    disabledText: {
        color: COLORS.lightGray,
    },
    testButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.blue,
        marginHorizontal: 16,
        marginVertical: 8,
        paddingVertical: 14,
        borderRadius: 12,
    },
    testButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    infoContainer: {
        margin: 16,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: COLORS.blue + '10',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.blue + '30',
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: COLORS.blue,
        marginLeft: 12,
        lineHeight: 20,
    },
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.red,
        marginHorizontal: 16,
        marginVertical: 16,
        paddingVertical: 14,
        borderRadius: 12,
    },
    disabledButton: {
        backgroundColor: COLORS.lightGray,
    },
    resetButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default NotificationSettingsScreen;