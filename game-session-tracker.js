(function () {
    if (window.PlanGameTracker) return;

    const GAME_STATS_KEY = 'gameStats';
    const DAILY_STATS_KEY = 'course_daily_learning_stats_v1';
    const WEEKLY_STATS_PREFIX = 'weekly_stats_';
    const SESSION_KEY = 'plan_game_session_v1';
    const API_BASE = localStorage.getItem('planApiBase') || 'http://127.0.0.1:8000/api';

    let currentSession = null;

    function readJson(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    }

    function writeJson(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function getPlanStartDate() {
        const stored = localStorage.getItem('planStartDate');
        if (stored) {
            const parsed = new Date(stored);
            if (!Number.isNaN(parsed.getTime())) {
                parsed.setHours(0, 0, 0, 0);
                return parsed;
            }
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        localStorage.setItem('planStartDate', today.toISOString());
        return today;
    }

    function getCurrentPlanDay() {
        const startDate = getPlanStartDate();
        const currentDate = new Date();

        startDate.setHours(0, 0, 0, 0);
        currentDate.setHours(0, 0, 0, 0);

        const diffTime = currentDate - startDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

        return Math.min(Math.max(diffDays, 1), 30);
    }

    function getISOWeekNumber(date = new Date()) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return { year: d.getUTCFullYear(), week: weekNum };
    }

    function formatWeekNumber(year, week) {
        return `${year}-W${String(week).padStart(2, '0')}`;
    }

    function getWeekBucketForDay(day) {
        if (day <= 7) return 1;
        if (day <= 14) return 2;
        if (day <= 21) return 3;
        return 4;
    }

    function getDailyStats() {
        return readJson(DAILY_STATS_KEY, {});
    }

    function saveDailyStats(stats) {
        writeJson(DAILY_STATS_KEY, stats);
        void syncDailyStatsToServer(stats);
    }

    function addDailyGamingTime(day, ms) {
        if (!Number.isFinite(ms) || ms <= 0) return;

        const stats = getDailyStats();
        const key = String(day);
        if (!stats[key] || typeof stats[key] !== 'object') {
            stats[key] = { theoryMs: 0, practiceMs: 0, gamingMs: 0 };
        }

        stats[key].gamingMs = (Number(stats[key].gamingMs) || 0) + Math.round(ms);
        saveDailyStats(stats);
    }

    function getWeekKey() {
        const week = getISOWeekNumber();
        return `${WEEKLY_STATS_PREFIX}${formatWeekNumber(week.year, week.week)}`;
    }

    function addWeeklyGamingTime(day, ms) {
        if (!Number.isFinite(ms) || ms <= 0) return;

        const currentWeekKey = getWeekKey();
        try {
            const existing = readJson(currentWeekKey, { theoryMs: 0, practiceMs: 0, gamingMs: 0 });
            existing.gamingMs = (existing.gamingMs || 0) + Math.round(ms);
            writeJson(currentWeekKey, existing);
        } catch {
            writeJson(currentWeekKey, { theoryMs: 0, practiceMs: 0, gamingMs: Math.round(ms) });
        }

        if (Number.isFinite(day) && day > 0) {
            const bucketKey = `${WEEKLY_STATS_PREFIX}plan-week-${getWeekBucketForDay(day)}`;
            try {
                const existing = readJson(bucketKey, { theoryMs: 0, practiceMs: 0, gamingMs: 0 });
                existing.gamingMs = (existing.gamingMs || 0) + Math.round(ms);
                writeJson(bucketKey, existing);
            } catch {
                writeJson(bucketKey, { theoryMs: 0, practiceMs: 0, gamingMs: Math.round(ms) });
            }
        }
    }

    function normalizeGameRecord(value) {
        if (typeof value === 'number') {
            return { plays: value, playtimeMs: 0, lastPlayedAt: '' };
        }

        if (!value || typeof value !== 'object') {
            return { plays: 0, playtimeMs: 0, lastPlayedAt: '' };
        }

        return {
            plays: Number(value.plays || value.count || 0),
            playtimeMs: Number(value.playtimeMs || value.playTimeMs || value.minutesPlayedMs || 0),
            lastPlayedAt: typeof value.lastPlayedAt === 'string' ? value.lastPlayedAt : ''
        };
    }

    function getGameStats() {
        const raw = readJson(GAME_STATS_KEY, {});
        const normalized = {};

        Object.entries(raw).forEach(([key, value]) => {
            normalized[key] = normalizeGameRecord(value);
        });

        return normalized;
    }

    function saveGameStats(stats) {
        writeJson(GAME_STATS_KEY, stats);
        void syncGameStatsToServer(stats);
    }

    async function apiRequest(path, options = {}) {
        if (window.PlanApiClient?.request) {
            return window.PlanApiClient.request(path, options, API_BASE);
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        try {
            const response = await fetch(`${API_BASE}${path}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...(options.headers || {})
                },
                signal: controller.signal
            });

            if (!response.ok) return null;
            return await response.json();
        } catch {
            return null;
        } finally {
            clearTimeout(timeout);
        }
    }

    async function syncGameStatsToServer(stats) {
        try {
            const currentResp = await apiRequest('/state/game_stats');
            const current = currentResp?.value && typeof currentResp.value === 'object' ? currentResp.value : {};
            await apiRequest('/state/game_stats', {
                method: 'PUT',
                body: JSON.stringify({ value: { ...current, ...stats } })
            });
        } catch {
            // offline/no backend
        }
    }

    async function syncDailyStatsToServer(dailyStats) {
        try {
            const currentResp = await apiRequest('/state/character_profile');
            const current = currentResp?.value && typeof currentResp.value === 'object' ? currentResp.value : {};
            await apiRequest('/state/character_profile', {
                method: 'PUT',
                body: JSON.stringify({
                    value: {
                        ...current,
                        dailyLearningStats: dailyStats
                    }
                })
            });
        } catch {
            // offline/no backend
        }
    }

    function recordGamePlay(gameKey, label, elapsedMs) {
        const safeKey = String(gameKey || 'game').trim();
        const ms = Math.max(0, Math.round(Number(elapsedMs) || 0));
        const stats = getGameStats();
        const current = normalizeGameRecord(stats[safeKey]);

        current.plays += 1;
        current.playtimeMs += ms;
        current.lastPlayedAt = new Date().toISOString();
        if (label && !current.label) current.label = String(label);

        stats[safeKey] = current;
        saveGameStats(stats);

        const day = getCurrentPlanDay();
        addDailyGamingTime(day, ms);
        addWeeklyGamingTime(day, ms);
    }

    function hydrateSessionFromStorage() {
        if (currentSession) return currentSession;

        const stored = readJson(SESSION_KEY, null);
        if (stored && typeof stored === 'object' && stored.gameKey && stored.startedAt) {
            currentSession = stored;
            return currentSession;
        }

        return null;
    }

    function startGameSession(gameKey, label) {
        const nextSession = {
            gameKey: String(gameKey || 'game').trim(),
            label: label ? String(label) : String(gameKey || 'game').trim(),
            startedAt: Date.now(),
            planDay: getCurrentPlanDay()
        };

        currentSession = nextSession;
        writeJson(SESSION_KEY, nextSession);
        return nextSession;
    }

    function clearGameSession() {
        currentSession = null;
        localStorage.removeItem(SESSION_KEY);
    }

    function finalizeGameSession(gameKey) {
        const session = hydrateSessionFromStorage();
        if (!session) return 0;
        if (gameKey && session.gameKey !== gameKey) return 0;

        const elapsed = Date.now() - Number(session.startedAt || 0);
        clearGameSession();

        if (!Number.isFinite(elapsed) || elapsed < 1000) return 0;

        recordGamePlay(session.gameKey, session.label, elapsed);
        return elapsed;
    }

    window.PlanGameTracker = {
        startGameSession,
        finalizeGameSession,
        clearGameSession,
        recordGamePlay,
        getCurrentPlanDay,
        getGameStats
    };

    window.addEventListener('pagehide', () => {
        finalizeGameSession();
    });

    window.addEventListener('beforeunload', () => {
        finalizeGameSession();
    });
})();