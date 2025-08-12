// src/utils/helpers.js
import { VALIDATION_RULES, LIMITS } from './constants';

/**
 * Opóźnia wykonanie funkcji o określony czas (debounce)
 * @param {Function} func - Funkcja do wykonania
 * @param {number} delay - Opóźnienie w milisekundach
 * @returns {Function} Debounced funkcja
 */
export const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

/**
 * Ogranicza częstotliwość wykonywania funkcji (throttle)
 * @param {Function} func - Funkcja do wykonania
 * @param {number} limit - Limit w milisekundach
 * @returns {Function} Throttled funkcja
 */
export const throttle = (func, limit) => {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            func.apply(null, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

/**
 * Skraca tekst do określonej długości z wielokropkiem
 * @param {string} text - Tekst do skrócenia
 * @param {number} maxLength - Maksymalna długość
 * @returns {string} Skrócony tekst
 */
export const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
};

/**
 * Kapitalizuje pierwszą literę tekstu
 * @param {string} text - Tekst do kapitalizacji
 * @returns {string} Tekst z dużą pierwszą literą
 */
export const capitalize = (text) => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Konwertuje tekst na format URL-friendly (slug)
 * @param {string} text - Tekst do konwersji
 * @returns {string} URL-friendly tekst
 */
export const slugify = (text) => {
    return text
        .toLowerCase()
        .replace(/[ąćęłńóśźż]/g, char => {
            const map = {
                'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n',
                'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z'
            };
            return map[char] || char;
        })
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
};

/**
 * Generuje losowy identyfikator
 * @param {number} length - Długość identyfikatora
 * @returns {string} Losowy identyfikator
 */
export const generateId = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/**
 * Sprawdza czy email jest poprawny
 * @param {string} email - Email do sprawdzenia
 * @returns {boolean} True jeśli email jest poprawny
 */
export const isValidEmail = (email) => {
    return VALIDATION_RULES.EMAIL.test(email);
};

/**
 * Sprawdza czy URL jest poprawny
 * @param {string} url - URL do sprawdzenia
 * @returns {boolean} True jeśli URL jest poprawny
 */
export const isValidUrl = (url) => {
    return VALIDATION_RULES.URL.test(url);
};

/**
 * Usuwa HTML tagi z tekstu
 * @param {string} html - HTML do oczyszczenia
 * @returns {string} Czysty tekst
 */
export const stripHtml = (html) => {
    return html.replace(/<[^>]*>/g, '');
};

/**
 * Formatuje liczbę z separatorami tysięcy
 * @param {number} number - Liczba do sformatowania
 * @returns {string} Sformatowana liczba
 */
export const formatNumber = (number) => {
    return new Intl.NumberFormat('pl-PL').format(number);
};

/**
 * Formatuje liczbę w skróconej formie (1K, 1M)
 * @param {number} number - Liczba do sformatowania
 * @returns {string} Sformatowana liczba
 */
export const formatNumberShort = (number) => {
    if (number < 1000) return number.toString();
    if (number < 1000000) return Math.floor(number / 1000) + 'K';
    if (number < 1000000000) return Math.floor(number / 1000000) + 'M';
    return Math.floor(number / 1000000000) + 'B';
};

/**
 * Sprawdza czy obiekt jest pusty
 * @param {Object} obj - Obiekt do sprawdzenia
 * @returns {boolean} True jeśli obiekt jest pusty
 */
export const isEmpty = (obj) => {
    if (obj == null) return true;
    if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
    return Object.keys(obj).length === 0;
};

/**
 * Głęboko klonuje obiekt
 * @param {any} obj - Obiekt do sklonowania
 * @returns {any} Sklonowany obiekt
 */
export const deepClone = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (Array.isArray(obj)) return obj.map(item => deepClone(item));

    const cloned = {};
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            cloned[key] = deepClone(obj[key]);
        }
    }
    return cloned;
};

/**
 * Łączy obiekty (merge)
 * @param {Object} target - Obiekt docelowy
 * @param {...Object} sources - Obiekty źródłowe
 * @returns {Object} Połączony obiekt
 */
export const merge = (target, ...sources) => {
    sources.forEach(source => {
        Object.keys(source).forEach(key => {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                target[key] = merge(target[key] || {}, source[key]);
            } else {
                target[key] = source[key];
            }
        });
    });
    return target;
};

/**
 * Losuje element z tablicy
 * @param {Array} array - Tablica do wyboru
 * @returns {any} Losowy element
 */
export const randomChoice = (array) => {
    return array[Math.floor(Math.random() * array.length)];
};

/**
 * Miesza elementy tablicy (shuffle)
 * @param {Array} array - Tablica do pomieszania
 * @returns {Array} Pomieszana tablica
 */
