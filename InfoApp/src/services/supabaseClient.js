import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://twoja-instancja.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'twoj-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
    },
});

export const getCurrentTimestamp = () => new Date().toISOString();

export const handleSupabaseError = (error, operation) => {
    console.error(`Error in ${operation}:`, error);
    return {
        success: false,
        error: error.message || 'Wystąpił nieoczekiwany błąd'
    };
};

export const handleSupabaseSuccess = (data, operation) => {
    console.log(`Success in ${operation}:`, data);
    return {
        success: true,
        data
    };
};