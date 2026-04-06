(function () {
  const LANG_KEY = 'planLang';
  const THEME_KEY = 'planTheme';

  function getCourseLang() {
    const lang = localStorage.getItem(LANG_KEY) || 'ru';
    return ['ru', 'uk', 'en'].includes(lang) ? lang : 'ru';
  }

  function getCourseTheme() {
    return (localStorage.getItem(THEME_KEY) || 'dark') === 'light' ? 'light' : 'dark';
  }

  function ensureCourseGlobalStyle() {
    if (document.getElementById('course-global-light-style')) return;
    const style = document.createElement('style');
    style.id = 'course-global-light-style';
    style.textContent = `
      body.light-theme {
        background: linear-gradient(135deg, #f5f8ff, #eef3ff, #e9f0ff) !important;
        color: #1f2a44 !important;
      }
      body.light-theme .card,
      body.light-theme .section,
      body.light-theme .hero,
      body.light-theme .topbar,
      body.light-theme .course-top-tools {
        background: rgba(255,255,255,0.92) !important;
        color: #1f2a44 !important;
        border-color: rgba(71,96,170,0.25) !important;
      }
      body.light-theme p,
      body.light-theme li,
      body.light-theme .hint,
      body.light-theme .small,
      body.light-theme label {
        color: #2f3d63 !important;
      }
    `;
    document.head.appendChild(style);
  }

  function localizeCourseCommonUi() {
    const lang = getCourseLang();
    document.documentElement.lang = lang;
    if (lang === 'ru') return;

    const maps = {
      uk: {
        'К модулям': 'До модулів',
        'Открыть модуль': 'Відкрити модуль',
        '🧪 Практика': '🧪 Практика',
        '📖 Не отмечено': '📖 Не відмічено',
        '📘 Отметить день как прочитанный': '📘 Відмітити день як прочитаний',
        '✅ День отмечен как прочитанный': '✅ День відмічено як прочитаний',
        '🧪 Отметить практику выполненной': '🧪 Відмітити практику виконаною',
        '✅ Практика выполнена': '✅ Практику виконано'
      },
      en: {
        'К модулям': 'To modules',
        'Открыть модуль': 'Open module',
        '🧪 Практика': '🧪 Practice',
        '📖 Не отмечено': '📖 Not marked',
        '📘 Отметить день как прочитанный': '📘 Mark day as read',
        '✅ День отмечен как прочитанный': '✅ Day marked as read',
        '🧪 Отметить практику выполненной': '🧪 Mark practice completed',
        '✅ Практика выполнена': '✅ Practice completed'
      }
    };

    const dict = maps[lang] || {};
    if (!Object.keys(dict).length) return;

    const elements = document.querySelectorAll('button, a, span, h1, h2, h3, p, .course-progress-pill, .badge');
    elements.forEach((el) => {
      if (el.hasAttribute('data-i18n')) return;
      const txt = (el.textContent || '').trim();
      if (!txt) return;
      if (dict[txt]) {
        el.textContent = dict[txt];
      } else if (txt.startsWith('Открыть модуль ')) {
        const day = txt.replace('Открыть модуль ', '');
        el.textContent = lang === 'uk' ? `Відкрити модуль ${day}` : `Open module ${day}`;
      }
    });
  }

  function applyCoursePreferences() {
    ensureCourseGlobalStyle();
    document.body.classList.toggle('light-theme', getCourseTheme() === 'light');
    localizeCourseCommonUi();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyCoursePreferences, { once: true });
  } else {
    applyCoursePreferences();
  }

  const STORAGE_KEY = 'course_days_read_v1';
  const THEORY_MS_KEY = 'course_theory_time_ms';
  const PRACTICE_MS_KEY = 'course_practice_time_ms';
  const PRACTICE_COMPLETED_PREFIX = 'practice_completed_';
  const DAILY_STATS_KEY = 'course_daily_learning_stats_v1';
  const PRACTICE_CHECKS_KEY = 'course_practice_checks_v1';
  const API_BASE = localStorage.getItem('planApiBase') || 'http://127.0.0.1:8000/api';

  let theorySessionStartedAt = null;
  let practiceSessionStartedAt = null;
  let learningTrackingInitialized = false;

  function readNumber(key) {
    const value = Number(localStorage.getItem(key) || 0);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  function getTheoryMs() {
    return readNumber(THEORY_MS_KEY);
  }

  function addTheoryMs(ms) {
    if (!Number.isFinite(ms) || ms <= 0) return;
    localStorage.setItem(THEORY_MS_KEY, String(getTheoryMs() + Math.round(ms)));
    const day = detectCurrentDay();
    if (day) {
      addDailyLearningTime(day, 'theoryMs', Math.round(ms));
    }
  }

  function getPracticeMs() {
    return readNumber(PRACTICE_MS_KEY);
  }

  function addPracticeMs(ms) {
    if (!Number.isFinite(ms) || ms <= 0) return;
    localStorage.setItem(PRACTICE_MS_KEY, String(getPracticeMs() + Math.round(ms)));
    const day = detectCurrentDay();
    if (day) {
      addDailyLearningTime(day, 'practiceMs', Math.round(ms));
    }
    addWeeklyPracticeTime(ms);
  }

  function loadDailyLearningStats() {
    try {
      return JSON.parse(localStorage.getItem(DAILY_STATS_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function saveDailyLearningStats(stats) {
    localStorage.setItem(DAILY_STATS_KEY, JSON.stringify(stats));
  }

  function addDailyLearningTime(day, field, ms) {
    if (!Number.isFinite(ms) || ms <= 0) return;
    const stats = loadDailyLearningStats();
    const key = String(day);
    if (!stats[key] || typeof stats[key] !== 'object') {
      stats[key] = { theoryMs: 0, practiceMs: 0 };
    }
    stats[key][field] = (Number(stats[key][field]) || 0) + Math.round(ms);
    saveDailyLearningStats(stats);
    void syncDailyStatsToServer(stats);
  }

  async function syncDailyStatsToServer(dailyStats) {
    try {
      if (window.PlanApiClient?.request) {
        const currentResp = await window.PlanApiClient.request('/state/character_profile');
        const current = currentResp?.value && typeof currentResp.value === 'object' ? currentResp.value : {};
        await window.PlanApiClient.request('/state/character_profile', {
          method: 'PUT',
          body: JSON.stringify({
            value: {
              ...current,
              theoryMs: getTheoryMs(),
              practiceMs: getPracticeMs(),
              dailyLearningStats: dailyStats
            }
          })
        });
        return;
      }

      const currentResp = await fetch(`${API_BASE}/state/character_profile`);
      const currentJson = currentResp.ok ? await currentResp.json() : { value: {} };
      const current = currentJson?.value && typeof currentJson.value === 'object' ? currentJson.value : {};

      await fetch(`${API_BASE}/state/character_profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: {
            ...current,
            theoryMs: getTheoryMs(),
            practiceMs: getPracticeMs(),
            dailyLearningStats: dailyStats
          }
        })
      });
    } catch {
      // offline/no backend: keep local data only
    }
  }

  function detectCurrentDay() {
    const byPath = window.location.pathname.match(/day-(\d{2})|day-(\d{1})/i);
    if (byPath) {
      const value = byPath[1] || byPath[2];
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    }

    const byTitle = document.title.match(/день\s*(\d{1,2})/i);
    if (byTitle) {
      const n = Number(byTitle[1]);
      return Number.isFinite(n) ? n : null;
    }

    return null;
  }

  function startTheorySession() {
    if (theorySessionStartedAt !== null) return;
    theorySessionStartedAt = Date.now();
  }

  function stopTheorySession() {
    if (theorySessionStartedAt === null) return;
    const elapsed = Date.now() - theorySessionStartedAt;
    theorySessionStartedAt = null;
    addTheoryMs(elapsed);
    addWeeklyTheoryTime(elapsed);
  }

  function initTheoryTracking() {
    const day = detectCurrentDay();
    if (!day) return;

    startTheorySession();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopTheorySession();
      } else {
        startTheorySession();
      }
    });

    window.addEventListener('beforeunload', stopTheorySession);
    window.addEventListener('pagehide', stopTheorySession);
  }

  function startPracticeSession() {
    if (practiceSessionStartedAt !== null) return;
    practiceSessionStartedAt = Date.now();
  }

  function stopPracticeSession() {
    if (practiceSessionStartedAt === null) return;
    const elapsed = Date.now() - practiceSessionStartedAt;
    practiceSessionStartedAt = null;
    addPracticeMs(elapsed);
  }

  function initPracticeTracking() {
    const day = detectCurrentDay();
    if (!day) return;

    startPracticeSession();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopPracticeSession();
      } else {
        startPracticeSession();
      }
    });

    window.addEventListener('beforeunload', stopPracticeSession);
    window.addEventListener('pagehide', stopPracticeSession);
  }

  function initLearningTracking() {
    if (learningTrackingInitialized) return;
    learningTrackingInitialized = true;

    if (isPracticePage()) {
      initPracticeTracking();
      return;
    }

    initTheoryTracking();
  }

  function getLearningStats(totalDays) {
    const readDays = countReadDays(totalDays);
    const theoryMs = getTheoryMs();
    const theoryMinutes = Math.floor(theoryMs / 60000);
    const theoryHours = Number((theoryMinutes / 60).toFixed(1));

    return {
      readDays,
      theoryMs,
      theoryMinutes,
      theoryHours
    };
  }

  function loadReadMap() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function saveReadMap(map) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    void syncReadDaysToServer(map);
  }

  async function syncReadDaysToServer(readDays) {
    try {
      if (window.PlanApiClient?.request) {
        const currentResp = await window.PlanApiClient.request('/state/character_profile');
        const current = currentResp?.value && typeof currentResp.value === 'object' ? currentResp.value : {};
        await window.PlanApiClient.request('/state/character_profile', {
          method: 'PUT',
          body: JSON.stringify({
            value: {
              ...current,
              readDays
            }
          })
        });
        return;
      }

      const currentResp = await fetch(`${API_BASE}/state/character_profile`);
      const currentJson = currentResp.ok ? await currentResp.json() : { value: {} };
      const current = currentJson?.value && typeof currentJson.value === 'object' ? currentJson.value : {};

      await fetch(`${API_BASE}/state/character_profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: {
            ...current,
            readDays
          }
        })
      });
    } catch {
      // offline/no backend: keep local only
    }
  }

  function isDayRead(day) {
    return Boolean(loadReadMap()[String(day)]);
  }

  function setDayRead(day, read) {
    const map = loadReadMap();
    if (read) {
      map[String(day)] = new Date().toISOString();
    } else {
      delete map[String(day)];
    }
    saveReadMap(map);
  }

  function getPracticeKey(day) {
    const nDay = Number(day);
    return `${PRACTICE_COMPLETED_PREFIX}${Number.isFinite(nDay) ? nDay : day}`;
  }

  function isPracticeCompleted(day) {
    return Boolean(localStorage.getItem(getPracticeKey(day)));
  }

  function setPracticeCompleted(day, completed) {
    const key = getPracticeKey(day);
    if (completed) {
      localStorage.setItem(key, new Date().toISOString());
    } else {
      localStorage.removeItem(key);
    }

    const checks = loadPracticeChecksMap();
    checks[String(day)] = Boolean(completed);
    localStorage.setItem(PRACTICE_CHECKS_KEY, JSON.stringify(checks));
    void syncPracticeChecksToServer(checks);
  }

  function loadPracticeChecksMap() {
    try {
      return JSON.parse(localStorage.getItem(PRACTICE_CHECKS_KEY) || '{}');
    } catch {
      return {};
    }
  }

  async function syncPracticeChecksToServer(practiceChecks) {
    try {
      if (window.PlanApiClient?.request) {
        const currentResp = await window.PlanApiClient.request('/state/character_profile');
        const current = currentResp?.value && typeof currentResp.value === 'object' ? currentResp.value : {};
        await window.PlanApiClient.request('/state/character_profile', {
          method: 'PUT',
          body: JSON.stringify({
            value: {
              ...current,
              practiceChecks
            }
          })
        });
        return;
      }

      const currentResp = await fetch(`${API_BASE}/state/character_profile`);
      const currentJson = currentResp.ok ? await currentResp.json() : { value: {} };
      const current = currentJson?.value && typeof currentJson.value === 'object' ? currentJson.value : {};

      await fetch(`${API_BASE}/state/character_profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: {
            ...current,
            practiceChecks
          }
        })
      });
    } catch {
      // offline/no backend: keep local only
    }
  }

  function refreshReadButton(btn, day) {
    const done = isDayRead(day);
    btn.classList.toggle('done', done);
    btn.textContent = done ? '✅ День отмечен как прочитанный' : '📘 Отметить день как прочитанный';
  }

  function refreshPracticeButton(btn, day) {
    const done = isPracticeCompleted(day);
    btn.classList.toggle('done', done);
    btn.textContent = done ? '✅ Практика выполнена' : '🧪 Отметить практику выполненной';
  }

  function ensurePracticeButton(day) {
    if (!isPracticePage()) return;

    const toolsHost = document.querySelector('.course-top-tools');
    if (!toolsHost) return;

    let btn = document.getElementById('practiceToggleBtn');
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'practiceToggleBtn';
      btn.className = 'practice-toggle-btn';
      toolsHost.appendChild(btn);
    }

    refreshPracticeButton(btn, day);
    btn.addEventListener('click', () => {
      const next = !isPracticeCompleted(day);
      setPracticeCompleted(day, next);
      refreshPracticeButton(btn, day);
    });
  }

  function initTrackSwitch() {
    const buttons = Array.from(document.querySelectorAll('.track-btn[data-track]'));
    if (!buttons.length) return;

    function apply(track) {
      buttons.forEach((b) => b.classList.toggle('active', b.dataset.track === track));
      document.querySelectorAll('.track-block').forEach((el) => {
        const t = el.getAttribute('data-track');
        el.hidden = !(track === 'all' || t === track);
      });
    }

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => apply(btn.dataset.track));
    });

    apply('all');
  }

  const EASTER_EGGS = [
    {
      title: '💡 Секрет фрилансера',
      type: 'text',
      text: '┌──────────────────────────────┐\n│ Не жди идеальный день.      │\n│ Запустил код — уже победа.  │\n└──────────────────────────────┘'
    },
    {
      title: '🔥 Мотивашка разработчика',
      type: 'quote',
      text: '«Сначала работает криво. Потом стабильно. Потом красиво. Это нормальный путь любого сильного разработчика.»'
    },
    {
      title: '🧠 Мини-чит по обучению',
      type: 'text',
      text: 'Каждый день: 1 маленький запуск,\n1 микро-фикс, 1 заметка.\nТак и собирается сильный уровень.'
    },
    {
      title: '💸 Напоминание про деньги',
      type: 'quote',
      text: '«Клиент платит не за код, а за снятую головную боль. Делай удобно, понятно и стабильно.»'
    },
    {
      title: '🎯 Пасхалка цели',
      type: 'text',
      text: 'Если сейчас сложно — это признак роста,\nа не признак провала. Продолжай. 🚀'
    }
  ];

  const EASTER_ICON_SET = ['🗝️', '🧩', '🔮', '✨', '📎', '🕵️'];
  const DAY_THEME = {
    5: 'безопасность и контроль доступа',
    6: 'email-автоматизация и стабильная доставка',
    7: 'портфолио и упаковка кейсов',
    8: 'FAQ-менеджер и вторичный парсинг',
    9: 'деплой и надёжный запуск',
    10: 'боты для продаж и конверсия',
    11: 'Google Sheets и отчётность',
    12: 'квизы, проверка знаний и 3-й проект',
    13: 'рефакторинг и шаблонизация',
    14: 'пакетирование и поставка решения',
    15: 'сборка собственного шаблона',
    16: 'логирование и отладка ошибок',
    17: 'надёжность сценариев и защита от сбоев',
    18: 'API-интеграции и внешние сервисы',
    19: 'оптимизация и производительность',
    20: 'архитектура и масштабирование',
    21: 'продуктовое мышление и ценность',
    22: 'автоматизация рутины и экономия времени',
    23: 'качество кода и читаемость',
    24: 'тест-кейсы и предсказуемый результат',
    25: 'клиентская коммуникация и бриф',
    26: 'финансовая модель и монетизация',
    27: 'демо, презентация и защита решения',
    28: 'финальный спринт и контроль качества',
    29: 'полировка, документация и handoff',
    30: 'выпускной запуск и план роста'
  };
  const FRAGMENT_SYMBOLS = ['◈', '✶', '✦', '⟁', '⌬'];
  const DAY_FRAGMENT_REWARD_XP = 40;
  const DAY_FRAGMENTS_KEY = 'course_day_fragments_found_v1';
  const DAY_FRAGMENT_REWARD_KEY = 'course_day_fragment_reward_v1';
  const ULTRA_SECRET_KEY = 'course_ultra_week_secret_v1';
  const ULTRA_SECRET_REWARD_XP = 180;

  const SUPER_EGG_REWARD_XP = 120;
  const SUPER_EGG_STORAGE_KEY = 'course_super_eggs_found_v1';
  const SUPER_EGG_DAYS = [7, 14, 21, 28];
  const SUPER_EGGS = {
    7: {
      title: '👑 Супер-пасхалка: Неделя 1',
      text: 'Ты дошёл до первой контрольной точки. Это уже не старт — это инерция успеха.'
    },
    14: {
      title: '⚡ Супер-пасхалка: Неделя 2',
      text: 'Экватор! Когда другие сливаются, ты усиливаешь темп. Уважение.\n(да, это официальный бафф продуктивности)'
    },
    21: {
      title: '🛡️ Супер-пасхалка: Неделя 3',
      text: 'Ты уже не ученик-новичок. Ты человек, который доводит до результата.'
    },
    28: {
      title: '🏆 Супер-пасхалка: Финальный рывок',
      text: 'Финальные дни решают всё. Дожимай марафон — и это станет твоим новым стандартом.'
    }
  };

  function loadSuperEggsFoundMap() {
    try {
      return JSON.parse(localStorage.getItem(SUPER_EGG_STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function saveSuperEggsFoundMap(map) {
    localStorage.setItem(SUPER_EGG_STORAGE_KEY, JSON.stringify(map));
  }

  function isSuperEggFound(day) {
    const map = loadSuperEggsFoundMap();
    return Boolean(map[String(day)]);
  }

  function markSuperEggFound(day) {
    const map = loadSuperEggsFoundMap();
    map[String(day)] = new Date().toISOString();
    saveSuperEggsFoundMap(map);
  }

  function addSuperEggRewardXp(amount) {
    if (!Number.isFinite(amount) || amount <= 0) return;
    try {
      const profile = JSON.parse(localStorage.getItem('profile_state') || '{"level":1,"xp":0}');
      profile.earnedAchievementXp = (profile.earnedAchievementXp || 0) + Math.round(amount);
      localStorage.setItem('profile_state', JSON.stringify(profile));
    } catch {
      // no-op
    }
  }

  function loadDayFragmentsMap() {
    try {
      return JSON.parse(localStorage.getItem(DAY_FRAGMENTS_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function saveDayFragmentsMap(map) {
    localStorage.setItem(DAY_FRAGMENTS_KEY, JSON.stringify(map));
  }

  function getFoundFragments(day) {
    const map = loadDayFragmentsMap();
    return Array.isArray(map[String(day)]) ? map[String(day)] : [];
  }

  function markFragmentFound(day, fragmentIndex) {
    const map = loadDayFragmentsMap();
    const dayKey = String(day);
    const current = Array.isArray(map[dayKey]) ? map[dayKey] : [];
    if (!current.includes(fragmentIndex)) current.push(fragmentIndex);
    map[dayKey] = current;
    saveDayFragmentsMap(map);
    return current;
  }

  function loadDayFragmentRewardMap() {
    try {
      return JSON.parse(localStorage.getItem(DAY_FRAGMENT_REWARD_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function saveDayFragmentRewardMap(map) {
    localStorage.setItem(DAY_FRAGMENT_REWARD_KEY, JSON.stringify(map));
  }

  function hasDayFragmentReward(day) {
    const map = loadDayFragmentRewardMap();
    return Boolean(map[String(day)]);
  }

  function markDayFragmentReward(day) {
    const map = loadDayFragmentRewardMap();
    map[String(day)] = new Date().toISOString();
    saveDayFragmentRewardMap(map);
  }

  function isUltraSecretClaimed() {
    try {
      return Boolean(JSON.parse(localStorage.getItem(ULTRA_SECRET_KEY) || '{"claimed":false}').claimed);
    } catch {
      return false;
    }
  }

  function markUltraSecretClaimed() {
    localStorage.setItem(ULTRA_SECRET_KEY, JSON.stringify({ claimed: true, at: new Date().toISOString() }));
  }

  function getSuperEggsFoundCount() {
    const map = loadSuperEggsFoundMap();
    return Object.keys(map).length;
  }

  function getFragmentRewardsCount() {
    const map = loadDayFragmentRewardMap();
    return Object.keys(map).length;
  }

  function canUnlockUltraSecret() {
    return getSuperEggsFoundCount() >= 2 && getFragmentRewardsCount() >= 3;
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function toHtmlMultiline(text) {
    return escapeHtml(text).replace(/\n/g, '<br>');
  }

  function getOrCreateEggModal() {
    let backdrop = document.getElementById('courseEggBackdrop');
    if (backdrop) return backdrop;

    backdrop = document.createElement('div');
    backdrop.id = 'courseEggBackdrop';
    backdrop.className = 'course-easter-modal-backdrop hidden';
    backdrop.innerHTML = `
      <div class="course-easter-modal" role="dialog" aria-modal="true" aria-label="Пасхалка">
        <button type="button" class="course-easter-modal-close" aria-label="Закрыть">✖</button>
        <div class="course-easter-modal-title" id="courseEggTitle"></div>
        <div class="course-easter-modal-body" id="courseEggBody"></div>
      </div>
    `;

    const closeBtn = backdrop.querySelector('.course-easter-modal-close');
    closeBtn.addEventListener('click', () => backdrop.classList.add('hidden'));

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.classList.add('hidden');
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') backdrop.classList.add('hidden');
    });

    document.body.appendChild(backdrop);
    return backdrop;
  }

  function openEggModal(title, text) {
    const backdrop = getOrCreateEggModal();
    const titleEl = document.getElementById('courseEggTitle');
    const bodyEl = document.getElementById('courseEggBody');
    if (!titleEl || !bodyEl) return;

    titleEl.innerHTML = toHtmlMultiline(title || 'Пасхалка');
    bodyEl.innerHTML = toHtmlMultiline(text || 'Секрет найден ✨');
    backdrop.classList.remove('hidden');
  }

  function showFragmentToast(text) {
    const toast = document.createElement('div');
    toast.className = 'course-fragment-toast';
    toast.textContent = text;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 20);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 250);
    }, 1800);
  }

  function pickEggIndexes(targetsLength, day, count) {
    const indexes = [];
    let seed = (Number(day) || 1) * 17 + 11;

    while (indexes.length < count && indexes.length < targetsLength) {
      seed = (seed * 9301 + 49297) % 233280;
      const idx = seed % targetsLength;
      if (!indexes.includes(idx)) indexes.push(idx);
    }

    return indexes.sort((a, b) => a - b);
  }

  function isPracticePage() {
    return /practice-lab/i.test(window.location.pathname || '');
  }

  function getDayTheme(day) {
    return DAY_THEME[day] || `модуль ${day}`;
  }

  function makeTheoryEggPool(day) {
    const theme = getDayTheme(day);
    return [
      {
        title: `💡 День ${day}: скрытый принцип`,
        text: `Тема дня: ${theme}.\n\nКлиент платит за предсказуемость: сделал один раз правильно — зарабатываешь много раз.`
      },
      {
        title: `🚀 День ${day}: фриланс-ускоритель`,
        text: `Сильный приём дня: из теории сразу в мини-прототип.\n30–45 минут на рабочую демку = больше доверия и быстрее первый платёж.`
      },
      {
        title: `🧠 День ${day}: микро-стратегия`,
        text: `Формула роста: 1 запуск + 1 фикс + 1 запись в заметки.\nПо теме «${theme}» это даёт буст уже в течение недели.`
      },
      {
        title: `💸 День ${day}: коммерческий инсайт`,
        text: `Позиционируй результат так: «После внедрения ${theme} у вас меньше ручной рутины и больше продаж».\nЭто язык, который понимают заказчики.`
      }
    ];
  }

  function makePracticeEggPool(day) {
    const theme = getDayTheme(day);
    return [
      {
        title: `🎯 Практикум ${day}: ты на верном пути`,
        text: `Сегодняшняя практика по теме «${theme}» — это уже кусок портфолио.\nНе просто учёба, а актив, который можно показывать клиенту.`
      },
      {
        title: `⚡ Практикум ${day}: hidden boost`,
        text: `Если задание закрыто до конца, ты ускоряешься сильнее большинства новичков.\nДисциплина в практике = стабильный доход на фрилансе.`
      }
    ];
  }

  function getEggPoolByDay(day, practiceMode) {
    const nDay = Number(day) || 1;
    if (nDay < 5) return EASTER_EGGS;
    return practiceMode ? makePracticeEggPool(nDay) : makeTheoryEggPool(nDay);
  }

  function injectEasterEggIcons(day) {
    if (document.querySelector('[data-course-easter-icon="1"]')) return;

    const nDay = Number(day) || 1;
    const practiceMode = isPracticePage();
    const targets = Array.from(document.querySelectorAll('.section, .card.track-block, .card'));
    if (!targets.length) return;

    const eggPool = getEggPoolByDay(nDay, practiceMode);

    let count = practiceMode ? 1 : 3;
    count = Math.min(count, targets.length);
    if (!practiceMode && targets.length >= 2) {
      count = Math.max(2, count);
    }

    const indexes = pickEggIndexes(targets.length, nDay, count);

    indexes.forEach((targetIndex, i) => {
      const target = targets[targetIndex];
      if (!target) return;

      target.classList.add('course-egg-host');
      const egg = eggPool[(targetIndex + i + nDay) % eggPool.length];
      const icon = EASTER_ICON_SET[(targetIndex + nDay + i) % EASTER_ICON_SET.length];

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'course-easter-icon';
      btn.setAttribute('data-course-easter-icon', '1');
      btn.setAttribute('aria-label', 'Скрытая пасхалка');
      btn.title = '...';
      btn.textContent = icon;

      btn.style.top = `${8 + ((targetIndex * 11 + i * 7) % 76)}%`;
      btn.style.left = `${6 + ((targetIndex * 17 + i * 13) % 82)}%`;

      btn.addEventListener('click', () => {
        openEggModal(egg.title, egg.text);
      });

      target.appendChild(btn);
    });
  }

  function injectSuperEasterIcon(day) {
    const nDay = Number(day) || 0;
    if (!SUPER_EGG_DAYS.includes(nDay)) return;
    if (document.querySelector('[data-course-super-icon="1"]')) return;

    const targets = Array.from(document.querySelectorAll('.section, .card.track-block'));
    if (!targets.length) return;
    const target = targets[(nDay * 3) % targets.length];
    if (!target) return;
    target.classList.add('course-egg-host');

    const data = SUPER_EGGS[nDay] || {
      title: '🌟 Супер-пасхалка',
      text: 'Секрет найден. Продолжай путь!'
    };

    const found = isSuperEggFound(nDay);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `course-super-icon${found ? ' found' : ''}`;
    btn.setAttribute('data-course-super-icon', '1');
    btn.setAttribute('aria-label', 'Супер-пасхалка');
    btn.title = found ? 'Супер-пасхалка уже найдена' : 'Супер-пасхалка';
    btn.textContent = found ? '✅' : '👑';
    btn.style.top = `${12 + ((nDay * 9) % 70)}%`;
    btn.style.left = `${8 + ((nDay * 5) % 78)}%`;

    btn.addEventListener('click', () => {
      if (!isSuperEggFound(nDay)) {
        markSuperEggFound(nDay);
        addSuperEggRewardXp(SUPER_EGG_REWARD_XP);
        btn.classList.add('found');
        btn.textContent = '✅';
        openEggModal(data.title, `${data.text}\n\n+${SUPER_EGG_REWARD_XP} XP в профиль 🌟`);
        return;
      }

      openEggModal(data.title, `${data.text}\n\nЭта супер-пасхалка уже найдена ✅`);
    });

    target.appendChild(btn);
  }

  function injectRuneFragments(day) {
    const nDay = Number(day) || 1;
    if (document.querySelector('[data-course-fragment="1"]')) return;

    const textTargets = Array.from(document.querySelectorAll('.section p, .section li, .card.track-block p, .card.track-block li'));
    if (!textTargets.length) return;

    const fragmentCount = 2;
    const targetIndexes = pickEggIndexes(textTargets.length, nDay * 3 + 5, fragmentCount);
    const found = getFoundFragments(nDay);

    targetIndexes.forEach((targetIndex, i) => {
      const target = textTargets[targetIndex];
      if (!target) return;

      const fragmentIndex = i + 1;
      const symbol = FRAGMENT_SYMBOLS[(targetIndex + nDay + i) % FRAGMENT_SYMBOLS.length];
      const iconBtn = document.createElement('button');
      iconBtn.type = 'button';
      iconBtn.className = `course-fragment-glyph${found.includes(fragmentIndex) ? ' found' : ''}`;
      iconBtn.setAttribute('data-course-fragment', '1');
      iconBtn.setAttribute('aria-label', 'Скрытый фрагмент руны');
      iconBtn.textContent = found.includes(fragmentIndex) ? '◆' : symbol;

      iconBtn.addEventListener('click', () => {
        const nowFound = markFragmentFound(nDay, fragmentIndex);
        iconBtn.classList.add('found');
        iconBtn.textContent = '◆';

        if (nowFound.length < fragmentCount) {
          showFragmentToast(`Фрагмент найден: ${nowFound.length}/${fragmentCount}`);
          return;
        }

        if (!hasDayFragmentReward(nDay)) {
          markDayFragmentReward(nDay);
          addSuperEggRewardXp(DAY_FRAGMENT_REWARD_XP);
          openEggModal(
            '🧰 Секретный сундук дня открыт',
            `Ты собрал все фрагменты руны дня ${nDay}.\n+${DAY_FRAGMENT_REWARD_XP} XP в профиль.\n\nМораль: внимательность в коде = деньги на фрилансе.`
          );
          return;
        }

        openEggModal('🧩 Руна собрана', `Фрагменты дня ${nDay} уже были собраны ранее. Ты красавчик.`);
      });

      target.appendChild(document.createTextNode(' '));
      target.appendChild(iconBtn);
    });
  }

  function injectUltraSecret(day) {
    const nDay = Number(day) || 1;
    if (document.querySelector('[data-course-ultra-secret="1"]')) return;

    const targets = Array.from(document.querySelectorAll('.section, .card.track-block'));
    if (!targets.length) return;
    const target = targets[(nDay * 7 + 1) % targets.length];
    if (!target) return;
    target.classList.add('course-egg-host');

    const claimed = isUltraSecretClaimed();
    if (!canUnlockUltraSecret() && !claimed) return;

    const icon = document.createElement('button');
    icon.type = 'button';
    icon.className = `course-ultra-secret-icon${claimed ? ' found' : ''}`;
    icon.setAttribute('data-course-ultra-secret', '1');
    icon.setAttribute('aria-label', 'Ультра-тайна недели');
    icon.title = '...';
    icon.textContent = claimed ? '🏆' : '☽';
    icon.style.top = `${10 + ((nDay * 13) % 74)}%`;
    icon.style.left = `${9 + ((nDay * 19) % 78)}%`;

    icon.addEventListener('click', () => {
      if (!isUltraSecretClaimed()) {
        markUltraSecretClaimed();
        addSuperEggRewardXp(ULTRA_SECRET_REWARD_XP);
        icon.classList.add('found');
        icon.textContent = '🏆';
        openEggModal(
          '🌙 Ультра-тайна недели',
          `Ты открыл скрытый мета-квест: 2 супер-пасхалки + 3 руны дня.\n+${ULTRA_SECRET_REWARD_XP} XP в профиль.\n\nТеперь ты реально охотник за секретами.`
        );
        return;
      }

      openEggModal('🌙 Ультра-тайна', 'Уже открыто. Легенда режима пасхалок 🏆');
    });

    target.appendChild(icon);
  }

  function initModulePage(day) {
    initLearningTracking();

    const btn = document.getElementById('readToggleBtn');
    if (btn && day) {
      refreshReadButton(btn, day);
      btn.addEventListener('click', () => {
        const next = !isDayRead(day);
        setDayRead(day, next);
        refreshReadButton(btn, day);
      });
    }

    if (day) {
      ensurePracticeButton(day);
    }

    initTrackSwitch();
    injectEasterEggIcons(day);
    injectSuperEasterIcon(day);
    injectRuneFragments(day);
    injectUltraSecret(day);
  }

  function countReadDays(total) {
    const map = loadReadMap();
    let count = 0;
    for (let i = 1; i <= total; i++) {
      if (map[String(i)]) count += 1;
    }
    return count;
  }

  function countFullyCompletedDays(total) {
    let count = 0;
    for (let i = 1; i <= total; i++) {
      if (isDayRead(i) && isPracticeCompleted(i)) count += 1;
    }
    return count;
  }

  function updateIndexProgress(totalDays) {
    const progressEl = document.getElementById('courseProgressText');
    if (progressEl) {
      const read = countReadDays(totalDays);
      const full = countFullyCompletedDays(totalDays);
      progressEl.textContent = `Прочитано дней: ${read}/${totalDays} · Полностью завершено: ${full}/${totalDays}`;
    }

    document.querySelectorAll('[data-day-card]').forEach((el) => {
      const day = el.getAttribute('data-day-card');
      const badge = el.querySelector('[data-day-read-badge]');
      if (!badge) return;
      const theoryDone = isDayRead(day);
      const practiceDone = isPracticeCompleted(day);
      const fullyDone = theoryDone && practiceDone;

      el.classList.toggle('module-complete-gold', fullyDone);
      badge.classList.toggle('done', fullyDone);

      if (fullyDone) {
        badge.textContent = '🏆 Теория + практика завершены';
        return;
      }

      if (theoryDone) {
        badge.textContent = '📘 Теория пройдена · 🧪 Практика не отмечена';
        return;
      }

      if (practiceDone) {
        badge.textContent = '🧪 Практика отмечена · 📖 Теория не отмечена';
        return;
      }

      badge.textContent = '📖 Не отмечено';
    });
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

  function addWeeklyTheoryTime(ms) {
    if (!Number.isFinite(ms) || ms <= 0) return;
    
    const week = getISOWeekNumber();
    const weekKey = formatWeekNumber(week.year, week.week);
    const storageKey = `weekly_stats_${weekKey}`;
    
    try {
      const existing = JSON.parse(localStorage.getItem(storageKey) || '{"theoryMs":0,"practiceMs":0,"gamingMs":0}');
      existing.theoryMs = (existing.theoryMs || 0) + Math.round(ms);
      localStorage.setItem(storageKey, JSON.stringify(existing));
    } catch {
      const stats = { theoryMs: Math.round(ms), practiceMs: 0, gamingMs: 0 };
      localStorage.setItem(storageKey, JSON.stringify(stats));
    }
  }

  function addWeeklyPracticeTime(ms) {
    if (!Number.isFinite(ms) || ms <= 0) return;

    const week = getISOWeekNumber();
    const weekKey = formatWeekNumber(week.year, week.week);
    const storageKey = `weekly_stats_${weekKey}`;

    try {
      const existing = JSON.parse(localStorage.getItem(storageKey) || '{"theoryMs":0,"practiceMs":0,"gamingMs":0}');
      existing.practiceMs = (existing.practiceMs || 0) + Math.round(ms);
      localStorage.setItem(storageKey, JSON.stringify(existing));
    } catch {
      const stats = { theoryMs: 0, practiceMs: Math.round(ms), gamingMs: 0 };
      localStorage.setItem(storageKey, JSON.stringify(stats));
    }
  }

  window.CourseTools = {
    initModulePage,
    updateIndexProgress,
    isDayRead,
    isPracticeCompleted,
    getLearningStats
  };

  // Практические задания отслеживание
  function markPracticeCompleted() {
    const day = detectCurrentDay();
    if (!day) {
      alert('⚠️ День не определен!');
      return;
    }

    const existing = isPracticeCompleted(day);
    
    if (existing) {
      alert('✅ Практика на день ' + day + ' уже отмечена как выполненная!');
      return;
    }

    setPracticeCompleted(day, true);
    
    // Add practice time - 1 hour default
    const PRACTICE_MS_KEY = 'course_practice_time_ms';
    const practiceMs = Number(localStorage.getItem(PRACTICE_MS_KEY) || 0) + 3600000;
    localStorage.setItem(PRACTICE_MS_KEY, String(practiceMs));
    addDailyLearningTime(day, 'practiceMs', 3600000);

    // Add weekly practice stats
    const week = getISOWeekNumber();
    const weekKey = `${week.year}-W${String(week.week).padStart(2, '0')}`;
    const storageKey = `weekly_stats_${weekKey}`;
    
    try {
      const existing = JSON.parse(localStorage.getItem(storageKey) || '{"theoryMs":0,"practiceMs":0,"gamingMs":0}');
      existing.practiceMs = (existing.practiceMs || 0) + 3600000;
      localStorage.setItem(storageKey, JSON.stringify(existing));
    } catch {
      const stats = { theoryMs: 0, practiceMs: 3600000, gamingMs: 0 };
      localStorage.setItem(storageKey, JSON.stringify(stats));
    }

    alert('🎉 Практика отмечена! +1ч практики и +50 XP');
    
    // Add XP
    try {
      const profile = JSON.parse(localStorage.getItem('profile_state') || '{"level":1,"xp":0}');
      profile.earnedAchievementXp = (profile.earnedAchievementXp || 0) + 50;
      localStorage.setItem('profile_state', JSON.stringify(profile));
    } catch {}
  }

  function getISOWeekNumber(date = new Date()) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return { year: d.getUTCFullYear(), week: weekNum };
  }

  window.markPracticeCompleted = markPracticeCompleted;
})();
