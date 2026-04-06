(function () {
    if (window.PlanSettings) return;

    const LANG_KEY = 'planLang';
    const THEME_KEY = 'planTheme';
    const DEFAULT_LANG = 'ru';
    const DEFAULT_THEME = 'dark';

    function getLang() {
        const lang = localStorage.getItem(LANG_KEY) || DEFAULT_LANG;
        return ['ru', 'uk', 'en'].includes(lang) ? lang : DEFAULT_LANG;
    }

    function setLang(lang) {
        const safe = ['ru', 'uk', 'en'].includes(lang) ? lang : DEFAULT_LANG;
        localStorage.setItem(LANG_KEY, safe);
        return safe;
    }

    function getTheme() {
        localStorage.setItem(THEME_KEY, DEFAULT_THEME);
        return DEFAULT_THEME;
    }

    function setTheme(_) {
        localStorage.setItem(THEME_KEY, DEFAULT_THEME);
        return DEFAULT_THEME;
    }

    function applyThemeClass(target = document.body) {
        if (!target) return;
        localStorage.setItem(THEME_KEY, DEFAULT_THEME);
        target.classList.remove('light-theme');
    }

    function translate(translations = {}) {
        const lang = getLang();
        const dict = translations[lang] || translations.ru || {};
        document.documentElement.lang = lang;

        document.querySelectorAll('[data-i18n]').forEach((el) => {
            const key = el.getAttribute('data-i18n');
            if (!key) return;
            const value = dict[key];
            if (typeof value === 'string') {
                el.textContent = value;
            }
        });

        return lang;
    }

    window.PlanSettings = {
        getLang,
        setLang,
        getTheme,
        setTheme,
        applyThemeClass,
        translate
    };
})();
