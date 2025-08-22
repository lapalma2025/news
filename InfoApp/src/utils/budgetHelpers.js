// src/utils/budgetHelpers.js - Funkcje pomocnicze dla budżetu
import { CURRENCY_CONFIG, BUDGET_THRESHOLDS, QUARTERS, BUDGET_CATEGORIES } from './constants';

/**
 * Formatuje kwotę w walucie polskiej
 * @param {number} amount - Kwota do sformatowania
 * @param {boolean} compact - Czy używać skróconej notacji (mln, mld)
 * @returns {string} Sformatowana kwota
 */
export const formatCurrency = (amount, compact = true) => {
    if (!amount || isNaN(amount)) return '0 zł';

    const absAmount = Math.abs(amount);

    if (compact && absAmount >= 1000000000) {
        // Miliardy
        const billions = amount / 1000000000;
        return `${billions.toFixed(1)} mld zł`;
    } else if (compact && absAmount >= 1000000) {
        // Miliony
        const millions = amount / 1000000;
        return `${millions.toFixed(1)} mln zł`;
    } else if (compact && absAmount >= 1000) {
        // Tysiące
        const thousands = amount / 1000;
        return `${thousands.toFixed(0)} tys. zł`;
    }

    // Standardowe formatowanie
    return new Intl.NumberFormat(CURRENCY_CONFIG.LOCALE, {
        style: 'currency',
        currency: CURRENCY_CONFIG.CURRENCY,
        minimumFractionDigits: CURRENCY_CONFIG.MINIMUM_FRACTION_DIGITS,
        maximumFractionDigits: CURRENCY_CONFIG.MAXIMUM_FRACTION_DIGITS,
    }).format(amount);
};

/**
 * Ocenia poziom wykonania budżetu
 * @param {number} executionPercent - Procent wykonania
 * @returns {object} Obiekt z oceną i kolorem
 */
export const evaluateExecution = (executionPercent) => {
    if (executionPercent >= BUDGET_THRESHOLDS.EXECUTION.EXCELLENT) {
        return {
            level: 'excellent',
            label: 'Bardzo dobry',
            color: '#10b981', // success
            icon: 'checkmark-circle'
        };
    } else if (executionPercent >= BUDGET_THRESHOLDS.EXECUTION.GOOD) {
        return {
            level: 'good',
            label: 'Dobry',
            color: '#f59e0b', // warning
            icon: 'warning'
        };
    } else if (executionPercent >= BUDGET_THRESHOLDS.EXECUTION.WARNING) {
        return {
            level: 'warning',
            label: 'Wymaga uwagi',
            color: '#ef4444', // error
            icon: 'alert-circle'
        };
    } else {
        return {
            level: 'poor',
            label: 'Niewystarczający',
            color: '#dc2626', // dark red
            icon: 'close-circle'
        };
    }
};

/**
 * Ocenia zmianę w wydatkach
 * @param {number} changePercent - Procent zmiany
 * @returns {object} Obiekt z oceną zmiany
 */
export const evaluateChange = (changePercent) => {
    if (changePercent >= BUDGET_THRESHOLDS.CHANGE.SIGNIFICANT_INCREASE) {
        return {
            type: 'significant_increase',
            label: 'Znaczący wzrost',
            color: '#dc2626',
            icon: 'trending-up'
        };
    } else if (changePercent <= BUDGET_THRESHOLDS.CHANGE.SIGNIFICANT_DECREASE) {
        return {
            type: 'significant_decrease',
            label: 'Znaczący spadek',
            color: '#10b981',
            icon: 'trending-down'
        };
    } else if (changePercent > 0) {
        return {
            type: 'increase',
            label: 'Wzrost',
            color: '#f59e0b',
            icon: 'arrow-up'
        };
    } else if (changePercent < 0) {
        return {
            type: 'decrease',
            label: 'Spadek',
            color: '#3b82f6',
            icon: 'arrow-down'
        };
    } else {
        return {
            type: 'stable',
            label: 'Bez zmian',
            color: '#6b7280',
            icon: 'remove'
        };
    }
};

/**
 * Pobiera aktualny kwartał
 * @param {Date} date - Data (domyślnie aktualna)
 * @returns {string} Kod kwartału (Q1, Q2, Q3, Q4)
 */
export const getCurrentQuarter = (date = new Date()) => {
    const month = date.getMonth() + 1;

    for (const [quarterCode, quarterData] of Object.entries(QUARTERS)) {
        if (quarterData.months.includes(month)) {
            return quarterCode;
        }
    }

    return 'Q1'; // fallback
};

/**
 * Pobiera nazwę kwartału
 * @param {string} quarterCode - Kod kwartału (Q1, Q2, Q3, Q4)
 * @returns {string} Nazwa kwartału
 */
export const getQuarterLabel = (quarterCode) => {
    return QUARTERS[quarterCode]?.label || quarterCode;
};

/**
 * Sprawdza czy rok jest dostępny w danych budżetowych
 * @param {number} year - Rok do sprawdzenia
 * @returns {boolean} Czy rok jest dostępny
 */
