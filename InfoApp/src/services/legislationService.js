// src/services/legislationService.js - Serwis do obsługi API Sejmu
import { handleApiError } from './apiHelpers';

const SEJM_API_BASE = 'https://api.sejm.gov.pl/sejm';
const CURRENT_TERM = 10; // Aktualna kadencja Sejmu

// Cache dla poprawy wydajności
const cache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minut

class LegislationService {
    async fetchPrints(options = {}) {
        try {
            const {
                limit = 50,
                offset = 0,
                type = 'all', // 'all', 'projekt_ustawy', 'rządowy', 'poselski', 'obywatelski'
                status = 'all' // 'all', 'nowe', 'aktywne', 'w_trakcie', 'stare'
            } = options;

            const cacheKey = `prints_${limit}_${offset}_${type}_${status}`;
            const cached = this.getCachedData(cacheKey);
            if (cached) return cached;

            const url = `${SEJM_API_BASE}/term${CURRENT_TERM}/prints`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            let data = await response.json();

            // Debug: loguj początkową liczbę dokumentów
            console.log(`Pobrano ${data.length} dokumentów z API`);

            // Wzbogacenie danych o dodatkowe informacje PRZED filtrowaniem
            data = data.map(print => this.enrichPrintData(print));

            // Debug: sprawdź rozkład statusów po wzbogaceniu
            const statusDistribution = data.reduce((acc, print) => {
                acc[print.status] = (acc[print.status] || 0) + 1;
                return acc;
            }, {});
            console.log('Rozkład statusów po wzbogaceniu:', statusDistribution);

            // Filtrowanie według typu
            if (type !== 'all') {
                data = this.filterPrintsByType(data, type);
            }

            // Filtrowanie według statusu
            if (status !== 'all') {
                data = this.filterPrintsByStatus(data, status);
            }

            console.log(`Po filtrowaniu (typ: ${type}, status: ${status}): ${data.length} dokumentów`);

            // Sortowanie według daty (najnowsze pierwsze)
            data.sort((a, b) => new Date(b.deliveryDate) - new Date(a.deliveryDate));

            // Paginacja
            const paginatedData = data.slice(offset, offset + limit);

            const result = {
                success: true,
                data: paginatedData,
                pagination: {
                    total: data.length,
                    limit,
                    offset,
                    hasMore: offset + limit < data.length
                }
            };

            this.setCachedData(cacheKey, result);
            return result;

        } catch (error) {
            console.error('Error fetching prints:', error);
            return handleApiError(error, 'Nie udało się pobrać druków sejmowych');
        }
    }

