// src/utils/dateUtils.js

/**
 * Formatuje datę w sposób relatywny (np. "2h temu", "wczoraj")
 * @param {string|Date} timestamp - Data do sformatowania
 * @returns {string} Sformatowana data
 */
export const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
        return 'teraz';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes}m temu`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours}h temu`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) {
        return 'wczoraj';
    }

    if (diffInDays < 7) {
        return `${diffInDays} dni temu`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
        return `${diffInWeeks} ${diffInWeeks === 1 ? 'tydzień' : 'tygodnie'} temu`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return `${diffInMonths} ${getMonthsPolishForm(diffInMonths)} temu`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} ${getYearsPolishForm(diffInYears)} temu`;
};

/**
 * Formatuje datę w formacie DD.MM.YYYY
 * @param {string|Date} timestamp - Data do sformatowania
 * @returns {string} Sformatowana data
 */
export const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
};

/**
 * Formatuje datę w formacie DD MMMM YYYY
 * @param {string|Date} timestamp - Data do sformatowania
 * @returns {string} Sformatowana data
 */
export const formatDateLong = (timestamp) => {
    const date = new Date(timestamp);
    const months = [
        'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
        'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
};

/**
 * Formatuje czas w formacie HH:MM
 * @param {string|Date} timestamp - Data do sformatowania
 * @returns {string} Sformatowany czas
 */
export const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes}`;
};

/**
 * Formatuje datę i czas w formacie DD.MM.YYYY, HH:MM
 * @param {string|Date} timestamp - Data do sformatowania
 * @returns {string} Sformatowana data i czas
 */
export const formatDateTime = (timestamp) => {
    return `${formatDate(timestamp)}, ${formatTime(timestamp)}`;
};

/**
 * Formatuje datę i czas w długim formacie
 * @param {string|Date} timestamp - Data do sformatowania
 * @returns {string} Sformatowana data i czas
 */
export const formatDateTimeLong = (timestamp) => {
    return `${formatDateLong(timestamp)}, ${formatTime(timestamp)}`;
};

/**
 * Sprawdza czy data jest dzisiaj
 * @param {string|Date} timestamp - Data do sprawdzenia
 * @returns {boolean} True jeśli data jest dzisiaj
 */
export const isToday = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();

    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    );
};

/**
 * Sprawdza czy data jest wczoraj
 * @param {string|Date} timestamp - Data do sprawdzenia
 * @returns {boolean} True jeśli data jest wczoraj
 */
export const isYesterday = (timestamp) => {
    const date = new Date(timestamp);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    return (
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear()
    );
};

/**
 * Sprawdza czy data jest w tym tygodniu
 * @param {string|Date} timestamp - Data do sprawdzenia
 * @returns {boolean} True jeśli data jest w tym tygodniu
 */
export const isThisWeek = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Poniedziałek
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Niedziela
    endOfWeek.setHours(23, 59, 59, 999);

    return date >= startOfWeek && date <= endOfWeek;
};

/**
 * Zwraca nazwę dnia tygodnia
 * @param {string|Date} timestamp - Data
 * @returns {string} Nazwa dnia tygodnia
 */
export const getDayName = (timestamp) => {
    const date = new Date(timestamp);
    const days = [
        'niedziela', 'poniedziałek', 'wtorek', 'środa',
        'czwartek', 'piątek', 'sobota'
    ];

    return days[date.getDay()];
};

/**
 * Zwraca inteligentne formatowanie daty
 * @param {string|Date} timestamp - Data do sformatowania
 * @returns {string} Inteligentnie sformatowana data
 */
export const formatSmartDate = (timestamp) => {
    if (isToday(timestamp)) {
        return `Dziś, ${formatTime(timestamp)}`;
    }

    if (isYesterday(timestamp)) {
        return `Wczoraj, ${formatTime(timestamp)}`;
    }

    if (isThisWeek(timestamp)) {
        return `${getDayName(timestamp)}, ${formatTime(timestamp)}`;
    }

    return formatDateTime(timestamp);
};

/**
 * Zwraca różnicę w dniach między dwiema datami
 * @param {string|Date} date1 - Pierwsza data
 * @param {string|Date} date2 - Druga data
 * @returns {number} Różnica w dniach
 */
export const getDaysDifference = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Sprawdza czy data jest w przyszłości
 * @param {string|Date} timestamp - Data do sprawdzenia
 * @returns {boolean} True jeśli data jest w przyszłości
 */
export const isFuture = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    return date > now;
};

/**
 * Sprawdza czy data jest w przeszłości
 * @param {string|Date} timestamp - Data do sprawdzenia
 * @returns {boolean} True jeśli data jest w przeszłości
 */
export const isPast = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    return date < now;
};