export const isYearAvailable = (year) => {
    const currentYear = new Date().getFullYear();
    return year >= 2015 && year <= currentYear;
};

/**
 * Pobiera kategorię budżetową na podstawie ID
 * @param {string} categoryId - ID kategorii
 * @returns {object|null} Obiekt kategorii lub null
 */
export const getBudgetCategory = (categoryId) => {
    return BUDGET_CATEGORIES.find(cat => cat.id === categoryId) || null;
};

/**
 * Mapuje nazwy kategorii z API na standardowe ID
 * @param {string} apiCategoryName - Nazwa kategorii z API
 * @returns {string} Standardowe ID kategorii
 */
export const mapApiCategoryToId = (apiCategoryName) => {
    if (!apiCategoryName) return 'inne';

    const categoryName = apiCategoryName.toLowerCase();

    const mappings = {
        'obrona': ['obrona', 'wojsko', 'bezpieczeństwo', 'siły zbrojne', 'armia'],
        'edukacja': ['edukacja', 'szkolnictwo', 'nauka', 'uniwersytet', 'szkoła'],
        'zdrowie': ['zdrowie', 'ochrona zdrowia', 'nfz', 'służba zdrowia', 'medycyna'],
        'transport': ['transport', 'infrastruktura', 'drogi', 'kolej', 'komunikacja'],
        'kultura': ['kultura', 'sport', 'sztuka', 'dziedzictwo', 'muzeum'],
        'pomoc': ['pomoc społeczna', 'świadczenia', 'emerytury', 'renty', 'rodzina'],
        'rozwoj': ['rozwój regionalny', 'fundusze', 'inwestycje', 'regiony'],
        'rolnictwo': ['rolnictwo', 'wieś', 'żywność', 'gospodarstwo'],
        'energia': ['energia', 'środowisko', 'klimat', 'ekologia', 'węgiel', 'gaz', 'prąd']
    };

    for (const [categoryId, keywords] of Object.entries(mappings)) {
        if (keywords.some(keyword => categoryName.includes(keyword))) {
            return categoryId;
        }
    }

    return 'inne';
};

/**
 * Kalkuluje podsumowanie budżetu
 * @param {Array} expenses - Tablica wydatków
 * @param {Array} revenues - Tablica dochodów
 * @returns {object} Podsumowanie budżetu
 */
export const calculateBudgetSummary = (expenses = [], revenues = []) => {
    const totalExpenses = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalRevenues = revenues.reduce((sum, item) => sum + (item.amount || 0), 0);
    const deficit = totalExpenses - totalRevenues;
    const surplus = totalRevenues - totalExpenses;

    // Średnie wykonanie wydatków
    const avgExecution = expenses.length > 0
        ? expenses.reduce((sum, item) => sum + (item.executionPercent || 0), 0) / expenses.length
        : 0;

    return {
        totalExpenses,
        totalRevenues,
        deficit: deficit > 0 ? deficit : 0,
        surplus: surplus > 0 ? surplus : 0,
        balance: totalRevenues - totalExpenses,
        avgExecution,
        executionRate: avgExecution,
        itemCount: expenses.length,
        revenueCount: revenues.length,
        lastUpdate: new Date().toISOString()
    };
};

/**
 * Grupuje wydatki według kategorii
 * @param {Array} expenses - Tablica wydatków
 * @returns {object} Wydatki pogrupowane według kategorii
 */
export const groupExpensesByCategory = (expenses = []) => {
    return expenses.reduce((groups, expense) => {
        const category = expense.category || 'inne';

        if (!groups[category]) {
            groups[category] = {
                items: [],
                totalAmount: 0,
                avgExecution: 0,
                count: 0
            };
        }

        groups[category].items.push(expense);
        groups[category].totalAmount += expense.amount || 0;
        groups[category].count += 1;

        return groups;
    }, {});
};

/**
 * Sortuje wydatki według różnych kryteriów
 * @param {Array} expenses - Tablica wydatków
 * @param {string} sortBy - Kryterium sortowania
 * @param {string} order - Kierunek sortowania ('asc' | 'desc')
 * @returns {Array} Posortowana tablica wydatków
 */
export const sortExpenses = (expenses = [], sortBy = 'amount', order = 'desc') => {
    return [...expenses].sort((a, b) => {
        let aValue, bValue;

        switch (sortBy) {
            case 'amount':
                aValue = a.amount || 0;
                bValue = b.amount || 0;
                break;
            case 'execution':
                aValue = a.executionPercent || 0;
                bValue = b.executionPercent || 0;
                break;
            case 'change':
                aValue = a.changePercent || 0;
                bValue = b.changePercent || 0;
                break;
            case 'title':
                aValue = a.title || '';
                bValue = b.title || '';
                break;
            case 'category':
                aValue = a.category || '';
                bValue = b.category || '';
                break;
            default:
                aValue = a.amount || 0;
                bValue = b.amount || 0;
        }

        if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }

        if (order === 'asc') {
            return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
            return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
    });
};

/**
 * Filtruje wydatki według zapytania wyszukiwania
 * @param {Array} expenses - Tablica wydatków
 * @param {string} query - Zapytanie wyszukiwania
 * @returns {Array} Przefiltrowane wydatki
 */
