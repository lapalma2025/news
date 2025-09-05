// src/hooks/useGoogleLogin.js
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useMemo } from 'react';
import { Alert, Platform } from 'react-native';
import { supabase } from '../services/supabaseClient';

WebBrowser.maybeCompleteAuthSession();

// WEB client (GCP: OAuth 2.0 Client IDs → Web application z redirectem https://auth.expo.io/@mzborowski/wiem)
const GOOGLE_WEB_CLIENT_ID =
    '443651685443-vgrjqdqlqtch3btggsturp5vsdq03mna.apps.googleusercontent.com';

// MUSI odpowiadać app.json → { "owner": "mzborowski", "slug": "wiem" }
const PROJECT_SLUG = '@mzborowski/wiem';

const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
};

export function useGoogleLogin() {
    // Stały nonce na czas jednej sesji logowania
    const nonce = useMemo(() => Math.random().toString(36).slice(2), []);

    // 1) Spróbuj wygenerować URI proxy
    const generatedProxyUri = AuthSession.makeRedirectUri({
        useProxy: true,
        projectNameForProxy: PROJECT_SLUG,
    });

    // 2) Fallback na twarde proxy, jeśli z jakiegoś powodu makeRedirectUri zwraca exp://
    const hardcodedProxyUri = `https://auth.expo.io/${PROJECT_SLUG}`;

    const REDIRECT_URI =
        generatedProxyUri?.startsWith('https://auth.expo.io/')
            ? generatedProxyUri
            : hardcodedProxyUri;

    console.log('[OIDC] Boot', {
        platform: Platform.OS,
        GOOGLE_WEB_CLIENT_ID,
        generatedProxyUri,
        hardcodedProxyUri,
        REDIRECT_URI_IN_USE: REDIRECT_URI,
        nonce,
    });

    if (!REDIRECT_URI.startsWith('https://auth.expo.io/')) {
        console.log(
            '[WARN] Redirect nadal NIE jest proxy. Upewnij się, że uruchamiasz w Expo Go i odpalasz: `expo start --tunnel -c`'
        );
    }

    const [request, result, promptAsync] = AuthSession.useAuthRequest(
        {
            clientId: GOOGLE_WEB_CLIENT_ID,                 // WEB client
            responseType: AuthSession.ResponseType.IdToken, // implicit id_token (OIDC)
            scopes: ['openid', 'profile', 'email'],         // tylko podstawowe scope’y
            extraParams: { nonce, prompt: 'select_account' },
            redirectUri: REDIRECT_URI,                      // → proxy (albo fallback proxy)
            usePKCE: false,                                 // przy id_token wyłącz PKCE
        },
        discovery
    );

    // Co WYCHODZI do Google
    useEffect(() => {
        if (!request) return;
        console.log('[OIDC] Request built', {
            url: request.url,
            redirectUri: REDIRECT_URI,
            clientId: GOOGLE_WEB_CLIENT_ID,
        });
    }, [request]);

    // Co WRACA z Google → logowanie do Supabase
    useEffect(() => {
        if (!result) return;

        console.log('[OIDC] Result raw:', JSON.stringify(result, null, 2));

        if (result.type !== 'success') {
            const err = result.params?.error || result.error;
            const desc =
                result.params?.error_description ||
                result.error_description ||
                'Brak opisu błędu';

            console.log('[OIDC] Non-success', { type: result.type, error: err, error_description: desc });

            if (/redirect_uri/i.test(desc)) {
                console.log('[HINT] GCP → Credentials → Web client (Expo Proxy) → Authorized redirect URIs = https://auth.expo.io/@mzborowski/wiem');
            }
            if (err === 'access_denied' || /blocked/i.test(desc)) {
                console.log('[HINT] OAuth consent screen = Testing + dodaj swój e-mail do Test users.');
            }
            if (err === 'unauthorized_client') {
                console.log('[HINT] Używasz złego klienta (np. Android). Trzymaj się WEB clienta.');
            }

            Alert.alert('Logowanie przerwane', desc);
            return;
        }

        const idToken = result.params?.id_token;
        if (!idToken) {
            console.log('[OIDC] Success bez id_token? params=', result.params);
            Alert.alert('Błąd', 'Brak id_token z Google');
            return;
        }

        (async () => {
            console.log('[OIDC] Supabase signInWithIdToken…', { nonceLen: nonce.length });
            const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: idToken,
                nonce,
            });
            if (error) {
                console.log('[OIDC] Supabase error:', { name: error.name, message: error.message, status: error.status });
                Alert.alert('❌ Błąd', 'Nie udało się zalogować w Supabase (szczegóły w konsoli).');
                return;
            }
            console.log('[OIDC] Supabase SIGNED_IN user:', data?.user?.email);
            Alert.alert('✅ Sukces', 'Zalogowano przez Google!');
        })();
    }, [result, nonce]);

    // Start logowania
    const login = async () => {
        try {
            console.log('[OIDC] promptAsync →', {
                willUseProxy: true,
                redirectUri: REDIRECT_URI,
                projectNameForProxy: PROJECT_SLUG,
            });
            const r = await promptAsync({ useProxy: true, projectNameForProxy: PROJECT_SLUG });
            console.log('[OIDC] promptAsync immediate return:', JSON.stringify(r, null, 2));
        } catch (e) {
            console.log('[OIDC] promptAsync threw:', String(e));
            Alert.alert('Błąd', 'Nie udało się uruchomić logowania Google');
        }
    };

    return { request, login };
}
