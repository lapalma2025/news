// src/screens/profile/RateAppScreen.js - Z połączeniem do bazy danych
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Linking,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../styles/colors';
import { APP_CONFIG } from '../../utils/constants';
import { userService } from '../../services/userService';
import { supabase } from '../../services/supabaseClient';

const RateAppScreen = () => {
    const [selectedRating, setSelectedRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [existingRating, setExistingRating] = useState(null);
    const [appStats, setAppStats] = useState(null);

    useEffect(() => {
        initializeRatingScreen();
    }, []);

    const initializeRatingScreen = async () => {
        try {
            // Pobierz aktualnego użytkownika
            const currentUser = await userService.getCurrentUser();
            setUser(currentUser);

            // Pobierz statystyki aplikacji
            await loadAppStats();

            // Sprawdź czy użytkownik już ocenił aplikację
            if (currentUser?.id) {
                await loadExistingRating(currentUser.id);
            }
        } catch (error) {
            console.error('Error initializing rating screen:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAppStats = async () => {
        try {
            const { data, error } = await supabase.rpc('get_average_rating');

            if (error) {
                console.error('Error loading app stats:', error);
                return;
            }

            if (data && data.length > 0) {
                setAppStats(data[0]);
                console.log('App stats loaded:', data[0]);
            }
        } catch (error) {
            console.error('Error loading app stats:', error);
        }
    };

    const loadExistingRating = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('app_ratings')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (error) {
                console.error('Error loading existing rating:', error);
                return;
            }

            if (data) {
                setExistingRating(data);
                setSelectedRating(data.rating);
                setFeedback(data.feedback || '');
                console.log('Existing rating loaded:', data);
            }
        } catch (error) {
            console.error('Error loading existing rating:', error);
        }
    };

    const handleStarPress = (rating) => {
        setSelectedRating(rating);
    };

    const handleSubmitRating = async () => {
        if (selectedRating === 0) {
            Alert.alert('Ocena wymagana', 'Proszę wybrać ocenę od 1 do 5 gwiazdek');
            return;
        }

        if (!user?.id) {
            Alert.alert('Błąd', 'Nie można zapisać oceny. Spróbuj ponownie.');
            return;
        }

        setIsSubmitting(true);

        try {
            console.log('Submitting rating:', {
                user_id: user.id,
                rating: selectedRating,
                feedback: feedback,
                app_version: APP_CONFIG.VERSION,
                device_platform: Platform.OS
            });

            const { data, error } = await supabase
                .from('app_ratings')
                .upsert({
                    user_id: user.id,
                    rating: selectedRating,
                    feedback: feedback || null,
                    app_version: APP_CONFIG.VERSION,
                    device_platform: Platform.OS
                })
                .select()
                .single();

            if (error) {
                throw error;
            }

            console.log('Rating saved:', data);

            // Odśwież statystyki
            await loadAppStats();

            const isUpdate = existingRating !== null;

            Alert.alert(
                'Dziękujemy!',
                `Twoja ocena (${selectedRating} ${selectedRating === 1 ? 'gwiazdka' : selectedRating < 5 ? 'gwiazdki' : 'gwiazdek'}) została ${isUpdate ? 'zaktualizowana' : 'zapisana'}.\n\n${feedback ? 'Twoja opinia pomoże nam udoskonalić aplikację!' : ''}`,
                [{ text: 'OK' }]
            );

            setExistingRating(data);

        } catch (error) {
            console.error('Error submitting rating:', error);
            Alert.alert(
                'Błąd',
                'Nie udało się wysłać oceny. Sprawdź połączenie internetowe i spróbuj ponownie.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStoreRating = (store) => {
        const storeUrls = {
            ios: 'https://apps.apple.com/app/idXXXXXXXXX', // Zastąp rzeczywistym ID
            android: 'https://play.google.com/store/apps/details?id=com.infoapp' // Zastąp rzeczywistym ID
        };

        const url = storeUrls[store];
        if (url) {
            Linking.openURL(url).catch(() => {
                Alert.alert('Błąd', 'Nie można otworzyć sklepu z aplikacjami');
            });
        }
    };

    const renderStars = () => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <TouchableOpacity
                    key={i}
                    style={styles.starButton}
                    onPress={() => handleStarPress(i)}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name={i <= selectedRating ? 'star' : 'star-outline'}
                        size={40}
                        color={i <= selectedRating ? '#FFD700' : COLORS.lightGray}
                    />
                </TouchableOpacity>
            );
        }
        return stars;
    };

    const getRatingText = () => {
        switch (selectedRating) {
            case 1:
                return 'Bardzo słabo 😞';
            case 2:
                return 'Słabo 😐';
            case 3:
                return 'W porządku 🙂';
            case 4:
                return 'Dobrze 😊';
            case 5:
                return 'Świetnie! 🤩';
            default:
                return 'Wybierz ocenę';
        }
    };

    const renderStatsCard = () => {
        if (!appStats) return null;

        const { average_rating, total_ratings, rating_distribution } = appStats;

        return (
            <View style={styles.statsCard}>
                <Text style={styles.statsTitle}>Oceny użytkowników</Text>
                <View style={styles.statsRow}>
                    <View style={styles.averageRatingContainer}>
                        <Text style={styles.averageRating}>{average_rating}</Text>
                        <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <Ionicons
                                    key={star}
                                    name={star <= Math.round(average_rating) ? 'star' : 'star-outline'}
                                    size={16}
                                    color="#FFD700"
                                />
                            ))}
                        </View>
                        <Text style={styles.totalRatings}>{total_ratings} ocen</Text>
                    </View>
                    <View style={styles.distributionContainer}>
                        {[5, 4, 3, 2, 1].map(rating => {
                            const count = rating_distribution?.[rating] || 0;
                            const percentage = total_ratings > 0 ? (count / total_ratings) * 100 : 0;
                            return (
                                <View key={rating} style={styles.distributionRow}>
                                    <Text style={styles.distributionRating}>{rating}</Text>
                                    <Ionicons name="star" size={12} color="#FFD700" />
                                    <View style={styles.distributionBar}>
                                        <View
                                            style={[
                                                styles.distributionFill,
                                                { width: `${percentage}%` }
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.distributionCount}>{count}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </View>
        );
    };

    const features = [
        {
            icon: 'newspaper',
            title: 'Najnowsze newsy',
            description: 'Aktualne wiadomości ze sprawdzonych źródeł'
        },
        {
            icon: 'people',
            title: 'Komunikaty polityków',
            description: 'Oficjalne wypowiedzi i stanowiska'
        },
        {
            icon: 'heart',
            title: 'Ulubione artykuły',
            description: 'Zapisuj i organizuj interesujące treści'
        },
        {
            icon: 'chatbubbles',
            title: 'Komentarze',
            description: 'Dyskutuj z innymi użytkownikami'
        }
    ];

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Ładowanie...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {/* Header */}
                <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    style={styles.header}
                >
                    <Ionicons name="star" size={48} color="#FFD700" />
                    <Text style={styles.headerTitle}>
                        {existingRating ? 'Aktualizuj ocenę' : 'Oceń InfoApp'}
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        {existingRating
                            ? 'Zmień swoją ocenę aplikacji'
                            : 'Twoja opinia jest dla nas bardzo ważna!'
                        }
                    </Text>
                </LinearGradient>

                {/* Statystyki aplikacji */}
                {renderStatsCard()}

                {/* Existing Rating Info */}
                {existingRating && (
                    <View style={styles.existingRatingCard}>
                        <Ionicons name="information-circle" size={20} color={COLORS.blue} />
                        <Text style={styles.existingRatingText}>
                            Już oceniłeś aplikację na {existingRating.rating} {existingRating.rating === 1 ? 'gwiazdkę' : 'gwiazdki'}.
                            Możesz zaktualizować swoją ocenę.
                        </Text>
                    </View>
                )}

                {/* Rating Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        {existingRating ? 'Zmień swoją ocenę' : 'Jak oceniasz naszą aplikację?'}
                    </Text>
                    <View style={styles.ratingContainer}>
                        <View style={styles.starsContainer}>
                            {renderStars()}
                        </View>
                        <Text style={styles.ratingText}>{getRatingText()}</Text>
                    </View>
                </View>

                {/* Feedback Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Podziel się swoją opinią</Text>
                    <Text style={styles.feedbackLabel}>
                        Co Ci się podoba? Co możemy poprawić?
                    </Text>
                    <TextInput
                        style={styles.feedbackInput}
                        placeholder="Napisz swoją opinię o aplikacji..."
                        value={feedback}
                        onChangeText={setFeedback}
                        multiline
                        numberOfLines={5}
                        textAlignVertical="top"
                        placeholderTextColor={COLORS.gray}
                    />
                </View>

                {/* Submit Button */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            (selectedRating === 0 || isSubmitting) && styles.submitButtonDisabled
                        ]}
                        onPress={handleSubmitRating}
                        disabled={selectedRating === 0 || isSubmitting}
                        activeOpacity={0.8}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color={COLORS.white} />
                        ) : (
                            <Ionicons name="send" size={20} color={COLORS.white} />
                        )}
                        <Text style={styles.submitButtonText}>
                            {isSubmitting
                                ? 'Wysyłanie...'
                                : existingRating
                                    ? 'Aktualizuj ocenę'
                                    : 'Wyślij ocenę'
                            }
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Store Rating */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Oceń w sklepie z aplikacjami</Text>
                    <Text style={styles.storeDescription}>
                        Pomoż innym użytkownikom odkryć InfoApp - zostaw opinię w sklepie!
                    </Text>
                    <View style={styles.storeButtons}>
                        <TouchableOpacity
                            style={styles.storeButton}
                            onPress={() => handleStoreRating('ios')}
                        >
                            <Ionicons name="logo-apple" size={24} color={COLORS.white} />
                            <Text style={styles.storeButtonText}>App Store</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.storeButton, styles.androidButton]}
                            onPress={() => handleStoreRating('android')}
                        >
                            <Ionicons name="logo-google-playstore" size={24} color={COLORS.white} />
                            <Text style={styles.storeButtonText}>Google Play</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Features Reminder */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Co oferuje InfoApp?</Text>
                    <View style={styles.featuresContainer}>
                        {features.map((feature, index) => (
                            <View key={index} style={styles.featureItem}>
                                <View style={styles.featureIcon}>
                                    <Ionicons name={feature.icon} size={24} color={COLORS.primary} />
                                </View>
                                <View style={styles.featureText}>
                                    <Text style={styles.featureTitle}>{feature.title}</Text>
                                    <Text style={styles.featureDescription}>{feature.description}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Dziękujemy za korzystanie z InfoApp! 🙏
                    </Text>
                    <Text style={styles.footerSubtext}>
                        Twoja opinia pomaga nam tworzyć lepszą aplikację dla wszystkich użytkowników.
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: COLORS.gray,
        marginTop: 12,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.white,
        marginTop: 16,
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
    },
    statsCard: {
        backgroundColor: COLORS.white,
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        padding: 16,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.black,
        marginBottom: 12,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    averageRatingContainer: {
        alignItems: 'center',
        marginRight: 20,
    },
    averageRating: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    starsRow: {
        flexDirection: 'row',
        marginVertical: 4,
    },
    totalRatings: {
        fontSize: 12,
        color: COLORS.gray,
    },
    distributionContainer: {
        flex: 1,
    },
    distributionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    distributionRating: {
        fontSize: 12,
        color: COLORS.gray,
        width: 12,
    },
    distributionBar: {
        flex: 1,
        height: 8,
        backgroundColor: COLORS.lightGray,
        borderRadius: 4,
        marginHorizontal: 8,
    },
    distributionFill: {
        height: '100%',
        backgroundColor: '#FFD700',
        borderRadius: 4,
    },
    distributionCount: {
        fontSize: 12,
        color: COLORS.gray,
        width: 20,
        textAlign: 'right',
    },
    existingRatingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.blue + '10',
        padding: 12,
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.blue + '30',
    },
    existingRatingText: {
        flex: 1,
        fontSize: 14,
        color: COLORS.blue,
        marginLeft: 8,
    },
    section: {
        marginHorizontal: 16,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.black,
        marginBottom: 16,
    },
    ratingContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 16,
        gap: 8,
    },
    starButton: {
        padding: 4,
    },
    ratingText: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.primary,
    },
    feedbackLabel: {
        fontSize: 16,
        color: COLORS.gray,
        marginBottom: 12,
    },
    feedbackInput: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: COLORS.black,
        minHeight: 120,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        backgroundColor: COLORS.lightGray,
        shadowOpacity: 0,
        elevation: 0,
    },
    submitButtonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
    },
    storeDescription: {
        fontSize: 16,
        color: COLORS.gray,
        marginBottom: 20,
        textAlign: 'center',
    },
    storeButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    storeButton: {
        flex: 1,
        backgroundColor: '#000000',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    androidButton: {
        backgroundColor: '#01875F',
    },
    storeButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    featuresContainer: {
        gap: 12,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 12,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    featureIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.lightGray,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.black,
        marginBottom: 4,
    },
    featureDescription: {
        fontSize: 14,
        color: COLORS.gray,
        lineHeight: 18,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    footerText: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.primary,
        textAlign: 'center',
        marginBottom: 8,
    },
    footerSubtext: {
        fontSize: 14,
        color: COLORS.gray,
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default RateAppScreen;