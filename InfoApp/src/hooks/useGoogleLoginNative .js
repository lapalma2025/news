import { useCallback, useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabase } from '../services/supabaseClient';

// Twój WEB client ID (z Google Cloud Console – taki sam jak wcześniej)
const WEB_CLIENT_ID =
    '443651685443-vgrjqdqlqtch3btggsturp5vsdq03mna.apps.googleusercontent.com';

export function useGoogleLoginNative() {
    // upewnij się, że configure() nie wykona się wielokrotnie
    const configuredRef = useRef(false);

    useEffect(() => {
        if (configuredRef.current) return;

        GoogleSignin.configure({
            webClientId: WEB_CLIENT_ID, // wymagane, by dostać idToken na Androidzie
            offlineAccess: false,
            forceCodeForRefreshToken: false,
        });

        configuredRef.current = true;
    }, []);

    const login = useCallback(async () => {
        try {
            // upewnij się, że są Google Play Services
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

            // ⬇️ KLUCZ: wyczyść poprzednią sesję, żeby ZAWSZE pokazać okno wyboru konta
            try {
                await GoogleSignin.signOut();
            } catch { }

            // natywne okno wyboru konta
            const userInfo = await GoogleSignin.signIn();

            // pobierz tokeny
            const tokens = await GoogleSignin.getTokens(); // { idToken?, accessToken? }
            const idToken = userInfo?.idToken || tokens?.idToken;
            const accessToken = tokens?.accessToken;

            if (!idToken) {
                Alert.alert('Błąd', 'Nie udało się uzyskać idToken z Google.');
                return;
            }

            // zaloguj do Supabase przy użyciu ID Tokena Google
            const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: idToken,
                // access_token nie jest wymagany, ale jeśli mamy – dołączamy
                access_token: accessToken,
            });

            if (error) {
                console.log('[Supabase] signInWithIdToken error:', error);
                Alert.alert('❌ Błąd', error.message || 'Logowanie nie powiodło się.');
                return;
            }

            // opcjonalnie: zaktualizuj profil w Supabase (avatar, imię)
            const displayName = userInfo?.user?.name;
            const avatarUrl = userInfo?.user?.photo;
            if (displayName || avatarUrl) {
                try {
                    await supabase.auth.updateUser({
                        data: {
                            full_name: displayName,
                            avatar_url: avatarUrl,
                        },
                    });
                } catch { }
            }

            // Nie musisz nic więcej robić – Twój onAuthStateChange w ProfileScreen odświeży UI.
            // Alert opcjonalny:
            // Alert.alert('✅ Sukces', `Zalogowano jako ${userInfo?.user?.email || 'użytkownik'}`);
        } catch (e) {
            console.log('[GoogleSignin] error:', e);
            // Kod 12501 = user cancelled na Androidzie – nie pokazuj błędu
            const msg =
                (Platform.OS === 'android' && `${e?.code}` === '12501')
                    ? null
                    : (e?.message || 'Nie udało się uruchomić logowania Google.');
            if (msg) Alert.alert('Błąd', msg);
        }
    }, []);

    return { login };
}
