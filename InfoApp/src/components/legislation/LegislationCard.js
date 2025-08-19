// src/components/legislation/LegislationCard.js - Karta dokumentu legislacyjnego z głosowaniem
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Animated,
    Linking,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../styles/colors';
import { legislationVotingService } from '../../services/legislationVotingService';

const LegislationCard = ({ print, onPress, onVote }) => {
    const [userVote, setUserVote] = useState(print.userVote || null);
    const [voteAnimation] = useState(new Animated.Value(1));
    const [votingStats, setVotingStats] = useState(print.votingStats || { likes: 0, dislikes: 0, total: 0 });
    const [loading, setLoading] = useState(false);

    // Aktualizuj stan gdy props się zmienią
    useEffect(() => {
        setUserVote(print.userVote || null);
        setVotingStats(print.votingStats || { likes: 0, dislikes: 0, total: 0 });
    }, [print.userVote, print.votingStats]);

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

    const handleVote = async (vote) => {
        // Sprawdź czy użytkownik już głosował tym samym głosem
        if (userVote === vote) {
            Alert.alert(
                'Już głosowałeś',
                'Czy chcesz cofnąć swój głos?',
                [
                    { text: 'Nie', style: 'cancel' },
                    { text: 'Cofnij głos', onPress: () => removeVote() }
                ]
            );
            return;
        }

        setLoading(true);

        // Animacja podczas głosowania
        Animated.sequence([
            Animated.timing(voteAnimation, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(voteAnimation, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        try {
            const response = await legislationVotingService.submitVote(print.number, vote);

            if (response.success) {
                setUserVote(vote);
                setVotingStats(response.data.stats);

                // Powiadom parent component
                if (onVote) {
                    onVote(vote, response.data.stats);
                }

                // Pokaż potwierdzenie
                const message = response.data.action === 'updated'
                    ? 'Twój głos został zaktualizowany!'
                    : 'Dziękujemy za oddanie głosu!';

                Alert.alert('Sukces', message);
            } else {
                Alert.alert('Błąd', response.error);
            }
        } catch (error) {
            console.error('Error voting:', error);
            Alert.alert('Błąd', 'Nie udało się zapisać głosu. Spróbuj ponownie.');
        } finally {
            setLoading(false);
        }
    };

    const removeVote = async () => {
        setLoading(true);

        try {
            const response = await legislationVotingService.removeVote(print.number);

            if (response.success) {
                setUserVote(null);
                setVotingStats(response.data.stats);

                // Powiadom parent component
                if (onVote) {
                    onVote(null, response.data.stats);
                }

                Alert.alert('Sukces', 'Twój głos został cofnięty');
            } else {
                Alert.alert('Błąd', response.error);
            }
        } catch (error) {
            console.error('Error removing vote:', error);
            Alert.alert('Błąd', 'Nie udało się cofnąć głosu.');
        } finally {
            setLoading(false);
        }
    };

    const openSejmPage = async () => {
        try {
            const url = legislationVotingService.generateSejmLink(print.number);
            const supported = await Linking.canOpenURL(url);

            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Błąd', 'Nie można otworzyć strony Sejmu');
            }
        } catch (error) {
            console.error('Error opening Sejm page:', error);
            Alert.alert('Błąd', 'Wystąpił problem podczas otwierania strony');
        }
    };

    const openPDF = async () => {
        try {
            const url = legislationVotingService.generatePdfLink(print.number);
            const supported = await Linking.canOpenURL(url);

            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Błąd', 'Nie można otworzyć dokumentu PDF');
            }
        } catch (error) {
            console.error('Error opening PDF:', error);
            Alert.alert('Błąd', 'Wystąpił problem podczas otwierania dokumentu');
        }
    };

    const handleCardPress = () => {
        Alert.alert(
            print.title,
            `${print.summary || 'Brak opisu'}\n\nData: ${print.formattedDate}\nStatus: ${getStatusLabel(print.status)}\n\nCo chcesz zrobić?`,
            [
                { text: 'Anuluj', style: 'cancel' },
                { text: 'Zobacz na Sejm.gov.pl', onPress: openSejmPage },
                { text: 'Pobierz PDF', onPress: openPDF },
                { text: 'Szczegóły', onPress: () => { if (onPress) onPress(print); } }
            ]
        );
    };

    const priorityIndicator = getPriorityIndicator(print.priority);

    return (
        <Animated.View style={[styles.container, { transform: [{ scale: voteAnimation }] }]}>
            <TouchableOpacity onPress={handleCardPress} activeOpacity={0.7}>
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

                    {/* Numer druku z przyciskiem do Sejmu */}
                    <View style={styles.numberContainer}>
                        <View style={styles.numberSection}>
                            <Text style={styles.numberText}>Druk nr {print.number}</Text>
                            <TouchableOpacity
                                style={styles.sejmButton}
                                onPress={openSejmPage}
                            >
                                <Ionicons name="open-outline" size={14} color={COLORS.primary} />
                                <Text style={styles.sejmButtonText}>Sejm.gov.pl</Text>
                            </TouchableOpacity>
                        </View>
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

                        {/* Przycisk PDF */}
                        <TouchableOpacity
                            style={styles.pdfButton}
                            onPress={openPDF}
                        >
                            <Ionicons name="document-text-outline" size={14} color={COLORS.blue} />
                            <Text style={styles.pdfButtonText}>PDF</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Statystyki głosowania */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statsItem}>
                            <Ionicons name="thumbs-up-outline" size={16} color={COLORS.green} />
                            <Text style={styles.statsText}>{votingStats.likes}</Text>
                        </View>
                        <View style={styles.statsItem}>
                            <Ionicons name="thumbs-down-outline" size={16} color={COLORS.red} />
                            <Text style={styles.statsText}>{votingStats.dislikes}</Text>
                        </View>
                        <View style={styles.statsItem}>
                            <Ionicons name="people-outline" size={16} color={COLORS.gray} />
                            <Text style={styles.statsText}>{votingStats.total} głosów</Text>
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
                                    disabled={loading}
                                >
                                    {loading && userVote === 'like' ? (
                                        <ActivityIndicator size="small" color={COLORS.white} />
                                    ) : (
                                        <Ionicons
                                            name={userVote === 'like' ? 'thumbs-up' : 'thumbs-up-outline'}
                                            size={20}
                                            color={userVote === 'like' ? COLORS.white : COLORS.green}
                                        />
                                    )}
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
                                    disabled={loading}
                                >
                                    {loading && userVote === 'dislike' ? (
                                        <ActivityIndicator size="small" color={COLORS.white} />
                                    ) : (
                                        <Ionicons
                                            name={userVote === 'dislike' ? 'thumbs-down' : 'thumbs-down-outline'}
                                            size={20}
                                            color={userVote === 'dislike' ? COLORS.white : COLORS.red}
                                        />
                                    )}
                                    <Text style={[
                                        styles.voteButtonText,
                                        userVote === 'dislike' && styles.voteButtonTextActive
                                    ]}>
                                        Sprzeciwiam się
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Informacja o cofaniu głosu */}
                            {userVote && (
                                <Text style={styles.voteHint}>
                                    Kliknij ponownie aby cofnąć głos
                                </Text>
                            )}
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
    numberSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    numberText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: 'bold',
        marginRight: 8,
    },
    sejmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: COLORS.primaryLight,
        borderRadius: 4,
    },
    sejmButtonText: {
        fontSize: 10,
        color: COLORS.primary,
        fontWeight: '600',
        marginLeft: 2,
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
    pdfButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: COLORS.infoLight,
        borderRadius: 4,
        marginLeft: 8,
    },
    pdfButtonText: {
        fontSize: 10,
        color: COLORS.blue,
        fontWeight: '600',
        marginLeft: 2,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
        marginBottom: 16,
    },
    statsItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statsText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginLeft: 4,
        fontWeight: '600',
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
    voteHint: {
        fontSize: 11,
        color: COLORS.textLight,
        textAlign: 'center',
        marginTop: 8,
        fontStyle: 'italic',
    },
});

export default LegislationCard;