import { useCallback } from 'react';
import { Alert } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabase } from '../services/supabaseClient';

// to jest Twój *WEB* client ID (zostaje ten sam):
const WEB_CLIENT_ID = '443651685443-vgrjqdqlqtch3btggsturp5vsdq03mna.apps.googleusercontent.com';

export function useGoogleLoginNative() {
    // konfiguracja raz
    GoogleSignin.configure({
        webClientId: WEB_CLIENT_ID,     // wymagane do idToken na Androidzie
        offlineAccess: false,
        forceCodeForRefreshToken: false,
    });

    const login = useCallback(async () => {
        try {
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

            // otwiera natywne okno wyboru konta
            const user = await GoogleSignin.signIn();

            // z niektórych wersji bierzemy też accessToken
            const tokens = await GoogleSignin.getTokens(); // { idToken?, accessToken? }

            const idToken = user?.idToken || tokens?.idToken;
            const accessToken = tokens?.accessToken;

            if (!idToken) {
                Alert.alert('Błąd', 'Brak idToken z Google');
                return;
            }

            // logowanie w Supabase ID Tokenem
            const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: idToken,
                // access_token bywa pomocny przy Google (opcjonalny w JS, ale dorzucamy jeśli jest)
                access_token: accessToken,
            });

            if (error) {
                console.log('[Supabase] signInWithIdToken error:', error);
                Alert.alert('❌ Błąd', error.message || 'Logowanie nie powiodło się');
                return;
            }

            Alert.alert('✅ Sukces', `Zalogowano jako ${data?.user?.email || 'użytkownik'}`);
        } catch (e) {
            console.log('[GoogleSignin] error:', e);
            Alert.alert('Błąd', 'Nie udało się uruchomić logowania Google');
        }
    }, []);

    return { login };
}
