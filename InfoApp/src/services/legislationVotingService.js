// src/services/legislationVotingService.js - Serwis do obsługi głosowania na ustawy
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, handleSupabaseError, handleSupabaseSuccess } from './supabaseClient';
import { handleApiError } from './apiHelpers';

class LegislationVotingService {
    constructor() {
        this.CURRENT_TERM = 10;
        this.TABLE_NAME = 'infoapp_legislation_votes';
    }

    /**
     * Generuje unikalny ID użytkownika dla anonimowych głosów
     * W prawdziwej aplikacji to będzie prawdziwy user ID
     */
    async generateUserId() {
        try {
            // Sprawdź czy już mamy zapisany ID w AsyncStorage
            let userId = await AsyncStorage.getItem('anonymous_user_id');

            if (!userId) {
                // Generuj unikalny ID na podstawie timestampu i random
                userId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                await AsyncStorage.setItem('anonymous_user_id', userId);
            }

            return userId;
        } catch (error) {
            console.error('Error generating user ID:', error);
            // Fallback do tymczasowego ID
            return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
    }

    /**
     * Oddaj głos na dokument legislacyjny
     * @param {string} printNumber - Numer druku
     * @param {string} voteType - 'like' lub 'dislike'
     * @returns {Object} Wynik operacji
     */
    async submitVote(printNumber, voteType) {
        try {
            const userId = await this.generateUserId();

            // Sprawdź czy użytkownik już głosował
            const existingVoteResponse = await this.getUserVote(printNumber, userId);

            if (existingVoteResponse.success && existingVoteResponse.data) {
                // Użytkownik już głosował - aktualizuj głos
                const { error } = await supabase
                    .from(this.TABLE_NAME)
                    .update({
                        vote_type: voteType,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', userId)
                    .eq('print_number', printNumber)
                    .eq('print_term', this.CURRENT_TERM);

                if (error) throw error;

                // Pobierz zaktualizowane statystyki
                const stats = await this.getVotingStats(printNumber);

                return {
                    success: true,
                    data: {
                        action: 'updated',
                        userVote: voteType,
                        stats: stats.data || { likes: 0, dislikes: 0, total: 0 }
                    }
                };
            } else {
                // Nowy głos
                const { error } = await supabase
                    .from(this.TABLE_NAME)
                    .insert({
                        user_id: userId,
                        print_number: printNumber,
                        print_term: this.CURRENT_TERM,
                        vote_type: voteType
                    });

                if (error) throw error;

                // Pobierz zaktualizowane statystyki
                const stats = await this.getVotingStats(printNumber);

                return {
                    success: true,
                    data: {
                        action: 'created',
                        userVote: voteType,
                        stats: stats.data || { likes: 0, dislikes: 0, total: 0 }
                    }
                };
            }
        } catch (error) {
            console.error('Error submitting vote:', error);
            return handleApiError(error, 'Nie udało się zapisać głosu');
        }
    }

    /**
     * Pobierz głos konkretnego użytkownika dla dokumentu
     * @param {string} printNumber - Numer druku
     * @param {string} userId - ID użytkownika (opcjonalne)
     * @returns {Object} Głos użytkownika
     */
    async getUserVote(printNumber, userId = null) {
        try {
            const currentUserId = userId || await this.generateUserId();

            const { data, error } = await supabase
                .from(this.TABLE_NAME)
                .select('vote_type, created_at, updated_at')
                .eq('user_id', currentUserId)
                .eq('print_number', printNumber)
                .eq('print_term', this.CURRENT_TERM);
            // ❌ USUNIĘTE: .single() - bo może nie być rekordów

            if (error) {
                throw error;
            }

            // Jeśli są dane, weź pierwszy rekord, jeśli nie - zwróć null
            const userVote = data && data.length > 0 ? data[0] : null;

            return {
                success: true,
                data: userVote
            };
        } catch (error) {
            console.error('Error getting user vote:', error);
            return handleApiError(error, 'Nie udało się pobrać głosu użytkownika');
        }
    }

    /**
     * Pobierz statystyki głosowania dla dokumentu
     * @param {string} printNumber - Numer druku
     * @returns {Object} Statystyki głosowania
     */
    async getVotingStats(printNumber) {
        try {
            const { data, error } = await supabase
                .from(this.TABLE_NAME)
                .select('vote_type')
                .eq('print_number', printNumber)
                .eq('print_term', this.CURRENT_TERM);

            if (error) throw error;

            const stats = {
                likes: data.filter(vote => vote.vote_type === 'like').length,
                dislikes: data.filter(vote => vote.vote_type === 'dislike').length,
                total: data.length
            };

            return {
                success: true,
                data: stats
            };
        } catch (error) {
            console.error('Error getting voting stats:', error);
            return handleApiError(error, 'Nie udało się pobrać statystyk głosowania');
        }
    }

    /**
     * Pobierz statystyki dla wielu dokumentów naraz
     * @param {Array} printNumbers - Lista numerów druków
     * @returns {Object} Mapa statystyk
     */
    async getMultipleVotingStats(printNumbers) {
        try {
            if (!printNumbers || printNumbers.length === 0) {
                return { success: true, data: {} };
            }

            const { data, error } = await supabase
                .from(this.TABLE_NAME)
                .select('print_number, vote_type')
                .in('print_number', printNumbers)
                .eq('print_term', this.CURRENT_TERM);

            if (error) throw error;

            // Grupuj statystyki według numeru druku
            const statsMap = {};

            printNumbers.forEach(printNumber => {
                const votes = data.filter(vote => vote.print_number === printNumber);
                statsMap[printNumber] = {
                    likes: votes.filter(vote => vote.vote_type === 'like').length,
                    dislikes: votes.filter(vote => vote.vote_type === 'dislike').length,
                    total: votes.length
                };
            });

            return {
                success: true,
                data: statsMap
            };
        } catch (error) {
            console.error('Error getting multiple voting stats:', error);
            return handleApiError(error, 'Nie udało się pobrać statystyk głosowania');
        }
    }

    /**
     * Pobierz głosy użytkownika dla wielu dokumentów
     * @param {Array} printNumbers - Lista numerów druków
     * @param {string} userId - ID użytkownika (opcjonalne)
     * @returns {Object} Mapa głosów użytkownika
     */
    async getMultipleUserVotes(printNumbers, userId = null) {
        try {
            if (!printNumbers || printNumbers.length === 0) {
                return { success: true, data: {} };
            }

            const currentUserId = userId || await this.generateUserId();

            const { data, error } = await supabase
                .from(this.TABLE_NAME)
                .select('print_number, vote_type')
                .eq('user_id', currentUserId)
                .in('print_number', printNumbers)
                .eq('print_term', this.CURRENT_TERM);

            if (error) throw error;

            // Stwórz mapę głosów użytkownika
            const votesMap = {};
            data.forEach(vote => {
                votesMap[vote.print_number] = vote.vote_type;
            });

            return {
                success: true,
                data: votesMap
            };
        } catch (error) {
            console.error('Error getting multiple user votes:', error);
            return handleApiError(error, 'Nie udało się pobrać głosów użytkownika');
        }
    }

    /**
     * Usuń głos użytkownika (jeśli chce cofnąć głos)
     * @param {string} printNumber - Numer druku
     * @param {string} userId - ID użytkownika (opcjonalne)
     * @returns {Object} Wynik operacji
     */
    async removeVote(printNumber, userId = null) {
        try {
            const currentUserId = userId || await this.generateUserId();

            const { error } = await supabase
                .from(this.TABLE_NAME)
                .delete()
                .eq('user_id', currentUserId)
                .eq('print_number', printNumber)
                .eq('print_term', this.CURRENT_TERM);

            if (error) throw error;

            // Pobierz zaktualizowane statystyki
            const stats = await this.getVotingStats(printNumber);

            return {
                success: true,
                data: {
                    action: 'removed',
                    userVote: null,
                    stats: stats.data || { likes: 0, dislikes: 0, total: 0 }
                }
            };
        } catch (error) {
            console.error('Error removing vote:', error);
            return handleApiError(error, 'Nie udało się usunąć głosu');
        }
    }

    /**
     * Pobierz najpopularniejsze dokumenty (według liczby głosów)
     * @param {number} limit - Limit wyników
     * @returns {Object} Lista popularnych dokumentów
     */
    async getPopularDocuments(limit = 10) {
        try {
            const { data, error } = await supabase
                .from(this.TABLE_NAME)
                .select('print_number, vote_type')
                .eq('print_term', this.CURRENT_TERM);

            if (error) throw error;

            // Grupuj i posortuj według liczby głosów
            const popularity = {};
            data.forEach(vote => {
                if (!popularity[vote.print_number]) {
                    popularity[vote.print_number] = { likes: 0, dislikes: 0, total: 0 };
                }
                if (vote.vote_type === 'like') {
                    popularity[vote.print_number].likes++;
                } else {
                    popularity[vote.print_number].dislikes++;
                }
                popularity[vote.print_number].total++;
            });

            // Sortuj według całkowitej liczby głosów
            const sorted = Object.entries(popularity)
                .sort(([, a], [, b]) => b.total - a.total)
                .slice(0, limit)
                .map(([printNumber, stats]) => ({
                    printNumber,
                    ...stats
                }));

            return {
                success: true,
                data: sorted
            };
        } catch (error) {
            console.error('Error getting popular documents:', error);
            return handleApiError(error, 'Nie udało się pobrać popularnych dokumentów');
        }
    }

    /**
     * Generuj link do dokumentu na stronie Sejmu
     * @param {string} printNumber - Numer druku
     * @param {number} term - Kadencja (opcjonalne)
     * @returns {string} URL do dokumentu
     */
    generateSejmLink(printNumber, term = this.CURRENT_TERM) {
        return `https://www.sejm.gov.pl/sejm${term}.nsf/PrzebiegProc.xsp?nr=${printNumber}`;
    }

    /**
     * Generuj link do PDF dokumentu
     * @param {string} printNumber - Numer druku
     * @param {number} term - Kadencja (opcjonalne)
     * @returns {string} URL do PDF
     */
    generatePdfLink(printNumber, term = this.CURRENT_TERM) {
        return `https://api.sejm.gov.pl/sejm/term${term}/prints/${printNumber}/${printNumber}.pdf`;
    }
}

export const legislationVotingService = new LegislationVotingService();