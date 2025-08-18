// src/components/legislation/LegislationCard.js - Karta dokumentu legislacyjnego
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS } from '../../styles/colors';

const LegislationCard = ({ print, onPress, onVote }) => {
    const [userVote, setUserVote] = useState(null); // 'like', 'dislike', lub null
    const [voteAnimation] = useState(new Animated.Value(1));

    const getTypeIcon = (type) => {
        switch (type) {
            case 'rządowy_projekt_ustawy':
                return 'business-outline';
            case 'poselski_projekt_ustawy':
                return 'people-outline';
            case 'obywatelski_projekt_ustawy':
                return 'heart-outline';
            case 'projekt_uchwały':
                return 'document-outline';
            case 'sprawozdanie':
                return 'stats-chart-outline';
            case 'kandydat':
                return 'person-outline';
            case 'informacja':
                return 'information-circle-outline';
            case 'wniosek':
                return 'mail-outline';
            default:
                return 'document-text-outline';
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'rządowy_projekt_ustawy':
                return 'Rządowy projekt';
            case 'poselski_projekt_ustawy':
                return 'Poselski projekt';
            case 'obywatelski_projekt_ustawy':
                return 'Obywatelski projekt';
            case 'projekt_uchwały':
                return 'Projekt uchwały';
            case 'sprawozdanie':
                return 'Sprawozdanie';
            case 'kandydat':
                return 'Kandydat';
            case 'informacja':
                return 'Informacja';
            case 'wniosek':
                return 'Wniosek';
            default:
                return 'Dokument';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'nowe':
                return COLORS.green;
            case 'aktywne':
                return COLORS.primary;
            case 'w_trakcie':
                return COLORS.yellow;
            case 'stare':
                return COLORS.orange;
            case 'archiwalne':
                return COLORS.gray;
            default:
                return COLORS.gray;
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'nowe':
                return 'NOWE';
            case 'aktywne':
                return 'AKTYWNE';
            case 'w_trakcie':
                return 'W TRAKCIE';
            case 'stare':
                return 'DŁUGOTRWAŁE';
            case 'archiwalne':
                return 'ARCHIWALNE';
            default:
                return 'NIEZNANY';
        }
    };

    const getPriorityIndicator = (priority) => {
        switch (priority) {
            case 'wysoki':
                return { color: COLORS.red, label: 'WAŻNE' };
            case 'średni':
                return { color: COLORS.yellow, label: 'ŚREDNI' };
            default:
                return null;
        }
    };

    const handleVote = (vote) => {
        // Animacja podczas głosowania
        Animated.sequence([
            Animated.timing(voteAnimation, {
                toValue: 0.8,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(voteAnimation, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        // Sprawdź czy użytkownik już głosował
        if (userVote === vote) {
            Alert.alert('Już głosowałeś', 'Twój głos został już zapisany dla tego dokumentu.');
            return;
        }

        setUserVote(vote);
        onVote(vote);
    };

    const priorityIndicator = getPriorityIndicator(print.priority);

    return (
        <Animated.View style={[styles.container, { transform: [{ scale: voteAnimation }] }]}>
            <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                <View style={styles.card}>
                    {/* Header z typem i statusem */}
                    <View style={styles.header}>
                        <View style={styles.typeContainer}>
                            <Ionicons
                                name={getTypeIcon(print.type)}
                                size={16}
                                color={COLORS.primary}
                            />
                            <Text style={styles.typeText}>
                                {getTypeLabel(print.type)}
                            </Text>
                        </View>

                        <View style={styles.statusContainer}>
                            {priorityIndicator && (
                                <View style={[styles.priorityBadge, { backgroundColor: priorityIndicator.color }]}>
                                    <Text style={styles.priorityText}>
                                        {priorityIndicator.label}
                                    </Text>
                                </View>
                            )}
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(print.status) }]}>
                                <Text style={styles.statusText}>
                                    {getStatusLabel(print.status)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Numer druku */}
                    <View style={styles.numberContainer}>
                        <Text style={styles.numberText}>Druk nr {print.number}</Text>
                        <Text style={styles.dateText}>{print.formattedDate}</Text>
                    </View>

                    {/* Tytuł i podsumowanie */}
                    <Text style={styles.title} numberOfLines={3}>
                        {print.title}
                    </Text>

                    {print.summary && (
                        <Text style={styles.summary} numberOfLines={2}>
                            {print.summary}
                        </Text>
                    )}

                    {/* Informacje dodatkowe */}
                    <View style={styles.additionalInfo}>
                        {print.hasAttachments && (
                            <View style={styles.infoItem}>
                                <Ionicons name="attach-outline" size={14} color={COLORS.textSecondary} />
                                <Text style={styles.infoText}>
                                    {print.attachmentCount} załącznik{print.attachmentCount > 1 ? 'i' : ''}
                                </Text>
                            </View>
                        )}

                        {print.hasAdditionalPrints && (
                            <View style={styles.infoItem}>
                                <Ionicons name="documents-outline" size={14} color={COLORS.textSecondary} />
                                <Text style={styles.infoText}>Druki dodatkowe</Text>
                            </View>
                        )}

                        <View style={styles.infoItem}>
                            <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                            <Text style={styles.infoText}>
                                {print.daysAge} dni temu
                            </Text>
                        </View>
                    </View>

                    {/* Przyciski głosowania */}
                    <View style={styles.votingContainer}>
                        <View style={styles.votingSection}>
                            <Text style={styles.votingLabel}>Czy popierasz ten projekt?</Text>
                            <View style={styles.votingButtons}>
                                <TouchableOpacity
                                    style={[
                                        styles.voteButton,
                                        styles.likeButton,
                                        userVote === 'like' && styles.voteButtonActive
                                    ]}
                                    onPress={() => handleVote('like')}
                                >
                                    <Ionicons
                                        name={userVote === 'like' ? 'thumbs-up' : 'thumbs-up-outline'}
                                        size={20}
                                        color={userVote === 'like' ? COLORS.white : COLORS.green}
                                    />
                                    <Text style={[
                                        styles.voteButtonText,
                                        userVote === 'like' && styles.voteButtonTextActive
                                    ]}>
                                        Popieram
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.voteButton,
                                        styles.dislikeButton,
                                        userVote === 'dislike' && styles.voteButtonActive
                                    ]}
                                    onPress={() => handleVote('dislike')}
                                >
                                    <Ionicons
                                        name={userVote === 'dislike' ? 'thumbs-down' : 'thumbs-down-outline'}
                                        size={20}
                                        color={userVote === 'dislike' ? COLORS.white : COLORS.red}
                                    />
                                    <Text style={[
                                        styles.voteButtonText,
                                        userVote === 'dislike' && styles.voteButtonTextActive
                                    ]}>
                                        Sprzeciwiam się
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    typeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    typeText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '600',
        marginLeft: 4,
        textTransform: 'uppercase',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    priorityBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 6,
    },
    priorityText: {
        fontSize: 10,
        color: COLORS.white,
        fontWeight: 'bold',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        color: COLORS.white,
        fontWeight: 'bold',
    },
    numberContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    numberText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    dateText: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        lineHeight: 22,
        marginBottom: 8,
    },
    summary: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
        marginBottom: 12,
    },
    additionalInfo: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
        marginBottom: 4,
    },
    infoText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginLeft: 4,
    },
    votingContainer: {
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: 16,
    },
    votingSection: {
        alignItems: 'center',
    },
    votingLabel: {
        fontSize: 14,
        color: COLORS.textPrimary,
        fontWeight: '600',
        marginBottom: 12,
    },
    votingButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    voteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1.5,
        minWidth: 120,
        justifyContent: 'center',
    },
    likeButton: {
        borderColor: COLORS.green,
        backgroundColor: 'transparent',
    },
    dislikeButton: {
        borderColor: COLORS.red,
        backgroundColor: 'transparent',
    },
    voteButtonActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    voteButtonText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
        color: COLORS.textPrimary,
    },
    voteButtonTextActive: {
        color: COLORS.white,
    },
});

export default LegislationCard;