export const shuffle = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

/**
 * Usuwa duplikaty z tablicy
 * @param {Array} array - Tablica z duplikatami
 * @param {string} key - Klucz do porównania (opcjonalny)
 * @returns {Array} Tablica bez duplikatów
 */
export const removeDuplicates = (array, key = null) => {
    if (!key) return [...new Set(array)];

    const seen = new Set();
    return array.filter(item => {
        const value = item[key];
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
    });
};

/**
 * Grupuje elementy tablicy według klucza
 * @param {Array} array - Tablica do grupowania
 * @param {string|Function} key - Klucz lub funkcja grupująca
 * @returns {Object} Pogrupowane elementy
 */
export const groupBy = (array, key) => {
    return array.reduce((groups, item) => {
        const group = typeof key === 'function' ? key(item) : item[key];
        if (!groups[group]) groups[group] = [];
        groups[group].push(item);
        return groups;
    }, {});
};

/**
 * Sortuje tablicę obiektów według klucza
 * @param {Array} array - Tablica do sortowania
 * @param {string} key - Klucz do sortowania
 * @param {string} order - Kierunek sortowania ('asc' lub 'desc')
 * @returns {Array} Posortowana tablica
 */
export const sortBy = (array, key, order = 'asc') => {
    return [...array].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];

        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
    });
};

/**
 * Konwertuje bajty na czytelny format
 * @param {number} bytes - Liczba bajtów
 * @param {number} decimals - Liczba miejsc po przecinku
 * @returns {string} Sformatowany rozmiar
 */
export const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Sprawdza czy aplikacja działa w trybie deweloperskim
 * @returns {boolean} True jeśli tryb deweloperski
 */
export const isDevelopment = () => {
    return __DEV__;
};

/**
 * Loguje informacje tylko w trybie deweloperskim
 * @param {...any} args - Argumenty do zalogowania
 */
export const devLog = (...args) => {
    if (isDevelopment()) {
        console.log('[DEV]', ...args);
    }
};

/**
 * Obsługuje błędy w bezpieczny sposób
 * @param {Function} fn - Funkcja do wykonania
 * @param {any} fallback - Wartość zwracana w przypadku błędu
 * @returns {any} Wynik funkcji lub fallback
 */
export const safeExecute = (fn, fallback = null) => {
    try {
        return fn();
    } catch (error) {
        devLog('Safe execute error:', error);
        return fallback;
    }
};

/**
 * Tworzy async wrapper z obsługą błędów
 * @param {Function} asyncFn - Async funkcja
 * @returns {Array} [error, result]
 */
export const asyncWrapper = async (asyncFn) => {
    try {
        const result = await asyncFn();
        return [null, result];
    } catch (error) {
        return [error, null];
    }
};

/**
 * Sprawdza czy urządzenie jest tabletem
 * @param {number} width - Szerokość ekranu
 * @param {number} height - Wysokość ekranu
 * @returns {boolean} True jeśli tablet
 */
export const isTablet = (width, height) => {
    const minDimension = Math.min(width, height);
    const maxDimension = Math.max(width, height);
    return minDimension >= 600 && maxDimension >= 900;
};

/**
 * Waliduje dane wejściowe
 * @param {Object} data - Dane do walidacji
 * @param {Object} rules - Reguły walidacji
 * @returns {Object} Wynik walidacji
 */
export const validateInput = (data, rules) => {
    const errors = {};
    let isValid = true;

    Object.keys(rules).forEach(field => {
        const value = data[field];
        const rule = rules[field];

        if (rule.required && (!value || value.toString().trim() === '')) {
            errors[field] = rule.message || `${field} jest wymagane`;
            isValid = false;
            return;
        }

        if (value && rule.pattern && !rule.pattern.test(value)) {
            errors[field] = rule.message || `${field} ma nieprawidłowy format`;
            isValid = false;
            return;
        }

        if (value && rule.minLength && value.length < rule.minLength) {
            errors[field] = rule.message || `${field} musi mieć co najmniej ${rule.minLength} znaków`;
            isValid = false;
            return;
        }

        if (value && rule.maxLength && value.length > rule.maxLength) {
            errors[field] = rule.message || `${field} może mieć maksymalnie ${rule.maxLength} znaków`;
            isValid = false;
            return;
        }
    });

    return { isValid, errors };
};

/**
 * Generuje kolory na podstawie tekstu
 * @param {string} text - Tekst bazowy
 * @returns {string} Kolor hex
 */
export const generateColorFromText = (text) => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }

    const color = Math.floor(Math.abs((Math.sin(hash) * 16777215)) % 16777215).toString(16);
    return '#' + Array(6 - color.length + 1).join('0') + color;
};