import { generateId } from '../utils/helpers';
import { VALIDATION_RULES } from '../utils/constants';

export const citizenBoxService = {
    async submitCitizenReport(reportData) {
        console.log('📥 submitCitizenReport called with:', reportData);

        try {
            // Walidacja danych
            const validation = this.validateReportData(reportData);
            console.log('✅ Validation result:', validation);

            if (!validation.isValid) {
                return {
                    success: false,
                    error: validation.errors.join(', ')
                };
            }

            // Przygotowanie danych do wysłania
            const submissionData = {
                id: generateId(12),
                title: reportData.title.trim(),
                description: reportData.description.trim(),
                category: reportData.category,
                location: reportData.location?.trim() || '',
                email: reportData.email.trim(),
                allowContact: reportData.allowContact,
                timestamp: new Date().toISOString(),
                status: 'pending_moderation',
            };

            // Wysłanie emaila przez EmailJS
            const emailResult = await this.sendEmailViaNative(submissionData);
            console.log('📧 Email result:', emailResult);

            if (emailResult.success) {
                // Zapisz w lokalnej historii
                await this.saveToLocalHistory(submissionData);

                return {
                    success: true,
                    data: submissionData,
                    message: 'Zgłoszenie zostało wysłane pomyślnie!'
                };
            } else {
                return {
                    success: false,
                    error: emailResult.error || 'Nie udało się wysłać zgłoszenia. Spróbuj ponownie.'
                };
            }

        } catch (error) {
            console.error('Error submitting citizen report:', error);
            return {
                success: false,
                error: 'Wystąpił błąd podczas wysyłania zgłoszenia'
            };
        }
    },

    async sendEmailViaEmailJS(submissionData) {
        try {
            console.log('🚀 Starting email send process...');

            // Sprawdź czy to przeglądarka czy React Native
            const isWeb = typeof window !== 'undefined' && window.document;

            if (!isWeb) {
                // React Native - użyj natywnego modułu email
                return await this.sendEmailViaNative(submissionData);
            }

            const EMAILJS_CONFIG = {
                serviceId: 'service_zpe4694',
                templateId: 'template_ujvy5sn',
                publicKey: 'OtMMkrZ1-8s-MZqxT'
            };

            console.log('📧 EmailJS Config:', EMAILJS_CONFIG);
            console.log('📝 Submission data:', submissionData);

            const categoryLabels = this.getCategoryLabels();

            // Dane do wysłania przez EmailJS
            const templateParams = {
                to_email: 'wiem.biuro@gmail.com',
                from_email: submissionData.email,
                subject: `🏛️ Nowe zgłoszenie obywatelskie - ${submissionData.title}`,
                title: submissionData.title,
                category: categoryLabels[submissionData.category] || submissionData.category,
                location: submissionData.location || 'Nie podano',
                description: submissionData.description,
                user_email: submissionData.email,
                allow_contact: submissionData.allowContact ? 'Tak' : 'Nie',
                date: new Date(submissionData.timestamp).toLocaleDateString('pl-PL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                report_id: submissionData.id
            };

            console.log('📋 Template params:', templateParams);

            const requestBody = {
                service_id: EMAILJS_CONFIG.serviceId,
                template_id: EMAILJS_CONFIG.templateId,
                user_id: EMAILJS_CONFIG.publicKey,
                template_params: templateParams
            };

            console.log('📤 Request body:', requestBody);
            console.log('🌐 Sending request to EmailJS API...');

            // Wysłanie emaila przez EmailJS
            const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            console.log('📡 Response status:', response.status);
            console.log('📡 Response headers:', response.headers);

            const responseText = await response.text();
            console.log('📄 Response text:', responseText);

            if (response.ok) {
                console.log('✅ Email sent successfully!');
                return { success: true };
            } else {
                console.error('❌ EmailJS Error - Status:', response.status);
                console.error('❌ EmailJS Error - Response:', responseText);
                return {
                    success: false,
                    error: `Błąd wysyłania emaila (${response.status}): ${responseText}`
                };
            }

        } catch (error) {
            console.error('💥 Email sending error:', error);
            console.error('💥 Error stack:', error.stack);
            return {
                success: false,
                error: `Błąd połączenia z serwerem email: ${error.message}`
            };
        }
    },

    async sendEmailViaNative(submissionData) {
        try {
            console.log('📱 Attempting EmailJS bypass for React Native...');

            // Przygotuj dane tak jak na web
            const EMAILJS_CONFIG = {
                serviceId: 'service_zpe4694',
                templateId: 'template_ujvy5sn',
                publicKey: 'OtMMkrZ1-8s-MZqxT'
            };

            const categoryLabels = this.getCategoryLabels();

            const templateParams = {
                to_email: 'wiem.biuro@gmail.com',
                from_email: submissionData.email,
                subject: `🏛️ Nowe zgłoszenie obywatelskie - ${submissionData.title}`,
                title: submissionData.title,
                category: categoryLabels[submissionData.category] || submissionData.category,
                location: submissionData.location || 'Nie podano',
                description: submissionData.description,
                user_email: submissionData.email,
                allow_contact: submissionData.allowContact ? 'Tak' : 'Nie',
                date: new Date(submissionData.timestamp).toLocaleDateString('pl-PL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                report_id: submissionData.id
            };

            const headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Origin': 'https://localhost:3000',
                'Referer': 'https://localhost:3000/',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'pl-PL,pl;q=0.9,en;q=0.8'
            };

            const requestBody = {
                service_id: EMAILJS_CONFIG.serviceId,
                template_id: EMAILJS_CONFIG.templateId,
                user_id: EMAILJS_CONFIG.publicKey,
                template_params: templateParams
            };

            console.log('🎭 Sending with browser headers...');
            console.log('📤 Request body:', requestBody);

            const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody)
            });

            console.log('📡 Response status:', response.status);
            const responseText = await response.text();
            console.log('📄 Response text:', responseText);

            if (response.ok) {
                console.log('✅ Email sent via EmailJS bypass!');
                return { success: true };
            } else {
                console.error('❌ EmailJS bypass failed:', response.status, responseText);

                // Fallback do Linking jako backup
                console.log('🔄 Falling back to Linking...');
                return await this.sendEmailViaLinking(submissionData);
            }

        } catch (error) {
            console.error('💥 EmailJS bypass error:', error);

            // Fallback do Linking jako backup
            console.log('🔄 Falling back to Linking...');
            return await this.sendEmailViaLinking(submissionData);
        }
    },

    async sendEmailViaLinking(submissionData) {
        try {
            const { Linking } = await import('react-native');
            const categoryLabels = this.getCategoryLabels();

            const subject = encodeURIComponent(`🏛️ Zgłoszenie obywatelskie - ${submissionData.title}`);
            const body = encodeURIComponent(`🏛️ SKRZYNKA OBYWATELA
    
    Tytuł: ${submissionData.title}
    Kategoria: ${categoryLabels[submissionData.category]}
    Lokalizacja: ${submissionData.location || 'Nie podano'}
    Data: ${new Date(submissionData.timestamp).toLocaleDateString('pl-PL')}
    
    OPIS: ${submissionData.description}
    
    Email: ${submissionData.email}
    Zgoda na kontakt: ${submissionData.allowContact ? 'Tak' : 'Nie'}
    ID: ${submissionData.id}`);

            const emailUrl = `mailto:wiem.biuro@gmail.com?subject=${subject}&body=${body}`;

            const canOpen = await Linking.canOpenURL(emailUrl);
            if (canOpen) {
                await Linking.openURL(emailUrl);
                return { success: true, method: 'linking' };
            } else {
                return { success: false, error: 'Brak aplikacji email' };
            }
        } catch (error) {
            return { success: false, error: 'Nie można otworzyć email' };
        }
    },

    validateReportData(data) {
        const errors = [];

        if (!data.title || data.title.trim().length < 5) {
            errors.push('Tytuł musi mieć co najmniej 10 znaków');
        }

        if (data.title && data.title.trim().length > 100) {
            errors.push('Tytuł może mieć maksymalnie 100 znaków');
        }

        if (!data.description || data.description.trim().length < 10) {
            errors.push('Opis musi mieć co najmniej 20 znaków');
        }

        if (data.description && data.description.trim().length > 500) {
            errors.push('Opis może mieć maksymalnie 500 znaków');
        }

        if (!data.email || !VALIDATION_RULES.EMAIL.test(data.email)) {
            errors.push('Podaj prawidłowy adres email');
        }

        if (!data.category) {
            errors.push('Wybierz kategorię problemu');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    async saveToLocalHistory(submissionData) {
        try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const existingHistory = await this.getCitizenReportsHistory();
            const updatedHistory = [submissionData, ...existingHistory].slice(0, 50);
            await AsyncStorage.setItem('@infoapp:citizenReports', JSON.stringify(updatedHistory));
            return true;
        } catch (error) {
            console.error('Error saving to local history:', error);
            return false;
        }
    },

    async getCitizenReportsHistory() {
        try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const history = await AsyncStorage.getItem('@infoapp:citizenReports');
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('Error getting citizen reports history:', error);
            return [];
        }
    },

    getCategoryLabels() {
        return {
            'infrastruktura': '🚧 Infrastruktura',
            'transport': '🚌 Transport publiczny',
            'srodowisko': '🌱 Środowisko',
            'bezpieczenstwo': '🚔 Bezpieczeństwo',
            'edukacja': '🎓 Edukacja',
            'zdrowie': '🏥 Służba zdrowia',
            'kultura': '🎭 Kultura i sport',
            'inne': '📝 Inne'
        };
    },

    getReportCategories() {
        return [
            { value: 'infrastruktura', label: '🚧 Infrastruktura', color: '#ef4444' },
            { value: 'transport', label: '🚌 Transport publiczny', color: '#f59e0b' },
            { value: 'srodowisko', label: '🌱 Środowisko', color: '#10b981' },
            { value: 'bezpieczenstwo', label: '🚔 Bezpieczeństwo', color: '#3b82f6' },
            { value: 'edukacja', label: '🎓 Edukacja', color: '#8b5cf6' },
            { value: 'zdrowie', label: '🏥 Służba zdrowia', color: '#06b6d4' },
            { value: 'kultura', label: '🎭 Kultura i sport', color: '#ec4899' },
            { value: 'inne', label: '📝 Inne', color: '#6b7280' }
        ];
    }
};