    async fetchPrintDetails(printNumber) {
        try {
            const cacheKey = `print_details_${printNumber}`;
            const cached = this.getCachedData(cacheKey);
            if (cached) return cached;

            const url = `${SEJM_API_BASE}/term${CURRENT_TERM}/prints/${printNumber}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const enrichedData = {
                ...data,
                ...this.enrichPrintData(data),
                // Dodatkowe szczegóły
                fullPdfUrl: `${SEJM_API_BASE}/term${CURRENT_TERM}/prints/${printNumber}/${printNumber}.pdf`,
                processUrl: data.processPrint?.[0] ?
                    `https://www.sejm.gov.pl/sejm${CURRENT_TERM}.nsf/PrzebiegProc.xsp?nr=${data.processPrint[0]}`
                    : null,
            };

            const result = {
                success: true,
                data: enrichedData
            };

            this.setCachedData(cacheKey, result);
            return result;

        } catch (error) {
            console.error('Error fetching print details:', error);
            return handleApiError(error, 'Nie udało się pobrać szczegółów druku');
        }
    }

    async fetchProcessDetails(processNumber) {
        try {
            // Pobranie szczegółów procesu legislacyjnego (jeśli dostępne w API)
            // Na razie przekierowanie do strony Sejmu
            return {
                success: true,
                data: {
                    processNumber,
                    url: `https://www.sejm.gov.pl/sejm${CURRENT_TERM}.nsf/PrzebiegProc.xsp?nr=${processNumber}`
                }
            };
        } catch (error) {
            console.error('Error fetching process details:', error);
            return handleApiError(error, 'Nie udało się pobrać szczegółów procesu');
        }
    }

    // Nowa metoda do filtrowania według statusu
    filterPrintsByStatus(prints, status) {
        const filtered = prints.filter(print => {
            // Używamy już wzbogaconych danych z określonym statusem
            return print.status === status;
        });

        // Debug logging
        console.log(`Filtrowanie według statusu "${status}":`, {
            przed: prints.length,
            po: filtered.length,
            statusy: prints.reduce((acc, p) => {
                acc[p.status] = (acc[p.status] || 0) + 1;
                return acc;
            }, {})
        });

        return filtered;
    }

    filterPrintsByType(prints, type) {
        let filtered;
        switch (type) {
            case 'projekt_ustawy':
                filtered = prints.filter(print =>
                    print.title.toLowerCase().includes('projekt ustawy')
                );
                break;
            case 'rządowy':
                filtered = prints.filter(print =>
                    print.title.toLowerCase().includes('rządowy projekt')
                );
                break;
            case 'poselski':
                filtered = prints.filter(print =>
                    print.title.toLowerCase().includes('poselski projekt')
                );
                break;
            case 'obywatelski':
                filtered = prints.filter(print =>
                    print.title.toLowerCase().includes('obywatelski projekt')
                );
                break;
            default:
                filtered = prints;
        }

        // Debug logging
        console.log(`Filtrowanie według typu "${type}":`, {
            przed: prints.length,
            po: filtered.length,
            przykłady: filtered.slice(0, 3).map(p => ({
                nr: p.number,
                typ: p.type,
                tytuł: p.title.substring(0, 50) + '...'
            }))
        });

        return filtered;
    }

    enrichPrintData(print) {
        const type = this.determinePrintType(print.title);
        const status = this.determinePrintStatus(print);
        const priority = this.determinePrintPriority(print);
        const summary = this.generatePrintSummary(print);

        return {
            ...print,
            type,
            status,
            priority,
            summary,
            formattedDate: this.formatDate(print.deliveryDate),
            daysAge: this.calculateDaysAge(print.deliveryDate),
            hasAttachments: print.attachments && print.attachments.length > 0,
            attachmentCount: print.attachments ? print.attachments.length : 0,
            hasAdditionalPrints: print.additionalPrints && print.additionalPrints.length > 0,
        };
    }

    determinePrintType(title) {
        const titleLower = title.toLowerCase();

        if (titleLower.includes('rządowy projekt ustawy')) return 'rządowy_projekt_ustawy';
        if (titleLower.includes('poselski projekt ustawy')) return 'poselski_projekt_ustawy';
        if (titleLower.includes('obywatelski projekt ustawy')) return 'obywatelski_projekt_ustawy';
        if (titleLower.includes('projekt uchwały')) return 'projekt_uchwały';
        if (titleLower.includes('sprawozdanie')) return 'sprawozdanie';
        if (titleLower.includes('kandydat')) return 'kandydat';
        if (titleLower.includes('informacja')) return 'informacja';
        if (titleLower.includes('wniosek')) return 'wniosek';

        return 'inne';
    }

    determinePrintStatus(print) {
        // Bardziej precyzyjna logika określania statusu
        const ageInDays = this.calculateDaysAge(print.deliveryDate);
        const titleLower = print.title.toLowerCase();

        // Sprawdź czy ma dodatkowe druki (oznacza aktywny proces)
        if (print.additionalPrints && print.additionalPrints.length > 0) {
            // Sprawdź daty dodatkowych druków
            const latestAdditionalDate = Math.max(
                ...print.additionalPrints.map(ap => new Date(ap.deliveryDate).getTime())
            );
            const daysSinceLatestUpdate = Math.ceil((Date.now() - latestAdditionalDate) / (1000 * 60 * 60 * 24));

            if (daysSinceLatestUpdate <= 30) {
                return 'w_trakcie'; // Ostatnia aktualizacja w ciągu miesiąca
            }
        }

        // Statusy na podstawie wieku dokumentu
        if (ageInDays <= 7) {
            return 'nowe'; // Nowe - do 7 dni
        } else if (ageInDays <= 30) {
            return 'aktywne'; // Aktywne - do miesiąca
        } else if (ageInDays <= 180) {
            // Sprawdź czy to może być długotrwały proces
            if (titleLower.includes('budżet') ||
                titleLower.includes('ustawa o zmianie') ||
                titleLower.includes('komisja śledcza')) {
                return 'w_trakcie'; // Procesy, które naturalnie trwają dłużej
            }
            return 'aktywne'; // Nadal aktywne do 6 miesięcy
        } else if (ageInDays <= 365) {
            return 'stare'; // Długotrwałe - 6 miesięcy do roku
        } else {
            return 'archiwalne'; // Starsze niż rok
        }
    }

    determinePrintPriority(print) {
        const titleLower = print.title.toLowerCase();

        // Wysokie pierwszeństwo
        if (titleLower.includes('budżet') ||
            titleLower.includes('podatek') ||
            titleLower.includes('kryzys') ||
            titleLower.includes('bezpieczeństwo')) {
            return 'wysoki';
        }

        // Średni priorytet
        if (titleLower.includes('zdrowie') ||
            titleLower.includes('edukacja') ||
            titleLower.includes('emerytura')) {
            return 'średni';
        }

        return 'normalny';
    }

    generatePrintSummary(print) {
        const title = print.title;

        // Wyciąganie kluczowych informacji z tytułu
        if (title.includes('projekt ustawy o zmianie ustawy')) {
            return 'Nowelizacja istniejącej ustawy';
        }

        if (title.includes('projekt ustawy o')) {
            const match = title.match(/projekt ustawy o ([^.]+)/i);
            return match ? `Nowa ustawa dotycząca: ${match[1]}` : 'Nowa ustawa';
        }

        if (title.includes('sprawozdanie')) {
            return 'Sprawozdanie z działalności';
        }

        if (title.includes('kandydat')) {
            return 'Kandydat na stanowisko';
        }

        // Skrócenie długich tytułów
        if (title.length > 100) {
            return title.substring(0, 97) + '...';
        }

        return title;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pl-PL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    calculateDaysAge(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    getCachedData(key) {
        const cached = cache.get(key);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }
        cache.delete(key);
        return null;
    }

    setCachedData(key, data) {
        cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        cache.clear();
    }

    // Metoda do zarządzania głosowaniem użytkowników
    async submitVote(printNumber, vote, userId) {
        try {
            // Tu można dodać integrację z bazą danych (Supabase)
            // Na razie symulacja
            const voteData = {
                printNumber,
                vote, // 'like' lub 'dislike'
                userId,
                timestamp: new Date().toISOString()
            };

            // Zapisz głos lokalnie lub wyślij do API
            console.log('Vote submitted:', voteData);

            return {
                success: true,
                data: voteData
            };
        } catch (error) {
            console.error('Error submitting vote:', error);
            return handleApiError(error, 'Nie udało się zapisać głosu');
        }
    }

    async getVotingStats(printNumber) {
        try {
            // Pobieranie statystyk głosowania
            // Na razie dane przykładowe
            return {
                success: true,
                data: {
                    printNumber,
                    likes: Math.floor(Math.random() * 100),
                    dislikes: Math.floor(Math.random() * 50),
                    totalVotes: Math.floor(Math.random() * 150)
                }
            };
        } catch (error) {
            console.error('Error fetching voting stats:', error);
            return handleApiError(error, 'Nie udało się pobrać statystyk głosowania');
        }
    }
}

export const legislationService = new LegislationService();