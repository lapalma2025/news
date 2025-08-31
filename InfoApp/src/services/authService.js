// src/services/authService.js
import { supabase } from './supabaseClient';

export const authService = {
    // Sprawdź aktualnego użytkownika
    async getCurrentUser() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            return session?.user || null;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    },

    // Sprawdź czy użytkownik jest zalogowany
    async isUserAuthenticated() {
        const user = await this.getCurrentUser();
        return user !== null;
    },

    // Pobierz dane użytkownika z metadata
    async getUserProfile() {
        const user = await this.getCurrentUser();
        if (!user) return null;

        return {
            id: user.id,
            email: user.email,
            displayName: user.user_metadata.full_name || user.email,
            photoURL: user.user_metadata.avatar_url,
            provider: user.app_metadata.provider,
            createdAt: user.created_at,
            isAnonymous: false
        };
    },

    // Wylogowanie
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    },

    // Nasłuchiwanie zmian stanu autentykacji
    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange(callback);
    },

    // Sprawdź czy użytkownik może dodawać komentarze
    async canUserComment() {
        return await this.isUserAuthenticated();
    },

    // Pobierz nazwę użytkownika do wyświetlania
    async getDisplayName() {
        const profile = await this.getUserProfile();
        return profile?.displayName || 'Anonim';
    },

    // Aktualizuj profil użytkownika
    async updateUserProfile(updates) {
        try {
            const { error } = await supabase.auth.updateUser({
                data: updates
            });

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Update profile error:', error);
            return { success: false, error: error.message };
        }
    }
};