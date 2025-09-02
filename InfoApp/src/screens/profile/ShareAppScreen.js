// src/screens/profile/ShareAppScreen.js
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Share,
    Alert,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../styles/colors';
import { APP_CONFIG } from '../../utils/constants';

const ShareAppScreen = () => {
    const [sharing, setSharing] = useState(false);

    const shareMessage = `📱 Sprawdź Wiem! 

Najlepsza aplikacja z najnowszymi wiadomościami i komunikatami polityków w Polsce! 

✨ Funkcje:
• Najnowsze newsy ze sprawdzonych źródeł
• Komunikaty polityków w jednym miejscu
• Komentarze i dyskusje
• Zapisywanie ulubionych artykułów

#Wiem #News #Polityka #Polska`;

    const handleNativeShare = async () => {
        try {
            setSharing(true);
            const result = await Share.share({
                message: shareMessage,
                url: APP_CONFIG.WEBSITE, // Link do strony aplikacji
                title: 'InfoApp - Najlepsze newsy z Polski'
            });

            if (result.action === Share.sharedAction) {
                Alert.alert('Dziękujemy!', 'Dzięki za polecenie naszej aplikacji! 🙏');
            }
        } catch (error) {
            Alert.alert('Błąd', 'Nie udało się udostępnić aplikacji');
        } finally {
            setSharing(false);
        }
    };

    const handleSocialShare = (platform) => {
        const encodedMessage = encodeURIComponent(shareMessage);
        let url = '';

        switch (platform) {
            case 'facebook':
                url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(APP_CONFIG.WEBSITE)}`;
                break;
            case 'twitter':
                url = `https://twitter.com/intent/tweet?text=${encodedMessage}`;
                break;
            case 'whatsapp':
                url = `https://wa.me/?text=${encodedMessage}`;
                break;
            case 'telegram':
                url = `https://t.me/share/url?url=${encodeURIComponent(APP_CONFIG.WEBSITE)}&text=${encodedMessage}`;
                break;
            case 'email':
                url = `mailto:?subject=${encodeURIComponent('Sprawdź InfoApp!')}&body=${encodedMessage}`;
                break;
            case 'sms':
                url = `sms:?body=${encodedMessage}`;
                break;
        }

        if (url) {
            Linking.openURL(url).catch(() => {
                Alert.alert('Błąd', 'Nie można otworzyć tej aplikacji');
            });
        }
    };

    const copyToClipboard = async () => {
        try {
            // W prawdziwej aplikacji użyj @react-native-clipboard/clipboard
            Alert.alert(
                'Skopiowano!',
                'Tekst został skopiowany do schowka.\n\nW prawdziwej aplikacji użyj biblioteki clipboard.',
                [{ text: 'OK' }]
            );
        } catch (error) {
            Alert.alert('Błąd', 'Nie udało się skopiować tekstu');
        }
    };

    const socialPlatforms = [
        {
            id: 'facebook',
            name: 'Facebook',
            icon: 'logo-facebook',
            color: '#1877F2',
            description: 'Udostępnij na Facebooku'
        },
        {
            id: 'twitter',
            name: 'Twitter',
            icon: 'logo-twitter',
            color: '#1DA1F2',
            description: 'Tweetnij o aplikacji'
        },
        {
            id: 'whatsapp',
            name: 'WhatsApp',
            icon: 'logo-whatsapp',
            color: '#25D366',
            description: 'Wyślij przez WhatsApp'
        },
        {
            id: 'telegram',
            name: 'Telegram',
            icon: 'paper-plane',
            color: '#0088CC',
            description: 'Udostępnij w Telegramie'
        },
        {
            id: 'email',
            name: 'Email',
            icon: 'mail',
            color: '#EA4335',
            description: 'Wyślij emailem'
        },
        {
            id: 'sms',
            name: 'SMS',
            icon: 'chatbubbles',
            color: '#34C759',
            description: 'Wyślij SMS-em'
        }
    ];

    const SocialButton = ({ platform }) => (
        <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: platform.color + '15' }]}
            onPress={() => handleSocialShare(platform.id)}
            activeOpacity={0.7}
        >
            <View style={[styles.socialIcon, { backgroundColor: platform.color }]}>
                <Ionicons name={platform.icon} size={24} color={COLORS.white} />
            </View>
            <View style={styles.socialText}>
                <Text style={styles.socialName}>{platform.name}</Text>
                <Text style={styles.socialDescription}>{platform.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
        </TouchableOpacity>
    );

    return (
        <>
            <ScrollView style={styles.scrollView}>
                {/* Header */}
                <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    style={styles.header}
                >
                    <Ionicons name="share" size={48} color={COLORS.white} />
                    <Text style={styles.headerTitle}>Podziel się aplikacją</Text>
                    <Text style={styles.headerSubtitle}>
                        Poleć aplikcję znajomym i rodzinie!
                    </Text>
                </LinearGradient>

                {/* Quick Share */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Szybkie udostępnianie</Text>
                    <TouchableOpacity
                        style={styles.quickShareButton}
                        onPress={handleNativeShare}
                        disabled={sharing}
                    >
                        <Ionicons name="share-outline" size={24} color={COLORS.white} />
                        <Text style={styles.quickShareText}>
                            {sharing ? 'Udostępnianie...' : 'Udostępnij aplikację'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Social Platforms */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Wybierz platformę</Text>
                    <View style={styles.socialGrid}>
                        {socialPlatforms.map((platform) => (
                            <SocialButton key={platform.id} platform={platform} />
                        ))}
                    </View>
                </View>

                {/* Message Preview */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Podgląd wiadomości</Text>
                    <View style={styles.messageCard}>
                        <Text style={styles.messageText}>{shareMessage}</Text>
                        <TouchableOpacity
                            style={styles.copyButton}
                            onPress={copyToClipboard}
                        >
                            <Ionicons name="copy-outline" size={18} color={COLORS.primary} />
                            <Text style={styles.copyButtonText}>Skopiuj tekst</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Benefits */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Dlaczego warto polecić aplikację?</Text>
                    <View style={styles.benefitsContainer}>
                        <View style={styles.benefitItem}>
                            <Ionicons name="newspaper" size={24} color={COLORS.blue} />
                            <Text style={styles.benefitText}>
                                Najnowsze wiadomości ze sprawdzonych źródeł
                            </Text>
                        </View>
                        <View style={styles.benefitItem}>
                            <Ionicons name="people" size={24} color={COLORS.green} />
                            <Text style={styles.benefitText}>
                                Komunikaty polityków w jednym miejscu
                            </Text>
                        </View>
                        <View style={styles.benefitItem}>
                            <Ionicons name="heart" size={24} color={COLORS.red} />
                            <Text style={styles.benefitText}>
                                Możliwość zapisywania ulubionych artykułów
                            </Text>
                        </View>
                        <View style={styles.benefitItem}>
                            <Ionicons name="chatbubbles" size={24} color={COLORS.purple} />
                            <Text style={styles.benefitText}>
                                Komentarze i dyskusje z innymi użytkownikami
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Dziękujemy za pomoc w rozpowszechnianiu aplikacji Wiem! 🙏
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
    quickShareButton: {
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
    quickShareText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 12,
    },
    socialGrid: {
        gap: 12,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    socialIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    socialText: {
        flex: 1,
    },
    socialName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.black,
        marginBottom: 2,
    },
    socialDescription: {
        fontSize: 14,
        color: COLORS.gray,
    },
    messageCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    messageText: {
        fontSize: 14,
        color: COLORS.gray,
        lineHeight: 20,
        marginBottom: 16,
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: COLORS.lightGray,
        borderRadius: 8,
    },
    copyButtonText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    benefitsContainer: {
        gap: 16,
    },
    benefitItem: {
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
    benefitText: {
        flex: 1,
        fontSize: 16,
        color: COLORS.black,
        marginLeft: 16,
        lineHeight: 22,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    footerText: {
        fontSize: 16,
        color: COLORS.gray,
        textAlign: 'center',
        fontWeight: '500',
    },
});

export default ShareAppScreen;