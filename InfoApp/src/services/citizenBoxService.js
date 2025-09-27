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
            const emailResult = await this.sendEmailViaEmailJS(submissionData);
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