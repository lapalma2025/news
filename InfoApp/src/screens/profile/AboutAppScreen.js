import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../styles/colors';
import { APP_CONFIG, SOCIAL_LINKS } from '../../utils/constants';

const Logo = require('../../../assets/logo-app.png');

const AboutAppScreen = () => {
    const openURL = async (url) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            }
        } catch (error) {
            console.error('Error opening URL:', error);
        }
    };

    const InfoItem = ({ label, value, onPress }) => (
        <TouchableOpacity
            style={styles.infoItem}
            onPress={onPress}
            disabled={!onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            <Text style={styles.infoLabel}>{label}</Text>
            <View style={styles.infoValueContainer}>
                <Text style={[styles.infoValue, onPress && styles.linkText]}>{value}</Text>
                {onPress && <Ionicons name="open-outline" size={16} color={COLORS.primary} />}
            </View>
        </TouchableOpacity>
    );

    const SocialButton = ({ icon, name, url, color }) => (
        <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: color + '20' }]}
            onPress={() => openURL(url)}
        >
            <Ionicons name={icon} size={24} color={color} />
            <Text style={[styles.socialText, { color }]}>{name}</Text>
        </TouchableOpacity>
    );

    return (
        <>
            <ScrollView style={styles.scrollView}>
                {/* App Logo & Info */}
                <View style={styles.appHeader}>
                    <Image source={Logo} style={styles.appLogo} resizeMode="contain" />
                    <Text style={styles.appDescription}>{APP_CONFIG.DESCRIPTION}</Text>
                    <Text style={styles.appVersion}>Wersja {APP_CONFIG.VERSION}</Text>
                </View>

                {/* App Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informacje o aplikacji</Text>
                    <View style={styles.infoCard}>
                        <InfoItem
                            label="Nazwa aplikacji"
                            value={APP_CONFIG.NAME}
                        />
                        <InfoItem
                            label="Wersja"
                            value={APP_CONFIG.VERSION}
                        />
                        <InfoItem
                            label="Strona internetowa"
                            value={APP_CONFIG.WEBSITE}
                            onPress={() => openURL(APP_CONFIG.WEBSITE)}
                        />
                        <InfoItem
                            label="Pomoc techniczna"
                            value={APP_CONFIG.SUPPORT_EMAIL}
                            onPress={() => openURL(`mailto:${APP_CONFIG.SUPPORT_EMAIL}`)}
                        />
                    </View>
                </View>

                {/* Features */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Funkcje aplikacji</Text>
                    <View style={styles.featuresGrid}>
                        <View style={styles.featureItem}>
                            <View style={styles.featureIcon}>
                                <Ionicons name="newspaper" size={24} color={COLORS.blue} />
                            </View>
                            <Text style={styles.featureTitle}>Najnowsze newsy</Text>
                            <Text style={styles.featureDescription}>
                                Aktualne wiadomości z różnych kategorii
                            </Text>
                        </View>

                        <View style={styles.featureItem}>
                            <View style={styles.featureIcon}>
                                <Ionicons name="people" size={24} color={COLORS.green} />
                            </View>
                            <Text style={styles.featureTitle}>Komunikaty polityków</Text>
                            <Text style={styles.featureDescription}>
                                Oficjalne wypowiedzi i stanowiska
                            </Text>
                        </View>

                        <View style={styles.featureItem}>
                            <View style={styles.featureIcon}>
                                <Ionicons name="chatbubbles" size={24} color={COLORS.purple} />
                            </View>
                            <Text style={styles.featureTitle}>Komentarze</Text>
                            <Text style={styles.featureDescription}>
                                Dyskusje i wymiana opinii
                            </Text>
                        </View>

                        <View style={styles.featureItem}>
                            <View style={styles.featureIcon}>
                                <Ionicons name="heart" size={24} color={COLORS.red} />
                            </View>
                            <Text style={styles.featureTitle}>Ulubione</Text>
                            <Text style={styles.featureDescription}>
                                Zapisuj interesujące artykuły
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Social Media */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Śledź nas</Text>
                    <View style={styles.socialGrid}>
                        <SocialButton
                            icon="logo-facebook"
                            name="Facebook"
                            url={SOCIAL_LINKS.FACEBOOK}
                            color="#1877F2"
                        />
                        <SocialButton
                            icon="logo-twitter"
                            name="Twitter"
                            url={SOCIAL_LINKS.TWITTER}
                            color="#1DA1F2"
                        />
                        <SocialButton
                            icon="logo-instagram"
                            name="Instagram"
                            url={SOCIAL_LINKS.INSTAGRAM}
                            color="#E4405F"
                        />
                        <SocialButton
                            icon="logo-linkedin"
                            name="LinkedIn"
                            url={SOCIAL_LINKS.LINKEDIN}
                            color="#0A66C2"
                        />
                    </View>
                </View>

                {/* Legal */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Dokumenty prawne</Text>
                    <View style={styles.legalCard}>
                        <TouchableOpacity
                            style={styles.legalItem}
                            onPress={() => openURL(APP_CONFIG.PRIVACY_URL)}
                        >
                            <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
                            <Text style={styles.legalText}>Polityka prywatności</Text>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.legalItem, styles.lastLegalItem]}
                            onPress={() => openURL(APP_CONFIG.TERMS_URL)}
                        >
                            <Ionicons name="document-text" size={20} color={COLORS.primary} />
                            <Text style={styles.legalText}>Regulamin</Text>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Credits */}
                <View style={styles.creditsSection}>
                    <Text style={styles.creditsText}>
                        © 2025 Wiem. Wszystkie prawa zastrzeżone.
                    </Text>
                    <Text style={styles.creditsSubtext}>
                        Stworzone dla polskich obywateli
                    </Text>
                </View>
            </ScrollView>
        </>
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
    appHeader: {
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingVertical: 40,
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    appLogo: {
        width: 96,
        height: 96,
        alignSelf: 'center',
        marginBottom: 16,
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
        paddingHorizontal: 16,
        paddingBottom: 16,
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

export default AboutAppScreen;