/**
 * Dodaje określoną liczbę dni do daty
 * @param {string|Date} timestamp - Data bazowa
 * @param {number} days - Liczba dni do dodania
 * @returns {Date} Nowa data
 */
export const addDays = (timestamp, days) => {
    const date = new Date(timestamp);
    date.setDate(date.getDate() + days);
    return date;
};

/**
 * Odejmuje określoną liczbę dni od daty
 * @param {string|Date} timestamp - Data bazowa
 * @param {number} days - Liczba dni do odjęcia
 * @returns {Date} Nowa data
 */
export const subtractDays = (timestamp, days) => {
    const date = new Date(timestamp);
    date.setDate(date.getDate() - days);
    return date;
};

/**
 * Zwraca początek dnia (00:00:00)
 * @param {string|Date} timestamp - Data
 * @returns {Date} Początek dnia
 */
export const getStartOfDay = (timestamp) => {
    const date = new Date(timestamp);
    date.setHours(0, 0, 0, 0);
    return date;
};

/**
 * Zwraca koniec dnia (23:59:59)
 * @param {string|Date} timestamp - Data
 * @returns {Date} Koniec dnia
 */
export const getEndOfDay = (timestamp) => {
    const date = new Date(timestamp);
    date.setHours(23, 59, 59, 999);
    return date;
};

/**
 * Zwraca aktualną datę w formacie ISO string
 * @returns {string} Aktualna data w formacie ISO
 */
export const getCurrentTimestamp = () => {
    return new Date().toISOString();
};

/**
 * Parsuje datę z różnych formatów
 * @param {string|Date|number} input - Wejściowa data
 * @returns {Date|null} Sparsowana data lub null w przypadku błędu
 */
export const parseDate = (input) => {
    try {
        if (!input) return null;

        if (input instanceof Date) {
            return input;
        }

        if (typeof input === 'number') {
            return new Date(input);
        }

        if (typeof input === 'string') {
            return new Date(input);
        }

        return null;
    } catch (error) {
        console.error('Error parsing date:', error);
        return null;
    }
};

/**
 * Sprawdza czy data jest poprawna
 * @param {any} date - Data do sprawdzenia
 * @returns {boolean} True jeśli data jest poprawna
 */
export const isValidDate = (date) => {
    const parsedDate = parseDate(date);
    return parsedDate instanceof Date && !isNaN(parsedDate);
};

/**
 * Zwraca polską formę dla miesięcy
 * @param {number} count - Liczba miesięcy
 * @returns {string} Poprawna forma polska
 */
const getMonthsPolishForm = (count) => {
    if (count === 1) return 'miesiąc';
    if (count >= 2 && count <= 4) return 'miesiące';
    return 'miesięcy';
};

/**
 * Zwraca polską formę dla lat
 * @param {number} count - Liczba lat
 * @returns {string} Poprawna forma polska
 */
const getYearsPolishForm = (count) => {
    if (count === 1) return 'rok';
    if (count >= 2 && count <= 4) return 'lata';
    return 'lat';
};

/**
 * Formatuje okres czasu między dwiema datami
 * @param {string|Date} startDate - Data początkowa
 * @param {string|Date} endDate - Data końcowa
 * @returns {string} Sformatowany okres
 */
export const formatDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffInSeconds = Math.floor((end - start) / 1000);

    if (diffInSeconds < 60) {
        return `${diffInSeconds} sek`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} min`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} godz`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} dni`;
};

/**
 * Zwraca tablicę dat w określonym zakresie
 * @param {string|Date} startDate - Data początkowa
 * @param {string|Date} endDate - Data końcowa
 * @returns {Date[]} Tablica dat
 */
export const getDateRange = (startDate, endDate) => {
    const dates = [];
    const currentDate = new Date(startDate);
    const lastDate = new Date(endDate);

    while (currentDate <= lastDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
};

/**
 * Grupuje elementy według daty (dziś, wczoraj, starsze)
 * @param {Array} items - Elementy z właściwością timestamp
 * @param {string} timestampKey - Klucz właściwości z timestamp
 * @returns {Object} Pogrupowane elementy
 */
export const groupByDate = (items, timestampKey = 'created_at') => {
    const today = [];
    const yesterday = [];
    const older = [];

    items.forEach(item => {
        const timestamp = item[timestampKey];

        if (isToday(timestamp)) {
            today.push(item);
        } else if (isYesterday(timestamp)) {
            yesterday.push(item);
        } else {
            older.push(item);
        }
    });

    return {
        today: today.length > 0 ? { title: 'Dziś', items: today } : null,
        yesterday: yesterday.length > 0 ? { title: 'Wczoraj', items: yesterday } : null,
        older: older.length > 0 ? { title: 'Starsze', items: older } : null,
    };
};