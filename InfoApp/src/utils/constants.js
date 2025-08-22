// src/utils/constants.js - Zaktualizowany z endpointami budżetowymi
// Kategorie newsów
export const NEWS_CATEGORIES = [
    { id: 'all', name: 'Wszystkie', icon: 'apps' },
    { id: 'Polityka', name: 'Polityka', icon: 'people' },
    { id: 'Ekonomia', name: 'Ekonomia', icon: 'trending-up' },
    { id: 'Technologia', name: 'Technologia', icon: 'phone-portrait' },
    { id: 'Społeczeństwo', name: 'Społeczeństwo', icon: 'home' },
    { id: 'Kultura', name: 'Kultura', icon: 'library' },
    { id: 'Sport', name: 'Sport', icon: 'football' },
    { id: 'Inne', name: 'Inne', icon: 'ellipsis-horizontal' },
];

// Kategorie budżetowe
export const BUDGET_CATEGORIES = [
    { id: 'all', name: 'Wszystkie', icon: 'apps' },
    { id: 'obrona', name: 'Obrona narodowa', icon: 'shield' },
    { id: 'edukacja', name: 'Edukacja', icon: 'school' },
    { id: 'zdrowie', name: 'Ochrona zdrowia', icon: 'medical' },
    { id: 'transport', name: 'Transport', icon: 'car' },
    { id: 'kultura', name: 'Kultura i sport', icon: 'library' },
    { id: 'pomoc', name: 'Pomoc społeczna', icon: 'people' },
    { id: 'rozwoj', name: 'Rozwój regionalny', icon: 'business' },
    { id: 'rolnictwo', name: 'Rolnictwo', icon: 'leaf' },
    { id: 'energia', name: 'Energia', icon: 'flash' },
    { id: 'inne', name: 'Inne', icon: 'ellipsis-horizontal' }
];

// Typy postów
export const POST_TYPES = {
    NEWS: 'news',
    POLITICIAN_POST: 'politician_post',
    COMMENT: 'comment',
    BUDGET_ITEM: 'budget_item',
};

// Statusy
export const STATUS = {
    IDLE: 'idle',
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error',
};

// Limity
export const LIMITS = {
    NEWS_PER_PAGE: 20,
    BUDGET_PER_PAGE: 50,
    COMMENTS_PER_PAGE: 50,
    SEARCH_MIN_LENGTH: 2,
    COMMENT_MAX_LENGTH: 300,
    TITLE_MAX_LENGTH: 150,
    CONTENT_MAX_LENGTH: 5000,
    AUTHOR_NAME_MAX_LENGTH: 50,
};

export const TIMEOUTS = {
    SEARCH_DEBOUNCE: 500,
    API_REQUEST: 10000,
    REFRESH_INTERVAL: 30000,
    NOTIFICATION_DISPLAY: 5000,
};

export const APP_CONFIG = {
    NAME: 'InfoApp',
    VERSION: '1.0.0',
    DESCRIPTION: 'Najnowsze newsy, komunikaty polityków i budżet państwa',
    WEBSITE: 'https://infoapp.pl',
    SUPPORT_EMAIL: 'pomoc@infoapp.pl',
    PRIVACY_URL: 'https://infoapp.pl/privacy',
    TERMS_URL: 'https://infoapp.pl/terms',
};

// Social media
export const SOCIAL_LINKS = {
    FACEBOOK: 'https://facebook.com/infoapp',
    TWITTER: 'https://twitter.com/infoapp',
    INSTAGRAM: 'https://instagram.com/infoapp',
    LINKEDIN: 'https://linkedin.com/company/infoapp',
};

// Animacje
export const ANIMATION_DURATION = {
    FAST: 200,
    NORMAL: 300,
    SLOW: 500,
    VERY_SLOW: 1000,
};

// Rozmiary
export const SIZES = {
    HEADER_HEIGHT: 60,
    TAB_BAR_HEIGHT: 60,
    CARD_BORDER_RADIUS: 16,
    BUTTON_BORDER_RADIUS: 12,
    INPUT_BORDER_RADIUS: 12,
    AVATAR_SIZE: 40,
    ICON_SIZE: 24,
    TOUCH_TARGET: 44,
};

// Z-Index levels
export const Z_INDEX = {
    MODAL: 1000,
    OVERLAY: 900,
    DROPDOWN: 800,
    HEADER: 700,
    TAB_BAR: 600,
    FLOATING_BUTTON: 500,
};

// Storage keys
export const STORAGE_KEYS = {
    USER_PREFERENCES: '@infoapp:userPreferences',
    BOOKMARKS: '@infoapp:bookmarks',
    READ_ARTICLES: '@infoapp:readArticles',
    NOTIFICATION_SETTINGS: '@infoapp:notificationSettings',
    THEME_PREFERENCE: '@infoapp:themePreference',
    LAST_UPDATE: '@infoapp:lastUpdate',
    BUDGET_CACHE: '@infoapp:budgetCache',
    BUDGET_FILTERS: '@infoapp:budgetFilters',
};

// API Endpoints (relatywne do Supabase URL)
export const API_ENDPOINTS = {
    NEWS: '/rest/v1/news',
    POLITICIANS: '/rest/v1/politicians',
    POLITICIAN_POSTS: '/rest/v1/politician_posts',
    COMMENTS: '/rest/v1/comments',
    LIKES: '/rest/v1/likes',

    // Endpointy budżetowe
    BUDGET_EXPENSES: '/api/budzet/wydatki',
    BUDGET_REVENUE: '/api/budzet/dochody',
    BUDGET_EXECUTION: '/api/budzet/wykonanie',
};

