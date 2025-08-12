// src/screens/ProfileScreen.js - Ekran profilu
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../styles/colors';
import { APP_CONFIG } from '../utils/constants';

const ProfileScreen = () => {
    const menuItems = [
        { id: 1, title: 'Ustawienia powiadomień', icon: 'notifications', onPress: () => { } },
        { id: 2, title: 'Ulubione artykuły', icon: 'heart', onPress: () => { } },
        { id: 3, title: 'Historia czytania', icon: 'time', onPress: () => { } },
        { id: 4, title: 'Podziel się aplikacją', icon: 'share', onPress: () => { } },
        { id: 5, title: 'Oceń aplikację', icon: 'star', onPress: () => { } },
        { id: 6, title: 'Pomoc i wsparcie', icon: 'help-circle', onPress: () => { } },
        { id: 7, title: 'O aplikacji', icon: 'information-circle', onPress: () => { } },
    ];

    const renderMenuItem = (item) => (
        <TouchableOpacity key={item.id} style={styles.menuItem} onPress={item.onPress}>
            <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon} size={24} color={COLORS.primary} />
                <Text style={styles.menuItemText}>{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    style={styles.header}
                >
                    <View style={styles.profileInfo}>
                        <View style={styles.avatar}>
                            <Ionicons name="person" size={40} color={COLORS.white} />
                        </View>
                        <Text style={styles.userName}>Czytelnik InfoApp</Text>
                        <Text style={styles.userEmail}>anonim@infoapp.pl</Text>
                    </View>
                </LinearGradient>

                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>42</Text>
                        <Text style={styles.statLabel}>Przeczytane</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>8</Text>
                        <Text style={styles.statLabel}>Ulubione</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>23</Text>
                        <Text style={styles.statLabel}>Komentarze</Text>
                    </View>
                </View>

                <View style={styles.menuContainer}>
                    {menuItems.map(renderMenuItem)}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.appVersion}>
                        {APP_CONFIG.NAME} v{APP_CONFIG.VERSION}
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
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    statLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    menuContainer: {
        backgroundColor: COLORS.white,
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 16,
        padding: 8,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemText: {
        fontSize: 16,
        color: COLORS.textPrimary,
        marginLeft: 16,
    },
    footer: {
        padding: 40,
        alignItems: 'center',
    },
    appVersion: {
        fontSize: 14,
        color: COLORS.textLight,
    },
});

export default ProfileScreen;