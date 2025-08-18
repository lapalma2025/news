// src/styles/colors.js - KOMPLETNE KOLORY z rozszerzeniami dla legislacji
export const COLORS = {
    // Główne kolory (ZACHOWANE)
    primary: '#667eea',
    secondary: '#764ba2',
    gradientStart: '#667eea',
    gradientEnd: '#764ba2',

    // Kolory tekstu (ZACHOWANE)
    textPrimary: '#1f2937',
    textSecondary: '#4b5563',
    textLight: '#9ca3af',

    // Kolory tła (ZACHOWANE)
    background: '#f9fafb',
    white: '#ffffff',
    black: '#000000',
    lightGray: '#f3f4f6',
    gray: '#6b7280',
    darkGray: '#374151',

    // Kolory akcji (ZACHOWANE)
    red: '#ef4444',
    green: '#10b981',
    blue: '#3b82f6',
    yellow: '#f59e0b',

    // Aliasy dla kompatybilności (ZACHOWANE)
    like: '#ef4444',
    comment: '#667eea',
    border: '#e5e7eb',

    // Kolory systemowe (ZACHOWANE)
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',

    // Przezroczystości (ZACHOWANE)
    overlay: 'rgba(0, 0, 0, 0.5)',
    lightOverlay: 'rgba(0, 0, 0, 0.3)',

    // Cienie (ZACHOWANE)
    shadow: '#000000',

    // NOWE ROZSZERZENIA dla legislacji (używające istniejących kolorów)

    // Dodatkowe odcienie dla nowych funkcji
    primaryDark: '#5a67d8',        // Ciemniejszy primary
    primaryLight: '#e8ebfc',       // Jasny primary
    successLight: '#d1fae5',       // Jasny success
    warningLight: '#fef3c7',       // Jasny warning  
    errorLight: '#fee2e2',         // Jasny error
    infoLight: '#dbeafe',          // Jasny info

    // Dodatkowe kolory harmonizujące z paletą
    orange: '#f97316',
    purple: '#8b5cf6',
    indigo: '#6366f1',
    pink: '#ec4899',
    teal: '#14b8a6',

    // Rozszerzone szarości
    textMuted: '#d1d5db',
    borderLight: '#f3f4f6',
    borderDark: '#d1d5db',

    // Transparentne
    transparent: 'transparent',

    // Kolory dla różnych typów dokumentów legislacyjnych (używające istniejących kolorów)
    legislation: {
        government: '#667eea',      // Rządowe - primary
        parliamentary: '#764ba2',   // Poselskie - secondary  
        civic: '#10b981',           // Obywatelskie - green
        resolution: '#f59e0b',      // Uchwały - yellow
        report: '#6b7280',          // Sprawozdania - gray
        candidate: '#ec4899',       // Kandydaci - pink
        information: '#3b82f6',     // Informacje - blue
        request: '#8b5cf6',         // Wnioski - purple
        other: '#6b7280',           // Inne - gray
    },

    // Kolory statusów dokumentów (używające istniejących kolorów)
    status: {
        new: '#10b981',         // Nowe - green
        active: '#667eea',      // Aktywne - primary
        inProgress: '#f59e0b',  // W trakcie - yellow
        old: '#f97316',         // Stare - orange
        archived: '#6b7280',    // Archiwalne - gray
    },

    // Kolory priorytetów (używające istniejących kolorów)
    priority: {
        high: '#ef4444',        // Wysoki - red
        medium: '#f59e0b',      // Średni - yellow
        low: '#6b7280',         // Niski - gray
        normal: '#6b7280',      // Normalny - gray
    },
};