// src/screens/profile/NotificationSettingsScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Switch,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLORS } from '../../styles/colors';

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

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const savedSettings = await AsyncStorage.getItem('@notification_settings');
            if (savedSettings) {
                setSettings(JSON.parse(savedSettings));
            }
        } catch (error) {
            console.error('Error loading notification settings:', error);
        }
    };

    const saveSettings = async (newSettings) => {
        try {
            await AsyncStorage.setItem('@notification_settings', JSON.stringify(newSettings));
            setSettings(newSettings);
        } catch (error) {
            console.error('Error saving notification settings:', error);
            Alert.alert('Błąd', 'Nie udało się zapisać ustawień');
        }
    };

    const toggleSetting = (key) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        saveSettings(newSettings);
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

    const SettingItem = ({ icon, title, description, value, onToggle, iconColor = COLORS.primary }) => (
        <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: iconColor + '20' }]}>
                    <Ionicons name={icon} size={20} color={iconColor} />
                </View>
                <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>{title}</Text>
                    <Text style={styles.settingDescription}>{description}</Text>
                </View>
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: COLORS.lightGray, true: COLORS.primary + '50' }}
                thumbColor={value ? COLORS.primary : COLORS.gray}
            />
        </View>
    );

    const SectionHeader = ({ title, icon }) => (
        <View style={styles.sectionHeader}>
            <Ionicons name={icon} size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
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

                {/* Info */}
                <View style={styles.infoContainer}>
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={24} color={COLORS.blue} />
                        <Text style={styles.infoText}>
                            Powiadomienia mogą być ograniczone przez ustawienia systemowe Twojego urządzenia.
                        </Text>
                    </View>
                </View>

                {/* Przycisk reset */}
                <TouchableOpacity style={styles.resetButton} onPress={resetToDefaults}>
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
    scrollView: {
        flex: 1,
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
    resetButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default NotificationSettingsScreen;