// External API Endpoints
export const EXTERNAL_API_ENDPOINTS = {
    // Ministerstwo Finansów
    MF_BUDGET: 'https://api.gov.pl/api/budzet',
    MF_EXPENSES: 'https://www.gov.pl/api/data/budzet',

    // Dane.gov.pl
    DANE_GOV_API: 'https://api.dane.gov.pl/1.4',
    DANE_GOV_EXPENSES: 'https://api.dane.gov.pl/1.4/datasets/397,wydatki-budzetowe-panstwa',
    DANE_GOV_REVENUE: 'https://api.dane.gov.pl/1.4/datasets/396,dochody-budzetowe-panstwa',
    DANE_GOV_EXECUTION: 'https://api.dane.gov.pl/1.4/datasets/398,wykonanie-budzetu-panstwa',

    // GUS Bank Danych Lokalnych
    GUS_BDL: 'https://bdl.stat.gov.pl/api/v1',
    GUS_DATA: 'https://bdl.stat.gov.pl/api/v1/data/by-variable',
};

// Supabase Realtime channels
export const REALTIME_CHANNELS = {
    NEWS: 'news_changes',
    POLITICIAN_POSTS: 'politician_posts_changes',
    COMMENTS: 'comments_changes',
    LIKES: 'likes_changes',
    BUDGET: 'budget_changes',
};

// Error messages
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Sprawdź połączenie z internetem',
    SERVER_ERROR: 'Problem z serwerem. Spróbuj ponownie',
    NOT_FOUND: 'Nie znaleziono żądanych danych',
    UNAUTHORIZED: 'Brak uprawnień do tej operacji',
    VALIDATION_ERROR: 'Nieprawidłowe dane',
    UNKNOWN_ERROR: 'Wystąpił nieoczekiwany błąd',
    TIMEOUT_ERROR: 'Operacja trwała zbyt długo',
    OFFLINE_ERROR: 'Brak połączenia z internetem',

    // Błędy budżetowe
    BUDGET_API_ERROR: 'Błąd API Ministerstwa Finansów',
    BUDGET_DATA_ERROR: 'Nie udało się pobrać danych budżetowych',
    BUDGET_SEARCH_ERROR: 'Błąd wyszukiwania w danych budżetowych',
};

// Success messages
export const SUCCESS_MESSAGES = {
    NEWS_ADDED: 'News został dodany pomyślnie',
    COMMENT_ADDED: 'Komentarz został dodany',
    LIKE_ADDED: 'Polubiono post',
    LIKE_REMOVED: 'Usunięto polubienie',
    BOOKMARK_ADDED: 'Dodano do zakładek',
    BOOKMARK_REMOVED: 'Usunięto z zakładek',
    DATA_REFRESHED: 'Dane zostały odświeżone',

    // Sukcesy budżetowe
    BUDGET_DATA_LOADED: 'Dane budżetowe zostały załadowane',
    BUDGET_FILTERS_APPLIED: 'Filtry zostały zastosowane',
    BUDGET_SEARCH_SUCCESS: 'Wyszukiwanie zakończone sukcesem',
};

// Validation rules
export const VALIDATION_RULES = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^\+?[\d\s\-\(\)]{9,}$/,
    URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
    AMOUNT: /^\d+(\.\d{1,2})?$/,
    YEAR: /^(19|20)\d{2}$/,
    PERCENTAGE: /^(0|[1-9]\d?)(\.\d+)?$|^100(\.0+)?$/,
};

// Budget execution thresholds
export const BUDGET_THRESHOLDS = {
    EXECUTION: {
        EXCELLENT: 90,
        GOOD: 70,
        WARNING: 50,
    },
    CHANGE: {
        SIGNIFICANT_INCREASE: 10,
        SIGNIFICANT_DECREASE: -10,
    },
};

// Currency formatting
export const CURRENCY_CONFIG = {
    LOCALE: 'pl-PL',
    CURRENCY: 'PLN',
    MINIMUM_FRACTION_DIGITS: 0,
    MAXIMUM_FRACTION_DIGITS: 0,
    COMPACT_THRESHOLD: 1000000, // 1 mln - powyżej tej kwoty używaj skrótów
};

// Available years for budget data
export const BUDGET_YEARS = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015];

// Budget data sources
export const BUDGET_DATA_SOURCES = {
    MF: 'Ministerstwo Finansów',
    DANE_GOV: 'Dane.gov.pl',
    GUS: 'Bank Danych Lokalnych GUS',
    MANUAL: 'Dane wprowadzone ręcznie',
};

// Budget item types
export const BUDGET_ITEM_TYPES = {
    EXPENSE: 'expense',
    REVENUE: 'revenue',
    EXECUTION: 'execution',
    PLAN: 'plan',
};

// Quarter mapping
export const QUARTERS = {
    Q1: { name: 'Q1', months: [1, 2, 3], label: 'I kwartał' },
    Q2: { name: 'Q2', months: [4, 5, 6], label: 'II kwartał' },
    Q3: { name: 'Q3', months: [7, 8, 9], label: 'III kwartał' },
    Q4: { name: 'Q4', months: [10, 11, 12], label: 'IV kwartał' },
};