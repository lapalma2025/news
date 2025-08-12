// src/components/politician/PoliticianDetail.js - Szczegóły polityka
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../styles/colors';
import { formatSmartDate } from '../../utils/dateUtils';

const PoliticianDetail = ({ post }) => {
    if (!post) return null;

    return (
        <ScrollView style={styles.container}>
            <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                style={styles.header}
            >
                <Text style={styles.politicianName}>
                    {post.politician_name || 'Nieznany polityk'}
                </Text>
                <Text style={styles.party}>
                    {post.politician_party || 'Niezależny'}
                </Text>
            </LinearGradient>

            <View style={styles.content}>
                <Text style={styles.title}>{post.title}</Text>
                <Text style={styles.meta}>
                    {formatSmartDate(post.created_at)}
                </Text>
                <Text style={styles.postContent}>{post.content}</Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        padding: 30,
        alignItems: 'center',
    },
    politicianName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 8,
    },
    party: {
        fontSize: 16,
        color: COLORS.white,
        opacity: 0.9,
    },
    content: {
        padding: 20,
        backgroundColor: COLORS.white,
        margin: 20,
        borderRadius: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 12,
    },
    meta: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 16,
    },
    postContent: {
        fontSize: 16,
        lineHeight: 24,
        color: COLORS.textPrimary,
    },
});

export default PoliticianDetail;