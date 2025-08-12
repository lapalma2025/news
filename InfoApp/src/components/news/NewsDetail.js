// src/components/news/NewsDetail.js - Szczegóły newsa
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../../styles/colors';
import { formatSmartDate } from '../../utils/dateUtils';

const NewsDetail = ({ news }) => {
    if (!news) return null;

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.category}>{news.category}</Text>
            <Text style={styles.title}>{news.title}</Text>
            <Text style={styles.meta}>
                {news.author} • {formatSmartDate(news.created_at)}
            </Text>
            <Text style={styles.content}>{news.content}</Text>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        padding: 20,
    },
    category: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 12,
    },
    meta: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 20,
    },
    content: {
        fontSize: 16,
        lineHeight: 24,
        color: COLORS.textPrimary,
    },
});

export default NewsDetail;