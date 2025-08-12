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

// Typy postów
export const POST_TYPES = {
    NEWS: 'news',
    POLITICIAN_POST: 'politician_post',
    COMMENT: 'comment',
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
    DESCRIPTION: 'Najnowsze newsy i komunikaty polityków',
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
};

// API Endpoints (relatywne do Supabase URL)
export const API_ENDPOINTS = {
    NEWS: '/rest/v1/news',
    POLITICIANS: '/rest/v1/politicians',
    POLITICIAN_POSTS: '/rest/v1/politician_posts',
    COMMENTS: '/rest/v1/comments',
    LIKES: '/rest/v1/likes',
};

// Supabase Realtime channels
export const REALTIME_CHANNELS = {
    NEWS: 'news_changes',
    POLITICIAN_POSTS: 'politician_posts_changes',
    COMMENTS: 'comments_changes',
    LIKES: 'likes_changes',
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
};

// Validation rules
export const VALIDATION_RULES = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^\+?[\d\s\-\(\)]{9,}$/,
    URL: /^https?:\/\/.+/,
    NO_SPECIAL_CHARS: /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s]+$/,
    ALPHANUMERIC: /^[a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s]+$/,
};

// Device types
export const DEVICE_TYPES = {
    PHONE: 'phone',
    TABLET: 'tablet',
    DESKTOP: 'desktop',
};

// Themes
export const THEMES = {
    LIGHT: 'light',
    DARK: 'dark',
    AUTO: 'auto',
};

// Languages
export const LANGUAGES = {
    PL: 'pl',
    EN: 'en',
};

// Date formats
export const DATE_FORMATS = {
    FULL: 'DD MMMM YYYY, HH:mm',
    SHORT: 'DD.MM.YYYY',
    TIME: 'HH:mm',
    RELATIVE: 'relative',
};

// Push notification types
export const NOTIFICATION_TYPES = {
    NEW_NEWS: 'new_news',
    NEW_POLITICIAN_POST: 'new_politician_post',
    COMMENT_REPLY: 'comment_reply',
    BREAKING_NEWS: 'breaking_news',
    WEEKLY_SUMMARY: 'weekly_summary',
};

// User roles (dla przyszłych funkcji)
export const USER_ROLES = {
    GUEST: 'guest',
    USER: 'user',
    MODERATOR: 'moderator',
    ADMIN: 'admin',
    POLITICIAN: 'politician',
};

// App states
export const APP_STATES = {
    ACTIVE: 'active',
    BACKGROUND: 'background',
    INACTIVE: 'inactive',
};

export default {
    NEWS_CATEGORIES,
    POST_TYPES,
    STATUS,
    LIMITS,
    TIMEOUTS,
    APP_CONFIG,
    SOCIAL_LINKS,
    ANIMATION_DURATION,
    SIZES,
    Z_INDEX,
    STORAGE_KEYS,
    API_ENDPOINTS,
    REALTIME_CHANNELS,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    VALIDATION_RULES,
    DEVICE_TYPES,
    THEMES,
    LANGUAGES,
    DATE_FORMATS,
    NOTIFICATION_TYPES,
    USER_ROLES,
    APP_STATES,
};