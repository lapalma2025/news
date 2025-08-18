// src/services/apiHelpers.js - Pomocnicze funkcje dla API
import { ERROR_MESSAGES } from '../utils/constants';

/**
 * Obsługuje błędy API i zwraca ustandaryzowaną odpowiedź
 * @param {Error} error - Obiekt błędu
 * @param {string} defaultMessage - Domyślna wiadomość błędu
 * @returns {Object} Ustandaryzowana odpowiedź błędu
 */
export const handleApiError = (error, defaultMessage = ERROR_MESSAGES.UNKNOWN_ERROR) => {
    console.error('API Error:', error);

    let errorMessage = defaultMessage;

    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
    } else if (error.message?.includes('404')) {
        errorMessage = ERROR_MESSAGES.NOT_FOUND;
    } else if (error.message?.includes('401') || error.message?.includes('403')) {
        errorMessage = ERROR_MESSAGES.UNAUTHORIZED;
    } else if (error.message?.includes('500')) {
        errorMessage = ERROR_MESSAGES.SERVER_ERROR;
    } else if (error.message?.includes('timeout')) {
        errorMessage = ERROR_MESSAGES.TIMEOUT_ERROR;
    }

    return {
        success: false,
        error: errorMessage,
        originalError: error
    };
};

/**
 * Obsługuje udane odpowiedzi API
 * @param {any} data - Dane z odpowiedzi
 * @param {string} operation - Nazwa operacji
 * @returns {Object} Ustandaryzowana odpowiedź sukcesu
 */
export const handleApiSuccess = (data, operation = 'fetchData') => {
    console.log(`API Success - ${operation}:`, data);

    return {
        success: true,
        data,
        timestamp: new Date().toISOString()
    };
};

/**
 * Tworzy parametry URL z obiektu
 * @param {Object} params - Obiekt parametrów
 * @returns {string} String parametrów URL
 */
export const createUrlParams = (params) => {
    const filteredParams = Object.entries(params)
        .filter(([key, value]) => value !== undefined && value !== null && value !== '')
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    return new URLSearchParams(filteredParams).toString();
};

/**
 * Wykonuje żądanie HTTP z obsługą błędów i timeout
 * @param {string} url - URL żądania
 * @param {Object} options - Opcje żądania
 * @returns {Promise} Promise z odpowiedzią
 */
export const fetchWithTimeout = async (url, options = {}) => {
    const { timeout = 10000, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
    } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
            throw new Error('Request timeout');
        }

        throw error;
    }
};

/**
 * Retry funkcja dla nieudanych żądań
 * @param {Function} fn - Funkcja do powtórzenia
 * @param {number} retries - Liczba prób
 * @param {number} delay - Opóźnienie między próbami w ms
 * @returns {Promise} Promise z wynikiem
 */
export const retryWithDelay = async (fn, retries = 3, delay = 1000) => {
    try {
        return await fn();
    } catch (error) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return retryWithDelay(fn, retries - 1, delay * 2); // Exponential backoff
        }
        throw error;
    }
};

/**
 * Waliduje odpowiedź API
 * @param {any} data - Dane do walidacji
 * @param {Array} requiredFields - Wymagane pola
 * @returns {boolean} Czy dane są prawidłowe
 */
export const validateApiResponse = (data, requiredFields = []) => {
    if (!data || typeof data !== 'object') {
        return false;
    }

    return requiredFields.every(field => {
        const value = field.split('.').reduce((obj, key) => obj?.[key], data);
        return value !== undefined && value !== null;
    });
};

/**
 * Formatuje dane z API do wyświetlenia
 * @param {Object} rawData - Surowe dane z API
 * @returns {Object} Sformatowane dane
 */
export const formatApiData = (rawData) => {
    if (!rawData) return null;

    // Konwersja dat do obiektów Date
    const dateFields = ['deliveryDate', 'documentDate', 'changeDate', 'createdAt', 'updatedAt'];
    const formatted = { ...rawData };

    dateFields.forEach(field => {
        if (formatted[field]) {
            formatted[field] = new Date(formatted[field]);
        }
    });

    // Czyści puste stringi i null values
    Object.keys(formatted).forEach(key => {
        if (formatted[key] === '' || formatted[key] === null) {
            delete formatted[key];
        }
    });

    return formatted;
};

/**
 * Debounce funkcja dla ograniczenia częstotliwości wywołań
 * @param {Function} func - Funkcja do debounce
 * @param {number} wait - Czas oczekiwania w ms
 * @returns {Function} Funkcja z debounce
 */
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

/**
 * Throttle funkcja dla ograniczenia częstotliwości wywołań
 * @param {Function} func - Funkcja do throttle
 * @param {number} limit - Limit w ms
 * @returns {Function} Funkcja z throttle
 */
export const throttle = (func, limit) => {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

/**
 * Cache manager dla API responses
 */
export class ApiCache {
    constructor(defaultTTL = 300000) { // 5 minut domyślnie
        this.cache = new Map();
        this.defaultTTL = defaultTTL;
    }

    set(key, data, ttl = this.defaultTTL) {
        const expiresAt = Date.now() + ttl;
        this.cache.set(key, { data, expiresAt });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return item.data;
    }

    has(key) {
        return this.get(key) !== null;
    }

    delete(key) {
        return this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }

    size() {
        // Usuń wygasłe elementy
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiresAt) {
                this.cache.delete(key);
            }
        }
        return this.cache.size;
    }
}

// Globalna instancja cache
export const globalApiCache = new ApiCache();

/**
 * Wrapper dla fetch z cache
 * @param {string} url - URL do pobrania
 * @param {Object} options - Opcje fetch
 * @param {number} cacheTTL - Czas życia cache w ms
 * @returns {Promise} Promise z danymi
 */
export const fetchWithCache = async (url, options = {}, cacheTTL) => {
    const cacheKey = `${url}_${JSON.stringify(options)}`;

    // Sprawdź cache
    const cachedData = globalApiCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }

    // Pobierz dane
    const response = await fetchWithTimeout(url, options);
    const data = await response.json();

    // Zapisz w cache
    globalApiCache.set(cacheKey, data, cacheTTL);

    return data;
};

/**
 * Sprawdza status połączenia internetowego
 * @returns {boolean} Czy jest połączenie
 */
export const isOnline = () => {
    return navigator.onLine !== false; // Default to true if navigator.onLine is undefined
};

/**
 * Formatuje rozmiar pliku
 * @param {number} bytes - Rozmiar w bajtach
 * @returns {string} Sformatowany rozmiar
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Generuje unikalny ID
 * @returns {string} Unikalny ID
 */
export const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};