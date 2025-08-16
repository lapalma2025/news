// src/screens/PoliticiansScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, RefreshControl, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import PoliticianList from '../components/politician/PoliticianList';
import CommentModal from '../components/modals/CommentModal';
import { COLORS } from '../styles/colors';

import { politicianService } from '../services/politicianService';
import { userService } from '../services/userService';
import { supabase } from '../services/supabaseClient';

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
            const resp = await politicianService.fetchPoliticianPosts();
            if (!resp.success) throw new Error('fetchPoliticianPosts failed');

            // dociągamy świeże liczniki + status lajka usera
            const user = await userService.getCurrentUser();
            const withCounts = await Promise.all(
                (resp.data ?? []).map(async (post) => {
                    try {
                        // świeże likes/comments
                        const { data: counts, error: countsErr } = await supabase
                            .from('infoapp_politician_posts')
                            .select('likes_count, comments_count')
                            .eq('id', post.id)
                            .single();
                        if (countsErr) {
                            return {
                                ...post,
                                likes_count: post.likes_count || 0,
                                comments_count: post.comments_count || 0,
                                isLikedByUser: false,
                            };
                        }

                        // czy user polubił
                        let isLikedByUser = false;
                        if (user?.id) {
                            const likedResp = await politicianService.checkIfLiked(post.id, user.id);
                            isLikedByUser = likedResp.success ? likedResp.data : false;
                        }

                        return {
                            ...post,
                            likes_count: counts?.likes_count ?? 0,
                            comments_count: counts?.comments_count ?? 0,
                            isLikedByUser,
                        };
                    } catch {
                        return {
                            ...post,
                            likes_count: post.likes_count || 0,
                            comments_count: post.comments_count || 0,
                            isLikedByUser: false,
                        };
                    }
                })
            );

            setPosts(withCounts);
        } catch (e) {
            console.error('loadPosts error:', e);
            Alert.alert('Błąd', 'Nie udało się załadować wpisów polityków');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadPosts();
        setRefreshing(false);
    };

    const openComments = async (item) => {
        if (!item) return;
        try {
            // dociągnij najnowsze liczniki przed otwarciem modala
            const { data: fresh, error } = await supabase
                .from('infoapp_politician_posts')
                .select('likes_count, comments_count')
                .eq('id', item.id)
                .single();

            const merged = error
                ? item
                : {
                    ...item,
                    likes_count: fresh?.likes_count ?? item.likes_count ?? 0,
                    comments_count: fresh?.comments_count ?? item.comments_count ?? 0,
                };

            setSelectedItem(merged);
            setModalVisible(true);
        } catch (e) {
            console.warn('openComments counts fetch warn:', e);
            setSelectedItem(item);
            setModalVisible(true);
        }
    };

    // lajki z karty (optymistycznie UI, potem DB + świeży licznik)
    const handleLikeFromCard = async (postId, shouldLike) => {
        try {
            const user = await userService.getCurrentUser();
            if (!user?.id) {
                Alert.alert('Info', 'Musisz być zalogowany');
                return;
            }

            const current = posts.find((p) => p.id === postId);
            if (!current) return;

            const isCurrentlyLiked = !!current.isLikedByUser;

            // optymistyczna aktualizacja
            setPosts((prev) =>
                prev.map((p) =>
                    p.id === postId
                        ? {
                            ...p,
                            isLikedByUser: shouldLike,
                            likes_count: shouldLike ? (p.likes_count || 0) + 1 : Math.max((p.likes_count || 0) - 1, 0),
                        }
                        : p
                )
            );

            // DB
            const resp = await politicianService.toggleLike(postId, user.id, isCurrentlyLiked);

            // pobierz świeży licznik (gdyby optymistyczna się rozjechała)
            const { data: fresh, error } = await supabase
                .from('infoapp_politician_posts')
                .select('likes_count')
                .eq('id', postId)
                .single();

            const freshCount =
                !error && typeof fresh?.likes_count === 'number'
                    ? fresh.likes_count
                    : shouldLike
                        ? (current.likes_count || 0) + 1
                        : Math.max((current.likes_count || 0) - 1, 0);

            // finalny write-back
            setPosts((prev) =>
                prev.map((p) =>
                    p.id === postId ? { ...p, likes_count: freshCount, isLikedByUser: shouldLike } : p
                )
            );

            // jeśli otwarty modal dotyczy tego posta — też uaktualnij
            if (selectedItem?.id === postId) {
                setSelectedItem((prev) => (prev ? { ...prev, likes_count: freshCount } : prev));
            }
        } catch (e) {
            console.error('handleLikeFromCard error:', e);
            Alert.alert('Błąd', 'Wystąpił problem z polubieniem wpisu');
            // rollback minimalny – przeładuj
            loadPosts();
        }
    };

    // update z CommentModal — LIKE
    const handleLikeUpdateFromModal = (postId, newLikesCount, isLiked) => {
        setPosts((prev) =>
            prev.map((p) =>
                p.id === postId ? { ...p, likes_count: newLikesCount, isLikedByUser: isLiked } : p
            )
        );
        if (selectedItem?.id === postId) {
            setSelectedItem((prev) => (prev ? { ...prev, likes_count: newLikesCount } : prev));
        }
    };

    // update z CommentModal — COMMENTS
    const handleCommentUpdateFromModal = (postId, newCommentsCount) => {
        setPosts((prev) =>
            prev.map((p) => (p.id === postId ? { ...p, comments_count: newCommentsCount } : p))
        );
        if (selectedItem?.id === postId) {
            setSelectedItem((prev) => (prev ? { ...prev, comments_count: newCommentsCount } : prev));
        }
    };

    const renderEmpty = () => (
        <View style={styles.emptyState}>
            <Ionicons name="megaphone-outline" size={56} color={COLORS.textSecondary} />
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
            {/* Używamy gotowej listy — przekaż koniecznie onLike */}
            <PoliticianList
                posts={posts}
                onRefresh={onRefresh}
                refreshing={refreshing}
                onItemPress={openComments}
                onLike={handleLikeFromCard}
                ListEmptyComponent={renderEmpty}
            />

            <CommentModal
                key={selectedItem?.id}
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                item={selectedItem}
                onLikeUpdate={handleLikeUpdateFromModal}
                onCommentAdded={handleCommentUpdateFromModal}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        paddingHorizontal: 24,
    },
});

export default PoliticiansScreen;
