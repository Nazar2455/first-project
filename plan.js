// 🎮 30-DAY PLAN TRACKER - Main JavaScript Module
// Игровой трекер для 30-дневного плана заработка на фрилансе

const PLANS = {
    WEEK1: [
        { day: 1, type: 'both', bots: ['Создать папку lead-bot-v1', 'Файлы .env, requirements.txt, main.py, README.md', 'Установить aiogram==3.13.1, python-dotenv==1.0.1', 'Сделать /start и /help'], parsing: ['Создать папку parser-project-1', 'Установить requests==2.31.0, beautifulsoup4==4.12.2', 'Выбрать первый сайт для парсинга', 'Спарсить первые 100 объектов'], synergy: 'Одна структура, один .env, один GitHub' },
        { day: 2, type: 'both', bots: ['Создать keyboards/main_kb.py', 'Reply-кнопки: Оставить заявку, FAQ, Контакты', 'Inline-кнопка с callback lead:start', 'Видео-демо 30 сек'], parsing: ['Спарсить 200 объектов', 'Экспорт в CSV', 'Фильтр по цене', 'Скриншот результата'], synergy: 'Первый результат в обоих!' },
        { day: 3, type: 'both', bots: ['FSM: имя → телефон → комментарий', 'Команда /cancel', 'Проверка полного цикла', 'Commit day-3-fsm'], parsing: ['Фильтры по всем параметрам', 'TOP-10 объектов', 'Функция экспорта', 'Первый скрипт готов!'], synergy: 'Логика работает. Готово показать клиенту' },
        { day: 4, type: 'both', bots: ['Установить aiosqlite==0.20.0', 'Создать db/database.py и db/repository.py', 'Таблица leads', 'Сохранять лиды при финале FSM'], parsing: ['Установить gspread==6.1.2, google-auth==2.35.0', 'Google Sheets API и service account', 'Функция append_to_sheet()', 'Автоэкспорт в таблицу'], synergy: 'БД + облако. Оба имеют persistence' },
        { day: 5, type: 'both', bots: ['Создать utils/security.py', '/admin команда', 'Показать последние 10 заявок', 'Проверка доступа по ADMIN_IDS'], parsing: ['Фильтр мин/макс цена', 'JSON/CSV вывод', 'Мониторинг новых объектов', 'Первый клиент?'], synergy: 'Админка в обоих' },
        { day: 6, type: 'both', bots: ['Создать services/export_service.py', 'Команда /export (админ)', 'CSS-файл с лидами', 'Отправляемый файл в Telegram'], parsing: ['Email отправка результатов', 'Расписание cron', 'Автоматизация 24/7', 'Второй клиент?'], synergy: 'Экспорт + автоматизация готовы' },
        { day: 7, type: 'both', bots: ['README: проблема-решение-стек-запуск', 'Видео-демо 60-90 сек', 'GitHub release-v1', 'Кейс в портфолио'], parsing: ['README для парсера', 'Видео результатов', 'GitHub release-v1', 'Кейс в портфолио'], synergy: '2 кейса + 2 видео + портфолио!' }
    ],
    WEEK2: [
        { day: 8, type: 'both', bots: ['Новый проект faq-bot-v1', '10 FAQ на inline-кнопках', 'Кнопка Связаться с менеджером', 'Отправка контактов менеджеру'], parsing: ['Новый parser-project-2', 'Другая категория/сайт', 'Адаптировать CSS селекторы', 'Второй рабочий парсер'], synergy: 'Трафик растёт. Видим паттерны' },
        { day: 9, type: 'both', bots: ['Развернуть на Render/Railway', 'Настроить .env на хостинге', 'Проверить логи и работу 24/7', 'Добавить ссылку в README'], parsing: ['Развернуть парсер на хостинге', 'Настроить cron расписание', 'Проверить результаты в Sheets', 'Первый живой парсер'], synergy: 'Оба на облаке 24/7' },
        { day: 10, type: 'both', bots: ['Зарегистрироваться на Kwork/FL/Upwork', '3 оффера (цена, сроки)', 'Заполнить профиль + кейсы', '20 откликов'], parsing: ['Начать продавать парсеры', '20 откликов в темы/форумы', 'Первые потенциальные клиенты', 'Таблица лидов'], synergy: '40 откликов в день!' },
        { day: 11, type: 'both', bots: ['Google Sheets API (если нет)', 'Service account JSON', 'Функция save_lead_to_sheets()', 'Лиды дублируются в таблицу'], parsing: ['Google Sheets для результатов', 'Автоматическое обновление', 'Клиент видит real-time', 'Юзеры любят Sheets'], synergy: 'Google Sheets у обоих' },
        { day: 12, type: 'both', bots: ['Новый проект quiz-bot-v1', '7 вопросов на FSM', 'Система баллов', 'Команда /my_result'], parsing: ['parser-project-3 (третий сайт)', 'Копируешь код 1-2, адаптируешь', 'Третий рабочий парсер', 'Готов масштабировать'], synergy: '3 бота + 3 парсера!' },
        { day: 13, type: 'both', bots: ['Рефакторинг под шаблон', 'Структура: handlers/, keyboards/, services/, db/, states/, utils/', 'Вынести логику из хендлеров', 'Commit refactor-commercial'], parsing: ['Рефакторинг 3 парсеров', 'Функции переиспользования', 'Нет копипасты', 'Commit refactor-commercial'], synergy: 'Новый проект за 30 минут!' },
        { day: 14, type: 'both', bots: ['README для faq и quiz', 'GIF/видео-демо', 'Блок "Для кого подходит"', '3 поста в чаты'], parsing: ['README для 3 парсеров', 'Скриншоты результатов', 'Примеры использования', '3 поста в релевантные'], synergy: '3 кейса бота + 3 парсинга!' }
    ],
    WEEK3_4: [
        { day: 15, type: 'both', bots: ['Собрать telegram-bot-template', 'Включить: auth, FSM, SQLite, export, error handler', 'Старт за 30 минут', 'Commit init-template'], parsing: ['parser-template', 'config, BeautifulSoup, gspread, error handling', 'Старт за 15 минут', 'Commit init-template'], synergy: 'Шаблоны готовы' },
        { day: 16, type: 'both', bots: ['Установить loguru==0.7.2', 'Логирование: входящие, ошибки, действия', 'Global error handler', 'Email админу при ошибке'], parsing: ['loguru для парсеров', 'Логирование: start, end, errors, объекты', 'Email при ошибке', 'Лог-файлы'], synergy: 'Профессиональное логирование' },
        { day: 17, type: 'both', bots: ['Платежный сценарий (mock)', 'Выбор тариф → подтверждение → статус', 'БД записывает статус', 'Fallback при ошибке'], parsing: ['Отправка результатов по email', 'Система уведомлений', 'Retry логика', 'Client уведомлен'], synergy: 'Оба уведомляют автоматом' },
        { day: 18, type: 'both', bots: ['Мини-CRM: статусы new/in_work/done', 'Команды: /lead_list, /lead_set_status', 'Фильтр по статусам', 'Уведомления при изменении'], parsing: ['Dashboard админа: статистика', 'Таблица статусов парсеров', 'Команда перезапуска', 'Всё видно'], synergy: 'Админка в обоих' },
        { day: 19, type: 'both', bots: ['20 уточняющих вопросов', 'Шаблон ТЗ', '10 ответов на возражения', 'Чеклист перед сдачей'], parsing: ['15 уточняющих вопросов', 'Шаблон ТЗ', 'Примеры откликов', 'Чеклист'], synergy: 'Sales playbook готов' },
        { day: 20, type: 'both', bots: ['30 откликов на заказы', 'Персональное описание кейса', 'Видео-отклик (30 сек)', 'Трекинг откликов'], parsing: ['30 откликов на парсинг', 'Описание опыта с категориями', 'Примеры результатов', 'Трекинг откликов'], synergy: '60 откликов за день!' },
        { day: 21, type: 'both', bots: ['Взять 1 заказ по цене ниже рынка', 'Разбить на 3 этапа', 'Сдать с инструкцией', 'Запросить отзыв + публикацию'], parsing: ['Взять 1 заказ на парсинг', 'Отправить результаты', 'Получить первый платеж', 'Заказ завершён'], synergy: 'Первые платежи! 🎉' }
    ]
};

