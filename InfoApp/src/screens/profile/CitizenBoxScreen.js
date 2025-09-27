// src/screens/profile/CitizenBoxScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../styles/colors';
import { citizenBoxService } from '../../services/citizenBoxService';
import { userService } from '../../services/userService';

const CitizenBoxScreen = () => {
    console.log('🏛️ CitizenBoxScreen rendered!'); // DODAJ TO

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'infrastruktura',
        location: '',
        email: '',
        allowContact: true
    });
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [reportsHistory, setReportsHistory] = useState([]);

    const categories = citizenBoxService.getReportCategories();

    useEffect(() => {
        initializeScreen();
    }, []);

    const initializeScreen = async () => {
        try {
            // Pobierz dane użytkownika
            const currentUser = await userService.getCurrentUser();
            setUser(currentUser);

            // Ustaw email użytkownika jeśli jest dostępny
            if (currentUser?.email) {
                setFormData(prev => ({ ...prev, email: currentUser.email }));
            }

            // Pobierz historię zgłoszeń
            const history = await citizenBoxService.getCitizenReportsHistory();
            setReportsHistory(history);

        } catch (error) {
            console.error('Error initializing screen:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        console.log('🔥 handleSubmit called!'); // DODAJ TO

        if (!formData.title.trim()) {
            Alert.alert('Błąd', 'Proszę podać tytuł problemu');
            return;
        }
        if (!formData.description.trim()) {
            Alert.alert('Błąd', 'Proszę opisać problem');
            return;
        }
        if (!formData.email.trim()) {
            Alert.alert('Błąd', 'Proszę podać adres email');
            return;
        }

        setSubmitting(true);

        try {
            const result = await citizenBoxService.submitCitizenReport(formData);

            if (result.success) {
                // Reset formularza
                setFormData({
                    title: '',
                    description: '',
                    category: 'infrastruktura',
                    location: '',
                    email: user?.email || '',
                    allowContact: true
                });

                // Odśwież historię
                const updatedHistory = await citizenBoxService.getCitizenReportsHistory();
                setReportsHistory(updatedHistory);

                Alert.alert(
                    'Zgłoszenie wysłane! 🎉',
                    'Dziękujemy za zgłoszenie problemu. Twoja sprawa zostanie sprawdzona przez moderatorów i opublikowana na liście publicznych problemów. Wyślemy Ci informację na email gdy zostanie opublikowana.',
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert('Błąd', result.error);
            }

        } catch (error) {
            console.error('Błąd wysyłania zgłoszenia:', error);
            Alert.alert('Błąd', 'Nie udało się wysłać zgłoszenia. Sprawdź połączenie z internetem i spróbuj ponownie.');
        } finally {
            setSubmitting(false);
        }
    };

    const renderCategorySelector = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kategoria problemu *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {categories.map((category) => (
                    <TouchableOpacity
                        key={category.value}
                        style={[
                            styles.categoryChip,
                            { borderColor: category.color },
                            formData.category === category.value && {
                                backgroundColor: category.color,
                                borderWidth: 2
                            }
                        ]}
                        onPress={() => setFormData(prev => ({ ...prev, category: category.value }))}
                        disabled={submitting}
                    >
                        <Text style={[
                            styles.categoryText,
                            formData.category === category.value && {
                                color: COLORS.white,
                                fontWeight: 'bold'
                            }
                        ]}>
                            {category.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderReportsHistory = () => {
        if (reportsHistory.length === 0) return null;

        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Twoje ostatnie zgłoszenia</Text>
                <View style={styles.historyContainer}>
                    {reportsHistory.slice(0, 3).map((report, index) => (
                        <View key={report.id} style={styles.historyItem}>
                            <View style={styles.historyHeader}>
                                <Text style={styles.historyTitle} numberOfLines={1}>
                                    {report.title}
                                </Text>
                                <Text style={styles.historyDate}>
                                    {new Date(report.timestamp).toLocaleDateString('pl-PL')}
                                </Text>
                            </View>
                            <Text style={styles.historyCategory}>
                                {categories.find(c => c.value === report.category)?.label || report.category}
                            </Text>
                            <View style={[styles.statusBadge, getStatusStyle(report.status)]}>
                                <Text style={styles.statusText}>
                                    {getStatusText(report.status)}
                                </Text>
                            </View>
                        </View>
                    ))}
                    {reportsHistory.length > 3 && (
                        <Text style={styles.moreReports}>
                            i {reportsHistory.length - 3} więcej...
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'pending_moderation':
                return { backgroundColor: COLORS.warning + '20', borderColor: COLORS.warning };
            case 'published':
                return { backgroundColor: COLORS.success + '20', borderColor: COLORS.success };
            case 'rejected':
                return { backgroundColor: COLORS.error + '20', borderColor: COLORS.error };
            default:
                return { backgroundColor: COLORS.gray + '20', borderColor: COLORS.gray };
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending_moderation':
                return 'Oczekuje na moderację';
            case 'published':
                return 'Opublikowane';
            case 'rejected':
                return 'Odrzucone';
            default:
                return 'Nieznany status';
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Ładowanie...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
            <KeyboardAvoidingView
                style={styles.keyboardContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <LinearGradient
                        colors={[COLORS.primary, COLORS.secondary]}
                        style={styles.header}
                    >
                        <Ionicons name="megaphone" size={48} color={COLORS.white} />
                        <Text style={styles.headerTitle}>🏛️ Skrzynka obywatela</Text>
                        <Text style={styles.headerSubtitle}>
                            Zgłoś problem. Twój głos ma znaczenie!
                        </Text>
                    </LinearGradient>

                    {/* Info Card */}
                    <View style={styles.infoCard}>
                        <Ionicons name="information-circle" size={24} color={COLORS.primary} />
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoText}>
                                Opisz problem. Po moderacji zostanie opublikowany na liście publicznych problemów, gdzie inni obywatele mogą zobaczyć i pomóc.
                            </Text>
                        </View>
                    </View>

                    {/* Historia zgłoszeń */}
                    {renderReportsHistory()}

                    {/* Formularz */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Tytuł problemu *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Np. Nielegalny przetarg w urzędzie miasta"
                            value={formData.title}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                            maxLength={100}
                            editable={!submitting}
                        />
                        <Text style={styles.counter}>{formData.title.length}/100</Text>
                    </View>

                    {renderCategorySelector()}

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Lokalizacja (opcjonalnie)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Np. ul. Kwiatowa 15, Wrocław"
                            value={formData.location}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                            maxLength={100}
                            editable={!submitting}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Opis problemu *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Opisz szczegółowo problem. Dlaczego to przeszkadza? Jak można to rozwiązać?"
                            value={formData.description}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                            multiline
                            numberOfLines={6}
                            maxLength={500}
                            textAlignVertical="top"
                            editable={!submitting}
                        />
                        <Text style={styles.counter}>{formData.description.length}/500</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Twój email *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="twoj@email.pl"
                            value={formData.email}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, email: text.toLowerCase() }))}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={!submitting}
                        />
                        <Text style={styles.helperText}>
                            Nie będzie publiczny. Używamy go tylko do powiadomień o statusie zgłoszenia.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <TouchableOpacity
                            style={styles.checkboxContainer}
                            onPress={() => setFormData(prev => ({ ...prev, allowContact: !prev.allowContact }))}
                            disabled={submitting}
                        >
                            <Ionicons
                                name={formData.allowContact ? "checkbox" : "checkbox-outline"}
                                size={24}
                                color={formData.allowContact ? COLORS.primary : COLORS.gray}
                            />
                            <Text style={styles.checkboxText}>
                                Wyrażam zgodę na kontakt w sprawie tego zgłoszenia
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Submit Button */}
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                (!formData.title.trim() || !formData.description.trim() || !formData.email.trim() || submitting) && styles.submitButtonDisabled
                            ]}
                            onPress={() => {
                                console.log('🔘 Submit button pressed!'); // DODAJ TO
                                handleSubmit();
                            }} disabled={!formData.title.trim() || !formData.description.trim() || !formData.email.trim() || submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color={COLORS.white} />
                            ) : (
                                <Ionicons name="send" size={20} color={COLORS.white} />
                            )}
                            <Text style={styles.submitButtonText}>
                                {submitting ? 'Wysyłanie...' : 'Wyślij zgłoszenie'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            Dziękujemy za aktywność obywatelską! 🏛️
                        </Text>
                        <Text style={styles.footerSubtext}>
                            Twoje zgłoszenia pomagają budować lepsze miasto dla wszystkich mieszkańców.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    keyboardContainer: {
        flex: 1,
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
    infoCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 24,
        borderRadius: 12,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    infoTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    infoText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    section: {
        marginHorizontal: 16,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 12,
    },
    input: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    counter: {
        textAlign: 'right',
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 4,
    },
    helperText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    categoryScroll: {
        marginTop: 8,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 12,
        backgroundColor: COLORS.white,
    },
    categoryText: {
        fontSize: 14,
        color: COLORS.textPrimary,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkboxText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        backgroundColor: COLORS.gray,
        shadowOpacity: 0,
        elevation: 0,
    },
    submitButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    historyContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    historyItem: {
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: COLORS.border,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    historyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        flex: 1,
    },
    historyDate: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    historyCategory: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    moreReports: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 8,
        fontStyle: 'italic',
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
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default CitizenBoxScreen;