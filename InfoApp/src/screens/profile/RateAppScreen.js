// src/screens/profile/RateAppScreen.js
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../styles/colors';
import { APP_CONFIG } from '../../utils/constants';

const RateAppScreen = () => {
    const [selectedRating, setSelectedRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleStarPress = (rating) => {
        setSelectedRating(rating);
    };

    const handleSubmitRating = async () => {
        if (selectedRating === 0) {
            Alert.alert('Ocena wymagana', 'Proszę wybrać ocenę od 1 do 5 gwiazdek');
            return;
        }

        setIsSubmitting(true);

        try {
            // Symulacja wysyłania oceny
            await new Promise(resolve => setTimeout(resolve, 1500));

            Alert.alert(
                'Dziękujemy!',
                `Twoja ocena (${selectedRating} ${selectedRating === 1 ? 'gwiazdka' : selectedRating < 5 ? 'gwiazdki' : 'gwiazdek'}) została zapisana.\n\n${feedback ? 'Twoja opinia pomoże nam udoskonalić aplikację!' : ''}`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setSelectedRating(0);
                            setFeedback('');
                        }
                    }
                ]
            );
        } catch (error) {
            Alert.alert('Błąd', 'Nie udało się wysłać oceny. Spróbuj ponownie.');
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

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {/* Header */}
                <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    style={styles.header}
                >
                    <Ionicons name="star" size={48} color="#FFD700" />
                    <Text style={styles.headerTitle}>Oceń InfoApp</Text>
                    <Text style={styles.headerSubtitle}>
                        Twoja opinia jest dla nas bardzo ważna!
                    </Text>
                </LinearGradient>

                {/* Rating Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Jak oceniasz naszą aplikację?</Text>
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
                        <Ionicons
                            name={isSubmitting ? 'hourglass' : 'send'}
                            size={20}
                            color={COLORS.white}
                        />
                        <Text style={styles.submitButtonText}>
                            {isSubmitting ? 'Wysyłanie...' : 'Wyślij ocenę'}
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