// Game state
const GAME_STATE = {
    points: parseInt(localStorage.getItem('points') || '0'),
    level: parseInt(localStorage.getItem('level') || '1'),
    completed: JSON.parse(localStorage.getItem('completed') || '{}'),
    secretFlags: JSON.parse(localStorage.getItem('secretFlags') || '{}'),
    titleClicks: parseInt(localStorage.getItem('titleClicks') || '0'),
    progressHistory: JSON.parse(localStorage.getItem('progressHistory') || '[]')
};

const API_BASE = localStorage.getItem('planApiBase') || 'http://127.0.0.1:8000/api';

const TASK_DETAILS = {};
const SECRET_TOTAL = 10;
let CURRENT_FILTER = 'all';
let GOBLIN_TIPS = [
    'Ищи особые задания — у некоторых есть скрытые руны с бонусом.',
    'README и Deploy часто скрывают золотые награды.',
    'Закрывай оба столбца (боты + парсинг) одного дня для двойного удара.',
    'Нажми 7 раз на заголовок для тайного квеста.',
    'Слизень улавливает твой прогресс. Проверяй статистику часто.',
];

// 🆕 TIMER функциональность
let CURRENT_DAY_START = null;
let TIMER_INTERVAL = null;

async function apiRequest(path, options = {}) {
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
    } catch (_) {
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

async function hydrateMainTrackerFromServer() {
    const data = await apiRequest('/state/main_tracker');
    if (!data || !data.value || typeof data.value !== 'object') return;

    const incoming = data.value;
    if (typeof incoming.points === 'number') GAME_STATE.points = incoming.points;
    if (typeof incoming.level === 'number') GAME_STATE.level = incoming.level;
    if (incoming.completed && typeof incoming.completed === 'object') GAME_STATE.completed = incoming.completed;
    if (incoming.secretFlags && typeof incoming.secretFlags === 'object') GAME_STATE.secretFlags = incoming.secretFlags;
    if (typeof incoming.titleClicks === 'number') GAME_STATE.titleClicks = incoming.titleClicks;
    if (Array.isArray(incoming.progressHistory)) GAME_STATE.progressHistory = incoming.progressHistory;

    saveState();
}

async function syncMainTrackerToServer() {
    const payload = {
        points: GAME_STATE.points,
        level: GAME_STATE.level,
        completed: GAME_STATE.completed,
        secretFlags: GAME_STATE.secretFlags,
        titleClicks: GAME_STATE.titleClicks,
        progressHistory: GAME_STATE.progressHistory
    };

    await apiRequest('/state/main_tracker', {
        method: 'PUT',
        body: JSON.stringify({ value: payload })
    });
}

function getCurrentDay() {
    const startDate = new Date(2026, 2, 31);
    const currentDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);
    const diffTime = currentDate - startDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.min(Math.max(diffDays, 1), 30);
}

