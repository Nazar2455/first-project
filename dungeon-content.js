// Расширяемый банк обучающих миссий для Code Dungeon
// Как расширять под конкретные задания:
// 1) Добавь ключ задания в byTask, например "day-8-bots-2"
// 2) Внутри укажи массив вопросов (question + options + answerIndex + tip)

const DUNGEON_QUESTION_BANK = {
    default: [
        {
            question: 'Какой файл обычно хранит секреты и токены?',
            options: ['README.md', '.env', 'requirements.txt', 'main.py'],
            answerIndex: 1,
            tip: 'Секреты храним в .env и не коммитим в Git.'
        },
        {
            question: 'Что лучше сделать перед первым откликом клиенту?',
            options: ['Сразу назвать цену без контекста', 'Показать релевантный кейс и сроки', 'Отправить пустой шаблон', 'Игнорировать ТЗ'],
            answerIndex: 1,
            tip: 'Кейс + конкретика по срокам повышают конверсию.'
        },
        {
            question: 'Что обязательно для MVP Telegram-бота?',
            options: ['Сложный AI сразу', '/start и базовый сценарий', '100 команд', 'Админ-панель на первом шаге'],
            answerIndex: 1,
            tip: 'Сначала рабочий минимум, потом усложнение.'
        },
        {
            question: 'Для парсинга HTML чаще всего используют...',
            options: ['NumPy', 'BeautifulSoup', 'Matplotlib', 'Selenium IDE'],
            answerIndex: 1,
            tip: 'BeautifulSoup + requests — базовый стек.'
        },
        {
            question: 'Что повышает шанс получить повторный заказ?',
            options: ['Сдать без инструкции', 'Сдать в срок + дать мини-инструкцию', 'Скрыть код', 'Не отвечать после сдачи'],
            answerIndex: 1,
            tip: 'Сервис и ясность = повторные клиенты.'
        },
        {
            question: 'Зачем нужен README в проекте?',
            options: ['Для красоты', 'Чтобы быстро понять и запустить проект', 'Только для GitHub звезд', 'Он не нужен'],
            answerIndex: 1,
            tip: 'README продаёт твой проект до первого созвона.'
        }
    ],
    byDay: {
        1: [
            {
                question: 'Что из этого логично сделать в день 1?',
                options: ['Сразу 24/7 деплой', 'Скелет проекта + /start + /help', 'Сложную платежку', 'Публикацию в 10 чатах'],
                answerIndex: 1,
                tip: 'Фундамент проекта важнее раннего усложнения.'
            }
        ],
        3: [
            {
                question: 'FSM в боте нужен для...',
                options: ['Графиков', 'Пошагового диалога с состояниями', 'Хранения изображений', 'Ускорения CPU'],
                answerIndex: 1,
                tip: 'FSM — управляемая воронка вопросов.'
            }
        ],
        9: [
            {
                question: 'Главный смысл деплоя на день 9?',
                options: ['Красивый домен', 'Работа 24/7 и доверие клиента', 'Больше анимаций', 'Уменьшить README'],
                answerIndex: 1,
                tip: 'Надёжность = деньги.'
            }
        ]
    },
    byTask: {
        'day-1-bots-0': [
            {
                question: 'Ты создаёшь папку lead-bot-v1. Что сразу добавить?',
                options: ['.env + requirements.txt + main.py + README', 'Только main.py', 'Только .gitignore', 'Ничего'],
                answerIndex: 0,
                tip: 'Минимальный набор файлов ускоряет старт и поддержку.'
            }
        ],
        'day-3-bots-0': [
            {
                question: 'Шаги FSM заявки корректнее всего строить как...',
                options: ['Имя -> Телефон -> Комментарий', 'Комментарий -> Выход', 'Только /start', 'Случайный порядок'],
                answerIndex: 0,
                tip: 'Линейная цепочка даёт предсказуемый UX.'
            }
        ],
        'day-4-parsing-3': [
            {
                question: 'Автоэкспорт в таблицу означает...',
                options: ['Данные остаются только в памяти', 'Результаты пишутся в Sheets/таблицу автоматически', 'Только ручной copy-paste', 'Никакого логирования'],
                answerIndex: 1,
                tip: 'Автоэкспорт = удобство клиента и регулярность.'
            }
        ],
        'day-10-bots-3': [
            {
                question: '20 откликов в день — это прежде всего...',
                options: ['Спам без персонализации', 'Статистика воронки продаж', 'Пустая трата времени', 'Только для топов'],
                answerIndex: 1,
                tip: 'Объём + релевантность дают первые диалоги.'
            }
        ],
        'day-14-bots-0': [
            {
                question: 'README для faq/quiz проекта нужно, чтобы...',
                options: ['Скрыть логику', 'Клиент понял ценность и запуск', 'Увеличить размер репо', 'Избежать тестов'],
                answerIndex: 1,
                tip: 'Упаковка напрямую влияет на продажи.'
            }
        ]
    }
};

function getCurrentPlanDayForDungeon() {
    const startDate = new Date(2026, 2, 31);
    const now = new Date();
    startDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const day = Math.floor((now - startDate) / (1000 * 60 * 60 * 24)) + 1;
    return Math.min(Math.max(day, 1), 30);
}

function buildDungeonQuestionQueue(limit = 12) {
    const completed = JSON.parse(localStorage.getItem('completed') || '{}');
    const completedKeys = Object.keys(completed);
    const currentDay = getCurrentPlanDayForDungeon();

    const currentDayKeys = [];
    for (let i = 0; i < 4; i++) {
        currentDayKeys.push(`day-${currentDay}-bots-${i}`);
        currentDayKeys.push(`day-${currentDay}-parsing-${i}`);
    }

    const byTaskQuestions = [];
    completedKeys.forEach(key => {
        const q = DUNGEON_QUESTION_BANK.byTask[key];
        if (q) byTaskQuestions.push(...q);
    });

    const byCurrentDayQuestions = [];
    currentDayKeys.forEach(key => {
        const q = DUNGEON_QUESTION_BANK.byTask[key];
        if (q) byCurrentDayQuestions.push(...q);
    });

    const dayQuestions = DUNGEON_QUESTION_BANK.byDay[currentDay] || [];
    const pool = [...byCurrentDayQuestions, ...byTaskQuestions, ...dayQuestions, ...DUNGEON_QUESTION_BANK.default];

    // Убираем точные дубли по question
    const seen = new Set();
    const unique = [];
    for (const item of pool) {
        if (!seen.has(item.question)) {
            seen.add(item.question);
            unique.push(item);
        }
    }

    // Лёгкий shuffle
    for (let i = unique.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [unique[i], unique[j]] = [unique[j], unique[i]];
    }

    return unique.slice(0, limit);
}
