(function () {
    if (window.PlanApiClient) return;

    const PROD_API_BASE = 'https://first-project-a31a.onrender.com/api';
    const FALLBACK_BASE = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
        ? 'http://127.0.0.1:8000/api'
        : PROD_API_BASE;
    const USER_KEY = 'planUserId';
    const USER_DRAFT_KEY = 'planUserIdDraft';

    function getPlanApiBase() {
        return localStorage.getItem('planApiBase') || FALLBACK_BASE;
    }

    function getPlanUserId() {
        const explicit = localStorage.getItem(USER_KEY) || localStorage.getItem(USER_DRAFT_KEY) || '';
        return explicit.trim();
    }

    function setPlanUserId(userId) {
        const value = String(userId || '').trim();
        if (!value) {
            localStorage.removeItem(USER_KEY);
            localStorage.removeItem(USER_DRAFT_KEY);
            return;
        }

        localStorage.setItem(USER_KEY, value);
        localStorage.setItem(USER_DRAFT_KEY, value);
    }

    function buildUrl(path, base = getPlanApiBase()) {
        const url = new URL(`${base}${path}`);
        const userId = getPlanUserId();
        if (userId) {
            url.searchParams.set('user_id', userId);
        }
        return url.toString();
    }

    async function request(path, options = {}, base = getPlanApiBase()) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const userId = getPlanUserId();

        try {
            const headers = {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            };
            if (userId) {
                headers['X-User-ID'] = userId;
            }

            const response = await fetch(buildUrl(path, base), {
                ...options,
                headers,
                signal: controller.signal
            });

            if (!response.ok) return null;
            return await response.json();
        } catch (_) {
            return null;
        } finally {
            clearTimeout(timeout);
        }
    }

    window.PlanApiClient = {
        getPlanApiBase,
        getPlanUserId,
        setPlanUserId,
        buildUrl,
        request
    };
})();