function startDayTimer() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    if (TIMER_INTERVAL) clearInterval(TIMER_INTERVAL);
    
    TIMER_INTERVAL = setInterval(() => {
        const now = new Date();
        const diff = tomorrow - now;
        
        if (diff <= 0) {
            document.getElementById('dayTimer').textContent = '00:00:00';
            clearInterval(TIMER_INTERVAL);
            return;
        }
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        document.getElementById('dayTimer').textContent = 
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

// 🆕 Progress history для графика
function recordDailyProgress() {
    const today = new Date().toISOString().split('T')[0];
    const completed = Object.keys(GAME_STATE.completed).length;
    
    if (!GAME_STATE.progressHistory) GAME_STATE.progressHistory = [];
    
    const lastRecord = GAME_STATE.progressHistory[GAME_STATE.progressHistory.length - 1];
    if (!lastRecord || lastRecord.date !== today) {
        GAME_STATE.progressHistory.push({
            date: today,
            completed: completed,
            day: getCurrentDay()
        });
        if (GAME_STATE.progressHistory.length > 30) {
            GAME_STATE.progressHistory.shift();
        }
        saveState();
    }
}

function renderProgressChart() {
    const chart = document.getElementById('progressChart');
    if (!chart) return;
    
    const history = GAME_STATE.progressHistory || [];
    if (history.length === 0) return;
    
    const maxCompleted = Math.max(...history.map(h => h.completed));
    const chartHTML = history.map(h => {
        const height = (h.completed / maxCompleted) * 100;
        const day = h.day;
        return `
            <div class="chart-bar" style="height: ${height}%" title="День ${day}: ${h.completed} задач">
                <span class="chart-label">${day}</span>
            </div>
        `;
    }).join('');
    
    chart.innerHTML = chartHTML;
}

// 🆕 Экспорт прогресса
function exportProgressJSON() {
    const data = {
        exportDate: new Date().toISOString(),
        level: GAME_STATE.level,
        points: GAME_STATE.points,
        tasksCompleted: Object.keys(GAME_STATE.completed).length,
        completedTasks: GAME_STATE.completed,
        progressHistory: GAME_STATE.progressHistory
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `30day-plan-progress-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

function exportProgressCSV() {
    let csv = 'День,Выполнено Задач,Статус\n';
    const history = GAME_STATE.progressHistory || [];
    
    for (let day = 1; day <= 30; day++) {
        const record = history.find(h => h.day === day);
        const completed = record ? record.completed : 0;
        const status = completed === day * 8 ? 'Завершен' : 'В процессе';
        csv += `${day},${completed},${status}\n`;
    }
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `30day-plan-progress-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

function importProgressJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            GAME_STATE.completed = data.completedTasks || {};
            GAME_STATE.points = data.points || 0;
            GAME_STATE.level = data.level || 1;
            GAME_STATE.progressHistory = data.progressHistory || [];
            saveState();
            updateDisplay();
            alert('✅ Прогресс успешно импортирован!');
        } catch (err) {
            alert('❌ Ошибка при импорте файла!');
        }
    };
    reader.readAsText(file);
}

// 🆕 Синхронизация между вкладками
function setupStorageSync() {
    window.addEventListener('storage', (e) => {
        if (e.key === 'completed' || e.key === 'points' || e.key === 'level') {
            GAME_STATE.completed = JSON.parse(localStorage.getItem('completed') || '{}');
            GAME_STATE.points = parseInt(localStorage.getItem('points') || '0');
            GAME_STATE.level = parseInt(localStorage.getItem('level') || '1');
            updateDisplay();
        }
    });
}

// 🆕 Onboarding
function showOnboarding() {
    const hasSeenOnboarding = localStorage.getItem('onboarding_seen');
    if (hasSeenOnboarding) return;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex;
        align-items: center; justify-content: center; z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div style="
            background: linear-gradient(135deg, rgba(20,30,50,0.98), rgba(10,15,30,0.98));
            border: 2px solid #ffd700; border-radius: 20px; padding: 40px;
            max-width: 600px; color: #fff;
        ">
            <h2 style="font-size:2em; color:#ffd700; margin-bottom:20px;">🎮 Добро пожаловать!</h2>
            <p style="font-size:1.1em; line-height:1.8; margin-bottom:20px;">
                <strong>Это трекер твоего 30-дневного плана</strong> к заработку $1000+<br><br>
                ✅ <strong>Выполняй задания</strong> каждый день<br>
                ✅ <strong>Собирай очки</strong> и поднимай уровень<br>
                ✅ <strong>Открывай секреты</strong> в особых заданиях<br>
                ✅ <strong>Смотри прогресс</strong> на графике<br><br>
                💡 Совет: нажми ☰ слева для фильтров и быстрой навигации
            </p>
            <button onclick="this.parentElement.parentElement.remove(); localStorage.setItem('onboarding_seen', '1')" 
                style="
                    width:100%; padding:15px; background:#ffd700; color:#0f0f1e;
                    border:none; border-radius:10px; font-size:1.1em; font-weight:800;
                    cursor:pointer; transition:all 0.3s ease;
                ">
                Начнём!
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// 🆕 ОСНОВНЫЕ ФУНКЦИИ (из оригинального кода)

function updateCurrentDayDisplay() {
    const currentDay = getCurrentDay();
    const allTasks = getAllTasks();
    const completedCount = Object.keys(GAME_STATE.completed).length;
    const completedDays = Math.floor(completedCount / 8);
    
    document.getElementById('dayCounter').textContent = `День ${currentDay}/30`;
    document.getElementById('daysCompleted').textContent = completedDays;
    
    const tasksCompleted = Object.keys(GAME_STATE.completed).filter(k => {
        const meta = parseTaskKey(k);
        return meta.day === currentDay;
    }).length;
    document.getElementById('tasksToday').textContent = `${tasksCompleted}/8`;
    
    const expectedCompleted = (currentDay / 30) * allTasks.length;
    const actualCompleted = completedCount;
    const pace = actualCompleted >= expectedCompleted ? '✓ На графике' : '⚠️ Позади';
    document.getElementById('progressPace').textContent = pace;
    
    const xpToLevel = (GAME_STATE.level * 500) - GAME_STATE.points;
    document.getElementById('xpToLevel').textContent = `${Math.max(0, xpToLevel)} XP`;
    
    let infoText = '';
    if (completedDays === 0) infoText = '🚀 Начало пути! Выполни первые задания.';
    else if (completedDays < 7) infoText = '⚔️ Первая неделя на финише. Держи темп!';
    else if (completedDays < 14) infoText = '💪 Половина пути позади. Отлично!';
    else if (completedDays < 21) infoText = '🌟 Три недели! Финиш видно. Финишируй!';
    else infoText = '🏆 Почти легенда! Завершай последнюю неделю!';
    document.getElementById('dayInfoText').textContent = infoText;
}

function renderDayNavigator() {
    const navigator = document.getElementById('dayNavigator');
    if (!navigator) return;
    navigator.innerHTML = '';
    const currentDay = getCurrentDay();
    
    for (let day = 1; day <= 30; day++) {
        const btn = document.createElement('button');
        btn.className = 'day-nav-btn';
        if (day === currentDay) btn.classList.add('current');
        if (isFullDayCompleted(day)) btn.classList.add('completed');
        btn.textContent = `День ${day}`;
        btn.onclick = () => scrollToDay(day);
        navigator.appendChild(btn);
    }
}

function scrollToDay(day) {
    const dayCard = document.querySelector(`[data-day="${day}"]`);
    if (dayCard) {
        dayCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        dayCard.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.6)';
        setTimeout(() => { dayCard.style.boxShadow = ''; }, 2000);
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebarFilter');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setFilter(type) {
    CURRENT_FILTER = type;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    filterTasks();
    if (window.innerWidth <= 1024) {
        setTimeout(() => toggleSidebar(), 300);
    }
}

function filterBySearch() {
    filterTasks();
}

function filterTasks() {
    const searchTerm = document.getElementById('filterSearch').value.toLowerCase();
    const dayCards = document.querySelectorAll('.day-card');
    
    dayCards.forEach(card => {
        let show = true;
        const isBot = card.classList.contains('bots');
        
        if (CURRENT_FILTER === 'bots') {
            show = isBot;
        } else if (CURRENT_FILTER === 'parsing') {
            show = !isBot;
        } else if (CURRENT_FILTER === 'portfolio') {
            show = card.textContent.includes('README') || card.textContent.includes('видео') || card.textContent.includes('кейс');
        } else if (CURRENT_FILTER === 'sales') {
            show = card.textContent.includes('отклик') || card.textContent.includes('клиент') || card.textContent.includes('цена') || card.textContent.includes('Upwork') || card.textContent.includes('Kwork');
        }
        
        if (searchTerm && !card.textContent.toLowerCase().includes(searchTerm)) {
            show = false;
        }
        
        card.style.display = show ? 'block' : 'none';
    });
}

function renderTasks() {
    const container = document.getElementById('tasksContainer');
    container.innerHTML = '';
    Object.keys(TASK_DETAILS).forEach(k => delete TASK_DETAILS[k]);
    
    let weekNum = 1;
    
    const addWeek = (planArray, weekLabel) => {
        if (weekNum > 1) {
            const weekSep = document.createElement('div');
            weekSep.className = 'week-separator';
            weekSep.innerHTML = `<h2>${weekLabel}</h2>`;
            container.appendChild(weekSep);
        }
        weekNum++;
        
        planArray.forEach(dayData => {
            const dayWrapper = document.createElement('div');
            dayWrapper.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;';
            
            const botCard = createCard(dayData, 'bots');
            const parsingCard = createCard(dayData, 'parsing');
            
            dayWrapper.appendChild(botCard);
            dayWrapper.appendChild(parsingCard);
            container.appendChild(dayWrapper);
        });
    };
    
    addWeek(PLANS.WEEK1, '📅 НЕДЕЛЯ 1: Стартовый спринт');
    addWeek(PLANS.WEEK2, '📅 НЕДЕЛЯ 2: Расширение и продажи');
    addWeek(PLANS.WEEK3_4, '📅 НЕДЕЛИ 3-4: Первая продажа и доход');
}

function createCard(dayData, category) {
    const card = document.createElement('div');
    card.className = `day-card ${category}`;
    card.setAttribute('data-day', dayData.day);
    
    const tasks = category === 'bots' ? dayData.bots : dayData.parsing;
    const emoji = category === 'bots' ? '🤖' : '🕷️';
    
    let html = `<div class="day-header">${emoji} День ${dayData.day} — ${category === 'bots' ? 'Боты' : 'Парсинг'}</div>`;
    html += '<ul class="task-list">';
    
    tasks.forEach((task, idx) => {
        const key = `day-${dayData.day}-${category}-${idx}`;
        const checked = GAME_STATE.completed[key] ? 'checked' : '';
        const completedClass = GAME_STATE.completed[key] ? 'completed' : '';
        const styleData = getTaskStyle(task, dayData.day, category, idx);
        TASK_DETAILS[key] = { key, day: dayData.day, category, idx, task, styleData };
        
        html += `
            <li class="task-item ${completedClass} ${styleData.className}" data-badge="${styleData.badge}">
                <input type="checkbox" class="checkbox" id="${key}" ${checked} onchange="toggleTask('${key}')">
                <label for="${key}" style="flex: 1; cursor: pointer; padding: 0; margin: 0;">
                    <span class="task-text">${task}</span>
                </label>
                <button class="task-mini-btn" onclick="openTaskQuest('${key}')" type="button">КВЕСТ</button>
            </li>
        `;
    });
    
    html += '</ul>';
    if (dayData.synergy) html += `<div class="synergy-box">⚡ ${dayData.synergy}</div>`;
    
    card.innerHTML = html;
    return card;
}

function toggleTask(key) {
    const checkbox = document.getElementById(key);
    if (checkbox.checked && !GAME_STATE.completed[key]) {
        GAME_STATE.points += 50;
        GAME_STATE.level = Math.floor(GAME_STATE.points / 500) + 1;
        GAME_STATE.completed[key] = true;
        showPointsPopup(50, checkbox);
        triggerSecrets(key);
    } else if (!checkbox.checked && GAME_STATE.completed[key]) {
        GAME_STATE.points -= 50;
        GAME_STATE.level = Math.floor(GAME_STATE.points / 500) + 1;
        delete GAME_STATE.completed[key];
    }
    saveState();
    updateDisplay();
}

function updateDisplay() {
    const completed = Object.keys(GAME_STATE.completed).length;
    const total = getAllTasks().length;
    
    document.getElementById('pointsDisplay').textContent = GAME_STATE.points;
    document.getElementById('levelDisplay').textContent = 'LVL ' + GAME_STATE.level;
    document.getElementById('tasksDisplay').textContent = completed + '/' + total;
    document.getElementById('secretsCount').textContent = `🗝️ Секретов: ${Object.keys(GAME_STATE.secretFlags).length}/${SECRET_TOTAL}`;
    
    updateProgress();
    updateCurrentDayDisplay();
    renderDayNavigator();
    recordDailyProgress();
    renderProgressChart();
}

function getAllTasks() {
    let result = [];
    const allPlans = [...PLANS.WEEK1, ...PLANS.WEEK2, ...PLANS.WEEK3_4];
    allPlans.forEach((day) => {
        day.bots.forEach((_, taskIdx) => { result.push(`day-${day.day}-bots-${taskIdx}`); });
        day.parsing.forEach((_, taskIdx) => { result.push(`day-${day.day}-parsing-${taskIdx}`); });
    });
    return result;
}

function updateProgress() {
    const allTasks = getAllTasks();
    const botsCompleted = Object.keys(GAME_STATE.completed).filter(k => k.includes('-bots-')).length;
    const parsingCompleted = Object.keys(GAME_STATE.completed).filter(k => k.includes('-parsing-')).length;
    const botsTotal = allTasks.filter(k => k.includes('-bots-')).length;
    const parsingTotal = allTasks.filter(k => k.includes('-parsing-')).length;
    
    const botsPercent = Math.round((botsCompleted / botsTotal) * 100);
    const parsingPercent = Math.round((parsingCompleted / parsingTotal) * 100);
    const totalPercent = Math.round((Object.keys(GAME_STATE.completed).length / allTasks.length) * 100);
    
    if (document.getElementById('progressBots')) {
        document.getElementById('progressBots').style.width = botsPercent + '%';
        document.getElementById('progressBots').textContent = botsPercent + '%';
        document.getElementById('botsPercent').textContent = botsPercent + '%';
    }
    if (document.getElementById('progressParsing')) {
        document.getElementById('progressParsing').style.width = parsingPercent + '%';
        document.getElementById('progressParsing').textContent = parsingPercent + '%';
        document.getElementById('parsingPercent').textContent = parsingPercent + '%';
    }
    if (document.getElementById('totalPercent')) {
        document.getElementById('totalPercent').textContent = totalPercent + '%';
    }
}

function getTaskStyle(task, day, category, idx) {
    const t = task.toLowerCase();
    if (t.includes('deploy') || t.includes('render') || t.includes('railway') || t.includes('cron')) {
        return { className: 'task-style-deploy', badge: 'DEPLOY' };
    }
    if (t.includes('отклик') || t.includes('клиент') || t.includes('цена') || t.includes('kwork') || t.includes('upwork')) {
        return { className: 'task-style-biz', badge: 'MONEY' };
    }
    if (t.includes('readme') || t.includes('видео') || t.includes('кейс') || t.includes('портфолио')) {
        return { className: 'task-style-showcase', badge: 'SHOW' };
    }
    if (t.includes('рефакторинг') || t.includes('template') || t.includes('шаблон') || t.includes('error handler')) {
        return { className: 'task-style-refactor', badge: 'PRO' };
    }
    if (category === 'parsing' || idx % 2 === 0 || day % 3 === 0) {
        return { className: 'task-style-build', badge: 'BUILD' };
    }
    return { className: 'task-style-biz', badge: 'QUEST' };
}

function showPointsPopup(points, element) {
    const rect = element.getBoundingClientRect();
    const popup = document.createElement('div');
    popup.className = 'points-popup';
    popup.style.left = rect.left + Math.random() * 100 + 'px';
    popup.style.top = rect.top - 30 + 'px';
    popup.textContent = '+' + points + ' 🎯';
    popup.style.color = '#ffd700';
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1500);
}

function saveState() {
    localStorage.setItem('points', GAME_STATE.points);
    localStorage.setItem('level', GAME_STATE.level);
    localStorage.setItem('completed', JSON.stringify(GAME_STATE.completed));
    localStorage.setItem('secretFlags', JSON.stringify(GAME_STATE.secretFlags));
    localStorage.setItem('titleClicks', GAME_STATE.titleClicks);
    localStorage.setItem('progressHistory', JSON.stringify(GAME_STATE.progressHistory));
    void syncMainTrackerToServer();
}

function resetProgress() {
    localStorage.clear();
    GAME_STATE.points = 0;
    GAME_STATE.level = 1;
    GAME_STATE.completed = {};
    GAME_STATE.progressHistory = [];
    renderTasks();
    updateDisplay();
}

function parseTaskKey(key) {
    const parts = key.split('-');
    return { day: parseInt(parts[1]), category: parts[2], idx: parseInt(parts[3]) };
}

function isFullDayCompleted(day) {
    for (let i = 0; i < 4; i++) {
        if (!GAME_STATE.completed[`day-${day}-bots-${i}`]) return false;
        if (!GAME_STATE.completed[`day-${day}-parsing-${i}`]) return false;
    }
    return true;
}

function openTaskQuest(key) {
    // Простая версия (полный код остается в HTML для модальок с большим текстом)
    alert(`Квест: ${TASK_DETAILS[key]?.task || 'Задание'}\n\nОткрыть детальную информацию в модальном окне. Функция требует полного JavaScript кода в HTML.`);
}

function triggerSecrets(key) {
    // Упрощенная версия
    const taskText = TASK_DETAILS[key]?.task.toLowerCase() || '';
    if (taskText.includes('readme')) {
        GAME_STATE.secretFlags['readme-rune'] = true;
        alert('📜 Секрет: Тайная руна README разблокирована! +120 XP');
        GAME_STATE.points += 120;
    }
}

// Show/hide scroll to top button
window.addEventListener('scroll', () => {
    const btn = document.getElementById('scrollToTopBtn');
    if (btn) {
        if (window.scrollY > 300) {
            btn.classList.add('show');
        } else {
            btn.classList.remove('show');
        }
    }
});

// Init on page load
document.addEventListener('DOMContentLoaded', async () => {
    await hydrateMainTrackerFromServer();
    renderTasks();
    updateDisplay();
    setupStorageSync();
    startDayTimer();
    showOnboarding();
    recordDailyProgress();
});
