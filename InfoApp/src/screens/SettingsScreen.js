// src/screens/SettingsScreen.js - Ekran ustawień
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../styles/colors';

const SettingsScreen = () => {
    const [pushNotifications, setPushNotifications] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const SettingItem = ({ title, subtitle, value, onValueChange, type = 'switch' }) => (
        <View style={styles.settingItem}>
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
                />
            )}
            {type === 'arrow' && (
                <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
            )}
        </View>
    );

    const SettingSection = ({ title, children }) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.sectionContent}>
                {children}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <SettingSection title="Powiadomienia">
                    <SettingItem
                        title="Powiadomienia push"
                        subtitle="Otrzymuj powiadomienia o nowych newsach"
                        value={pushNotifications}
                        onValueChange={setPushNotifications}
                    />
                    <SettingItem
                        title="Powiadomienia email"
                        subtitle="Cotygodniowe podsumowanie na email"
                        value={emailNotifications}
                        onValueChange={setEmailNotifications}
                    />
                </SettingSection>

                <SettingSection title="Wygląd">
                    <SettingItem
                        title="Tryb ciemny"
                        subtitle="Używaj ciemnego motywu"
                        value={darkMode}
                        onValueChange={setDarkMode}
                    />
                </SettingSection>

                <SettingSection title="Funkcjonalność">
                    <SettingItem
                        title="Automatyczne odświeżanie"
                        subtitle="Automatycznie sprawdzaj nowe newsy"
                        value={autoRefresh}
                        onValueChange={setAutoRefresh}
                    />
                </SettingSection>

                <SettingSection title="Konto">
                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingTitle}>Zarządzaj kontem</Text>
                            <Text style={styles.settingSubtitle}>Dane osobowe i preferencje</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                    </TouchableOpacity>
                </SettingSection>

                <SettingSection title="Informacje">
                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingTitle}>Polityka prywatności</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingTitle}>Regulamin</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                    </TouchableOpacity>
                </SettingSection>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
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
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: COLORS.border,
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
});

export default SettingsScreen;