export const filterExpensesByQuery = (expenses = [], query = '') => {
    if (!query || query.trim().length < 2) {
        return expenses;
    }

    const searchQuery = query.toLowerCase().trim();

    return expenses.filter(expense => {
        return (
            (expense.title || '').toLowerCase().includes(searchQuery) ||
            (expense.description || '').toLowerCase().includes(searchQuery) ||
            (expense.category || '').toLowerCase().includes(searchQuery) ||
            (getBudgetCategory(expense.category)?.name || '').toLowerCase().includes(searchQuery)
        );
    });
};

/**
 * Sprawdza czy wydatek jest znaczący (powyżej określonego progu)
 * @param {object} expense - Obiekt wydatku
 * @param {number} threshold - Próg w złotych (domyślnie 1 mld)
 * @returns {boolean} Czy wydatek jest znaczący
 */
export const isSignificantExpense = (expense, threshold = 1000000000) => {
    return (expense.amount || 0) >= threshold;
};

/**
 * Pobiera top N wydatków według kwoty
 * @param {Array} expenses - Tablica wydatków
 * @param {number} count - Liczba wydatków do pobrania (domyślnie 10)
 * @returns {Array} Top wydatki
 */
export const getTopExpenses = (expenses = [], count = 10) => {
    return sortExpenses(expenses, 'amount', 'desc').slice(0, count);
};

/**
 * Kalkuluje trend wydatków (porównanie z poprzednim rokiem)
 * @param {Array} currentYearExpenses - Wydatki z bieżącego roku
 * @param {Array} previousYearExpenses - Wydatki z poprzedniego roku
 * @returns {object} Trend wydatków
 */
export const calculateExpensesTrend = (currentYearExpenses = [], previousYearExpenses = []) => {
    const currentTotal = currentYearExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
    const previousTotal = previousYearExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);

    if (previousTotal === 0) {
        return {
            trend: 'unknown',
            changePercent: 0,
            changeAmount: 0,
            isSignificant: false
        };
    }

    const changeAmount = currentTotal - previousTotal;
    const changePercent = (changeAmount / previousTotal) * 100;
    const isSignificant = Math.abs(changePercent) >= 5; // 5% próg znaczącej zmiany

    let trend = 'stable';
    if (changePercent > 0) {
        trend = 'increasing';
    } else if (changePercent < 0) {
        trend = 'decreasing';
    }

    return {
        trend,
        changePercent,
        changeAmount,
        isSignificant,
        currentTotal,
        previousTotal
    };
};

/**
 * Formatuje procent wykonania
 * @param {number} percent - Procent do sformatowania
 * @param {number} decimals - Liczba miejsc po przecinku
 * @returns {string} Sformatowany procent
 */
export const formatPercentage = (percent, decimals = 1) => {
    if (isNaN(percent)) return '0%';
    return `${percent.toFixed(decimals)}%`;
};

/**
 * Konwertuje wartość z API na liczbę
 * @param {any} value - Wartość do konwersji
 * @returns {number} Skonwertowana liczba
 */
export const parseApiValue = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        // Usuwa wszystkie znaki oprócz cyfr, kropki i minusa
        const cleaned = value.replace(/[^\d.-]/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

/**
 * Sprawdza czy dane budżetowe są aktualne
 * @param {string} lastUpdate - Data ostatniej aktualizacji (ISO string)
 * @param {number} maxAgeHours - Maksymalny wiek danych w godzinach (domyślnie 24)
 * @returns {boolean} Czy dane są aktualne
 */
export const isBudgetDataFresh = (lastUpdate, maxAgeHours = 24) => {
    if (!lastUpdate) return false;

    const updateDate = new Date(lastUpdate);
    const now = new Date();
    const ageHours = (now - updateDate) / (1000 * 60 * 60);

    return ageHours <= maxAgeHours;
};

/**
 * Tworzy klucz cache dla danych budżetowych
 * @param {number} year - Rok
 * @param {string} category - Kategoria
 * @param {string} type - Typ danych (expenses, revenue, execution)
 * @returns {string} Klucz cache
 */
export const createBudgetCacheKey = (year, category = 'all', type = 'expenses') => {
    return `budget_${type}_${year}_${category}`;
};

/**
 * Eksportuje dane budżetowe do formatu CSV
 * @param {Array} expenses - Tablica wydatków
 * @returns {string} Dane w formacie CSV
 */
export const exportBudgetToCSV = (expenses = []) => {
    const headers = [
        'Tytuł',
        'Kategoria',
        'Kwota (PLN)',
        'Rok',
        'Kwartał',
        'Wykonanie (%)',
        'Zmiana (%)',
        'Opis',
        'Źródło'
    ];

    const rows = expenses.map(expense => [
        expense.title || '',
        getBudgetCategory(expense.category)?.name || expense.category || '',
        expense.amount || 0,
        expense.year || '',
        expense.quarter || '',
        expense.executionPercent || 0,
        expense.changePercent || 0,
        (expense.description || '').replace(/"/g, '""'), // Escape quotes
        expense.source || ''
    ]);

    const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

    return csvContent;
};