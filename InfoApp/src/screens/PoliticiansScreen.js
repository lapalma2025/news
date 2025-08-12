// src/screens/PoliticiansScreen.js - Ekran polityków
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PoliticianList from '../components/politician/PoliticianList';
import CommentModal from '../components/modals/CommentModal';
import { COLORS } from '../styles/colors';
import { politicianService } from '../services/politicianService';

const PoliticiansScreen = () => {
    const [posts, setPosts] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        setLoading(true);
        try {
            const response = await politicianService.fetchPoliticianPosts();
            if (response.success) {
                setPosts(response.data);
            } else {
                Alert.alert('Błąd', 'Nie udało się załadować wpisów');
            }
        } catch (error) {
            Alert.alert('Błąd', 'Wystąpił problem z połączeniem');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadPosts();
        setRefreshing(false);
    };

    const openComments = (item) => {
        setSelectedItem(item);
        setModalVisible(true);
    };

    const renderEmpty = () => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Brak wpisów polityków</Text>
            <Text style={styles.emptyText}>
                Aktualnie nie ma opublikowanych komunikatów od polityków
            </Text>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text>Ładowanie wpisów polityków...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <PoliticianList
                posts={posts}
                onRefresh={onRefresh}
                refreshing={refreshing}
                onItemPress={openComments}
                ListEmptyComponent={renderEmpty}
            />

            <CommentModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                item={selectedItem}
            />
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
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
});

export default PoliticiansScreen;