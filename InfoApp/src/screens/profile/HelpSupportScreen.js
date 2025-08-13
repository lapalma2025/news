import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    TextInput,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../styles/colors';
import { APP_CONFIG } from '../../utils/constants';

const HelpSupportScreen = () => {
    const [expandedFAQ, setExpandedFAQ] = useState(null);
    const [feedbackText, setFeedbackText] = useState('');

    const faqData = [
        {
            id: 1,
            question: "Jak dodać artykuł do ulubionych?",
            answer: "Kliknij ikonę serca przy artykule, aby dodać go do ulubionych. Wszystkie ulubione artykuły znajdziesz w sekcji 'Ulubione artykuły' w swoim profilu."
        },
        {
            id: 2,
            question: "Czy mogę komentować artykuły bez rejestracji?",
            answer: "Tak! Możesz komentować artykuły podając tylko swoje imię lub pseudonim. Nie jest wymagana pełna rejestracja."
        },
        {
            id: 3,
            question: "Jak działa system powiadomień?",
            answer: "Możesz skonfigurować powiadomienia w ustawieniach profilu. Aplikacja może wysyłać powiadomienia o nowych artykułach, komunikatach polityków i odpowiedziach na komentarze."
        },
        {
            id: 4,
            question: "Czy moje dane są bezpieczne?",
            answer: "Tak, Twoje dane są przechowywane lokalnie na urządzeniu. Nie gromadzimy danych osobowych bez Twojej zgody. Więcej informacji znajdziesz w polityce prywatności."
        },
        {
            id: 5,
            question: "Jak zgłosić problem z aplikacją?",
            answer: "Możesz skontaktować się z nami przez formularz poniżej lub wysłać email na adres: " + APP_CONFIG.SUPPORT_EMAIL
        }
    ];

    const contactOptions = [
        {
            icon: "mail",
            title: "Email",
            description: "Wyślij nam wiadomość",
            action: () => Linking.openURL(`mailto:${APP_CONFIG.SUPPORT_EMAIL}`)
        },
        {
            icon: "globe",
            title: "Strona internetowa",
            description: "Odwiedź nasze FAQ online",
            action: () => Linking.openURL(APP_CONFIG.WEBSITE)
        },
        {
            icon: "star",
            title: "Oceń aplikację",
            description: "Zostaw opinię w sklepie",
            action: () => Alert.alert("Oceń aplikację", "Dziękujemy za chęć oceny!")
        }
    ];

    const toggleFAQ = (id) => {
        setExpandedFAQ(expandedFAQ === id ? null : id);
    };

    const sendFeedback = () => {
        if (!feedbackText.trim()) {
            Alert.alert("Błąd", "Proszę wprowadzić treść opinii");
            return;
        }

        const subject = "Opinia o aplikacji InfoApp";
        const body = `Opinia użytkownika:\n\n${feedbackText}\n\n---\nWysłano z aplikacji InfoApp v${APP_CONFIG.VERSION}`;

        Linking.openURL(`mailto:${APP_CONFIG.SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
        setFeedbackText('');
        Alert.alert("Dziękujemy!", "Twoja opinia zostanie przekierowana do programu pocztowego.");
    };

    return (
        <SafeAreaView style={helpStyles.container}>
            <ScrollView style={helpStyles.scrollView}>
                {/* Quick Contact */}
                <View style={helpStyles.section}>
                    <View style={helpStyles.contactGrid}>
                        {contactOptions.map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                style={helpStyles.contactOption}
                                onPress={option.action}
                            >
                                <View style={helpStyles.contactIcon}>
                                    <Ionicons name={option.icon} size={24} color={COLORS.primary} />
                                </View>
                                <Text style={helpStyles.contactTitle}>{option.title}</Text>
                                <Text style={helpStyles.contactDescription}>{option.description}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* FAQ */}
                <View style={helpStyles.section}>
                    <Text style={helpStyles.sectionTitle}>Często zadawane pytania</Text>
                    <View style={helpStyles.faqContainer}>
                        {faqData.map((faq) => (
                            <View key={faq.id} style={helpStyles.faqItem}>
                                <TouchableOpacity
                                    style={helpStyles.faqQuestion}
                                    onPress={() => toggleFAQ(faq.id)}
                                >
                                    <Text style={helpStyles.faqQuestionText}>{faq.question}</Text>
                                    <Ionicons
                                        name={expandedFAQ === faq.id ? "chevron-up" : "chevron-down"}
                                        size={20}
                                        color={COLORS.gray}
                                    />
                                </TouchableOpacity>
                                {expandedFAQ === faq.id && (
                                    <View style={helpStyles.faqAnswer}>
                                        <Text style={helpStyles.faqAnswerText}>{faq.answer}</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Feedback Form */}
                <View style={helpStyles.section}>
                    <Text style={helpStyles.sectionTitle}>Prześlij opinię</Text>
                    <View style={helpStyles.feedbackCard}>
                        <Text style={helpStyles.feedbackLabel}>
                            Masz sugestię lub napotkałeś problem? Napisz do nas!
                        </Text>
                        <TextInput
                            style={helpStyles.feedbackInput}
                            placeholder="Opisz swój problem lub sugestię..."
                            value={feedbackText}
                            onChangeText={setFeedbackText}
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                            placeholderTextColor={COLORS.gray}
                        />
                        <TouchableOpacity
                            style={helpStyles.sendButton}
                            onPress={sendFeedback}
                        >
                            <Ionicons name="send" size={20} color={COLORS.white} />
                            <Text style={helpStyles.sendButtonText}>Wyślij opinię</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* App Info */}
                <View style={helpStyles.infoCard}>
                    <Ionicons name="information-circle" size={24} color={COLORS.blue} />
                    <Text style={helpStyles.infoText}>
                        Odpowiadamy na wszystkie wiadomości w ciągu 24 godzin.
                        Dziękujemy za pomoc w ulepszaniu aplikacji InfoApp!
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// Styles for AboutAppScreen
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollView: {
        flex: 1,
    },
    appHeader: {
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingVertical: 40,
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    appIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    appName: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.black,
        marginBottom: 8,
    },
    appDescription: {
        fontSize: 16,
        color: COLORS.gray,
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 22,
    },
    appVersion: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    section: {
        marginHorizontal: 16,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.black,
        marginBottom: 16,
    },
    infoCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    infoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: COLORS.lightGray,
    },
    infoLabel: {
        fontSize: 16,
        color: COLORS.gray,
        fontWeight: '500',
    },
    infoValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoValue: {
        fontSize: 16,
        color: COLORS.black,
        fontWeight: '500',
    },
    linkText: {
        color: COLORS.primary,
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    featureItem: {
        width: '48%',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        alignItems: 'center',
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
        marginBottom: 12,
    },
    featureTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.black,
        marginBottom: 4,
        textAlign: 'center',
    },
    featureDescription: {
        fontSize: 12,
        color: COLORS.gray,
        textAlign: 'center',
        lineHeight: 16,
    },
    socialGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    socialButton: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        justifyContent: 'center',
    },
    socialText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    legalCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    legalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: COLORS.lightGray,
    },
    lastLegalItem: {
        borderBottomWidth: 0,
    },
    legalText: {
        flex: 1,
        fontSize: 16,
        color: COLORS.black,
        fontWeight: '500',
        marginLeft: 12,
    },
    creditsSection: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
        marginTop: 20,
    },
    creditsText: {
        fontSize: 16,
        color: COLORS.gray,
        textAlign: 'center',
        marginBottom: 8,
        fontWeight: '500',
    },
    creditsSubtext: {
        fontSize: 14,
        color: COLORS.primary,
        textAlign: 'center',
        fontWeight: '600',
    },
});

// Styles for HelpSupportScreen
const helpStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollView: {
        flex: 1,
    },
    section: {
        marginHorizontal: 16,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.black,
        marginBottom: 16,
    },
    contactGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 24,
    },
    contactOption: {
        width: '32%',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    contactIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.lightGray,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    contactTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.black,
        marginBottom: 4,
        textAlign: 'center',
    },
    contactDescription: {
        fontSize: 12,
        color: COLORS.gray,
        textAlign: 'center',
        lineHeight: 16,
    },
    faqContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    faqItem: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: COLORS.lightGray,
    },
    faqQuestion: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    faqQuestionText: {
        flex: 1,
        fontSize: 16,
        color: COLORS.black,
        fontWeight: '500',
        marginRight: 12,
    },
    faqAnswer: {
        paddingHorizontal: 8,
        paddingTop: 8,
        paddingBottom: 8,
        backgroundColor: COLORS.lightGray,
    },
    faqAnswerText: {
        fontSize: 14,
        color: COLORS.gray,
        lineHeight: 20,
    },
    feedbackCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 20,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    feedbackLabel: {
        fontSize: 16,
        color: COLORS.black,
        fontWeight: '500',
        marginBottom: 16,
        lineHeight: 22,
    },
    feedbackInput: {
        borderWidth: 1,
        borderColor: COLORS.lightGray,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: COLORS.black,
        minHeight: 120,
        marginBottom: 16,
        textAlignVertical: 'top',
    },
    sendButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    infoCard: {
        backgroundColor: COLORS.blue + '20',
        borderRadius: 12,
        padding: 20,
        margin: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: COLORS.blue,
        lineHeight: 20,
        marginLeft: 12,
        fontWeight: '500',
    },
});

export default HelpSupportScreen;