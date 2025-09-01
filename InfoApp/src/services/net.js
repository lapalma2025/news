import { Platform } from 'react-native';

export async function fetchJson(url, opts = {}, timeoutMs = 15000) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

    const defaultHeaders = {
        Accept: 'application/json',
        'User-Agent': `InfoApp/${Platform.OS}; RN`,
    };

    try {
        const res = await fetch(url, {
            ...opts,
            headers: { ...defaultHeaders, ...(opts.headers || {}) },
            cache: 'no-store',
            signal: controller.signal,
        });

        if (!res.ok) {
            let text = '';
            try { text = await res.text(); } catch (_) { }
            throw new Error(
                `HTTP ${res.status} ${res.statusText} @ ${url} :: ${String(text).slice(0, 200)}`
            );
        }

        return await res.json();
    } catch (e) {
        // przydatne logi na urządzeniu
        console.error('[fetchJson] ERROR', {
            url,
            message: e && e.message,
            name: e && e.name,
        });
        throw e;
    } finally {
        clearTimeout(t);
    }
}

export default { fetchJson };
