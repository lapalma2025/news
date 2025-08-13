/*
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { COLORS } from '../../styles/colors';
import { userService } from '../../services/userService';
import { APP_CONFIG } from '../../utils/constants';

const DataManagementScreen = () => {
    const [userData, setUserData] = useState(null);
    const [dataSize, setDataSize] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const user = await userService.getCurrentUser();
            setUserData(user);
            calculateDataSize(user);
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    const calculateDataSize = (user) => {
        if (!user) return;

        const dataString = JSON.stringify(user);
        const sizeInBytes = new Blob([dataString]).size;
        setDataSize(sizeInBytes);
    };

    const formatDataSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const exportData = async () => {
        setLoading(true);
        try {
            if (!userData) {
                Alert.alert('Błąd', 'Brak danych do eksportu');
                return;
            }

            const exportData = {
                exportDate: new Date().toISOString(),
                appVersion: APP_CONFIG.VERSION,
                userData: {
                    profile: {
                        displayName: userData.displayName,
                        email: userData.email,
                        isAnonymous: userData.isAnonymous,
                        createdAt: userData.createdAt,
                    },
                    statistics: userData.stats,
                    preferences: userData.preferences || {},
                }
            };

            const jsonString = JSON.stringify(exportData, null, 2);
            const fileName = `infoapp_export_${new Date().toISOString().split('T')[0]}.json`;
            const fileUri = FileSystem.documentDirectory + fileName;

            await FileSystem.writeAsStringAsync(fileUri, jsonString);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'application/json',
                    dialogTitle: 'Eksport danych InfoApp',
                });
            } else {
                Alert.alert(
                    'Eksport ukończony',
                    `Dane zostały zapisane w: ${fileUri}`,
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('Error exporting data:', error);
            Alert.alert('Błąd', 'Nie udało się wyeksportować danych');
        } finally {
            setLoading(false);
        }
    };

    const resetAllData = () => {
        Alert.alert(
            'Resetuj wszystkie dane',
            'UWAGA: Ta operacja usunie wszystkie Twoje dane z aplikacji, w tym:\n\n• Historię czytania\n• Ulubione artykuły\n• Komentarze\n• Ustawienia\n• Statystyki\n\nTa operacja jest nieodwracalna!',
            [
                { text: 'Anuluj', style: 'cancel' },
                {
                    text: 'Resetuj wszystko',
                    style: 'destructive',
                    onPress: confirmReset
                }
            ]
        );
    };

    const confirmReset = () => {
        Alert.alert(
            'Ostateczne potwierdzenie',
            'Czy na pewno chcesz usunąć WSZYSTKIE swoje dane? Ta operacja nie może być cofnięta.',
            [
                { text: 'Anuluj', style: 'cancel' },
                {
                    text: 'TAK, usuń wszystko',
                    style: 'destructive',
                    onPress: performReset
                }
            ]
        );
    };

    const performReset = async () => {
        try {
            await userService.resetUser();
            await loadUserData();
            Alert.alert(
                'Dane zostały zresetowane',
                'Wszystkie Twoje dane zostały pomyślnie usunięte. Aplikacja została przywrócona do stanu początkowego.'
            );
        } catch (error) {
            Alert.alert('Błąd', 'Nie udało się zresetować danych');
        }
    };

    const clearCache = async () => {
        Alert.alert(
            'Wyczyść pamięć podręczną',
            'Czy chcesz wyczyścić pamięć podręczną aplikacji? To może pomóc w rozwiązaniu problemów z wydajnością.',
            [
                { text: 'Anuluj', style: 'cancel' },
                {
                    text: 'Wyczyść',
                    onPress: async () => {
                        try {
                            // Tu można dodać logikę czyszczenia cache
                            Alert.alert('Sukces', 'Pamięć podręczna została wyczyszczona');
                        } catch (error) {
                            Alert.alert('Błąd', 'Nie udało się wyczyścić pamięci podręcznej');
                        }
                    }
                }
            ]
        );
    };

    const ActionCard = ({ icon, title, description, onPress, iconColor = COLORS.primary, dangerous = false }) => (
        <TouchableOpacity
            style={[styles.actionCard, dangerous && styles.dangerousCard]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.actionIcon, { backgroundColor: iconColor + '20' }]}>
                <Ionicons name={icon} size={24} color={iconColor} />
            </View>
            <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, dangerous && styles.dangerousText]}>
                    {title}
                </Text>
                <Text style={styles.actionDescription}>{description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
        </TouchableOpacity>
    );

    const DataSummaryCard = () => (
        <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Podsumowanie danych</Text>

            <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryNumber}>
                        {userData?.stats?.readArticles || 0}
                    </Text>
                    <Text style={styles.summaryLabel}>Przeczytane artykuły</Text>
                </View>

                <View style={styles.summaryItem}>
                    <Text style={styles.summaryNumber}>
                        {userData?.stats?.favoriteArticles?.length || 0}
                    </Text>
                    <Text style={styles.summaryLabel}>Ulubione</Text>
                </View>

                <View style={styles.summaryItem}>
                    <Text style={styles.summaryNumber}>
                        {userData?.stats?.comments || 0}
                    </Text>
                    <Text style={styles.summaryLabel}>Komentarze</Text>
                </View>

                <View style={styles.summaryItem}>
                    <Text style={styles.summaryNumber}>
                        {formatDataSize(dataSize)}
                    </Text>
                    <Text style={styles.summaryLabel}>Rozmiar danych</Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <DataSummaryCard />

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Eksport danych</Text>
                    <ActionCard
                        icon="download-outline"
                        title="Pobierz moje dane"
                        description="Eksportuj wszystkie swoje dane w formacie JSON"
                        onPress={exportData}
                        iconColor={COLORS.blue}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Zarządzanie przestrzenią</Text>
                    <ActionCard
                        icon="refresh-outline"
                        title="Wyczyść pamięć podręczną"
                        description="Usuń tymczasowe pliki i dane cache"
                        onPress={clearCache}
                        iconColor={COLORS.green}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Resetowanie danych</Text>
                    <ActionCard
                        icon="trash-outline"
                        title="Resetuj wszystkie dane"
                        description="Usuń wszystkie dane i przywróć aplikację do stanu początkowego"
                        onPress={resetAllData}
                        iconColor={COLORS.red}
                        dangerous={true}
                    />
                </View>

                <View style={styles.infoSection}>
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={24} color={COLORS.blue} />
                        <Text style={styles.infoText}>
                            Eksportowane dane zawierają tylko informacje przechowywane lokalnie w aplikacji.
                            Nie obejmują danych przechowywanych na serwerach InfoApp.
                        </Text>
                    </View>
                </View>

                <View style={styles.privacySection}>
                    <Text style={styles.privacyTitle}>Prywatność i bezpieczeństwo</Text>
                    <Text style={styles.privacyText}>
                        • Twoje dane są przechowywane lokalnie na urządzeniu{'\n'}
                        • Eksport danych nie zawiera poufnych informacji{'\n'}
                        • Resetowanie danych jest nieodwracalne{'\n'}
                        • Regularnie sprawdzaj rozmiar swoich danych
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
    scrollView: {
        flex: 1,
    },
    summaryCard: {
        backgroundColor: COLORS.white,
        margin: 16,
        borderRadius: 16,
        padding: 20,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.black,
        marginBottom: 16,
        textAlign: 'center',
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    summaryItem: {
        width: '50%',
        alignItems: 'center',
        marginBottom: 16,
    },
    summaryNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.primary,
        marginBottom: 4,
    },
    summaryLabel: {
        fontSize: 12,
        color: COLORS.gray,
        textAlign: 'center',
    },
    section: {
        marginHorizontal: 16,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.black,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
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
    dangerousCard: {
        borderWidth: 1,
        borderColor: COLORS.red + '30',
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.black,
        marginBottom: 4,
    },
    dangerousText: {
        color: COLORS.red,
    },
    actionDescription: {
        fontSize: 14,
        color: COLORS.gray,
        lineHeight: 20,
    },
    infoSection: {
        marginHorizontal: 16,
        marginBottom: 24,
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
    privacySection: {
        marginHorizontal: 16,
        marginBottom: 32,
        backgroundColor: COLORS.white,
        padding: 20,
        borderRadius: 12,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    privacyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.black,
        marginBottom: 12,
    },
    privacyText: {
        fontSize: 14,
        color: COLORS.gray,
        lineHeight: 22,
    },
});

export default DataManagementScreen;
*/