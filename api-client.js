(function () {
    if (window.PlanApiClient) return;

    const LANG_KEY = 'planLang';
    const THEME_KEY = 'planTheme';

    function ensurePlanSettings() {
        if (window.PlanSettings) return window.PlanSettings;

        function getLang() {
            const lang = localStorage.getItem(LANG_KEY) || 'ru';
            return ['ru', 'uk', 'en'].includes(lang) ? lang : 'ru';
        }

        function setLang(lang) {
            const safe = ['ru', 'uk', 'en'].includes(lang) ? lang : 'ru';
            localStorage.setItem(LANG_KEY, safe);
            return safe;
        }

        function getTheme() {
            return (localStorage.getItem(THEME_KEY) || 'dark') === 'light' ? 'light' : 'dark';
        }

        function setTheme(theme) {
            const safe = theme === 'light' ? 'light' : 'dark';
            localStorage.setItem(THEME_KEY, safe);
            return safe;
        }

        function applyThemeClass(target = document.body) {
            if (!target) return;
            target.classList.toggle('light-theme', getTheme() === 'light');
        }

        function translate(translations = {}) {
            const lang = getLang();
            const dict = translations[lang] || translations.ru || {};
            document.documentElement.lang = lang;
            document.querySelectorAll('[data-i18n]').forEach((el) => {
                const key = el.getAttribute('data-i18n');
                if (!key) return;
                const value = dict[key];
                if (typeof value === 'string') el.textContent = value;
            });
            return lang;
        }

        window.PlanSettings = { getLang, setLang, getTheme, setTheme, applyThemeClass, translate };
        return window.PlanSettings;
    }

    function ensureGlobalLightThemeStyle() {
        if (document.getElementById('plan-global-light-theme-style')) return;
        const style = document.createElement('style');
        style.id = 'plan-global-light-theme-style';
        style.textContent = `
            body.light-theme {
                background: linear-gradient(135deg, #f5f8ff, #eef3ff, #e9f0ff) !important;
                color: #1f2a44 !important;
            }
            body.light-theme .navbar,
            body.light-theme .topbar,
            body.light-theme .panel,
            body.light-theme .card,
            body.light-theme .module,
            body.light-theme .quest,
            body.light-theme .profile-container,
            body.light-theme .level-section,
            body.light-theme .chart-container,
            body.light-theme .timeline-container,
            body.light-theme .weekly-stats-container,
            body.light-theme .hero,
            body.light-theme .day-card,
            body.light-theme .progress-wrapper,
            body.light-theme .secrets-panel {
                background: rgba(255,255,255,0.92) !important;
                color: #1f2a44 !important;
                border-color: rgba(71, 96, 170, 0.25) !important;
            }
            body.light-theme p,
            body.light-theme .hint,
            body.light-theme .small,
            body.light-theme .stat-label,
            body.light-theme .bar-label,
            body.light-theme .task-text,
            body.light-theme .day-info-text,
            body.light-theme .upgrade-desc,
            body.light-theme .xp-text,
            body.light-theme label {
                color: #2f3d63 !important;
            }
        `;
        document.head.appendChild(style);
    }

    function applyCommonTextLocalization() {
        const settings = ensurePlanSettings();
        const lang = settings.getLang();
        document.documentElement.lang = lang;
        if (lang === 'ru') return;

        const maps = {
            uk: {
                '⚙️ Настройки': '⚙️ Налаштування',
                '⚙️ НАСТРОЙКИ': '⚙️ НАЛАШТУВАННЯ',
                '← Назад': '← Назад',
                '← Назад на главную': '← Назад на головну',
                '⬅️ Назад в план': '⬅️ Назад до плану',
                '👤 Профиль': '👤 Профіль',
                '✅ Проверка': '✅ Перевірка',
                '📋 План': '📋 План',
                'Выйти': 'Вийти',
                'Сбросить всё': 'Скинути все'
            },
            en: {
                '⚙️ Настройки': '⚙️ Settings',
                '⚙️ НАСТРОЙКИ': '⚙️ SETTINGS',
                '← Назад': '← Back',
                '← Назад на главную': '← Back to main',
                '⬅️ Назад в план': '⬅️ Back to plan',
                '👤 Профиль': '👤 Profile',
                '✅ Проверка': '✅ Check',
                '📋 План': '📋 Plan',
                'Выйти': 'Logout',
                'Сбросить всё': 'Reset all'
            }
        };

        const dict = maps[lang] || {};
        if (!Object.keys(dict).length) return;

        const elements = document.querySelectorAll('button, a, span, h1, h2, h3, p, .stat-value, .title, .navbar-title, .topbar-title');
        elements.forEach((el) => {
            if (el.hasAttribute('data-i18n')) return;
            const raw = (el.textContent || '').trim();
            if (!raw) return;
            const mapped = dict[raw];
            if (mapped) el.textContent = mapped;
        });
    }

    function autoApplyAppPreferences() {
        const settings = ensurePlanSettings();
        ensureGlobalLightThemeStyle();
        settings.applyThemeClass(document.body);
        applyCommonTextLocalization();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoApplyAppPreferences, { once: true });
    } else {
        autoApplyAppPreferences();
    }

    const PROD_API_BASE = 'https://first-project-1-ec9k.onrender.com/api';
    const FALLBACK_BASE = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
        ? 'http://127.0.0.1:8000/api'
        : PROD_API_BASE;
    const USER_KEY = 'planUserId';
    const USER_DRAFT_KEY = 'planUserIdDraft';
    const AUTH_TOKEN_KEY = 'planAuthToken';

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

    function getAuthToken() {
        return localStorage.getItem(AUTH_TOKEN_KEY) || '';
    }

    function setAuthToken(token) {
        const value = String(token || '').trim();
        if (!value) {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            return;
        }
        localStorage.setItem(AUTH_TOKEN_KEY, value);
    }

    function clearAuth() {
        setAuthToken('');
        setPlanUserId('');
    }

    function buildUrl(path, base = getPlanApiBase()) {
        const url = new URL(`${base}${path}`);
        const userId = getPlanUserId();
        if (userId) {
            url.searchParams.set('user_id', userId);
        }
        return url.toString();
    }

    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function request(path, options = {}, base = getPlanApiBase()) {
        const userId = getPlanUserId();
        const authToken = getAuthToken();
        const method = String(options.method || 'GET').toUpperCase();
        const isAuthPath = String(path || '').startsWith('/auth/');
        const maxAttempts = isAuthPath ? 3 : 1;
        const timeoutMs = isAuthPath ? 15000 : 8000;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), timeoutMs);

            try {
                const headers = {
                    'Content-Type': 'application/json',
                    ...(options.headers || {})
                };
                if (userId) {
                    headers['X-User-ID'] = userId;
                }
                if (authToken) {
                    headers['Authorization'] = `Bearer ${authToken}`;
                }

                const response = await fetch(buildUrl(path, base), {
                    ...options,
                    headers,
                    signal: controller.signal
                });

                if (!response.ok) {
                    const canRetry = attempt < maxAttempts && response.status >= 500 && method === 'GET';
                    if (canRetry) {
                        await sleep(800 * attempt);
                        continue;
                    }
                    return null;
                }

                return await response.json();
            } catch (_) {
                if (attempt < maxAttempts && method === 'GET') {
                    await sleep(800 * attempt);
                    continue;
                }
                return null;
            } finally {
                clearTimeout(timeout);
            }
        }

        return null;
    }

    async function register({ email, password, display_name }, base = getPlanApiBase()) {
        const data = await request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, display_name })
        }, base);

        if (data?.access_token) {
            setAuthToken(data.access_token);
            if (data.user_id) setPlanUserId(data.user_id);
        }
        return data;
    }

    async function login({ email, password }, base = getPlanApiBase()) {
        const data = await request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        }, base);

        if (data?.access_token) {
            setAuthToken(data.access_token);
            if (data.user_id) setPlanUserId(data.user_id);
        }
        return data;
    }

    async function me(base = getPlanApiBase()) {
        return request('/auth/me', { method: 'GET' }, base);
    }

    async function ensureAuthOrRedirect({
        next = (window.location.pathname.split('/').pop() || '30d-main-tasks.html'),
        redirectTo = 'auth.html',
        base = getPlanApiBase()
    } = {}) {
        const token = getAuthToken();
        const target = `${redirectTo}?next=${encodeURIComponent(next || '30d-main-tasks.html')}`;

        if (!token) {
            window.location.href = target;
            return null;
        }

        let meData = await me(base);
        if (!meData || !meData.email) {
            await sleep(1200);
            meData = await me(base);
        }

        if (!meData || !meData.email) {
            window.location.href = target;
            return null;
        }

        return meData;
    }

    window.PlanApiClient = {
        getPlanApiBase,
        getPlanUserId,
        setPlanUserId,
        getAuthToken,
        setAuthToken,
        clearAuth,
        buildUrl,
        request,
        register,
        login,
        me,
        ensureAuthOrRedirect
    };
})();
