// src/services/userService.js - Z funkcją śledzenia polityków
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '../utils/helpers';

const USER_KEY = '@infoapp:user';
const SETTINGS_KEY = '@infoapp:settings';

export const userService = {
    // Pobierz lub utwórz lokalnego użytkownika
    async getCurrentUser() {
        try {
            const userData = await AsyncStorage.getItem(USER_KEY);

            if (userData) {
                return JSON.parse(userData);
            } else {
                // Utwórz nowego anonimowego użytkownika
                const newUser = {
                    id: generateId(12),
                    anonymousId: `Anonim#${Math.floor(Math.random() * 9999)}`,
                    displayName: `Anonim#${Math.floor(Math.random() * 9999)}`,
                    isAnonymous: true,
                    createdAt: new Date().toISOString(),
                    preferences: {
                        theme: 'light',
                        notifications: true,
                        autoRefresh: true,
                    },
                    stats: {
                        readArticles: 0,
                        likedPosts: 0,
                        comments: 0,
                        favoriteArticles: [],
                        readHistory: [],
                    },
                    followedPoliticians: [], // ← DODANE
                };

                await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));
                return newUser;
            }
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    },

    // Zaktualizuj dane użytkownika
    async updateUser(updates) {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) return null;

            const updatedUser = {
                ...currentUser,
                ...updates,
                updatedAt: new Date().toISOString(),
            };

            await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
            return updatedUser;
        } catch (error) {
            console.error('Error updating user:', error);
            return null;
        }
    },

    // Zaktualizuj statystyki użytkownika
    async updateStats(statType, value) {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) return null;

            const updatedStats = {
                ...currentUser.stats,
                [statType]: value,
            };

            return await this.updateUser({ stats: updatedStats });
        } catch (error) {
            console.error('Error updating stats:', error);
            return null;
        }
    },

    // Dodaj artykuł do ulubionych
    async addToFavorites(articleId, articleType = 'news') {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) return false;

            const favorites = currentUser.stats.favoriteArticles || [];
            const newFavorite = {
                id: articleId,
                type: articleType,
                addedAt: new Date().toISOString(),
            };

            const updatedFavorites = [...favorites, newFavorite];
            await this.updateStats('favoriteArticles', updatedFavorites);
            return true;
        } catch (error) {
            console.error('Error adding to favorites:', error);
            return false;
        }
    },

    // Usuń z ulubionych
    async removeFromFavorites(articleId) {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) return false;

            const favorites = currentUser.stats.favoriteArticles || [];
            const updatedFavorites = favorites.filter(fav => fav.id !== articleId);

            await this.updateStats('favoriteArticles', updatedFavorites);
            return true;
        } catch (error) {
            console.error('Error removing from favorites:', error);
            return false;
        }
    },

    // Sprawdź czy artykuł jest w ulubionych
    async isFavorite(articleId) {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) return false;

            const favorites = currentUser.stats.favoriteArticles || [];
            return favorites.some(fav => fav.id === articleId);
        } catch (error) {
            return false;
        }
    },

    // ===== NOWE FUNKCJE DLA ŚLEDZENIA POLITYKÓW =====

    // Dodaj polityka do śledzonych
    async followPolitician(politicianId, politicianName, politicianParty) {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) return false;

            const followed = currentUser.followedPoliticians || [];

            // Sprawdź czy już śledzi
            if (followed.some(p => p.id === politicianId)) {
                return true; // Już śledzi
            }

            const newFollowed = [...followed, {
                id: politicianId,
                name: politicianName,
                party: politicianParty,
                followedAt: new Date().toISOString(),
            }];

            await this.updateUser({ followedPoliticians: newFollowed });
            return true;
        } catch (error) {
            console.error('Error following politician:', error);
            return false;
        }
    },

    // Przestań śledzić polityka
    async unfollowPolitician(politicianId) {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) return false;

            const followed = currentUser.followedPoliticians || [];
            const updatedFollowed = followed.filter(p => p.id !== politicianId);

            await this.updateUser({ followedPoliticians: updatedFollowed });
            return true;
        } catch (error) {
            console.error('Error unfollowing politician:', error);
            return false;
        }
    },

    // Sprawdź czy śledzi polityka
    async isFollowingPolitician(politicianId) {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) return false;

            const followed = currentUser.followedPoliticians || [];
            return followed.some(p => p.id === politicianId);
        } catch (error) {
            return false;
        }
    },

    // Pobierz listę śledzonych polityków
    async getFollowedPoliticians() {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) return [];

            return currentUser.followedPoliticians || [];
        } catch (error) {
            console.error('Error getting followed politicians:', error);
            return [];
        }
    },

    // Dodaj do historii czytania
    async addToReadHistory(articleId, articleTitle, articleType = 'news') {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) return false;

            const history = currentUser.stats.readHistory || [];
            const newEntry = {
                id: articleId,
                title: articleTitle,
                type: articleType,
                readAt: new Date().toISOString(),
            };

            // Usuń duplikaty i dodaj na początek
            const filteredHistory = history.filter(item => item.id !== articleId);
            const updatedHistory = [newEntry, ...filteredHistory].slice(0, 100); // Zachowaj tylko 100 ostatnich

            await this.updateStats('readHistory', updatedHistory);
            await this.updateStats('readArticles', (currentUser.stats.readArticles || 0) + 1);
            return true;
        } catch (error) {
            console.error('Error adding to read history:', error);
            return false;
        }
    },

    // Zwiększ licznik komentarzy
    async incrementComments() {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) return false;

            const newCount = (currentUser.stats.comments || 0) + 1;
            await this.updateStats('comments', newCount);
            return true;
        } catch (error) {
            console.error('Error incrementing comments:', error);
            return false;
        }
    },

    // Zwiększ licznik polubień
    async incrementLikes() {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) return false;

            const newCount = (currentUser.stats.likedPosts || 0) + 1;
            await this.updateStats('likedPosts', newCount);
            return true;
        } catch (error) {
            console.error('Error incrementing likes:', error);
            return false;
        }
    },

    // Pobierz ustawienia użytkownika
    async getSettings() {
        try {
            const currentUser = await this.getCurrentUser();
            return currentUser?.preferences || {};
        } catch (error) {
            console.error('Error getting settings:', error);
            return {};
        }
    },

    // Zaktualizuj ustawienia
    async updateSettings(newSettings) {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) return false;

            const updatedPreferences = {
                ...currentUser.preferences,
                ...newSettings,
            };

            await this.updateUser({ preferences: updatedPreferences });
            return true;
        } catch (error) {
            console.error('Error updating settings:', error);
            return false;
        }
    },

    // Resetuj dane użytkownika (dla testów)
    async resetUser() {
        try {
            await AsyncStorage.removeItem(USER_KEY);
            await AsyncStorage.removeItem(SETTINGS_KEY);
            return true;
        } catch (error) {
            console.error('Error resetting user:', error);
            return false;
        }
    },

    // Wyeksportuj dane użytkownika
    async exportUserData() {
        try {
            const currentUser = await this.getCurrentUser();
            return currentUser;
        } catch (error) {
            console.error('Error exporting user data:', error);
            return null;
        }
    },

    // Pobierz statystyki dla profilu
    async getUserStats() {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) return null;

            return {
                readArticles: currentUser.stats.readArticles || 0,
                favoriteArticles: (currentUser.stats.favoriteArticles || []).length,
                comments: currentUser.stats.comments || 0,
                likedPosts: currentUser.stats.likedPosts || 0,
                followedPoliticians: (currentUser.followedPoliticians || []).length,
            };
        } catch (error) {
            console.error('Error getting user stats:', error);
            return null;
        }
    }
};