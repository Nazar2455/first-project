(function () {
  const DAY_DATA = {
    5: {
      title: 'Модуль 5 · День 5',
      subtitle: 'Безопасность и контроль: админ-доступ в боте + фильтры/мониторинг в парсинге',
      goal: 'Сегодня ты переводишь проекты из «просто работает» в «безопасно и управляемо». Это важный шаг к коммерческому уровню.',
      dayPlan: [
        'Разогрев (15–20 мин): повтори путь заявки в боте и текущий pipeline парсера.',
        'Блок БОТЫ (60–90 мин): доступы, guard, аудит, тест не-админов.',
        'Блок ПАРСИНГ (60–90 мин): диапазон, snapshot, new_rows, экспорт.',
        'Финал (20–30 мин): мини-демо + фиксация результата в README/портфолио.'
      ],
      glossary: [
        { term: 'Guard', explain: 'Ранний защитный блок в коде, который останавливает выполнение при нарушении условия.' },
        { term: 'Snapshot', explain: 'Снимок прошлого состояния данных для сравнения с текущим запуском.' },
        { term: 'new_rows', explain: 'Новые элементы, которых не было в предыдущем snapshot.' },
        { term: 'Audit log', explain: 'Лог действий и попыток доступа для контроля и расследования инцидентов.' }
      ],
      deliverables: [
        'Рабочий guard на всех админ-командах бота.',
        'Логи успешных и неуспешных попыток доступа.',
        'Фильтр + snapshot + отдельный экспорт новых объектов.',
        'Короткое демо (бот + parsing мониторинг) и запись в портфолио.'
      ],
      bots: {
        why: 'Если нет проверки прав, любой пользователь может получить доступ к чувствительным данным. Для клиента это красный флаг.',
        microExamples: [
          {
            title: 'Мини-пример 1: базовая проверка доступа',
            code: 'def is_admin(user_id: int, admin_ids: set[int]) -> bool:\n    return user_id in admin_ids',
            explain: 'Это самый маленький guard. Всё, что связано с просмотром лидов/экспортом, должно проходить через него.'
          },
          {
            title: 'Мини-пример 2: early-return в хендлере',
            code: '@router.message(Command("admin"))\nasync def admin_panel(message: Message):\n    if not is_admin(message.from_user.id, ADMIN_IDS):\n        await message.answer("⛔ Нет доступа")\n        return\n\n    await message.answer("Добро пожаловать в админ-панель")',
            explain: 'Паттерн «проверил → быстро вышел» делает код безопаснее и чище: приватная логика не выполняется вообще.'
          },
          {
            title: 'Мини-пример 3: аудит неуспешной попытки',
            code: 'logger.warning("Unauthorized admin access", extra={"user_id": user_id, "command": "/admin"})',
            explain: 'Лог попыток нужен не «для красоты», а для диагностики инцидентов и отчётности перед клиентом.'
          }
        ],
        bigSteps: [
          'Вынеси проверку доступа в utils/security.py и загружай ADMIN_IDS из .env (через split + int).',
          'Перед /admin, /export и другими чувствительными командами добавь guard: if not is_admin(...): ответ + return.',
          'Сделай два типа логов: успешный доступ (info) и отказ доступа (warning).',
          'Проверь 3 сценария: админ, не-админ, пустой/битый ADMIN_IDS в окружении.'
        ],
        implementationWalkthrough: [
          'Сконфигурируй ADMIN_IDS в .env, например: ADMIN_IDS=123456,987654.',
          'Добавь parse_admin_ids() с обработкой пустых значений и лишних пробелов.',
          'Поставь guard в начале каждого чувствительного хендлера до бизнес-логики.',
          'При отказе: ответ пользователю + warning лог с user_id и командой.',
          'При успехе: info лог (кто/когда/какая команда).',
          'Протестируй с двумя аккаунтами: админ и обычный пользователь.'
        ],
        fullCode: {
          title: 'Большой пример: доступ + аудит + админ-команды',
          code: 'import os\nimport logging\nfrom aiogram import Router\nfrom aiogram.filters import Command\nfrom aiogram.types import Message\n\nrouter = Router()\nlogger = logging.getLogger("security")\n\n\ndef parse_admin_ids(raw: str | None) -> set[int]:\n    if not raw:\n        return set()\n    result = set()\n    for part in raw.split(","):\n        part = part.strip()\n        if not part:\n            continue\n        if part.isdigit():\n            result.add(int(part))\n    return result\n\n\nADMIN_IDS = parse_admin_ids(os.getenv("ADMIN_IDS"))\n\n\ndef is_admin(user_id: int) -> bool:\n    return user_id in ADMIN_IDS\n\n\ndef log_denied(user_id: int, command: str) -> None:\n    logger.warning("Admin access denied", extra={"user_id": user_id, "command": command})\n\n\ndef log_allowed(user_id: int, command: str) -> None:\n    logger.info("Admin access allowed", extra={"user_id": user_id, "command": command})\n\n\n@router.message(Command("admin"))\nasync def admin_panel(message: Message):\n    user_id = message.from_user.id\n    if not is_admin(user_id):\n        log_denied(user_id, "/admin")\n        await message.answer("⛔ Нет доступа")\n        return\n\n    log_allowed(user_id, "/admin")\n    await message.answer("✅ Админ-панель: /admin_count /export")\n\n\n@router.message(Command("admin_count"))\nasync def admin_count(message: Message):\n    user_id = message.from_user.id\n    if not is_admin(user_id):\n        log_denied(user_id, "/admin_count")\n        await message.answer("⛔ Нет доступа")\n        return\n\n    # Пример: заменишь заглушку на реальный запрос в БД\n    leads_count = 42\n    log_allowed(user_id, "/admin_count")\n    await message.answer(f"📊 Лидов в базе: {leads_count}")',
          explain: 'Этот блок показывает полный «контур безопасности»: загрузка админов, единая проверка прав, ранний отказ и аудит логов.',
          breakdown: [
            'parse_admin_ids нормализует ADMIN_IDS и защищает от мусора в .env.',
            'is_admin используется как единый guard во всех чувствительных командах.',
            'log_denied/log_allowed дают прозрачность по действиям пользователей.',
            'early return после отказа не даёт приватной логике выполниться.'
          ],
          lineByLine: [
            'Импорты: разделены зависимости aiogram и logging — это упрощает поддержку и тестирование.',
            'router и logger создаются один раз на модуль: меньше побочных эффектов.',
            'parse_admin_ids: пустая строка сразу даёт пустой set, чтобы не было ложных доступов.',
            'split(",") + strip() убирают пробелы и мусор в конфиге.',
            'isdigit() фильтрует некорректные значения (например, случайные символы).',
            'ADMIN_IDS инициализируется из env на старте — единый источник прав.',
            'is_admin инкапсулирует проверку в отдельной функции, чтобы не дублировать логику.',
            'В admin_panel guard идёт первым — до любой бизнес-логики.',
            'log_denied + ответ пользователю + return: полный безопасный сценарий отказа.',
            'log_allowed пишется только при успехе — можно строить аудит по логам.',
            'admin_count использует тот же guard-паттерн, что делает код единообразным.',
            'Заглушка leads_count помечена явно: видно место интеграции с реальной БД.'
          ]
        },
        commonErrors: [
          'ADMIN_IDS хранится строкой и не переводится в int — из-за этого админ «как будто не админ».',
          'Guard добавлен в /admin, но забыт в /export и других чувствительных командах.',
          'Нет return после отказа доступа — код ниже всё равно выполняется.',
          'Логи отсутствуют, и ты не видишь, кто и когда пытался зайти в админку.'
        ],
        resultChecklist: [
          'Только admin_id из .env получает доступ к админ-командам.',
          'Не-админ получает корректный отказ без технических деталей.',
          'Попытки несанкционированного доступа пишутся в лог.',
          'Команда /admin_count показывает актуальное число лидов.'
        ],
        practice: [
          'Добавь двух админов в .env и протестируй оба аккаунта.',
          'Сделай /admin_count для количества лидов.',
          'Добавь лог неуспешных попыток доступа.'
        ]
      },
      parsing: {
        why: 'Клиенту редко нужен «весь датасет». Обычно нужны фильтры и понятный список новых объектов.',
        microExamples: [
          {
            title: 'Мини-пример 1: фильтр по диапазону',
            code: 'def in_range(price: int, min_p: int, max_p: int) -> bool:\n    return min_p <= price <= max_p',
            explain: 'Это атомарная проверка, из которой строится бизнес-фильтр «покажи только нужный сегмент».'
          },
          {
            title: 'Мини-пример 2: сравнение snapshot',
            code: 'old_urls = {"a", "b"}\ncurrent_urls = {"a", "b", "c"}\nnew_urls = current_urls - old_urls\nprint(new_urls)  # {"c"}',
            explain: 'Так определяется «что нового появилось» между запусками. Клиенту обычно важны именно новые позиции.'
          },
          {
            title: 'Мини-пример 3: мониторинг числа новых объектов',
            code: 'if len(new_rows) == 0:\n    logger.info("No new items")\nelse:\n    logger.info(f"New items: {len(new_rows)}")',
            explain: 'Даже простая метрика new_rows уже делает проект мониторинговым, а не просто «разовый скрипт».'
          }
        ],
        bigSteps: [
          'Сделай parse_price() и фильтр min/max с явной валидацией входных параметров.',
          'После фильтра добавь раздельный экспорт: filtered.csv (всё по критериям) и new_items.json (только новое).',
          'Реализуй snapshot по ключу url/id: сохрани старое состояние, сравни с текущим, вычисли new_rows.',
          'Добавь базовый мониторинг: лог количества total/filtered/new и времени выполнения.'
        ],
        implementationWalkthrough: [
          'Определи стабильный ключ сущности (обычно url или id с сайта).',
          'Перед фильтрацией нормализуй цену в число через parse_price().',
          'Считай текущие ключи и прошлые ключи из snapshot-файла.',
          'Вычисли только новые элементы и сохрани их отдельным JSON.',
          'Логируй total/filtered/new, чтобы видеть динамику между запусками.',
          'Сохрани свежий snapshot в конце успешного прогона.'
        ],
        fullCode: {
          title: 'Большой пример: фильтр + snapshot + new_rows мониторинг',
          code: 'import csv\nimport json\nimport time\nfrom pathlib import Path\n\nSNAPSHOT_PATH = Path("snapshot_urls.json")\n\n\ndef parse_price(raw: str) -> int:\n    digits = "".join(ch for ch in str(raw) if ch.isdigit())\n    return int(digits) if digits else 0\n\n\ndef in_range(price: int, min_p: int, max_p: int) -> bool:\n    return min_p <= price <= max_p\n\n\ndef filter_rows(rows: list[dict], min_p: int, max_p: int) -> list[dict]:\n    result = []\n    for row in rows:\n        p = parse_price(row.get("price", "0"))\n        if in_range(p, min_p, max_p):\n            row = dict(row)\n            row["price_num"] = p\n            result.append(row)\n    return result\n\n\ndef load_snapshot() -> set[str]:\n    if not SNAPSHOT_PATH.exists():\n        return set()\n    data = json.loads(SNAPSHOT_PATH.read_text(encoding="utf-8"))\n    return set(data)\n\n\ndef save_snapshot(urls: set[str]) -> None:\n    SNAPSHOT_PATH.write_text(json.dumps(sorted(urls), ensure_ascii=False, indent=2), encoding="utf-8")\n\n\ndef export_csv(rows: list[dict], path: str) -> None:\n    if not rows:\n        return\n    fieldnames = ["title", "price", "url", "price_num"]\n    with open(path, "w", encoding="utf-8", newline="") as f:\n        writer = csv.DictWriter(f, fieldnames=fieldnames)\n        writer.writeheader()\n        writer.writerows(rows)\n\n\ndef main(rows: list[dict]) -> None:\n    started = time.time()\n\n    filtered = filter_rows(rows, min_p=20000, max_p=80000)\n\n    old_urls = load_snapshot()\n    current_urls = {r.get("url", "") for r in filtered if r.get("url")}\n    new_urls = current_urls - old_urls\n\n    new_rows = [r for r in filtered if r.get("url") in new_urls]\n\n    export_csv(filtered, "filtered.csv")\n    Path("new_items.json").write_text(json.dumps(new_rows, ensure_ascii=False, indent=2), encoding="utf-8")\n    save_snapshot(current_urls)\n\n    elapsed = round(time.time() - started, 2)\n    print(f"total={len(rows)} filtered={len(filtered)} new={len(new_rows)} time={elapsed}s")',
          explain: 'Это полноценный monitoring pipeline: нормализация цены, фильтр, дельта новых объектов, экспорт и метрики выполнения.',
          breakdown: [
            'filter_rows оставляет только нужный диапазон и добавляет числовую цену.',
            'snapshot хранит прошлое состояние для сравнения между запусками.',
            'new_rows показывает именно новые позиции, а не весь поток данных.',
            'финальный print даёт операционные метрики total/filtered/new/time.'
          ],
          lineByLine: [
            'SNAPSHOT_PATH задаёт постоянный файл состояния между запусками.',
            'parse_price оставляет только цифры — это обязательная нормализация перед фильтрацией.',
            'in_range изолирует условие диапазона в маленькую переиспользуемую функцию.',
            'filter_rows: берём price из row.get(...), чтобы не падать на отсутствующих ключах.',
            'row = dict(row) предотвращает случайную мутацию исходных данных.',
            'price_num добавляется специально для сортировок и аналитики.',
            'load_snapshot корректно обрабатывает первый запуск (когда файла ещё нет).',
            'save_snapshot сохраняет отсортированный список для стабильного diffs в git/логах.',
            'export_csv проверяет пустой набор до записи — нет «пустых» отчётов без смысла.',
            'current_urls собирается только из валидных непустых url.',
            'new_urls = current_urls - old_urls — ключевая операция поиска новинок.',
            'new_rows формируется из filtered, поэтому клиент видит новые только в заданном диапазоне.',
            'В конце обновляем snapshot, иначе следующий запуск снова покажет старое как новое.',
            'Метрика elapsed нужна для контроля производительности и поиска деградаций.'
          ]
        },
        commonErrors: [
          'Сравнивают объекты целиком, а не по стабильному ключу (url/id) — появляются ложные «новые».',
          'Снапшот не сохраняется после прогона, поэтому каждый запуск «с нуля».',
          'Фильтрация идёт по строковой цене без нормализации в int.',
          'Нет логов по total/filtered/new, и невозможно понять, где проблема в pipeline.'
        ],
        resultChecklist: [
          'Фильтр по цене даёт корректный диапазон без мусорных строк.',
          'new_rows определяется через сравнение текущего и прошлого снапшота.',
          'Отдельно сохраняются filtered.csv и new_items.json.',
          'В логах видно total, filtered, new и длительность прогона.'
        ],
        practice: [
          'Сделай фильтр 20 000–80 000.',
          'Сравни два запуска и выведи new_rows.',
          'Сохрани новые объекты отдельно в new_items.json.'
        ]
      }
    },
    6: {
      title: 'Модуль 6 · День 6',
      subtitle: 'Экспорт и автоматизация: результат должен доходить до клиента без ручной рутины',
      goal: 'Сегодня ты превращаешь данные в доставляемый результат: бот отдает корректный CSV, парсер отправляет отчёт по расписанию.',
      dayPlan: [
        'Разогрев (10–15 мин): проверь, что в БД есть тестовые заявки и парсер даёт валидные rows.',
        'БОТЫ (60–90 мин): экспорт CSV, защита доступа, отправка файла в Telegram.',
        'ПАРСИНГ (60–90 мин): email-отчёт, retry, плановый запуск.',
        'Финал (20 мин): демо «экспорт + авто-отчёт», запись выводов в README.'
      ],
      glossary: [
        { term: 'Export service', explain: 'Отдельный модуль, который собирает данные и формирует файл для клиента.' },
        { term: 'Retry', explain: 'Повтор операции после временной ошибки (сеть, SMTP, API).' },
        { term: 'Scheduler', explain: 'Планировщик, который запускает скрипт автоматически по времени.' },
        { term: 'Idempotency', explain: 'Повторный запуск не должен ломать процесс и давать хаос в результатах.' }
      ],
      deliverables: [
        'Команда /export отправляет клиентский CSV-файл без ошибок.',
        'Экспорт закрыт guard-проверкой админ-доступа.',
        'Парсер отправляет email-сводку с TOP-5 и метриками.',
        'Настроен хотя бы один автоматический запуск и подтверждён логами.'
      ],
      bots: {
        why: 'Экспорт — это про ценность. Клиенту нужен файл/таблица, а не объяснение «данные в базе».',
        microExamples: [
          {
            title: 'Мини-пример 1: базовый CSV-экспорт',
            code: 'import csv\n\nwith open("leads.csv", "w", newline="", encoding="utf-8") as f:\n    writer = csv.DictWriter(f, fieldnames=["id", "name", "phone"])\n    writer.writeheader()\n    writer.writerows(rows)',
            explain: 'Это основа экспорта: единые заголовки + массив строк, который клиент может открыть сразу.'
          },
          {
            title: 'Мини-пример 2: имя файла с timestamp',
            code: 'from datetime import datetime\nfilename = f"leads_{datetime.now():%Y%m%d_%H%M%S}.csv"',
            explain: 'Timestamp в имени помогает не перезаписывать старые отчёты и облегчает аудит.'
          },
          {
            title: 'Мини-пример 3: отправка документа в Telegram',
            code: 'from aiogram.types import FSInputFile\n\nfile = FSInputFile(filename)\nawait message.answer_document(file, caption="Экспорт лидов")',
            explain: 'Итоговая ценность появляется в момент, когда файл доходит до пользователя/клиента.'
          }
        ],
        bigSteps: [
          'Сделай export_service.py: чтение последних лидов из БД, формирование CSV, возврат пути к файлу.',
          'Повесь /export на guard-проверку админа и добавь понятные ответы на успех/ошибку.',
          'Отправь файл через answer_document и логируй факт экспорта.',
          'Проверь сценарии: админ, не-админ, пустая БД, ошибка записи файла.'
        ],
        implementationWalkthrough: [
          'В repository добавь get_last_leads(limit) для выборки.',
          'В export_service собери rows -> writer.writeheader -> writer.writerows.',
          'Возвращай path файла наружу, не отправляй Telegram из сервиса (разделение ответственности).',
          'В хендлере /export: guard -> try export -> answer_document -> cleanup файла.',
          'Логируй user_id, количество строк и имя файла.'
        ],
        fullCode: {
          title: 'Большой пример: export_service + /export handler',
          code: 'import csv\nfrom datetime import datetime\nfrom pathlib import Path\nfrom aiogram import Router\nfrom aiogram.filters import Command\nfrom aiogram.types import Message, FSInputFile\n\nrouter = Router()\nEXPORT_DIR = Path("exports")\nEXPORT_DIR.mkdir(exist_ok=True)\n\n\ndef build_export_filename() -> Path:\n    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")\n    return EXPORT_DIR / f"leads_{stamp}.csv"\n\n\ndef write_leads_csv(rows: list[dict]) -> Path:\n    path = build_export_filename()\n    fieldnames = ["id", "name", "phone", "comment", "created_at"]\n    with open(path, "w", encoding="utf-8", newline="") as f:\n        writer = csv.DictWriter(f, fieldnames=fieldnames)\n        writer.writeheader()\n        writer.writerows(rows)\n    return path\n\n\ndef is_admin(user_id: int) -> bool:\n    return user_id in {123456789}\n\n\n@router.message(Command("export"))\nasync def export_cmd(message: Message):\n    if not is_admin(message.from_user.id):\n        await message.answer("⛔ Нет доступа")\n        return\n\n    # Заглушка: подставь реальный вызов get_last_leads()\n    rows = [\n        {"id": 1, "name": "Nazar", "phone": "+79990000000", "comment": "Нужен бот", "created_at": "2026-03-31 10:00:00"},\n        {"id": 2, "name": "Alex", "phone": "+79991112233", "comment": "Нужен парсер", "created_at": "2026-03-31 11:15:00"},\n    ]\n\n    if not rows:\n        await message.answer("ℹ️ Нет данных для экспорта")\n        return\n\n    path = write_leads_csv(rows)\n    await message.answer_document(FSInputFile(path), caption=f"Экспорт: {len(rows)} строк")\n    path.unlink(missing_ok=True)',
          explain: 'Этот код показывает полный «боевой» поток: подготовка файла, проверка прав, экспорт строк и отправка клиенту в Telegram.',
          breakdown: [
            'write_leads_csv изолирует логику формирования файла и не зависит от Telegram API.',
            'в хендлере /export сначала guard, затем проверка пустого набора, затем отправка документа.',
            'timestamp в имени файла упрощает историю выгрузок.',
            'после отправки файл удаляется, чтобы не копить мусор на сервере.'
          ],
          lineByLine: [
            'EXPORT_DIR создаётся заранее: экспорт не падает из-за отсутствия папки.',
            'build_export_filename использует timestamp, чтобы каждый отчёт был уникальным.',
            'fieldnames фиксируются явно: клиент всегда получает одинаковую структуру CSV.',
            'newline="" и utf-8 решают типичные проблемы CSV на Windows.',
            'is_admin вынесен в отдельную функцию — легче заменить на полноценный guard.',
            'В хендлере guard стоит до доступа к данным — это принцип secure-by-default.',
            'Проверка if not rows предотвращает отправку пустых и бесполезных файлов.',
            'FSInputFile — корректный тип для отправки локального файла в Telegram.',
            'caption сообщает пользователю, сколько строк в отчёте.',
            'unlink(missing_ok=True) очищает временный файл и не падает, если его уже нет.'
          ]
        },
        commonErrors: [
          'Экспорт открыт всем пользователям — отсутствует guard на /export.',
          'CSV записывается без newline="" и в Windows появляются пустые строки.',
          'Неверные fieldnames: часть колонок не совпадает с данными.',
          'Файл создаётся, но не удаляется после отправки и забивает диск.'
        ],
        resultChecklist: [
          '/export работает только для админа.',
          'Клиент получает корректный CSV с ожидаемыми колонками.',
          'Пустой результат обрабатывается дружелюбным сообщением.',
          'Экспорт логируется, а временный файл очищается.'
        ],
        practice: [
          'Создай 3 тестовые заявки через FSM.',
          'Проверь корректность CSV заголовков и значений.',
          'Добавь timestamp экспорта в имя файла.',
          'Сделай вариант /export_50 (последние 50 строк).' 
        ]
      },
      parsing: {
        why: 'Автоматизация = регулярная ценность. Если отчёт приходит сам, клиент реально экономит время.',
        microExamples: [
          {
            title: 'Мини-пример 1: retry с паузой',
            code: 'import time\n\ndef with_retry(fn, retries=3, delay=2):\n    for attempt in range(1, retries + 1):\n        try:\n            return fn()\n        except Exception:\n            if attempt == retries:\n                raise\n            time.sleep(delay)',
            explain: 'Retry нужен для временных сбоев сети. Важно: на последней попытке ошибка должна пробрасываться.'
          },
          {
            title: 'Мини-пример 2: краткая email-сводка',
            code: 'subject = "Daily parsing report"\nbody = f"total={total}, new={new}, top5={top5}"',
            explain: 'Клиенту нужен не сырой лог, а короткая управленческая сводка.'
          },
          {
            title: 'Мини-пример 3: отметка времени запуска',
            code: 'from datetime import datetime\nprint(f"Run at {datetime.now():%Y-%m-%d %H:%M:%S}")',
            explain: 'Без метки времени трудно понять, какой запуск дал конкретный результат.'
          }
        ],
        bigSteps: [
          'Сделай email_report.py: subject/body + вложение при необходимости.',
          'Оберни отправку в retry-логику с контролируемым числом попыток.',
          'Настрой плановый запуск (Task Scheduler/cron) и сохрани лог каждого прогона.',
          'Проверь сценарии: успех, временный SMTP-сбой, фатальная ошибка с уведомлением.'
        ],
        implementationWalkthrough: [
          'Собери метрики после парсинга: total, filtered, new, длительность.',
          'Сформируй письмо в одном месте: build_report(metrics, top5).',
          'send_email оберни retry-обёрткой, чтобы переживать кратковременные сбои.',
          'Добавь лог начала/конца задачи и причины падения.',
          'Подключи scheduler и проверь хотя бы один автозапуск end-to-end.'
        ],
        fullCode: {
          title: 'Большой пример: email_report + retry + плановый запуск',
          code: 'import smtplib\nimport time\nfrom email.mime.text import MIMEText\nfrom datetime import datetime\n\n\ndef build_report(metrics: dict, top5: list[dict]) -> tuple[str, str]:\n    subject = f"Parsing report {datetime.now():%Y-%m-%d}"\n    lines = [\n        f"total={metrics.get(\"total\", 0)}",\n        f"filtered={metrics.get(\"filtered\", 0)}",\n        f"new={metrics.get(\"new\", 0)}",\n        f"duration={metrics.get(\"duration\", 0)}s",\n        "",\n        "TOP-5:",\n    ]\n    for i, row in enumerate(top5, 1):\n        lines.append(f"{i}. {row.get(\"title\", \"-\")} | {row.get(\"price\", \"-\")} | {row.get(\"url\", \"-\")}")\n    return subject, "\\n".join(lines)\n\n\ndef send_email(subject: str, body: str, smtp_host: str, smtp_port: int, user: str, password: str, to_email: str):\n    msg = MIMEText(body, _charset="utf-8")\n    msg["Subject"] = subject\n    msg["From"] = user\n    msg["To"] = to_email\n\n    with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=20) as server:\n        server.login(user, password)\n        server.send_message(msg)\n\n\ndef send_with_retry(subject: str, body: str, *, retries: int = 3, delay_sec: int = 3, **smtp_kwargs):\n    for attempt in range(1, retries + 1):\n        try:\n            send_email(subject, body, **smtp_kwargs)\n            return\n        except Exception as e:\n            if attempt == retries:\n                raise RuntimeError(f"Email failed after {retries} attempts") from e\n            time.sleep(delay_sec)\n\n\ndef main(metrics: dict, top5: list[dict], smtp_config: dict):\n    started = datetime.now()\n    subject, body = build_report(metrics, top5)\n    send_with_retry(subject, body, retries=3, delay_sec=2, **smtp_config)\n    ended = datetime.now()\n    print(f"Report sent. start={started} end={ended}")\n\n\n# Для scheduler:\n# Windows Task Scheduler: запуск python email_report.py в 09:00 и 18:00\n# Linux cron: 0 9,18 * * * /usr/bin/python3 /app/email_report.py',
          explain: 'Это «прод»-контур отчётности: готовишь сводку, отправляешь с retry и получаешь предсказуемый авто-результат по расписанию.',
          breakdown: [
            'build_report делает письмо читабельным для клиента (не только для разработчика).',
            'send_with_retry защищает от временных проблем SMTP.',
            'main связывает метрики парсинга и отправку в один поток.',
            'scheduler превращает разовый скрипт в регулярный сервис.'
          ],
          lineByLine: [
            'build_report собирает subject и body централизованно — проще менять формат отчёта.',
            'metrics.get(..., 0) защищает от KeyError при неполных данных.',
            'TOP-5 формируется в цикле enumerate, чтобы у клиента был ранжированный список.',
            'MIMEText с utf-8 нужен для корректной кириллицы в письмах.',
            'SMTP_SSL сразу шифрует соединение — базовое требование безопасности.',
            'send_with_retry пробует отправку несколько раз и не скрывает финальную ошибку.',
            'delay_sec между попытками снижает вероятность повторного мгновенного сбоя.',
            'main фиксирует start/end, что полезно для операционных логов.',
            'Комментарий с scheduler даёт готовый мост к автоматическому запуску.',
            'Итог: отчётность становится регулярной, а не «когда вспомнил — тогда отправил».'
          ]
        },
        commonErrors: [
          'retry бесконечный или «глотает» ошибки — проблема скрывается.',
          'В письме нет метрик и клиент не видит ценности отчёта.',
          'Scheduler настроен, но путь к Python/скрипту неверный.',
          'SMTP-креды хранятся в коде вместо .env.'
        ],
        resultChecklist: [
          'Отчёт отправляется вручную и по расписанию.',
          'При временной ошибке SMTP срабатывает retry.',
          'Письмо содержит total/filtered/new/top5.',
          'Логи запуска позволяют восстановить картину по времени.'
        ],
        practice: [
          'Отправь себе тестовый отчёт на email.',
          'Добавь TOP-5 элементов в тело письма.',
          'Проверь автоматический запуск хотя бы один раз.',
          'Сделай алерт-сообщение при фатальном падении после всех retry.'
        ]
      }
    },
    7: {
      title: 'Модуль 7 · День 7',
      subtitle: 'Упаковка кейсов: как превратить код в продаваемый результат',
      goal: 'Ты не просто пишешь код, а оформляешь его так, чтобы клиент понял выгоду за 30–60 секунд.',
      dayPlan: [
        'Разогрев (15 мин): выбери 1 лучший бот-проект и 1 лучший parsing-проект за прошлые дни.',
        'Блок БОТЫ (60–90 мин): README, демо-скрипт, карточка кейса и отклик.',
        'Блок ПАРСИНГ (60–90 мин): структура отчёта, ограничения, ценность для клиента.',
        'Финал (20–30 мин): собери портфолио-страницу и 2 готовых шаблона отклика.'
      ],
      glossary: [
        { term: 'Кейс', explain: 'Упакованный результат: проблема клиента, твое решение и эффект.' },
        { term: 'Демо-сценарий', explain: 'Короткая последовательность шагов, которую показываешь в видео/созвоне.' },
        { term: 'Pain → Solution → Result', explain: 'Формула презентации кейса, понятная даже не-технарю.' },
        { term: 'Оффер', explain: 'Конкретное предложение, что именно ты сделаешь и в каком формате.' }
      ],
      deliverables: [
        '1 полностью оформленный бот-кейс (README + демо + карточка).',
        '1 полностью оформленный parsing-кейс (метрики + ограничения + артефакты).',
        '2 шаблона откликов: короткий и расширенный.',
        'Мини-набор материалов для отправки клиенту за 2-3 минуты.'
      ],
      bots: {
        why: 'Без упаковки хороший проект не продаётся. README + демо + кейс = доверие.',
        microExamples: [
          {
            title: 'Мини-пример 1: каркас кейса',
            code: 'Проблема клиента -> Что сделал -> Что получил клиент',
            explain: 'Этот порядок удерживает внимание и быстро переводит разговор в ценность.'
          },
          {
            title: 'Мини-пример 2: структура README',
            code: '1) Для кого проект\n2) Что решает\n3) Основные функции\n4) Как запустить\n5) Результат/эффект',
            explain: 'README должен отвечать на вопросы клиента, а не только разработчика.'
          },
          {
            title: 'Мини-пример 3: сценарий демо 60 секунд',
            code: 'Старт -> 2-3 действия пользователя -> итоговый результат -> куда можно масштабировать',
            explain: 'Если демо длиннее 90 секунд, клиент чаще теряет фокус.'
          }
        ],
        bigSteps: [
          'Оформи README по шаблону (проблема/функции/запуск/выгода).',
          'Запиши демо 60–90 секунд с пользовательским сценарием.',
          'Сделай release v1.0.0 и карточку кейса.',
          'Собери шаблон отклика с ссылками на демо и README.'
        ],
        implementationWalkthrough: [
          'Выбери один проект и зафиксируй: кому он помогает и какую боль закрывает.',
          'Заполни README по фиксированным разделам (без пропусков).',
          'Напиши demo-скрипт по шагам, чтобы не импровизировать при записи.',
          'Собери карточку кейса на 6–8 коротких пунктов.',
          'Сделай шаблон отклика и подставляй туда конкретику вакансии/задачи.'
        ],
        fullCode: {
          title: 'Большой пример: шаблон README + карточка кейса + отклик',
          code: '# README (бот-кейс)\n\n## Проблема\nКлиент терял заявки в Telegram: сообщения были в хаосе, не было структуры и контроля.\n\n## Решение\nРеализован Telegram-бот на aiogram с формой заявки, админ-доступом и экспортом CSV.\n\n## Ключевые функции\n- FSM-форма: имя -> телефон -> комментарий\n- Guard на админ-команды\n- /export для выгрузки заявок\n- Логи попыток доступа\n\n## Результат\n- Время обработки заявки сокращено с ~10 мин до ~2 мин\n- Все заявки сохраняются и доступны для отчёта\n\n## Запуск\n1. Создать .env\n2. Установить зависимости\n3. Запустить main.py\n\n---\n\n# Карточка кейса (короткая)\n- Ниша: лидогенерация в Telegram\n- Боль: терялись обращения\n- Что сделал: бот + структура заявки + экспорт\n- Срок: 2 дня\n- Результат: прозрачная обработка лидов\n\n---\n\n# Шаблон отклика\nЗдравствуйте!\nСделаю Telegram-бота для сбора заявок с удобной формой и экспортом отчётов.\nПохожий кейс: [ссылка на README/демо]\nМогу показать рабочий сценарий на коротком звонке (10-15 минут).',
          explain: 'Этот шаблон даёт тебе готовый комплект продаж: README для доверия, кейс-карточка для быстрого чтения и отклик для контакта.',
          breakdown: [
            'README объясняет пользу и снижает страх клиента.',
            'Карточка кейса нужна для быстрого просмотра без чтения длинного текста.',
            'Отклик с кейсом резко повышает шанс ответа по сравнению с общими фразами.',
            'Фиксированная структура экономит время на каждый новый проект.'
          ],
          lineByLine: [
            'Начинай с проблемы клиента — это создаёт контекст и удерживает внимание.',
            'В разделе Решение пиши конкретные механики, а не абстракции.',
            'Ключевые функции оформляй списком, чтобы читалось за 10 секунд.',
            'В Результате давай измеримый эффект (время, количество, скорость).',
            'В Запуске оставляй только необходимые шаги, без лишней теории.',
            'Карточка кейса должна быть ультракороткой для чатов и бирж.',
            'Отклик заканчивай понятным next step (созвон, демо, мини-план).'
          ]
        },
        commonErrors: [
          'README превращается в технический конспект без клиентской ценности.',
          'Демо без сценария: много лишнего и мало результата.',
          'В отклике нет ссылок на доказательства (кейс/демо).',
          'Одинаковый текст отклика для всех задач без персонализации.'
        ],
        resultChecklist: [
          'README читается клиентом за 2-3 минуты и даёт понимание выгоды.',
          'Есть демо 60-90 секунд с чётким сценарием.',
          'Есть карточка кейса для быстрых откликов.',
          'Есть шаблон отклика, который легко адаптировать под задачу.'
        ],
        practice: [
          'Собери 1 готовый бот-кейс.',
          'Напиши 1 шаблон отклика с ссылками на кейс.',
          'Получи обратную связь от знакомого/коллеги по понятности.',
          'Сделай 5 пробных откликов и сравни, где выше ответ.'
        ]
      },
      parsing: {
        why: 'Для парсинга клиент покупает не скрипт, а стабильный поток данных в понятном формате.',
        microExamples: [
          {
            title: 'Мини-пример 1: оффер по парсингу в одну строку',
            code: 'Собираю товары по фильтрам, обновляю 2 раза в день, отдаю CSV + Google Sheets.',
            explain: 'Клиент сразу понимает формат результата и регулярность обновления.'
          },
          {
            title: 'Мини-пример 2: набор метрик кейса',
            code: 'Обработано / Валидно / Новых / Время прогона',
            explain: 'Метрики делают кейс убедительным и сравнимым с ручной работой.'
          },
          {
            title: 'Мини-пример 3: блок ограничений',
            code: 'Ограничения: anti-bot защита, лимиты сайта, возможные изменения верстки.',
            explain: 'Честный блок ограничений повышает доверие и снижает конфликты на проекте.'
          }
        ],
        bigSteps: [
          'Оформи README с примерами входа/выхода.',
          'Сделай визуальные артефакты: скрин таблицы/CSV, короткое видео.',
          'Подготовь release notes с ограничениями и roadmap.',
          'Собери 2 версии КП: короткую (чат) и развернутую (документ).'
        ],
        implementationWalkthrough: [
          'Опиши входные данные: откуда берешь, как часто, в каком объеме.',
          'Опиши выход: какие поля, где хранится, как клиент получает доступ.',
          'Добавь реальные цифры по последнему прогону.',
          'Сделай раздел рисков и как ты их обрабатываешь (retry, логирование, мониторинг).',
          'Собери две версии описания: 5 строк и 1 страница.'
        ],
        fullCode: {
          title: 'Большой пример: шаблон parsing-кейса + коммерческое предложение',
          code: '# Parsing case template\n\n## Что собираем\n- Категория: ноутбуки\n- Источник: сайт поставщика\n- Частота: 2 раза в день\n\n## Что отдаём клиенту\n- CSV (title, price, url, updated_at)\n- Google Sheets с авто-обновлением\n- Отдельный файл new_items.json\n\n## Метрики последнего прогона\n- Обработано: 1240\n- Валидно: 1178\n- Новых: 63\n- Время: 48 сек\n\n## Ограничения\n- Возможны изменения верстки сайта\n- Лимиты запросов/anti-bot\n\n## Как контролируем риски\n- Retry на сетевые ошибки\n- Логи total/filtered/new\n- Алерт при фатальном сбое\n\n---\n\n# КП (короткая версия в чат)\nСделаю парсер под вашу нишу с регулярным обновлением и отчетом в CSV/Google Sheets.\nВы получите: структуру полей, автоматический запуск и контроль новых позиций.\nПохожий кейс: [ссылка].\n\n# КП (развернутая версия)\n1) Цели и формат данных\n2) План внедрения (2-4 дня)\n3) Результат и SLA\n4) Риски и меры контроля\n5) Стоимость и этапы',
          explain: 'Этот шаблон превращает техническую работу в коммерчески понятный продукт: клиент видит формат, регулярность, риски и результат.',
          breakdown: [
            'Раздел Что собираем задает границы задачи и снижает недопонимание.',
            'Раздел Что отдаем фокусирует на ценности, а не на внутренней кухне.',
            'Метрики дают доверие и доказательство работоспособности.',
            'КП в двух форматах ускоряет ответы на биржах и в личных сообщениях.'
          ],
          lineByLine: [
            'Начинай кейс с предметной области, чтобы клиент узнал свою задачу.',
            'Формат выхода прописывай в полях, не общими словами.',
            'Метрики всегда указывай по последнему прогону — это честно и проверяемо.',
            'Ограничения пиши заранее, чтобы не обещать невозможное.',
            'Риски обязательно сопроводи мерами контроля.',
            'Короткое КП нужно для чатов/бирж, длинное — для согласования этапов.'
          ]
        },
        commonErrors: [
          'Кейс без цифр: выглядит как теория, а не рабочий результат.',
          'Нет раздела ограничений — потом возникают споры по ожиданиям.',
          'Оффер слишком общий, не ясно что получает клиент.',
          'Нет двух форматов КП, из-за чего ответы медленные и неудобные.'
        ],
        resultChecklist: [
          'Есть parsing-кейс с реальными метриками и артефактами.',
          'Ограничения и риски описаны заранее.',
          'Есть короткое и развернутое КП.',
          'Клиент из кейса понимает: что, когда и в каком виде получает.'
        ],
        practice: [
          'Сделай 1 parsing-кейс с цифрами.',
          'Добавь блок «ограничения и риски».',
          'Подготовь 2 варианта отклика: короткий и развёрнутый.',
          'Отправь 5 релевантных откликов и зафиксируй реакцию.'
        ]
      }
    },
    8: {
      title: 'Модуль 8 · День 8',
      subtitle: 'Масштабирование портфеля: второй бот и второй парсер по шаблону',
      goal: 'Учимся повторять успех: не один удачный проект, а воспроизводимая система разработки.',
      dayPlan: [
        'Разогрев (15 мин): разбери, что из Day 7 реально сработало в откликах и упаковке.',
        'БОТЫ (60–90 мин): собираем FAQ-бота как второй коммерческий кейс.',
        'ПАРСИНГ (60–90 мин): делаем parser-project-2 под новую верстку сайта.',
        'Финал (20–30 мин): публикуем два обновлённых кейса в портфолио.'
      ],
      glossary: [
        { term: 'Шаблон проекта', explain: 'Заранее подготовленная структура, ускоряющая запуск нового кейса.' },
        { term: 'Адаптер селекторов', explain: 'Слой, который подстраивает парсер под конкретную HTML-структуру сайта.' },
        { term: 'FAQ flow', explain: 'Логика переходов по вопросам/ответам в боте через кнопки.' },
        { term: 'Повторяемость', explain: 'Способность делать второй проект почти так же быстро, как первый.' }
      ],
      deliverables: [
        'FAQ-бот v1 с рабочими inline-кнопками и логикой ответа.',
        'parser-project-2 с валидной выгрузкой на новом сайте.',
        '2 кейса в портфолио с демо и описанием результата.',
        'Набор переиспользуемых шаблонов для следующих запусков.'
      ],
      bots: {
        why: 'FAQ-бот — частый коммерческий запрос. Это быстрый способ показать ценность за короткий срок.',
        microExamples: [
          {
            title: 'Мини-пример 1: единый формат callback_data',
            code: 'callback_data = "faq:delivery"\ncallback_data = "faq:payment"',
            explain: 'Одинаковый формат сильно упрощает обработчики и отладку.'
          },
          {
            title: 'Мини-пример 2: таблица FAQ в памяти',
            code: 'FAQ = {\n    "delivery": "Доставка 1-3 дня",\n    "payment": "Оплата картой/безнал"\n}',
            explain: 'Даже простой словарь уже дает управляемый контент без копипасты хендлеров.'
          },
          {
            title: 'Мини-пример 3: универсальный обработчик callback',
            code: 'key = call.data.split(":", maxsplit=1)[1]\nanswer = FAQ.get(key, "Ответ не найден")',
            explain: 'Один обработчик масштабируется лучше, чем 10 отдельных функций на каждый FAQ.'
          }
        ],
        bigSteps: [
          'Создай faq-bot-v1 с inline-кнопками.',
          'Добавь 10 FAQ и кнопку связи с менеджером.',
          'Подготовь мини-демо с цепочкой действий пользователя.',
          'Добавь простую форму контакта и сохранение заявки.'
        ],
        implementationWalkthrough: [
          'Сформируй структуру данных FAQ (словарь/JSON).',
          'Собери inline-клавиатуру с callback_data в едином формате.',
          'Сделай один callback-хендлер и маршрутизацию по ключу вопроса.',
          'Добавь fallback на неизвестный callback, чтобы бот не «молчал».',
          'Проверь end-to-end сценарий: старт -> FAQ -> контакт -> подтверждение.'
        ],
        fullCode: {
          title: 'Большой пример: FAQ-бот с универсальным callback-handler',
          code: 'from aiogram import Router, F\nfrom aiogram.filters import Command\nfrom aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton\n\nrouter = Router()\n\nFAQ = {\n    "delivery": "🚚 Доставка 1-3 дня по РФ",\n    "payment": "💳 Оплата: карта / безнал",\n    "support": "🧑‍💻 Поддержка: 10:00-19:00"\n}\n\nfaq_kb = InlineKeyboardMarkup(inline_keyboard=[\n    [InlineKeyboardButton(text="Доставка", callback_data="faq:delivery")],\n    [InlineKeyboardButton(text="Оплата", callback_data="faq:payment")],\n    [InlineKeyboardButton(text="Поддержка", callback_data="faq:support")],\n    [InlineKeyboardButton(text="Оставить контакт", callback_data="faq:contact")]\n])\n\n\n@router.message(Command("start"))\nasync def start(message: Message):\n    await message.answer("Выбери вопрос:", reply_markup=faq_kb)\n\n\n@router.callback_query(F.data.startswith("faq:"))\nasync def faq_callback(call: CallbackQuery):\n    key = call.data.split(":", maxsplit=1)[1]\n\n    if key == "contact":\n        await call.message.answer("Напишите ваш номер, и менеджер свяжется с вами")\n        await call.answer()\n        return\n\n    answer = FAQ.get(key)\n    if not answer:\n        await call.message.answer("Неизвестный раздел FAQ")\n        await call.answer()\n        return\n\n    await call.message.answer(answer)\n    await call.answer()',
          explain: 'Этот блок показывает, как собрать второй коммерческий бот быстро и без хаоса: единый callback-формат, один хендлер и управляемый FAQ-контент.',
          breakdown: [
            'FAQ хранится в структуре данных, а не размазан по коду.',
            'callback_data стандартизирован как faq:<key>.',
            'Один обработчик закрывает весь FAQ-роутинг.',
            'Есть fallback на неизвестные ключи и отдельная ветка contact.'
          ],
          lineByLine: [
            'router создается один раз и подключается в main.py.',
            'FAQ словарь — единый источник текстов, удобно редактировать.',
            'InlineKeyboardMarkup формирует явные пользовательские действия.',
            'F.data.startswith("faq:") фильтрует только нужные callback.',
            'split(":", 1) безопасно отделяет namespace от ключа.',
            'Ветка contact выделена отдельно как целевое действие на лид.',
            'FAQ.get(key) + проверка not answer защищает от сломанных callback.',
            'call.answer() обязателен, чтобы Telegram закрыл состояние кнопки.'
          ]
        },
        commonErrors: [
          'callback_data хаотичный и без единого формата.',
          'Много отдельных callback-хендлеров вместо одного универсального.',
          'Забывают call.answer(), у пользователя висит «крутилка».',
          'FAQ-тексты зашиты в условиях и тяжело редактируются.'
        ],
        resultChecklist: [
          'FAQ-бот работает по кнопкам без «битых» переходов.',
          'Есть единый callback-handler и fallback.',
          'Есть кнопка контакта и понятный сценарий следующего шага.',
          'Есть короткое демо-ვიდео flow пользователя.'
        ],
        practice: [
          'Добавь кнопку «Оставить номер».',
          'Сохрани контакт в файл/БД.',
          'Покажи full flow в демо-видео.',
          'Добавь 2 новых FAQ без изменения обработчика.'
        ]
      },
      parsing: {
        why: 'Второй парсер показывает, что ты адаптируешься к новой вёрстке, а не зависишь от одного сайта.',
        microExamples: [
          {
            title: 'Мини-пример 1: точечная проверка селектора',
            code: 'title_el = card.select_one(".title")\ntitle = title_el.get_text(strip=True) if title_el else ""',
            explain: 'Сначала проверяешь один селектор, потом собираешь весь адаптер.'
          },
          {
            title: 'Мини-пример 2: адаптер под сайт',
            code: 'SELECTORS = {"card": ".item", "title": ".name", "price": ".cost", "url": "a"}',
            explain: 'Селекторы держим в конфиге, чтобы смена сайта не ломала ядро.'
          },
          {
            title: 'Мини-пример 3: валидация строки',
            code: 'if not row.get("title") or not row.get("url"):\n    continue',
            explain: 'Фильтрация мусора в момент парсинга сильно улучшает качество выгрузки.'
          }
        ],
        bigSteps: [
          'Создай parser-project-2 на базе шаблона.',
          'Адаптируй селекторы под новый сайт.',
          'Выгрузи результат в CSV/JSON и проверь валидность.',
          'Сравни качество данных с parser-project-1 и зафиксируй отличия.'
        ],
        implementationWalkthrough: [
          'Скопируй шаблон parser-template и переименуй под новую нишу.',
          'Собери селекторы card/title/price/url через DevTools.',
          'Сделай parse_rows + валидацию обязательных полей.',
          'Выгрузи в CSV/JSON и проверь 20-30 строк вручную.',
          'Добавь короткий quality-report: сколько валидных, сколько отброшено.'
        ],
        fullCode: {
          title: 'Большой пример: parser-project-2 с адаптером селекторов',
          code: 'import csv\nimport requests\nfrom bs4 import BeautifulSoup\n\nURL = "https://example.com/catalog"\n\nSELECTORS = {\n    "card": ".item",\n    "title": ".name",\n    "price": ".cost",\n    "url": "a"\n}\n\n\ndef fetch_html(url: str) -> str:\n    r = requests.get(url, timeout=20)\n    r.raise_for_status()\n    return r.text\n\n\ndef parse_rows(html: str) -> list[dict]:\n    soup = BeautifulSoup(html, "html.parser")\n    cards = soup.select(SELECTORS["card"])\n    rows = []\n\n    for card in cards:\n        title_el = card.select_one(SELECTORS["title"])\n        price_el = card.select_one(SELECTORS["price"])\n        url_el = card.select_one(SELECTORS["url"])\n\n        row = {\n            "title": title_el.get_text(strip=True) if title_el else "",\n            "price": price_el.get_text(strip=True) if price_el else "",\n            "url": url_el.get("href", "") if url_el else ""\n        }\n\n        if not row["title"] or not row["url"]:\n            continue\n\n        rows.append(row)\n\n    return rows\n\n\ndef export_csv(rows: list[dict], path: str = "result2.csv"):\n    if not rows:\n        return\n    with open(path, "w", encoding="utf-8", newline="") as f:\n        writer = csv.DictWriter(f, fieldnames=["title", "price", "url"])\n        writer.writeheader()\n        writer.writerows(rows)\n\n\ndef main():\n    html = fetch_html(URL)\n    rows = parse_rows(html)\n    export_csv(rows)\n    print(f"rows={len(rows)}")\n\n\nif __name__ == "__main__":\n    main()',
          explain: 'Этот пример показывает второй парсер как воспроизводимый процесс: адаптер селекторов + валидация + стабильная выгрузка.',
          breakdown: [
            'SELECTORS отделяет знания о сайте от логики парсера.',
            'fetch_html отвечает только за сеть и статус-коды.',
            'parse_rows собирает данные и фильтрует мусор до экспорта.',
            'export_csv отдает клиентский формат без лишней внутренней кухни.'
          ],
          lineByLine: [
            'URL и SELECTORS вынесены наверх для быстрой адаптации.',
            'requests.get + raise_for_status сразу ловят HTTP-проблемы.',
            'cards = soup.select(...) задает основную сущность парсинга.',
            'Каждое поле извлекается безопасно через проверку element/None.',
            'row формируется единым объектом — удобно валидировать и экспортировать.',
            'if not title/url отбрасывает неполные и бесполезные записи.',
            'DictWriter фиксирует колонки и делает выгрузку предсказуемой.',
            'print(rows=...) дает быстрый контроль результата запуска.'
          ]
        },
        commonErrors: [
          'Селекторы копируют «как есть» без проверки на реальном HTML.',
          'Нет валидации полей, в выгрузку попадает мусор.',
          'URL может быть относительным и не приводится к полному виду.',
          'Проверка качества после парсинга вообще не проводится.'
        ],
        resultChecklist: [
          'parser-project-2 стабильно собирает данные на новом сайте.',
          'Есть валидация обязательных полей.',
          'CSV/JSON выгрузка читаема и полезна клиенту.',
          'Есть сравнение качества с первым парсером.'
        ],
        practice: [
          'Получи 100+ строк данных.',
          'Добавь минимум один фильтр.',
          'Собери второй parsing-кейс в портфолио.',
          'Сделай мини-таблицу: source/rows/valid/new/time.'
        ]
      }
    },
    9: {
      title: 'Модуль 9 · День 9',
      subtitle: 'Деплой и стабильность 24/7',
      goal: 'Теперь проекты должны жить не на твоём ноутбуке, а в проде — стабильно и предсказуемо.',
      dayPlan: [
        'Разогрев (15 мин): проверь локальный запуск и минимальный smoke-test обоих проектов.',
        'БОТЫ (60–90 мин): подготовка к деплою, env, health-check и перезапуск без потери сценариев.',
        'ПАРСИНГ (60–90 мин): автозапуск по расписанию, логирование, контроль результата.',
        'Финал (20–30 мин): демо «работает в проде», фиксация runbook и troubleshooting.'
      ],
      glossary: [
        { term: 'Deploy', explain: 'Публикация проекта в среде, где он работает постоянно и доступен клиенту.' },
        { term: 'Health-check', explain: 'Быстрая проверка, что сервис жив и отвечает корректно.' },
        { term: 'Scheduler', explain: 'Планировщик регулярных запусков (cron/Task Scheduler/платформа).' },
        { term: 'Runbook', explain: 'Краткая инструкция: как запустить, проверить и восстановить сервис.' }
      ],
      deliverables: [
        'Бот задеплоен и проходит smoke-check (/start, ключевой сценарий, админ-команды).',
        'Парсер запускается по расписанию и пишет логи start/end/errors.',
        'Есть ссылка/доказательство работы в проде (скрин/лог/URL).',
        'Собран runbook с типичными сбоями и действиями по восстановлению.'
      ],
      bots: {
        why: 'Если бот офлайн, клиент теряет заявки. Продакшен-деплой = обязательный этап.',
        microExamples: [
          {
            title: 'Мини-пример 1: fail-fast по env',
            code: 'if not TOKEN:\n    raise ValueError("TOKEN missing")',
            explain: 'Если критичная переменная не задана, падаем сразу с понятной причиной.'
          },
          {
            title: 'Мини-пример 2: простая health-проверка',
            code: '@router.message(Command("health"))\nasync def health(message: Message):\n    await message.answer("ok")',
            explain: 'Так ты быстро проверяешь, что бот жив после деплоя.'
          },
          {
            title: 'Мини-пример 3: лог старта',
            code: 'logger.info("Bot starting in production")',
            explain: 'Лог старта позволяет отличить «не запускался» от «запустился и упал позже».'
          }
        ],
        bigSteps: [
          'Подготовь requirements и команду запуска.',
          'Настрой env в Render/Railway.',
          'Проверь /start, FSM и /admin после деплоя.',
          'Добавь минимальный runbook по восстановлению после сбоя.'
        ],
        implementationWalkthrough: [
          'Очисти зависимости: зафиксируй версии в requirements.txt.',
          'Проверь, что все секреты вынесены в env, а не в код.',
          'Настрой команду запуска и переменные на платформе.',
          'После деплоя прогоняй smoke-check: /start -> ключевая функция -> админ-команда.',
          'Сними логи старта/ошибок и добавь их в runbook.'
        ],
        fullCode: {
          title: 'Большой пример: прод-старт бота с проверкой env и логами',
          code: 'import asyncio\nimport logging\nimport os\nfrom aiogram import Bot, Dispatcher\nfrom aiogram.filters import Command\nfrom aiogram.types import Message\n\nlogging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")\nlogger = logging.getLogger("bot")\n\nTOKEN = os.getenv("TELEGRAM_BOT_TOKEN")\nif not TOKEN:\n    raise ValueError("TELEGRAM_BOT_TOKEN missing")\n\n\ndp = Dispatcher()\n\n\n@dp.message(Command("start"))\nasync def start(message: Message):\n    await message.answer("Бот в проде работает ✅")\n\n\n@dp.message(Command("health"))\nasync def health(message: Message):\n    await message.answer("ok")\n\n\nasync def main():\n    logger.info("Bot starting in production")\n    bot = Bot(token=TOKEN)\n    try:\n        await dp.start_polling(bot)\n    except Exception:\n        logger.exception("Bot crashed")\n        raise\n    finally:\n        logger.info("Bot shutdown")\n\n\nif __name__ == "__main__":\n    asyncio.run(main())',
          explain: 'Этот код показывает боевой каркас: fail-fast по env, health-check, лог старта/падения/остановки и предсказуемый цикл работы.',
          breakdown: [
            'Проверка TOKEN выполняется до запуска polling — ошибка видна сразу.',
            'Команда /health нужна для быстрой диагностики после деплоя.',
            'try/except/finally вокруг polling делает поведение при падении прозрачным.',
            'Логи позволяют быстро понять, где и когда произошёл сбой.'
          ],
          lineByLine: [
            'basicConfig задаёт единый формат логов для прод-диагностики.',
            'TOKEN берётся из env — секрет не хранится в репозитории.',
            'ValueError на старте предотвращает «тихие» проблемы в рантайме.',
            'Dispatcher и хендлеры определяют минимальный рабочий smoke-сценарий.',
            '/health не заменяет мониторинг, но закрывает быструю ручную проверку.',
            'logger.info("starting") фиксирует момент запуска для таймлайна.',
            'logger.exception("crashed") пишет traceback, что ускоряет фиксы.',
            'finally + shutdown лог показывает корректность завершения.'
          ]
        },
        commonErrors: [
          'Запуск с локальными переменными вместо настроенных env на платформе.',
          'Нет smoke-check после деплоя — баги замечают только клиенты.',
          'Логи не настроены и «падения» невозможно расследовать.',
          'requirements не зафиксирован, в проде встают другие версии пакетов.'
        ],
        resultChecklist: [
          'Бот стартует в проде без ручных правок на сервере.',
          '/start и /health работают стабильно.',
          'Секреты берутся из env, а не из кода.',
          'Есть runbook с шагами восстановления.'
        ],
        practice: [
          'Сделай скрин deploy success + logs.',
          'Добавь ссылку на прод в README.',
          'Зафиксируй типичные ошибки деплоя и решения.',
          'Сделай чек-лист smoke-test после каждого релиза.'
        ]
      },
      parsing: {
        why: 'Запуск по расписанию создаёт регулярную ценность. Это часто важнее «одного идеального прогона».',
        microExamples: [
          {
            title: 'Мини-пример 1: cron-выражение',
            code: '0 9,18 * * * python main.py',
            explain: 'Два запуска в день — минимальный режим для регулярного обновления отчётов.'
          },
          {
            title: 'Мини-пример 2: базовый лог прогонов',
            code: 'logger.info("job_start")\n...\nlogger.info("job_end")',
            explain: 'Без start/end логов нельзя доказать, что scheduler реально запускал задачу.'
          },
          {
            title: 'Мини-пример 3: аварийный сигнал',
            code: 'except Exception:\n    logger.exception("job_failed")\n    notify_admin("parser failed")',
            explain: 'При фатальной ошибке нужен сигнал, иначе проблема обнаружится слишком поздно.'
          }
        ],
        bigSteps: [
          'Размести parser в среде, где он может работать по расписанию.',
          'Добавь логирование start/end и ошибок.',
          'Проверь, что отчёты реально обновляются автоматически.',
          'Оформи runbook: как перезапустить и где смотреть логи.'
        ],
        implementationWalkthrough: [
          'Определи целевую частоту запусков и SLA обновления.',
          'Настрой scheduler (cron/Task Scheduler/платформа) на реальный путь к python и скрипту.',
          'Добавь лог начала, конца, метрик и ошибок каждого запуска.',
          'Проверь 2-3 автоматических прогона подряд и сравни результаты.',
          'Добавь уведомление администратору на фатальные ошибки.'
        ],
        fullCode: {
          title: 'Большой пример: плановый запуск парсера с логами и алертом',
          code: 'import logging\nimport time\nfrom datetime import datetime\n\nlogging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")\nlogger = logging.getLogger("parser-job")\n\n\ndef notify_admin(text: str):\n    # Заглушка: отправка в Telegram/Email\n    logger.warning(f"ADMIN_NOTIFY: {text}")\n\n\ndef run_parser() -> dict:\n    # Заглушка бизнес-логики\n    time.sleep(1)\n    return {"total": 1200, "filtered": 880, "new": 47}\n\n\ndef job():\n    started = time.time()\n    started_at = datetime.now().isoformat(timespec="seconds")\n    logger.info(f"job_start at={started_at}")\n\n    try:\n        metrics = run_parser()\n        elapsed = round(time.time() - started, 2)\n        logger.info(\n            f"job_end total={metrics[\"total\"]} filtered={metrics[\"filtered\"]} new={metrics[\"new\"]} time={elapsed}s"\n        )\n    except Exception as e:\n        logger.exception("job_failed")\n        notify_admin(f"parser failed: {e}")\n        raise\n\n\nif __name__ == "__main__":\n    job()\n\n# Cron example:\n# 0 9,18 * * * /usr/bin/python3 /app/main.py >> /app/logs/cron.log 2>&1',
          explain: 'Это skeleton прод-задачи: scheduler запускает job, ты получаешь метрики в логах и сигнал в случае падения.',
          breakdown: [
            'job_start/job_end дают операционную наблюдаемость процесса.',
            'run_parser возвращает метрики, которые важны клиенту и разработчику.',
            'exception + notify_admin закрывают сценарий «упало и никто не узнал».',
            'cron-пример показывает, как подключить реальный автозапуск.'
          ],
          lineByLine: [
            'logging.basicConfig задаёт формат для поиска инцидентов по времени.',
            'notify_admin вынесен функцией — потом легко заменить на Telegram/email API.',
            'run_parser изолирован как бизнес-часть, job — как операционный контур.',
            'started/time нужны для контроля длительности прогона.',
            'logger.info(job_start) фиксирует факт запуска scheduler.',
            'logger.info(job_end ...) пишет ключевые метрики одной строкой.',
            'logger.exception(job_failed) сохраняет traceback для анализа.',
            'raise после алерта важен: платформа видит, что запуск завершился ошибкой.'
          ]
        },
        commonErrors: [
          'Неверный путь к python/скрипту в scheduler.',
          'Логи пишутся, но не сохраняются между перезапусками среды.',
          'Ошибки «глотаются» и scheduler считает запуск успешным.',
          'Нет уведомлений, поэтому сбой замечают через дни.'
        ],
        resultChecklist: [
          'Есть хотя бы 1 успешный автозапуск с логом start/end.',
          'Метрики total/filtered/new фиксируются каждый прогон.',
          'Фатальная ошибка даёт уведомление администратору.',
          'Runbook описывает: где логи, как перезапустить, как проверить.'
        ],
        practice: [
          'Настрой 1–2 автозапуска в день.',
          'Проверь логи после автостарта.',
          'Добавь раздел «расписание» в README.',
          'Смоделируй одну ошибку и убедись, что приходит алерт.'
        ]
      }
    },
    10: {
      title: 'Модуль 10 · День 10',
      subtitle: 'Продажи и отклики: превращаем навыки в диалоги с клиентами',
      goal: 'Не учим новый фреймворк — учимся получать первые заказы через понятные офферы и структуру общения.',
      dayPlan: [
        'Разогрев (15 мин): выпиши 3 сильные стороны своих кейсов без «воды».',
        'БОТЫ (60–90 мин): оффер, шаблон отклика, вопросы к клиенту, мини-воронка.',
        'ПАРСИНГ (60–90 мин): пакеты услуг, КП, отработка возражений.',
        'Финал (20–30 мин): трекер откликов + выводы по конверсии.'
      ],
      glossary: [
        { term: 'Оффер', explain: 'Краткое и конкретное обещание ценности клиенту.' },
        { term: 'KPI откликов', explain: 'Метрики: отправлено, ответов, созвонов, сделок.' },
        { term: 'Возражение', explain: 'Причина сомнений клиента, которую нужно разобрать и закрыть.' },
        { term: 'Конверсия', explain: 'Доля перехода между этапами: отклик -> ответ -> созвон -> сделка.' }
      ],
      deliverables: [
        'Готовый пакет офферов (минимум 3 уровня услуг).',
        'Шаблоны откликов для ботов и парсинга.',
        'Список вопросов к клиенту для быстрой квалификации задачи.',
        'Таблица KPI и первые данные по конверсии.'
      ],
      bonusTips: [
        'Не начинай отклик с «я умею всё» — начинай с конкретного результата для клиента.',
        'Используй цифры из кейса: время, объём, точность, частота обновления.',
        'Всегда давай next step: «могу показать демо сегодня, 10-15 минут».',
        'Веди мини-CRM откликов: иначе невозможно улучшать конверсию системно.'
      ],
      bots: {
        why: 'Хороший код без продаж не приносит доход. Нужны оффер, кейс и понятный next step.',
        microExamples: [
          {
            title: 'Мини-пример 1: формула отклика',
            code: 'Проблема клиента -> Что сделаю -> Доказательство -> Следующий шаг',
            explain: 'Такой порядок работает лучше обычного «готов взяться за задачу».'
          },
          {
            title: 'Мини-пример 2: вопрос на квалификацию',
            code: 'Какие 2-3 действия в боте критичны в версии 1.0?',
            explain: 'Один точный вопрос сразу показывает твою экспертность.'
          },
          {
            title: 'Мини-пример 3: короткий CTA',
            code: 'Могу сегодня показать рабочий прототип за 15 минут.',
            explain: 'Ясный next step повышает шанс перейти к созвону.'
          }
        ],
        bigSteps: [
          'Собери 3 пакета услуги (Lite/Standard/Pro).',
          'Подготовь 1 шаблон отклика и 1 шаблон вопросов клиенту.',
          'Запусти KPI: 20 релевантных откликов.',
          'Сделай разбор 5 ответов клиентов и обнови формулировки.'
        ],
        implementationWalkthrough: [
          'Сначала упакуй один «якорный» кейс, который лучше всего заходит клиентам.',
          'Сформируй оффер в формате «результат + срок + формат сдачи».',
          'Добавь в отклик 1 факт-доказательство (кейс/метрика/демо).',
          'Заканчивай отклик конкретным шагом: демо, созвон, мини-план.',
          'После 10 откликов проанализируй ответы и подкорректируй текст.'
        ],
        fullCode: {
          title: 'Большой пример: шаблоны офферов и откликов для Telegram-ботов',
          code: '# Пакеты услуг (боты)\n\nLITE = {\n  "что": "бот с 2-3 командами + базовая форма",\n  "срок": "2-3 дня",\n  "результат": "готовый MVP"\n}\n\nSTANDARD = {\n  "что": "FSM-форма + админ-функции + экспорт",\n  "срок": "4-6 дней",\n  "результат": "рабочий инструмент для бизнеса"\n}\n\nPRO = {\n  "что": "интеграции + логирование + прод-деплой",\n  "срок": "7-10 дней",\n  "результат": "стабильный сервис с поддержкой"\n}\n\n# Шаблон отклика\nTEMPLATE = """\nЗдравствуйте!\nВижу вашу задачу: {pain}.\nПредлагаю решение: {solution}.\nПохожий кейс: {proof_link}.\nСрок MVP: {eta}.\nМогу сегодня показать короткое демо (10-15 минут).\n"""\n\ndef build_reply(pain: str, solution: str, proof_link: str, eta: str) -> str:\n    return TEMPLATE.format(\n        pain=pain,\n        solution=solution,\n        proof_link=proof_link,\n        eta=eta\n    )\n\n\n# Пример\ntext = build_reply(\n    pain="нужно собирать заявки в Telegram без потерь",\n    solution="бот с формой заявки, админ-доступом и выгрузкой CSV",\n    proof_link="https://your-portfolio.example/bot-case",\n    eta="3-5 дней"\n)\nprint(text)',
          explain: 'Этот блок превращает продажи в повторяемый процесс: пакеты + шаблон + персонализация под задачу.',
          breakdown: [
            'Пакеты снимают хаос по цене и ожиданиям клиента.',
            'TEMPLATE задает структуру отклика без пропусков.',
            'build_reply персонализирует отклик за 30-60 секунд.',
            'Фокус на доказательствах и next step даёт больше ответов.'
          ],
          lineByLine: [
            'LITE/ STANDARD/ PRO формируют понятную лестницу ценности.',
            'В каждом пакете фиксируй что/срок/результат, а не только стоимость.',
            'Шаблон отклика должен быть коротким и читатьcя за 20-30 секунд.',
            'Переменные pain/solution/proof/eta делают отклик релевантным задаче.',
            'build_reply избавляет от ручного копипаста и ошибок формулировок.',
            'Финальный print — быстрый self-check перед отправкой клиенту.'
          ]
        },
        commonErrors: [
          'Отклик без конкретики и без ссылок на кейсы.',
          'Обещают «всё и сразу» без границ версии 1.0.',
          'Нет next step, клиент не понимает что делать дальше.',
          'Не анализируют ответы, поэтому тексты не улучшаются.'
        ],
        resultChecklist: [
          'Есть 3 пакета с понятными границами и результатом.',
          'Есть шаблон отклика с доказательством и CTA.',
          'Есть список квалифицирующих вопросов к клиенту.',
          'Есть метрики по воронке откликов.'
        ],
        practice: [
          'Отметь в таблице: отклик/ответ/созвон/сделка.',
          'Сравни конверсию разных формулировок.',
          'Улучши оффер по обратной связи.',
          'Сделай 10 персонализированных откликов с разными CTA.'
        ]
      },
      parsing: {
        why: 'Для парсинга важно чётко продавать результат: формат данных, частота обновления, SLA.',
        microExamples: [
          {
            title: 'Мини-пример 1: формат оффера по парсингу',
            code: 'Источник -> Частота -> Формат вывода -> SLA',
            explain: 'Клиенту важно сразу увидеть «что получу и когда».'
          },
          {
            title: 'Мини-пример 2: быстрая оценка объёма',
            code: 'Объём = кол-во страниц * среднее кол-во карточек на странице',
            explain: 'Простая оценка помогает не занижать сроки и стоимость.'
          },
          {
            title: 'Мини-пример 3: ответ на возражение по цене',
            code: 'Цена = не за «скрипт», а за регулярный поток чистых данных + поддержку',
            explain: 'Смещение фокуса на бизнес-ценность работает лучше технических деталей.'
          }
        ],
        bigSteps: [
          'Собери 2 версии КП (краткая и расширенная).',
          'Подготовь набор уточняющих вопросов.',
          'Сделай 20 откликов на релевантные задачи.',
          'Собери FAQ по возражениям и ответы в 1 документ.'
        ],
        implementationWalkthrough: [
          'Сформируй пакеты: разовый парсинг, регулярный мониторинг, подписка.',
          'Для каждого пакета зафиксируй: формат, частоту, сроки, поддержку.',
          'Подготовь 5 уточняющих вопросов до старта работ.',
          'Сделай таблицу «возражение -> ответ -> доказательство».',
          'После первых 10 откликов обнови КП по реальной обратной связи.'
        ],
        fullCode: {
          title: 'Большой пример: шаблон КП и матрица возражений для парсинга',
          code: `# Пакеты парсинга
    PACKAGES = {
      "one_time": {
        "what": "разовый сбор и выгрузка",
        "format": "CSV/JSON",
        "eta": "1-2 дня"
      },
      "monitoring": {
        "what": "регулярный сбор + new_items",
        "format": "CSV + Google Sheets",
        "eta": "2-4 дня"
      },
      "subscription": {
        "what": "поддержка и адаптация при изменении сайта",
        "format": "отчеты + алерты",
        "eta": "еженедельно"
      }
    }

    OBJECTIONS = {
      "дорого": "Снижаем ручной труд и даем регулярные структурированные данные",
      "а если сайт изменится": "Включена адаптация селекторов и мониторинг ошибок",
      "нужен быстрый старт": "Первый MVP-результат в течение 24-48 часов"
    }

    def build_kp(task: str, package_key: str) -> str:
      p = PACKAGES[package_key]
      return (
        f"Задача: {task}\n"
        f"Предлагаю: {p['what']}\n"
        f"Формат: {p['format']}\n"
        f"Срок: {p['eta']}\n"
        f"Следующий шаг: согласуем поля и запустим MVP"
      )


    print(build_kp("мониторинг цен конкурентов", "monitoring"))`,
          explain: 'Этот шаблон делает продажи парсинга системными: пакеты, ответы на возражения и быстрый сбор КП под задачу.',
          breakdown: [
            'PACKAGES структурируют услуги и ускоряют согласование.',
            'OBJECTIONS заранее готовит уверенные ответы на частые сомнения.',
            'build_kp собирает персонализированное КП без лишнего ручного труда.',
            'Один и тот же каркас легко масштабировать на разные ниши.'
          ],
          lineByLine: [
            'Каждый пакет описан через what/format/eta — минимум для решения клиента.',
            'OBJECTIONS связывает страх клиента с конкретной пользой.',
            'build_kp берет task + package_key и строит читаемое предложение.',
            'f-строки держат текст компактным и удобным для изменений.',
            'Фраза про next step переводит чат в действие, а не в переписку без конца.'
          ]
        },
        commonErrors: [
          'КП без структуры и без конкретного формата результата.',
          'Сроки оцениваются «на глаз» без оценки объема данных.',
          'Возражения закрываются эмоциями, а не фактами и кейсами.',
          'Нет дифференциации пакетов — клиент не понимает разницу.'
        ],
        resultChecklist: [
          'Есть готовые пакеты с понятными условиями.',
          'Есть матрица частых возражений и ответов.',
          'Есть генератор/шаблон КП под задачу клиента.',
          'Есть первые цифры конверсии по пакетам.'
        ],
        practice: [
          'Отдельно посчитай конверсию по каждому пакету.',
          'Добавь 3 ответа на частые возражения.',
          'Сделай post-mortem по итогам дня.',
          'Проведи мини A/B тест двух вариантов КП.'
        ]
      }
    },
    11: {
      title: 'Модуль 11 · День 11',
      subtitle: 'Google Sheets интеграции: прозрачные данные для клиента',
      goal: 'Интеграции — это то, что делает проект «полезным в бизнесе», а не просто «технически интересным».',
      dayPlan: [
        'Разогрев (15 мин): проверь доступ к таблице и тестовые данные в локальном проекте.',
        'БОТЫ (60–90 мин): запись лидов в Sheets + fallback при ошибке.',
        'ПАРСИНГ (60–90 мин): экспорт с anti-dup и меткой времени.',
        'Финал (20–30 мин): демо «заявка/данные попадают в таблицу автоматически».'
      ],
      glossary: [
        { term: 'Service account', explain: 'Служебный аккаунт Google для автоматического доступа к таблицам.' },
        { term: 'Fallback', explain: 'Резервный путь, если внешняя интеграция временно недоступна.' },
        { term: 'Idempotency', explain: 'Повторный запуск не должен плодить дубли.' },
        { term: 'Upsert', explain: 'Обновить существующую строку или добавить новую.' }
      ],
      deliverables: [
        'Бот записывает лиды в Google Sheets без ручных действий.',
        'При недоступности Sheets бот не падает (есть fallback).',
        'Парсер выгружает данные без дублей (по ключу URL/ID).',
        'Есть демонстрация и README-блок по интеграции.'
      ],
      bonusTips: [
        'Сразу добавляй колонку source (bot/parser), чтобы потом не путать происхождение данных.',
        'Используй фиксированный порядок колонок — это спасает от «плавающей» структуры.',
        'Логируй ID таблицы/листа, но никогда не логируй секретные ключи.',
        'Снимай скриншоты до/после автозаписи — отличный материал для портфолио.'
      ],
      bots: {
        why: 'Менеджерам удобно работать в таблицах. Запись лидов в Sheets снижает friction при внедрении бота.',
        microExamples: [
          {
            title: 'Мини-пример 1: запись одной строки',
            code: 'ws.append_row([timestamp, name, phone, comment, source])',
            explain: 'Минимальный контракт: заявка сразу видна команде в едином месте.'
          },
          {
            title: 'Мини-пример 2: fallback при сбое',
            code: 'try:\n    save_to_sheets(row)\nexcept Exception:\n    save_to_local_backup(row)',
            explain: 'Интеграция не должна ломать бота — данные должны сохраняться даже при ошибке API.'
          },
          {
            title: 'Мини-пример 3: маркировка источника',
            code: 'row["source"] = "telegram_bot"',
            explain: 'Источник данных важен для аналитики и дальнейшей сегментации.'
          }
        ],
        bigSteps: [
          'Подними service account и доступ к таблице.',
          'Сделай save_lead_to_sheets().',
          'Добавь fallback: если Sheets недоступен — бот не падает.',
          'Добавь логирование успешной/ошибочной записи в таблицу.'
        ],
        implementationWalkthrough: [
          'Создай service-account ключ и расшарь таблицу на email этого аккаунта.',
          'Собери модуль sheets_client.py (инициализация + get_worksheet).',
          'Сделай save_lead_to_sheets с фиксированным порядком колонок.',
          'Оберни вызов в try/except и добавь local backup.',
          'Проверь реальный сценарий: пользователь отправляет форму -> строка появляется в таблице.'
        ],
        fullCode: {
          title: 'Большой пример: запись лида в Sheets с fallback',
          code: `from datetime import datetime
import json

def save_to_local_backup(row: dict, path: str = "failed_leads.jsonl"):
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(row, ensure_ascii=False) + "\n")


def save_lead_to_sheets(ws, lead: dict):
    row = [
        datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        lead.get("name", ""),
        lead.get("phone", ""),
        lead.get("comment", ""),
        "telegram_bot"
    ]
    ws.append_row(row)


def save_lead_with_fallback(ws, lead: dict):
    try:
        save_lead_to_sheets(ws, lead)
        print("lead_saved_to_sheets")
    except Exception as e:
        print(f"sheets_error: {e}")
        save_to_local_backup(lead)
        print("lead_saved_to_backup")`,
          explain: 'Этот блок делает интеграцию безопасной: успешная запись в облако или резервное сохранение без потери данных.',
          breakdown: [
            'save_to_local_backup гарантирует сохранность заявок при сбое внешнего API.',
            'save_lead_to_sheets держит единый порядок колонок.',
            'save_lead_with_fallback связывает happy path и аварийный путь.',
            'Логи помогают понять, куда реально ушла запись.'
          ],
          lineByLine: [
            'Время записи добавляется на уровне интеграции, а не интерфейса пользователя.',
            'lead.get(..., "") защищает от KeyError при неполных данных.',
            'source="telegram_bot" нужен для фильтров и отчетов.',
            'try/except отделяет ошибку интеграции от логики бота.',
            'JSONL-бэкап прост и удобен для повторной заливки в Sheets.'
          ]
        },
        commonErrors: [
          'Таблица не расшарена на service account -> Permission denied.',
          'Нет fallback: при сбое API теряются данные.',
          'Колонки пишутся в разном порядке на разных вызовах.',
          'Секреты ключа случайно попадают в репозиторий.'
        ],
        resultChecklist: [
          'Лиды стабильно появляются в таблице.',
          'При ошибке Sheets лид сохраняется в backup.',
          'Есть source и timestamp у каждой строки.',
          'README содержит шаги подключения service account.'
        ],
        practice: [
          'Отправь 3 заявки и проверь строки.',
          'Добавь source и статус.',
          'Сделай скрин для портфолио.',
          'Смоделируй сбой Sheets и проверь fallback.'
        ]
      },
      parsing: {
        why: 'Клиенту важна не только выгрузка, но и удобство просмотра динамики данных.',
        microExamples: [
          {
            title: 'Мини-пример 1: append-режим',
            code: 'ws.append_rows(rows)',
            explain: 'Подходит для хранения истории прогонов.'
          },
          {
            title: 'Мини-пример 2: upsert-идея',
            code: 'if key in existing: update\nelse: append',
            explain: 'Базовый механизм борьбы с дублями.'
          },
          {
            title: 'Мини-пример 3: ключ уникальности',
            code: 'key = row["url"]',
            explain: 'Нужен стабильный ключ, чтобы понимать «та же запись» или «новая».'
          }
        ],
        bigSteps: [
          'Настрой экспорт в Google Sheets.',
          'Выбери стратегию без дублей (URL как ключ).',
          'Добавь метку времени обновления данных.',
          'Добавь короткий quality-report после выгрузки.'
        ],
        implementationWalkthrough: [
          'Определи режим выгрузки: append для истории или upsert для актуального среза.',
          'Перед записью собери множество существующих ключей из таблицы.',
          'Отфильтруй/обнови только нужные строки.',
          'Запиши updated_at для наблюдаемости изменений.',
          'В конце выведи total/new/updated/skipped.'
        ],
        fullCode: {
          title: 'Большой пример: anti-dup экспорт в Google Sheets',
          code: `from datetime import datetime

def build_key(row: dict) -> str:
    return row.get("url", "").strip()


def export_upsert(ws, rows: list[dict]):
    # Читаем уже существующие URL из таблицы (колонка C)
    existing_urls = set(ws.col_values(3)[1:])  # без header

    to_append = []
    skipped = 0

    for row in rows:
        key = build_key(row)
        if not key:
            skipped += 1
            continue

        if key in existing_urls:
            # Упрощенный путь: пропускаем дубль
            skipped += 1
            continue

        to_append.append([
            row.get("title", ""),
            row.get("price", ""),
            key,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ])

    if to_append:
        ws.append_rows(to_append, value_input_option="USER_ENTERED")

    print(f"total={len(rows)} appended={len(to_append)} skipped={skipped}")`,
          explain: 'Код показывает практичный anti-dup поток: проверка ключей до записи, метка обновления и прозрачная статистика.',
          breakdown: [
            'build_key стандартизирует поле уникальности.',
            'existing_urls позволяет быстро отсекать дубли.',
            'to_append собирает только новые строки.',
            'Финальный print даёт быстрый quality-report.'
          ],
          lineByLine: [
            'col_values(3)[1:] — читаем URL-колонку без заголовка.',
            'Пустые ключи сразу отбрасываются в skipped.',
            'Проверка key in existing_urls предотвращает повторные строки.',
            'updated_at помогает отслеживать момент записи.',
            'append_rows пачкой быстрее, чем append_row в цикле.'
          ]
        },
        commonErrors: [
          'Стратегия дубликатов не определена и таблица разрастается хаотично.',
          'Ключ уникальности нестабилен (например, title вместо url).',
          'Нет метки времени, трудно понять свежесть данных.',
          'Нет отчёта по качеству выгрузки.'
        ],
        resultChecklist: [
          'Дубли в таблице контролируются выбранной стратегией.',
          'У каждой строки есть updated_at.',
          'Выводится статистика appended/skipped.',
          'README описывает режим выгрузки (append/upsert).' 
        ],
        practice: [
          'Сделай 2 запуска без дублей.',
          'Покажи клиентский дашборд-вид таблицы.',
          'Опиши логику обновления в README.',
          'Добавь отдельный лист для new_items за день.'
        ]
      }
    },
    12: {
      title: 'Модуль 12 · День 12',
      subtitle: 'Расширение портфеля: quiz-бот и третий parser-project',
      goal: 'Разнообразие кейсов повышает доверие: клиент видит, что ты решаешь разные типы задач.',
      dayPlan: [
        'Разогрев (15 мин): выбери формат quiz-бота и нишу для parser-project-3.',
        'БОТЫ (60–90 мин): проектируем квиз, баллы, прогресс, итог.',
        'ПАРСИНГ (60–90 мин): адаптация нового источника, валидация, экспорт.',
        'Финал (20–30 мин): упаковка двух новых кейсов в портфолио.'
      ],
      glossary: [
        { term: 'Score', explain: 'Суммарный балл пользователя по ответам в квизе.' },
        { term: 'Question bank', explain: 'Набор вопросов/вариантов в отдельном модуле данных.' },
        { term: 'Coverage', explain: 'Насколько полно парсер покрывает нужные поля и объём данных.' },
        { term: 'Data quality', explain: 'Качество данных: полнота, корректность, отсутствие дублей.' }
      ],
      deliverables: [
        'Quiz-бот с логикой прохождения и итоговым результатом.',
        'parser-project-3 с новой нишей/сайтом и стабильной выгрузкой.',
        '2 новых кейса в портфолио (бот + парсинг).',
        'Мини-таблица сравнения: parser1 vs parser2 vs parser3.'
      ],
      bonusTips: [
        'Храни вопросы в data/questions.py, а не в хендлерах — так проще масштабировать.',
        'Для parser-project-3 сразу зафиксируй критерии качества (например, >=90% валидных строк).',
        'Снимай демо «до/после» по времени выполнения — это сильный аргумент для клиента.',
        'В README добавляй блок «что не покрывает версия 1.0», это повышает доверие.'
      ],
      bots: {
        why: 'Quiz-бот отлично демонстрирует FSM, работу с состояниями и UX-логику.',
        microExamples: [
          {
            title: 'Мини-пример 1: начисление баллов',
            code: 'if answer == correct:\n    score += 1',
            explain: 'Базовая логика оценки, из которой строится весь квиз.'
          },
          {
            title: 'Мини-пример 2: хранение вопроса по индексу',
            code: 'current_question = questions[state_index]',
            explain: 'Индекс в состоянии позволяет двигаться по квизу шаг за шагом.'
          },
          {
            title: 'Мини-пример 3: итоговое сообщение',
            code: 'result = f"Ваш результат: {score}/{total}"',
            explain: 'Пользователь должен получить понятный итог, а не просто «готово».'
          }
        ],
        bigSteps: [
          'Собери quiz-bot-v1 на 7 вопросов.',
          'Добавь /my_result и сохранение результата.',
          'Подготовь короткое демо прохождения.',
          'Добавь повтор прохождения без перезапуска бота.'
        ],
        implementationWalkthrough: [
          'Вынеси вопросы в отдельный модуль данных.',
          'Храни в состоянии индекс текущего вопроса и score.',
          'После каждого ответа обновляй score и переходи к следующему вопросу.',
          'После последнего вопроса показывай итог и очищай/перезапускай состояние.',
          'Добавь команду /my_result для просмотра последнего результата.'
        ],
        fullCode: {
          title: 'Большой пример: quiz-flow с баллами и итогом',
          code: `from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import StatesGroup, State

router = Router()

QUESTIONS = [
    {"q": "2+2?", "options": ["3", "4", "5"], "correct": "4"},
    {"q": "Столица Франции?", "options": ["Рим", "Париж", "Берлин"], "correct": "Париж"},
]


class Quiz(StatesGroup):
    in_progress = State()


@router.message(Command("quiz"))
async def quiz_start(message: Message, state: FSMContext):
    await state.set_state(Quiz.in_progress)
    await state.update_data(idx=0, score=0)
    q = QUESTIONS[0]
    await message.answer(f"Вопрос 1/{len(QUESTIONS)}: {q['q']}\nВарианты: {', '.join(q['options'])}")


@router.message(Quiz.in_progress)
async def quiz_answer(message: Message, state: FSMContext):
    data = await state.get_data()
    idx = data.get("idx", 0)
    score = data.get("score", 0)

    current = QUESTIONS[idx]
    if message.text.strip() == current["correct"]:
        score += 1

    idx += 1
    if idx >= len(QUESTIONS):
        await message.answer(f"Квиз завершён! Результат: {score}/{len(QUESTIONS)}")
        await state.clear()
        return

    await state.update_data(idx=idx, score=score)
    q = QUESTIONS[idx]
    await message.answer(f"Вопрос {idx+1}/{len(QUESTIONS)}: {q['q']}\nВарианты: {', '.join(q['options'])}")`,
          explain: 'Это рабочий каркас quiz-бота: состояние, вопросы, проверка ответов, начисление баллов и корректное завершение.',
          breakdown: [
            'Состояние хранит прогресс пользователя (индекс и score).',
            'Каждый входящий ответ обрабатывается единым хендлером.',
            'После последнего вопроса выводится итог и состояние очищается.',
            'Каркас легко масштабируется до 7-20 вопросов.'
          ],
          lineByLine: [
            'QUESTIONS задаёт банк вопросов в простой расширяемой структуре.',
            'quiz_start инициализирует idx=0 и score=0.',
            'Quiz.in_progress ограничивает обработчик только на период квиза.',
            'Сравнение ответа идёт с current["correct"].',
            'idx += 1 переводит на следующий вопрос.',
            'Условие idx >= len(QUESTIONS) завершает сценарий.',
            'state.clear() не оставляет пользователя в «зависшем» состоянии.'
          ]
        },
        commonErrors: [
          'Вопросы/ответы зашиты в хендлеры и тяжело поддерживаются.',
          'Состояние не очищается после завершения квиза.',
          'Нет проверки на выход за границы индекса вопросов.',
          'Итог не показывается явно пользователю.'
        ],
        resultChecklist: [
          'Квиз проходит полностью от старта до результата.',
          'Баллы начисляются корректно.',
          'Состояние очищается после завершения.',
          'Есть возможность повторного прохождения.'
        ],
        practice: [
          'Добавь минимум 2 уровня сложности.',
          'Сделай повтор теста без перезапуска бота.',
          'Вынеси вопросы в отдельный модуль data/questions.py.',
          'Добавь таблицу результатов top-5 пользователей.'
        ]
      },
      parsing: {
        why: 'Третий проект закрепляет навык адаптации и показывает «серийность» твоей работы.',
        microExamples: [
          {
            title: 'Мини-пример 1: единый pipeline',
            code: 'rows = parse_rows(fetch_html(URL))',
            explain: 'Универсальный паттерн, который переносится на любой источник.'
          },
          {
            title: 'Мини-пример 2: проверка обязательных полей',
            code: 'if not row.get("title") or not row.get("url"):\n    continue',
            explain: 'Данные без ключевых полей не должны попадать в итоговую выгрузку.'
          },
          {
            title: 'Мини-пример 3: quality ratio',
            code: 'quality = valid_rows / total_rows if total_rows else 0',
            explain: 'Качество данных лучше показывать цифрой, а не «вроде нормально».'
          }
        ],
        bigSteps: [
          'Выбери новый сайт/нишу для третьего parser-project.',
          'Адаптируй селекторы и валидацию.',
          'Сделай экспорт и краткий отчёт по качеству данных.',
          'Сравни метрики с parser-project-1 и parser-project-2.'
        ],
        implementationWalkthrough: [
          'Определи нишу и ожидаемые поля до начала парсинга.',
          'Собери и протестируй селекторы на 1-2 страницах вручную.',
          'Внедри валидацию и отбраковку мусора.',
          'Экспортируй данные в CSV/JSON и посчитай quality ratio.',
          'Собери короткий сравнительный отчёт по трём проектам.'
        ],
        fullCode: {
          title: 'Большой пример: parser-project-3 с отчётом качества',
          code: `import csv
import requests
from bs4 import BeautifulSoup

URL = "https://example.com/new-source"
SELECTORS = {
    "card": ".product",
    "title": ".product-title",
    "price": ".product-price",
    "url": "a"
}


def fetch_html(url: str) -> str:
    r = requests.get(url, timeout=20)
    r.raise_for_status()
    return r.text


def parse_rows(html: str) -> tuple[list[dict], int]:
    soup = BeautifulSoup(html, "html.parser")
    cards = soup.select(SELECTORS["card"])
    rows = []
    total = len(cards)

    for c in cards:
        title_el = c.select_one(SELECTORS["title"])
        price_el = c.select_one(SELECTORS["price"])
        url_el = c.select_one(SELECTORS["url"])

        row = {
            "title": title_el.get_text(strip=True) if title_el else "",
            "price": price_el.get_text(strip=True) if price_el else "",
            "url": url_el.get("href", "") if url_el else ""
        }

        if not row["title"] or not row["url"]:
            continue

        rows.append(row)

    return rows, total


def export_csv(rows: list[dict], path: str = "result3.csv"):
    if not rows:
        return
    with open(path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["title", "price", "url"])
        writer.writeheader()
        writer.writerows(rows)


def main():
    html = fetch_html(URL)
    valid_rows, total_rows = parse_rows(html)
    export_csv(valid_rows)

    quality = round((len(valid_rows) / total_rows) * 100, 2) if total_rows else 0
    print(f"total={total_rows} valid={len(valid_rows)} quality={quality}%")


if __name__ == "__main__":
    main()`,
          explain: 'Этот пример показывает третий парсер как зрелый проект: валидация, экспорт и измеримый показатель качества.',
          breakdown: [
            'parse_rows возвращает и валидные строки, и общий объём для метрик.',
            'quality ratio даёт объективную оценку качества адаптера.',
            'Экспорт отделён от парсинга — проще тестировать и сопровождать.',
            'Итоговая строка print пригодна для мониторинга и портфолио.'
          ],
          lineByLine: [
            'SELECTORS вынесен в конфиг для быстрой адаптации под сайт.',
            'total = len(cards) нужен для расчёта качества.',
            'row формируется в едином формате под выгрузку.',
            'Проверка title/url отбрасывает бесполезные записи.',
            'quality считается в процентах и округляется для отчёта.',
            'print(total/valid/quality) даёт понятный итог каждого прогона.'
          ]
        },
        commonErrors: [
          'Выбирают слишком сложную нишу и застревают на старте.',
          'Нет метрики качества, поэтому непонятно, насколько адаптер хорош.',
          'Селекторы не проверяются после первых изменений на сайте.',
          'Сравнение с parser1/2 не фиксируется и теряется прогресс.'
        ],
        resultChecklist: [
          'parser-project-3 собирает валидные данные в новой нише.',
          'Есть quality ratio и отчёт по прогону.',
          'CSV/JSON выгрузка пригодна для клиента.',
          'Есть сравнение трёх парсеров по ключевым метрикам.'
        ],
        practice: [
          'Собери 100+ строк валидных данных.',
          'Сделай сравнение 3 парсеров в одной таблице.',
          'Оформи третий кейс в портфолио.',
          'Добавь диаграмму «рост качества от parser1 к parser3».'
        ]
      }
    },
    13: {
      title: 'Модуль 13 · День 13',
      subtitle: 'Рефакторинг и шаблоны: скорость разработки как конкурентное преимущество',
      goal: 'Сегодня ты превращаешь наработки в систему: reusable-подход экономит время и повышает маржу.',
      dayPlan: [
        'Разогрев (15 мин): посмотри 2 последних проекта и выпиши повторяющиеся фрагменты кода.',
        'БОТЫ (60–90 мин): собираем bot-template и выносим общие модули.',
        'ПАРСИНГ (60–90 мин): делаем parser-template с адаптерами и единым pipeline.',
        'Финал (20–30 мин): замер скорости старта нового проекта и фиксация результата в README.'
      ],
      glossary: [
        { term: 'Template', explain: 'Готовая структура проекта, которая ускоряет старт и снижает количество ошибок.' },
        { term: 'Refactoring', explain: 'Улучшение структуры кода без изменения поведения для пользователя.' },
        { term: 'Reusable module', explain: 'Модуль, который можно использовать в нескольких проектах без переписывания.' },
        { term: 'Bootstrap time', explain: 'Время от старта проекта до первого рабочего сценария.' }
      ],
      deliverables: [
        'bot-template с понятной структурой папок и базовыми модулями.',
        'parser-template с конфигом селекторов, валидацией и экспортом.',
        'Замер времени старта нового мини-проекта до и после шаблонов.',
        'Mini-case в портфолио: «как шаблон ускорил разработку».'
      ],
      bonusTips: [
        'Делай шаблон минимальным: лучше маленький стабильный каркас, чем огромный комбайн.',
        'Сразу заведи .env.example и quickstart-блок в README.',
        'Каждый общий модуль сопровождай коротким docstring или комментарием «зачем он».',
        'Фиксируй метрики времени старта проекта — это сильный аргумент в продаже услуг.'
      ],
      bots: {
        why: 'Если каждый новый проект начинается с копипасты, ты теряешь время и увеличиваешь количество багов.',
        microExamples: [
          {
            title: 'Мини-пример 1: каркас папок',
            code: 'handlers/\nservices/\nrepositories/\nutils/\nconfig.py\nmain.py',
            explain: 'Понятная структура сразу снижает хаос и ускоряет навигацию по проекту.'
          },
          {
            title: 'Мини-пример 2: единая точка запуска',
            code: 'def create_app() -> Dispatcher:\n    dp = Dispatcher()\n    include_routers(dp)\n    return dp',
            explain: 'Функция-конструктор делает старт проекта предсказуемым и тестируемым.'
          },
          {
            title: 'Мини-пример 3: общий сервис в отдельном модуле',
            code: 'class LeadService:\n    def __init__(self, repo):\n        self.repo = repo',
            explain: 'Бизнес-логика должна жить в сервисе, а не в хендлерах — это упрощает переиспользование.'
          }
        ],
        bigSteps: [
          'Собери bot-template с базовыми модулями.',
          'Перенеси общие фрагменты из старых проектов.',
          'Добавь README quickstart и .env.example.',
          'Проверь, что запуск нового бота стал быстрее.'
        ],
        implementationWalkthrough: [
          'Выдели повторяющиеся части из 2-3 прошлых ботов (инициализация, роутеры, конфиг, логирование).',
          'Собери шаблон с базовой структурой: handlers, services, repositories, utils.',
          'Вынеси загрузку env и validate-конфиг в единый config.py.',
          'Добавь starter-хендлеры /start, /help, /health и глобальный error-лог.',
          'Проверь новый старт: от создания папки до рабочего /start без ручной копипасты.'
        ],
        fullCode: {
          title: 'Большой пример: bot-template со слоями и быстрым стартом',
          code: `import asyncio
import logging
import os
from dataclasses import dataclass
from aiogram import Bot, Dispatcher, Router
from aiogram.filters import Command
from aiogram.types import Message


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("bot-template")


@dataclass
class Settings:
    token: str
    admin_ids: set[int]


def parse_admin_ids(raw: str | None) -> set[int]:
    if not raw:
        return set()
    result = set()
    for part in raw.split(","):
        part = part.strip()
        if part.isdigit():
            result.add(int(part))
    return result


def load_settings() -> Settings:
    token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    if not token:
        raise ValueError("TELEGRAM_BOT_TOKEN missing")
    admin_ids = parse_admin_ids(os.getenv("ADMIN_IDS"))
    return Settings(token=token, admin_ids=admin_ids)


class LeadService:
    def save_lead(self, lead: dict) -> None:
        logger.info(f"lead_saved phone={lead.get('phone', '-')}")


def create_router(settings: Settings, lead_service: LeadService) -> Router:
    router = Router()

    @router.message(Command("start"))
    async def start(message: Message):
        await message.answer("Бот-шаблон запущен ✅")

    @router.message(Command("health"))
    async def health(message: Message):
        await message.answer("ok")

    @router.message(Command("admin"))
    async def admin(message: Message):
        uid = message.from_user.id
        if uid not in settings.admin_ids:
            await message.answer("⛔ Нет доступа")
            return
        await message.answer("Админ-панель: /health /start")

    @router.message(Command("lead_test"))
    async def lead_test(message: Message):
        lead_service.save_lead({"phone": "+70000000000"})
        await message.answer("Тестовая заявка сохранена")

    return router


def create_app() -> tuple[Bot, Dispatcher]:
    settings = load_settings()
    bot = Bot(token=settings.token)
    dp = Dispatcher()
    dp.include_router(create_router(settings, LeadService()))
    return bot, dp


async def main():
    logger.info("Bot template starting")
    bot, dp = create_app()
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())`,
          explain: 'Это компактный шаблон прод-старта: конфиг, сервисы, роутеры и единая точка сборки приложения.',
          breakdown: [
            'load_settings делает fail-fast проверку токена и подготавливает admin_ids.',
            'create_router отделяет интерфейсные хендлеры от бизнес-логики.',
            'LeadService показывает, куда складывать прикладную логику.',
            'create_app централизует сборку зависимостей и ускоряет старт новых ботов.'
          ],
          lineByLine: [
            'Settings в dataclass фиксирует контракт конфигурации проекта.',
            'parse_admin_ids нормализует env-строку и отсекает мусор.',
            'load_settings падает сразу, если токен отсутствует — это защищает от тихих ошибок.',
            'LeadService пока минимальный, но это правильное место для бизнес-правил.',
            'create_router принимает зависимости аргументами, а не берет их глобально.',
            'Команда /admin использует guard и ранний return для безопасного доступа.',
            'create_app возвращает готовую связку bot+dispatcher, удобно для тестов и запуска.',
            'main содержит только orchestration без лишней логики.'
          ]
        },
        commonErrors: [
          'Шаблон превращают в свалку и туда попадает бизнес-логика конкретного клиента.',
          'Дублируют env-парсинг в каждом модуле вместо единого config.py.',
          'Хендлеры напрямую работают с БД, из-за чего код трудно переносить.',
          'Нет quickstart-инструкции и шаблоном сложно пользоваться даже автору.'
        ],
        resultChecklist: [
          'Новый бот стартует на шаблоне без копипасты старого проекта.',
          'Есть единый config/load_settings с fail-fast проверкой.',
          'Слои handlers/services разделены и не перемешаны.',
          'README объясняет быстрый запуск за 3-5 шагов.'
        ],
        practice: [
          'Создай новый мини-проект на шаблоне.',
          'Засеки время старта до первого рабочего сценария.',
          'Добавь команду /health и admin-guard в шаблон.',
          'Зафиксируй результат в README шаблона.'
        ]
      },
      parsing: {
        why: 'parser-template уменьшает стоимость адаптации под новый сайт и делает сроки более предсказуемыми.',
        microExamples: [
          {
            title: 'Мини-пример 1: единый интерфейс адаптера',
            code: 'class BaseAdapter:\n    def parse_rows(self, html: str) -> list[dict]:\n        raise NotImplementedError',
            explain: 'Один интерфейс для разных сайтов делает систему расширяемой.'
          },
          {
            title: 'Мини-пример 2: конфиг селекторов',
            code: 'SELECTORS = {"card": ".item", "title": ".name", "price": ".cost", "url": "a"}',
            explain: 'Изменения верстки лучше чинить в конфиге, а не переписывать весь pipeline.'
          },
          {
            title: 'Мини-пример 3: единый экспорт',
            code: 'export_csv(rows, "result.csv")\nexport_json(rows, "result.json")',
            explain: 'Одинаковый формат экспорта экономит время при каждом новом проекте.'
          }
        ],
        bigSteps: [
          'Собери parser-template с конфигом селекторов.',
          'Сделай адаптеры под 2 сайта.',
          'Унифицируй экспорт и логи.',
          'Сравни скорость адаптации нового источника с прошлым подходом.'
        ],
        implementationWalkthrough: [
          'Выдели общее ядро: fetch, validate, export, report.',
          'Сделай BaseAdapter и минимум один SiteAdapter по новому шаблону.',
          'Вынеси селекторы и базовый URL в конфиг адаптера.',
          'Собери pipeline run(adapter): fetch -> parse -> validate -> export.',
          'Добавь итоговый отчет total/valid/skipped/time и сравни с предыдущими проектами.'
        ],
        fullCode: {
          title: 'Большой пример: parser-template с адаптерами и pipeline',
          code: `import csv
import json
import time
import requests
from bs4 import BeautifulSoup


class BaseAdapter:
    url: str = ""
    selectors: dict[str, str] = {}

    def fetch_html(self) -> str:
        r = requests.get(self.url, timeout=20)
        r.raise_for_status()
        return r.text

    def parse_rows(self, html: str) -> list[dict]:
        raise NotImplementedError


class SiteAAdapter(BaseAdapter):
    url = "https://example.com/catalog-a"
    selectors = {"card": ".item", "title": ".name", "price": ".cost", "url": "a"}

    def parse_rows(self, html: str) -> list[dict]:
        soup = BeautifulSoup(html, "html.parser")
        rows = []
        for card in soup.select(self.selectors["card"]):
            title_el = card.select_one(self.selectors["title"])
            price_el = card.select_one(self.selectors["price"])
            url_el = card.select_one(self.selectors["url"])
            row = {
                "title": title_el.get_text(strip=True) if title_el else "",
                "price": price_el.get_text(strip=True) if price_el else "",
                "url": url_el.get("href", "") if url_el else "",
            }
            rows.append(row)
        return rows


def validate_rows(rows: list[dict]) -> tuple[list[dict], int]:
    valid = []
    skipped = 0
    for row in rows:
        if not row.get("title") or not row.get("url"):
            skipped += 1
            continue
        valid.append(row)
    return valid, skipped


def export_csv(rows: list[dict], path: str):
    if not rows:
        return
    with open(path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["title", "price", "url"])
        writer.writeheader()
        writer.writerows(rows)


def export_json(rows: list[dict], path: str):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)


def run_pipeline(adapter: BaseAdapter):
    started = time.time()
    html = adapter.fetch_html()
    raw_rows = adapter.parse_rows(html)
    valid_rows, skipped = validate_rows(raw_rows)
    export_csv(valid_rows, "result.csv")
    export_json(valid_rows, "result.json")
    elapsed = round(time.time() - started, 2)
    print(f"total={len(raw_rows)} valid={len(valid_rows)} skipped={skipped} time={elapsed}s")


if __name__ == "__main__":
    run_pipeline(SiteAAdapter())`,
          explain: 'Это базовый parser-template с чистой архитектурой: адаптер сайта + общее ядро пайплайна и отчет по качеству.',
          breakdown: [
            'BaseAdapter задает контракт, который обязаны поддерживать все источники.',
            'SiteAAdapter хранит только знания о конкретной верстке.',
            'validate_rows централизует контроль качества данных.',
            'run_pipeline объединяет этапы и выводит понятные метрики прогона.'
          ],
          lineByLine: [
            'fetch_html инкапсулирует сеть и HTTP-проверку в одном месте.',
            'parse_rows реализуется в конкретном адаптере под сайт.',
            'row формируется единым контрактом title/price/url для дальнейшего экспорта.',
            'validate_rows отбрасывает неполные записи и считает skipped.',
            'CSV и JSON экспорт отделены от этапа парсинга, это упрощает тестирование.',
            'run_pipeline считает время и печатает total/valid/skipped для контроля качества.',
            'Добавление второго сайта = новый адаптер, а не переписывание ядра.'
          ]
        },
        commonErrors: [
          'Логику парсинга и экспорта смешивают в одном длинном файле.',
          'Нет единого контракта row, из-за чего ломается выгрузка.',
          'При смене сайта переписывают весь проект вместо нового адаптера.',
          'Не считают skipped/valid и не видят деградацию качества.'
        ],
        resultChecklist: [
          'Новый источник подключается через отдельный адаптер.',
          'Ядро pipeline не меняется при добавлении второго сайта.',
          'Есть унифицированный экспорт CSV/JSON.',
          'Есть отчёт по качеству: total/valid/skipped/time.'
        ],
        practice: [
          'Подключи ещё один сайт без переписывания ядра.',
          'Оцени процент переиспользованного кода.',
          'Добавь второй адаптер и сравни метрики с первым.',
          'Оформи mini-case «до/после рефакторинга».'
        ]
      }
    },
    14: {
      title: 'Модуль 14 · День 14',
      subtitle: 'Упаковка второй недели: публикация кейсов и улучшение откликов',
      goal: 'Закрепляем результаты недели и переводим их в понятные рыночные материалы, которые реально продают.',
      dayPlan: [
        'Разогрев (15 мин): выбери по 1 лучшему кейсу в ботах и парсинге для доработки.',
        'БОТЫ (60–90 мин): доводим кейсы до формата «сразу понятно клиенту».',
        'ПАРСИНГ (60–90 мин): усиливаем цифры, скриншоты и коммерческий вывод.',
        'Финал (20–30 мин): публикуем обновлённые кейсы и фиксируем KPI откликов.'
      ],
      glossary: [
        { term: 'Case packaging', explain: 'Оформление результата так, чтобы ценность была очевидна без технических деталей.' },
        { term: 'Social proof', explain: 'Элементы доверия: демо, цифры, отзывы, реальные артефакты.' },
        { term: 'CTR отклика', explain: 'Процент переходов к диалогу после отправленного отклика.' },
        { term: 'Positioning', explain: 'Чёткое позиционирование: для кого ты и какую задачу решаешь лучше всего.' }
      ],
      deliverables: [
        '2 обновлённых бот-кейса в едином продающем формате.',
        '2 обновлённых parsing-кейса с метриками и выводом для клиента.',
        'Пакет откликов с персонализацией под разные задачи.',
        'Таблица KPI: отправлено/ответов/созвонов за день.'
      ],
      bonusTips: [
        'Публикуй кейс не как «дневник разработки», а как «бизнес-результат».',
        'Один кейс = одна боль клиента + одно сильное решение + одна метрика эффекта.',
        'В конце каждого кейса всегда давай CTA: демо, консультация, мини-план.',
        'Сохраняй шаблон карточки кейса, чтобы ускорять упаковку следующих проектов.'
      ],
      bots: {
        why: 'Клиент покупает понятный результат, а не «кучу функций без контекста».',
        microExamples: [
          {
            title: 'Мини-пример 1: структура описания кейса',
            code: 'Боль -> Решение -> Срок -> Результат -> Что дальше',
            explain: 'Эта структура помогает клиенту за 20 секунд понять, подходишь ли ты под задачу.'
          },
          {
            title: 'Мини-пример 2: усиление цифрами',
            code: 'До: 15 минут на обработку заявки\nПосле: 3 минуты',
            explain: 'Даже одна конкретная цифра делает кейс заметно сильнее и правдоподобнее.'
          },
          {
            title: 'Мини-пример 3: финальный CTA',
            code: 'Готов показать сценарий на 10-минутном созвоне сегодня.',
            explain: 'Кейс без следующего шага хуже конвертирует в диалог.'
          }
        ],
        bigSteps: [
          'Оформи 2 бот-кейса с одинаковым стандартом качества.',
          'Добавь демо, release и блок «для кого подходит».',
          'Подготовь две версии описания: короткую для чата и расширенную для портфолио.',
          'Публикуй кейсы в каналах/биржах.'
        ],
        implementationWalkthrough: [
          'Выбери 2 кейса, которые лучше всего показывают разные типы задач (лиды, FAQ, автоматизация).',
          'Оформи каждый кейс по шаблону: проблема -> решение -> функции -> результат.',
          'Добавь демо-сценарий и ссылки на артефакты (README/скрины/репо).',
          'Сформулируй «для кого подходит» и «какой результат за 1-ю версию».',
          'Собери 10 персонализированных откликов с этими кейсами.'
        ],
        fullCode: {
          title: 'Большой пример: шаблон бот-кейса + адаптер отклика',
          code: `CASE_TEMPLATE = {
    "niche": "Telegram lead bot",
    "pain": "заявки терялись в чатах",
    "solution": "FSM-форма + админ-панель + экспорт CSV",
    "eta": "4 дня",
    "result": "время обработки заявки сократилось с 15 до 3 минут",
    "artifacts": ["README", "demo.mp4", "release-v1.0.0"],
}


def build_case_text(case: dict) -> str:
    return (
        f"Ниша: {case['niche']}\n"
        f"Боль: {case['pain']}\n"
        f"Решение: {case['solution']}\n"
        f"Срок: {case['eta']}\n"
        f"Результат: {case['result']}\n"
        f"Материалы: {', '.join(case['artifacts'])}\n"
        "Следующий шаг: показываю демо и адаптирую под вашу задачу"
    )


def build_reply(task: str, case: dict) -> str:
    return (
        f"Здравствуйте! Вижу задачу: {task}.\n"
        f"Делал похожее: {case['solution']}.\n"
        f"Результат в кейсе: {case['result']}.\n"
        "Могу показать демо и предложить план внедрения на 3-5 дней."
    )


print(build_case_text(CASE_TEMPLATE))
print("---")
print(build_reply("нужен бот для сбора заявок", CASE_TEMPLATE))`,
          explain: 'Это рабочий «конвейер упаковки»: единый формат кейса + генерация отклика под задачу клиента.',
          breakdown: [
            'CASE_TEMPLATE задаёт обязательные поля сильного кейса.',
            'build_case_text превращает структуру в читабельный текст для портфолио.',
            'build_reply использует доказательство из кейса, а не абстрактные обещания.',
            'Один шаблон масштабируется на десятки откликов с персонализацией.'
          ],
          lineByLine: [
            'В шаблоне фиксируются niche/pain/solution/result — это ядро продажного описания.',
            'artifacts показывают, что решение реально существует и проверяемо.',
            'build_case_text формирует карточку кейса без ручной рутинной верстки.',
            'В build_reply сначала отражается задача клиента, затем релевантный опыт.',
            'Фраза про демо и план внедрения переводит разговор в следующий шаг.',
            'print используется как self-check финального текста перед публикацией.'
          ]
        },
        commonErrors: [
          'Кейсы публикуются без метрик, и они выглядят как «общие слова».',
          'Нет единого шаблона, поэтому качество кейсов плавает от проекта к проекту.',
          'Отклики копируются без адаптации под конкретную задачу клиента.',
          'Не добавлен призыв к следующему шагу (созвон/демо/план).'
        ],
        resultChecklist: [
          'Бот-кейсы читаются быстро и содержат измеримый результат.',
          'Есть демо/README/release как доказательства выполнения.',
          'Отклик использует релевантный кейс, а не общий текст.',
          'После отправки кейсов есть рост входящих диалогов.'
        ],
        practice: [
          'Сделай 10+ откликов с новыми кейсами.',
          'Собери обратную связь по формулировкам.',
          'Проведи A/B тест двух вариантов CTA в отклике.',
          'Обнови шаблон оффера.'
        ]
      },
      parsing: {
        why: 'Метрики и понятные отчёты делают parsing-кейс коммерчески убедительным.',
        microExamples: [
          {
            title: 'Мини-пример 1: KPI-карточка кейса',
            code: 'total=1800 | valid=1650 | new=74 | time=52s',
            explain: 'Короткая KPI-строка помогает клиенту быстро оценить практическую пользу решения.'
          },
          {
            title: 'Мини-пример 2: блок выгоды',
            code: 'Ручной сбор: 5-6 часов\nАвтоматизировано: 1 запуск в 1 клик',
            explain: 'Сравнение с ручной работой лучше показывает экономический эффект.'
          },
          {
            title: 'Мини-пример 3: ограничение заранее',
            code: 'Риски: anti-bot, изменения верстки.\nМеры: retry + мониторинг + адаптер.',
            explain: 'Честное описание рисков повышает доверие и снижает конфликты в проекте.'
          }
        ],
        bigSteps: [
          'Упакуй 2 parsing-кейса с цифрами.',
          'Добавь визуальные артефакты (таблицы/скрины).',
          'Подготовь короткое КП для чатов и расширенное КП для созвона.',
          'Публикуй в профильных сообществах.'
        ],
        implementationWalkthrough: [
          'Для каждого кейса собери блоки: входные данные, pipeline, результат, риски.',
          'Добавь KPI по последнему прогону и поясни, что означает каждая метрика.',
          'Подготовь 2 формата презентации: 5 строк и 1 страница.',
          'Свяжи кейс с конкретными типами задач (мониторинг цен, агрегаторы, витрины).',
          'Проведи 10–15 откликов и зафиксируй, какие кейсы дали ответы.'
        ],
        fullCode: {
          title: 'Большой пример: генератор карточки parsing-кейса и КП',
          code: `def build_parsing_case(title: str, metrics: dict, output: str, risks: list[str]) -> str:
    return (
        f"Кейс: {title}\n"
        f"Метрики: total={metrics['total']}, valid={metrics['valid']}, new={metrics['new']}, time={metrics['time']}\n"
        f"Формат выдачи: {output}\n"
        f"Риски: {', '.join(risks)}\n"
        "Результат для клиента: регулярный поток структурированных данных"
    )


def build_kp_short(task: str, case_text: str) -> str:
    return (
        f"Сделаю под вашу задачу: {task}.\n"
        "Запуск MVP за 2-4 дня, отчеты в CSV/Google Sheets.\n"
        f"Похожий кейс:\n{case_text}\n"
        "Готов обсудить детали и предложить точный план сегодня."
    )


case = build_parsing_case(
    title="Мониторинг цен конкурентов",
    metrics={"total": 1800, "valid": 1650, "new": 74, "time": "52s"},
    output="CSV + Google Sheets",
    risks=["изменение верстки", "ограничение запросов"],
)

print(case)
print("---")
print(build_kp_short("регулярный сбор цен", case))`,
          explain: 'Этот шаблон позволяет быстро собирать убедительные parsing-материалы и конвертировать их в КП.',
          breakdown: [
            'build_parsing_case стандартизирует подачу кейса в одном стиле.',
            'KPI блок показывает результат без технической перегрузки.',
            'build_kp_short сокращает путь от кейса к коммерческому предложению.',
            'Шаблон легко переиспользовать для разных ниш парсинга.'
          ],
          lineByLine: [
            'title задаёт предметную область кейса (чтобы клиент узнал свою задачу).',
            'metrics вынесены в dict для лёгкой замены данных прогона.',
            'output фиксирует формат сдачи результата, важный для клиента.',
            'risks добавляются явно — это про зрелую коммуникацию, а не про страх.',
            'build_kp_short ссылается на кейс как на доказательство компетенции.',
            'Финальный CTA переводит переписку в конкретное действие.'
          ]
        },
        commonErrors: [
          'В кейсе нет KPI, и клиент не может оценить полезность решения.',
          'Слишком много технических деталей, но мало бизнес-выгоды.',
          'КП не привязано к реальному кейсу и выглядит «пустым».',
          'Не проводится анализ эффективности публикаций и откликов.'
        ],
        resultChecklist: [
          'Есть 2 parsing-кейса с понятными метриками и выводом.',
          'Есть 2 формата КП: короткий и расширенный.',
          'Каждый кейс содержит блок ограничений и мер контроля.',
          'Есть данные по откликам и конверсии в диалоги.'
        ],
        practice: [
          'Сделай 10–15 откликов по парсингу.',
          'Отметь, какие кейсы дают больше диалогов.',
          'Собери таблицу «кейс -> просмотры -> ответы».',
          'Подкрути описание выгоды в КП.'
        ]
      }
    },
    15: {
      title: 'Модуль 15 · День 15',
      subtitle: 'Третья неделя: шаблоны ускорения и повторяемое качество',
      goal: 'Ускоряем старт новых заказов: шаблоны + стандарты качества = больше проектов за то же время.',
      dayPlan: [
        'Разогрев (15 мин): оцени, какие блоки чаще всего повторяются в новых задачах.',
        'БОТЫ (60–90 мин): усиливаем bot-template до реально коммерческого старта.',
        'ПАРСИНГ (60–90 мин): строим parser-template v2 с режимом multi-site.',
        'Финал (20–30 мин): измеряем экономию времени и фиксируем стандарты качества.'
      ],
      glossary: [
        { term: 'Boilerplate', explain: 'Минимальный рабочий каркас проекта, который ускоряет запуск.' },
        { term: 'Scaffold', explain: 'Структура файлов/папок для быстрого старта по стандарту.' },
        { term: 'Quality gate', explain: 'Набор проверок перед релизом (ошибки, тесты, smoke-check).' },
        { term: 'Multi-site mode', explain: 'Режим, в котором один parser-template работает с несколькими источниками.' }
      ],
      deliverables: [
        'bot-template с базовыми модулями для старта задач за 30–40 минут.',
        'parser-template v2 с адаптерами и общим pipeline.',
        'Чеклист quality gate для релиза каждого проекта.',
        'Сравнение времени «до шаблона» и «после шаблона».'
      ],
      bonusTips: [
        'Шаблон должен быть маленьким и понятным: сложность добавляй по мере задачи.',
        'Каждый шаблон обновляй после реального проекта, а не «в теории».',
        'Документируй только то, что реально используешь в 80% случаев.',
        'Не бойся удалять лишнее из шаблона — перегруженный шаблон тормозит, а не ускоряет.'
      ],
      bots: {
        why: 'bot-template уменьшает «стоимость входа» в любой новый проект и снижает риск пропустить критичный блок.',
        microExamples: [
          {
            title: 'Мини-пример 1: жизненный цикл бота',
            code: 'load_config -> create_bot -> include_routers -> start_polling',
            explain: 'Единый lifecycle помогает запускать проекты без хаоса и «забытых шагов».'
          },
          {
            title: 'Мини-пример 2: общий guard',
            code: 'if message.from_user.id not in ADMIN_IDS:\n    return await message.answer("⛔ Нет доступа")',
            explain: 'Guard лучше положить в шаблон сразу, а не добавлять под конец проекта.'
          },
          {
            title: 'Мини-пример 3: базовый smoke-check',
            code: '/start -> /help -> /health -> key command',
            explain: 'Этот мини-чеклист защищает от релиза «бот стартует, но половина функций не работает».'
          }
        ],
        bigSteps: [
          'Собери telegram-bot-template с auth/FSM/export/error handler.',
          'Добавь .env.example и quickstart README.',
          'Собери quality gate перед релизом.',
          'Проверь, что новый бот стартует за 30–40 минут.'
        ],
        implementationWalkthrough: [
          'Собери минимальную структуру проекта и шаблон команд /start, /help, /health.',
          'Добавь слой services и repositories, чтобы не смешивать бизнес-логику и интерфейс.',
          'Включи базовый middleware для логирования входящих апдейтов.',
          'Пропиши .env.example и краткий README quickstart в 5 шагов.',
          'Запусти мини-проект на шаблоне и измерь время до первого рабочего сценария.'
        ],
        fullCode: {
          title: 'Большой пример: quality-gate для bot-template',
          code: `def quality_gate_bot(project_name: str, checks: dict) -> str:
    required = [
        "env_configured",
        "commands_work",
        "admin_guard",
        "error_logging",
        "readme_quickstart",
    ]
    missing = [key for key in required if not checks.get(key)]

    if missing:
        return (
            f"❌ {project_name}: релиз остановлен. "
            f"Не пройдены проверки: {', '.join(missing)}"
        )

    return f"✅ {project_name}: quality-gate пройден, можно выпускать релиз"


sample_checks = {
    "env_configured": True,
    "commands_work": True,
    "admin_guard": True,
    "error_logging": True,
    "readme_quickstart": True,
}

print(quality_gate_bot("lead-bot-template", sample_checks))`,
          explain: 'Этот блок внедряет дисциплину релиза: шаблон считается готовым только после прохождения quality-gate.',
          breakdown: [
            'required фиксирует минимальные критерии качества перед релизом.',
            'missing показывает точные пробелы, а не абстрактное «ещё не готово».',
            'Функция возвращает понятный результат для команды и для тебя.',
            'Такой gate снижает риск багов и повторных доработок после релиза.'
          ],
          lineByLine: [
            'required хранит ключевые проверки как контракт качества.',
            'list comprehension собирает непрошедшие пункты в один список.',
            'Если missing не пуст, релиз блокируется с объяснением причин.',
            'Позитивная ветка явно подтверждает готовность к выпуску.',
            'sample_checks можно заменить автоматическими проверками CI/CD.'
          ]
        },
        commonErrors: [
          'В шаблон добавляют всё подряд, и он становится тяжёлым и непонятным.',
          'Нет quality-gate, поэтому релизы выходят с базовыми багами.',
          'README не обновляется, и даже автор забывает шаги запуска.',
          'Слои проекта смешиваются, что снова приводит к копипасте.'
        ],
        resultChecklist: [
          'bot-template запускается стабильно и быстро на новом проекте.',
          'Есть проверяемый quality-gate перед релизом.',
          'Есть понятный quickstart и .env.example.',
          'Время старта нового проекта сократилось по сравнению с прошлым подходом.'
        ],
        practice: [
          'Подними demo-проект на шаблоне.',
          'Проверь работу ключевых сценариев.',
          'Прогони quality-gate перед тестовым релизом.',
          'Зафиксируй шаблон как отдельный кейс.'
        ]
      },
      parsing: {
        why: 'parser-template v2 позволяет быстрее подключать новые источники и устойчивее переживать изменения верстки.',
        microExamples: [
          {
            title: 'Мини-пример 1: единый pipeline',
            code: 'rows = export(validate(parse(fetch(source))))',
            explain: 'Фиксированная последовательность этапов делает проект прозрачным для отладки.'
          },
          {
            title: 'Мини-пример 2: registry адаптеров',
            code: 'ADAPTERS = {"site_a": SiteAAdapter(), "site_b": SiteBAdapter()}',
            explain: 'Registry ускоряет подключение новых сайтов без переписывания ядра.'
          },
          {
            title: 'Мини-пример 3: quality check',
            code: 'quality = valid / total if total else 0',
            explain: 'Без метрики качества сложно понять, реально ли шаблон даёт стабильный результат.'
          }
        ],
        bigSteps: [
          'Сделай template с конфигом селекторов и retry.',
          'Добавь общие проверки качества данных.',
          'Введи registry адаптеров для multi-site режима.',
          'Подготовь multi-site режим для расширения.'
        ],
        implementationWalkthrough: [
          'Вынеси общий код pipeline в отдельный модуль (без привязки к конкретному сайту).',
          'Сделай 2 адаптера и подключи их через registry.',
          'Добавь retry на сетевой слой и лог этапов выполнения.',
          'Добавь quality-report после каждого прогона.',
          'Сравни скорость подключения 2-го сайта со старым подходом.'
        ],
        fullCode: {
          title: 'Большой пример: multi-site runner для parser-template v2',
          code: `class BaseAdapter:
    name = "base"

    def fetch(self) -> str:
        raise NotImplementedError

    def parse(self, html: str) -> list[dict]:
        raise NotImplementedError


def validate_rows(rows: list[dict]) -> tuple[list[dict], int]:
    valid, skipped = [], 0
    for r in rows:
        if not r.get("title") or not r.get("url"):
            skipped += 1
            continue
        valid.append(r)
    return valid, skipped


def run_adapter(adapter: BaseAdapter) -> dict:
    html = adapter.fetch()
    raw = adapter.parse(html)
    valid, skipped = validate_rows(raw)
    return {
        "source": adapter.name,
        "total": len(raw),
        "valid": len(valid),
        "skipped": skipped,
    }


def run_all(adapters: dict[str, BaseAdapter]):
    reports = []
    for key, adapter in adapters.items():
        report = run_adapter(adapter)
        reports.append(report)
        print(
            f"[{key}] total={report['total']} valid={report['valid']} skipped={report['skipped']}"
        )
    return reports`,
          explain: 'Этот пример превращает parser-template в масштабируемую платформу: один runner, много источников.',
          breakdown: [
            'BaseAdapter задаёт единый контракт для всех источников.',
            'validate_rows переиспользуется между сайтами и стабилизирует качество.',
            'run_adapter формирует единый отчет по каждому источнику.',
            'run_all запускает multi-site режим и даёт сравнимые метрики.'
          ],
          lineByLine: [
            'Контракт BaseAdapter защищает от хаотичных реализаций парсеров.',
            'validate_rows исключает мусор и считает skipped для диагностики.',
            'run_adapter возвращает стандартизированный report dict.',
            'source в отчете важен для multi-site аналитики.',
            'run_all итерирует registry адаптеров без изменений ядра.',
            'print формирует человекочитаемый мониторинг в runtime.'
          ]
        },
        commonErrors: [
          'Каждый новый источник дублирует pipeline заново.',
          'Нет единого формата отчетов по источникам.',
          'Качество данных не измеряется после прогона.',
          'Retry есть, но не логируется и его поведение непонятно.'
        ],
        resultChecklist: [
          '2+ источника работают через единый runner.',
          'У каждого прогона есть стандартный quality-report.',
          'Изменение селекторов не требует переписывать ядро.',
          'Время подключения нового источника заметно сокращено.'
        ],
        practice: [
          'Подключи 2 сайта на одном шаблоне.',
          'Сравни время старта до и после шаблона.',
          'Собери единый отчет по двум источникам.',
          'Обнови README с инструкцией адаптации.'
        ]
      }
    },
    16: {
      title: 'Модуль 16 · День 16',
      subtitle: 'Надёжность прод-уровня: логирование и обработка ошибок',
      goal: 'Сегодня делаешь проекты устойчивыми к сбоям: чтобы они не «молча падали», а контролируемо восстанавливались.',
      dayPlan: [
        'Разогрев (15 мин): вспомни 3 последние ошибки и как долго ты их искал в логах.',
        'БОТЫ (60–90 мин): делаем глобальную обработку ошибок и структурные логи.',
        'ПАРСИНГ (60–90 мин): усиливаем retry, алерты и диагностику качества.',
        'Финал (20–30 мин): оформляем troubleshooting-гайд и чеклист реакции на инциденты.'
      ],
      glossary: [
        { term: 'Structured log', explain: 'Лог с понятными полями (event, user_id, source), удобный для поиска и анализа.' },
        { term: 'Exception boundary', explain: 'Граница, где ошибка перехватывается и обрабатывается контролируемо.' },
        { term: 'Backoff', explain: 'Увеличение паузы между retry-попытками при повторных сбоях.' },
        { term: 'Incident response', explain: 'Порядок действий при аварии: обнаружить, локализовать, восстановить, зафиксировать.' }
      ],
      deliverables: [
        'Глобальная обработка ошибок для бота с понятным сообщением пользователю.',
        'Структурные логи ключевых событий и ошибок.',
        'Retry + alert-механизм для критичных сбоев в парсинге.',
        'Troubleshooting-блок в README с типовыми сценариями.'
      ],
      bonusTips: [
        'Пиши логи так, как будто их будет читать человек без контекста проекта.',
        'Одна ошибка = один event_id в логах, чтобы легче собирать цепочку.',
        'После каждого инцидента добавляй пункт в troubleshooting, а не надейся на память.',
        'Лучше один стабильный алерт, чем 20 шумных уведомлений.'
      ],
      bots: {
        why: 'Логи и error handling — это основа сопровождения и доверия клиента к продакшен-сервису.',
        microExamples: [
          {
            title: 'Мини-пример 1: структурный лог события',
            code: 'logger.info("command_received", extra={"user_id": uid, "command": "/start"})',
            explain: 'Структурные поля ускоряют поиск причин проблем по логам.'
          },
          {
            title: 'Мини-пример 2: дружелюбная ошибка для пользователя',
            code: 'await message.answer("⚠️ Временная ошибка. Уже исправляем, попробуйте позже.")',
            explain: 'Пользователь не должен видеть traceback и внутренние детали.'
          },
          {
            title: 'Мини-пример 3: лог с traceback',
            code: 'logger.exception("unhandled_error", exc_info=True)',
            explain: 'Traceback нужен разработчику для быстрого root-cause анализа.'
          }
        ],
        bigSteps: [
          'Подключи loguru/стандартное логирование.',
          'Сделай global error handler и защиту команд.',
          'Добавь корреляционный id события в логи.',
          'Настрой ротацию логов и базовый алерт на критические ошибки.'
        ],
        implementationWalkthrough: [
          'Настрой единый формат логов с временем, уровнем и event name.',
          'Добавь middleware или общий handler для логирования входящих команд.',
          'Сделай global error handler с ответом пользователю и записью exception.',
          'Добавь защиту критичных команд и корректные сообщения об отказе.',
          'Протестируй 2-3 искусственные ошибки и проверь, что логи достаточно информативны.'
        ],
        fullCode: {
          title: 'Большой пример: global error handler + структурные логи для бота',
          code: `import logging
import uuid
from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message

logger = logging.getLogger("bot-prod")
router = Router()


def event_id() -> str:
    return uuid.uuid4().hex[:8]


@router.message(Command("start"))
async def start(message: Message):
    eid = event_id()
    logger.info("command_start", extra={"event_id": eid, "user_id": message.from_user.id})
    await message.answer("Бот работает ✅")


@router.message(Command("crash_test"))
async def crash_test(message: Message):
    eid = event_id()
    try:
        1 / 0
    except Exception:
        logger.exception("unhandled_error", extra={"event_id": eid, "user_id": message.from_user.id})
        await message.answer("⚠️ Временная ошибка. Команда уже в работе.")`,
          explain: 'Код показывает безопасную обработку ошибок: техническая детализация в логах, спокойная коммуникация с пользователем.',
          breakdown: [
            'event_id связывает пользовательский запрос и запись ошибки.',
            'Лог старта команды фиксирует контекст входящего действия.',
            'Exception записывается с полями user_id/event_id для быстрого поиска.',
            'Пользователь получает понятный ответ, а не внутреннюю трассировку.'
          ],
          lineByLine: [
            'uuid используется для лёгкого корреляционного ID.',
            'extra в logger добавляет структурные поля в запись.',
            'Команда crash_test моделирует инцидент для тренировки диагностики.',
            'except блок отделяет «техническое логирование» от «пользовательского ответа».',
            'С таким подходом инциденты быстрее локализуются и чинятся.'
          ]
        },
        commonErrors: [
          'Пользователю показывают сырые технические ошибки.',
          'Логи без контекста (кто, где, когда) бесполезны при расследовании.',
          'Нет единого формата логирования по проекту.',
          'Обработчик ошибок есть, но не покрывает критичные места.'
        ],
        resultChecklist: [
          'Ошибки логируются с понятным контекстом и event_id.',
          'Пользователь получает корректное и безопасное сообщение.',
          'Есть базовый алерт на критические исключения.',
          'Troubleshooting-гайд обновлён по реальным инцидентам.'
        ],
        practice: [
          'Сымитируй 2 ошибки и проверь лог.',
          'Добавь troubleshooting секцию в README.',
          'Введи event_id и проверь поиск инцидента по нему.',
          'Проверь, что бот не падает от ожидаемых исключений.'
        ]
      },
      parsing: {
        why: 'Для парсеров критичны сетевые сбои и «грязные данные». Надёжность = retry + контроль аномалий + уведомления.',
        microExamples: [
          {
            title: 'Мини-пример 1: контролируемый retry',
            code: 'for attempt in range(1, max_attempts + 1): ...',
            explain: 'Retry должен быть ограничен по числу попыток, иначе зависнешь в бесконечном цикле.'
          },
          {
            title: 'Мини-пример 2: backoff',
            code: 'sleep_sec = base_delay * attempt',
            explain: 'Плавное увеличение паузы снижает нагрузку на источник и шанс повторной ошибки.'
          },
          {
            title: 'Мини-пример 3: алерт при фатале',
            code: 'notify_admin(f"parser failed: {error}")',
            explain: 'Фатальные ошибки должны всплывать сразу, а не обнаруживаться через сутки.'
          }
        ],
        bigSteps: [
          'Добавь детальные логи этапов парсинга.',
          'Реализуй retry на HTTP-ошибки.',
          'Добавь anomaly-check для резких просадок качества.',
          'Сделай сигнализацию на critical-сбои.'
        ],
        implementationWalkthrough: [
          'Раздели логи по этапам: fetch, parse, validate, export.',
          'Добавь retry с backoff на сеть и отдельный лимит попыток.',
          'Проверь аномалии: например, valid резко упал ниже порога.',
          'При фатальной ошибке отправляй алерт с кратким контекстом.',
          'Собери troubleshooting: что делать при timeout, пустой выдаче, падении качества.'
        ],
        fullCode: {
          title: 'Большой пример: retry + anomaly-check + алерты в парсинге',
          code: `import time
import logging

logger = logging.getLogger("parser-prod")


def notify_admin(text: str):
    logger.warning(f"ADMIN_ALERT: {text}")


def fetch_with_retry(fetch_fn, max_attempts: int = 3, base_delay: int = 2):
    for attempt in range(1, max_attempts + 1):
        try:
            return fetch_fn()
        except Exception as e:
            logger.warning(f"fetch_failed attempt={attempt} error={e}")
            if attempt == max_attempts:
                raise
            time.sleep(base_delay * attempt)


def anomaly_check(total: int, valid: int, min_quality: float = 0.75) -> bool:
    quality = (valid / total) if total else 0
    if quality < min_quality:
        notify_admin(f"quality_drop total={total} valid={valid} quality={quality:.2f}")
        return True
    return False


def run_job(fetch_fn, parse_fn):
    try:
        html = fetch_with_retry(fetch_fn, max_attempts=4, base_delay=2)
        rows = parse_fn(html)
        total = len(rows)
        valid = len([r for r in rows if r.get("title") and r.get("url")])
        anomaly_check(total, valid)
        logger.info(f"job_ok total={total} valid={valid}")
    except Exception as e:
        logger.exception("job_failed")
        notify_admin(f"fatal_error: {e}")
        raise`,
          explain: 'Этот блок делает парсер устойчивым: временные сбои переживаются retry, критичные — сразу сигнализируются.',
          breakdown: [
            'fetch_with_retry ограничивает число попыток и использует backoff.',
            'anomaly_check отслеживает не только падение процесса, но и падение качества.',
            'run_job централизует операционную часть и аварийную реакцию.',
            'notify_admin закрывает риск «упало и никто не заметил».'
          ],
          lineByLine: [
            'warning на каждой неудачной попытке даёт историю деградации до фатала.',
            'raise после последней попытки сохраняет прозрачность статуса задачи.',
            'quality считается как отношение valid/total — простой, но полезный KPI.',
            'При quality_drop отправляется отдельный алерт, даже если job формально не упала.',
            'job_ok лог нужен для подтверждения стабильной работы между инцидентами.',
            'В except сначала лог с traceback, затем админ-алерт, затем проброс ошибки.'
          ]
        },
        commonErrors: [
          'Retry реализован без лимита и превращается в бесконечный цикл.',
          'Алерты приходят только при падении, но не при деградации качества.',
          'Логи не разделены по этапам, и причина падения неочевидна.',
          'После инцидента не обновляют troubleshooting-документацию.'
        ],
        resultChecklist: [
          'Сетевые ошибки обрабатываются через retry с backoff.',
          'Критичные сбои и просадки качества дают алерты.',
          'Логи позволяют восстановить цепочку этапов и причин.',
          'Есть инструкция по реакции на типовые инциденты.'
        ],
        practice: [
          'Смоделируй сетевой сбой и убедись в корректном retry.',
          'Проверь critical-лог/уведомление при фатальной ошибке.',
          'Смоделируй просадку качества ниже порога и проверь alert.',
          'Добавь раздел «диагностика» в README.'
        ]
      }
    },
    17: {
      title: 'Модуль 17 · День 17',
      subtitle: 'Автоуведомления и платежный сценарий: повышаем ценность сервиса',
      goal: 'Добавляем в проекты «реакцию на события»: бот умеет вести платежный flow, парсер — автоматически уведомлять клиента о результатах.',
      dayPlan: [
        'Разогрев (15 мин): опиши 2 ключевых события, о которых клиент должен узнавать автоматически.',
        'БОТЫ (60–90 мин): собираем mock-платежный сценарий с фиксацией статуса в БД.',
        'ПАРСИНГ (60–90 мин): email/Telegram-уведомления + retry для доставки.',
        'Финал (20–30 мин): демо «событие -> уведомление» и запись в кейс.'
      ],
      glossary: [
        { term: 'Payment flow', explain: 'Сценарий выбора тарифа, подтверждения и получения статуса оплаты.' },
        { term: 'Status machine', explain: 'Чёткий набор статусов, через которые проходит заявка/платёж.' },
        { term: 'Notification pipeline', explain: 'Цепочка отправки уведомлений с проверкой доставки и retry.' },
        { term: 'Delivery guarantee', explain: 'Механизм, который снижает риск потери уведомления.' }
      ],
      deliverables: [
        'Mock-платежный сценарий в боте с сохранением статусов.',
        'Отправка уведомлений о результатах парсинга (email/Telegram).',
        'Retry-механика для временных сбоев отправки.',
        'Короткое демо и описание выгоды для клиента.'
      ],
      bonusTips: [
        'Сделай статусы максимально прозрачными: created -> pending -> paid/failed.',
        'Не смешивай отправку уведомления и бизнес-логику в одном хендлере.',
        'Добавляй event_id в уведомления и логи для трассировки.',
        'Даже mock-платежи повышают доверие клиента к твоей архитектуре.'
      ],
      bots: {
        why: 'Платежный сценарий и статусы заявок резко повышают «коммерческую взрослость» бота.',
        microExamples: [
          {
            title: 'Мини-пример 1: набор статусов',
            code: 'STATUSES = ["created", "pending", "paid", "failed"]',
            explain: 'Фиксированные статусы защищают от хаоса и неоднозначных состояний.'
          },
          {
            title: 'Мини-пример 2: смена статуса',
            code: 'if payment_ok:\n    update_status(order_id, "paid")\nelse:\n    update_status(order_id, "failed")',
            explain: 'Статус должен меняться только после явной проверки результата.'
          },
          {
            title: 'Мини-пример 3: уведомление пользователю',
            code: 'await message.answer(f"Статус оплаты: {status}")',
            explain: 'Пользователь всегда должен понимать текущее состояние процесса.'
          }
        ],
        bigSteps: [
          'Собери mock-flow: выбор тарифа -> подтверждение -> результат.',
          'Сохраняй статус платежа в БД/хранилище.',
          'Добавь повторную проверку статуса и понятные ответы пользователю.',
          'Протестируй ветки paid/failed и обработку ошибок.'
        ],
        implementationWalkthrough: [
          'Определи модель заказа: user_id, plan, amount, status, created_at.',
          'Сделай команды/кнопки для выбора тарифа и старта оплаты.',
          'Реализуй mock-проверку результата (успех/ошибка).',
          'После проверки обновляй статус и отправляй уведомление.',
          'Добавь админ-команду просмотра последних платежных событий.'
        ],
        fullCode: {
          title: 'Большой пример: mock payment flow со статусами',
          code: `from dataclasses import dataclass
from datetime import datetime


@dataclass
class Order:
    id: int
    user_id: int
    plan: str
    amount: int
    status: str
    created_at: str


ORDERS: dict[int, Order] = {}


def create_order(order_id: int, user_id: int, plan: str, amount: int) -> Order:
    order = Order(
        id=order_id,
        user_id=user_id,
        plan=plan,
        amount=amount,
        status="created",
        created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    )
    ORDERS[order_id] = order
    return order


def set_status(order_id: int, status: str) -> None:
    if order_id in ORDERS:
        ORDERS[order_id].status = status


def process_mock_payment(order_id: int, ok: bool) -> str:
    set_status(order_id, "pending")
    if ok:
        set_status(order_id, "paid")
    else:
        set_status(order_id, "failed")
    return ORDERS[order_id].status


order = create_order(order_id=1, user_id=123, plan="standard", amount=1990)
status = process_mock_payment(order_id=1, ok=True)
print(f"order={order.id} status={status}")`,
          explain: 'Код показывает прозрачный каркас платежного сценария: создание заказа, переходы статусов и итоговый результат.',
          breakdown: [
            'Order описывает минимальный контракт для платежной сущности.',
            'set_status централизует изменение состояния и упрощает контроль.',
            'process_mock_payment отражает базовую логику pending -> paid/failed.',
            'Такой каркас легко заменить на реальный платежный API.'
          ],
          lineByLine: [
            'dataclass уменьшает boilerplate в модели заказа.',
            'ORDERS как in-memory store подходит для учебного MVP.',
            'create_order сразу фиксирует created_at и начальный status.',
            'set_status изолирует изменение состояния в одной функции.',
            'pending ставится до результата — это важно для честной трассировки.',
            'print даёт простой smoke-check финального состояния.'
          ]
        },
        commonErrors: [
          'Статусы меняются хаотично без единого контракта.',
          'Нет уведомления пользователю о результате операции.',
          'Логика оплаты и UI перемешаны в одном обработчике.',
          'Не тестируются негативные сценарии (failed/timeout).'
        ],
        resultChecklist: [
          'Платежный flow проходит через ожидаемые статусы.',
          'Пользователь видит понятный финальный результат.',
          'Состояние заказа хранится и читается стабильно.',
          'Проверены ветки успеха и ошибки.'
        ],
        practice: [
          'Добавь 3 тарифа с разной стоимостью.',
          'Сделай команду /payment_status <id>.',
          'Добавь журнал событий по заказам.',
          'Оформи мини-кейс «бот с платежным flow».'
        ]
      },
      parsing: {
        why: 'Уведомления превращают парсер из «скрипта» в сервис, который доставляет ценность клиенту автоматически.',
        microExamples: [
          {
            title: 'Мини-пример 1: событие нового запуска',
            code: 'notify("Парсер стартовал: source=site_a")',
            explain: 'Короткие системные уведомления повышают прозрачность процесса.'
          },
          {
            title: 'Мини-пример 2: итоговый отчёт',
            code: 'notify(f"Готово: total={total}, new={new}, time={elapsed}s")',
            explain: 'Итоговое сообщение должно содержать ключевые метрики, а не «всё ок».'
          },
          {
            title: 'Мини-пример 3: retry отправки',
            code: 'for i in range(3):\n    try_send()\n    if ok: break',
            explain: 'Сеть нестабильна, поэтому уведомления лучше отправлять с повтором.'
          }
        ],
        bigSteps: [
          'Сделай единый notifier (email/Telegram).',
          'Отправляй start/end/error уведомления с метриками.',
          'Добавь retry при временной ошибке отправки.',
          'Собери шаблон отчёта для клиента.'
        ],
        implementationWalkthrough: [
          'Определи формат уведомления: source, total, valid, new, duration.',
          'Подключи notifier в конце каждого прогона парсера.',
          'Сделай try_send с ограниченным retry и логированием попыток.',
          'Раздели технические уведомления и клиентские отчёты.',
          'Проверь сценарии success/failure и сохрани логи доставки.'
        ],
        fullCode: {
          title: 'Большой пример: notifier с retry для парсинга',
          code: `import time


def send_message(text: str) -> None:
    # Заглушка: email/telegram API
    print(f"SEND: {text}")


def send_with_retry(text: str, retries: int = 3, delay: int = 2) -> bool:
    for attempt in range(1, retries + 1):
        try:
            send_message(text)
            return True
        except Exception as e:
            print(f"notify_error attempt={attempt} err={e}")
            if attempt == retries:
                return False
            time.sleep(delay)


def notify_run_result(source: str, total: int, new: int, elapsed: float):
    text = f"[{source}] total={total} new={new} time={elapsed}s"
    ok = send_with_retry(text)
    print(f"notify_status={'ok' if ok else 'failed'}")


notify_run_result(source="site_a", total=1200, new=47, elapsed=39.2)`,
          explain: 'Этот пример показывает базовый production-подход: уведомления отправляются стабильно и не теряются при временных сбоях.',
          breakdown: [
            'send_with_retry повышает вероятность доставки уведомления.',
            'notify_run_result формирует понятный формат для клиента.',
            'status отправки фиксируется отдельно для диагностики.',
            'Каркас можно подключить к email, Telegram, Slack.'
          ],
          lineByLine: [
            'send_message — единая точка интеграции с внешним каналом.',
            'В цикле retry попытки нумеруются для логов.',
            'На последней попытке функция возвращает False, а не молчит.',
            'Текст отчёта содержит ровно ключевые KPI без перегруза.',
            'notify_status сразу показывает успешность доставки.'
          ]
        },
        commonErrors: [
          'Уведомления отправляются без retry и часто теряются.',
          'Сообщения слишком длинные и клиент не читает их.',
          'Не отделены внутренние ошибки и клиентские сводки.',
          'Нет логов по доставке уведомлений.'
        ],
        resultChecklist: [
          'Уведомления приходят на старт/финиш/ошибку.',
          'Есть retry и диагностика неуспешной отправки.',
          'Клиент получает понятные метрики по прогону.',
          'Сервис не «молчит» при сбое.'
        ],
        practice: [
          'Добавь уведомление о резком росте новых объектов.',
          'Сделай отдельный формат «клиентский» и «технический».',
          'Проверь доставку при искусственном сбое канала.',
          'Добавь этот кейс в портфолио как «monitoring + alerts».'
        ]
      }
    },
    18: {
      title: 'Модуль 18 · День 18',
      subtitle: 'Мини-CRM и админ-дашборд: управляем процессом, а не хаосом',
      goal: 'Сегодня добавляешь управляемость: статусы лидов в боте и админ-контроль парсеров в одной панели.',
      dayPlan: [
        'Разогрев (15 мин): зафиксируй нужные статусы и правила перехода.',
        'БОТЫ (60–90 мин): мини-CRM со статусами new/in_work/done.',
        'ПАРСИНГ (60–90 мин): админ-дашборд по состоянию парсеров и статистике.',
        'Финал (20–30 мин): демо процесса «получили лид -> сменили статус -> отчет».'
      ],
      glossary: [
        { term: 'CRM status', explain: 'Текущее состояние лида в воронке работы.' },
        { term: 'State transition', explain: 'Правило, как лид может переходить из одного статуса в другой.' },
        { term: 'Dashboard KPI', explain: 'Ключевые метрики в панели контроля: total/new/errors/uptime.' },
        { term: 'Operational control', explain: 'Практика управления системой через понятные показатели и команды.' }
      ],
      deliverables: [
        'Команды для списка лидов и смены статуса.',
        'Панель мониторинга парсеров с ключевыми метриками.',
        'Проверенный сценарий статусных переходов без конфликтов.',
        'README-блок с workflow работы менеджера/админа.'
      ],
      bots: {
        why: 'Без статусов лиды «висят» в воздухе и теряются — CRM-логика делает процесс управляемым.',
        microExamples: [
          { title: 'Мини-пример 1: статус по умолчанию', code: 'lead.status = "new"', explain: 'Каждый новый лид должен иметь одинаковую стартовую точку.' },
          { title: 'Мини-пример 2: валидный переход', code: 'new -> in_work -> done', explain: 'Последовательность статусов защищает от хаотичных изменений.' },
          { title: 'Мини-пример 3: команда смены статуса', code: '/lead_set_status 15 in_work', explain: 'Админ должен управлять статусом через явную команду.' }
        ],
        bigSteps: [
          'Добавь поле status в модель лида.',
          'Сделай /lead_list с фильтрацией по статусу.',
          'Сделай /lead_set_status <id> <status> с валидацией.',
          'Добавь уведомление менеджеру о смене статуса.'
        ],
        implementationWalkthrough: [
          'Определи список допустимых статусов.',
          'Обнови хранилище/БД и миграцию под новое поле status.',
          'Сделай команды просмотра и изменения статуса.',
          'Добавь защиту от невалидных статусов и несуществующих id.',
          'Проверь полный сценарий на 3-5 тестовых лидах.'
        ],
        fullCode: {
          title: 'Большой пример: мини-CRM статусы лидов',
          code: `ALLOWED_STATUSES = {"new", "in_work", "done"}

LEADS = {
    1: {"name": "Nazar", "status": "new"},
    2: {"name": "Alex", "status": "in_work"},
}


def list_leads(status: str | None = None) -> list[tuple[int, dict]]:
    items = list(LEADS.items())
    if status:
        items = [x for x in items if x[1]["status"] == status]
    return items


def set_lead_status(lead_id: int, status: str) -> bool:
    if status not in ALLOWED_STATUSES:
        return False
    if lead_id not in LEADS:
        return False
    LEADS[lead_id]["status"] = status
    return True


print(list_leads("new"))
print(set_lead_status(1, "in_work"))
print(LEADS[1])`,
          explain: 'Каркас показывает основу CRM-подхода: фильтрация, валидация статусов и управляемые переходы.',
          breakdown: [
            'ALLOWED_STATUSES фиксирует допустимые значения.',
            'list_leads поддерживает фильтрацию для операционной работы.',
            'set_lead_status валидирует вход и защищает от мусорных данных.',
            'С таким ядром легко подключить Telegram-команды и БД.'
          ],
          lineByLine: [
            'Статусы вынесены в set для быстрой проверки membership.',
            'LEADS здесь учебный словарь, в проде это будет таблица.',
            'Если status не передан, list_leads возвращает все записи.',
            'Функция изменения статуса возвращает bool для прозрачного ответа UI.',
            'Финальные print — быстрый smoke-test логики.'
          ]
        },
        commonErrors: [
          'Разрешают любые статусы и теряют контроль процесса.',
          'Нет фильтрации списка лидов, менеджеру сложно работать.',
          'Команда смены статуса не валидирует lead_id.',
          'Статусы меняются без аудита и неясно, кто внёс изменения.'
        ],
        resultChecklist: [
          'Статусы лидов управляются централизованно.',
          'Есть команды просмотра и изменения статусов.',
          'Невалидные изменения корректно блокируются.',
          'Менеджер видит понятный рабочий процесс.'
        ],
        practice: [
          'Добавь статус canceled.',
          'Сделай фильтр /lead_list done.',
          'Запиши audit-log смены статусов.',
          'Сними демо «lead lifecycle» для портфолио.'
        ]
      },
      parsing: {
        why: 'Админ-панель по парсингу сокращает время реакции на проблемы и повышает надёжность сервиса.',
        microExamples: [
          { title: 'Мини-пример 1: сводка статуса', code: 'site_a: ok | new=32 | last_run=09:00', explain: 'Одна строка может дать всю картину по источнику.' },
          { title: 'Мини-пример 2: флаг ошибки', code: 'if errors > 0: status = "warning"', explain: 'Явный статус warning позволяет быстро заметить деградацию.' },
          { title: 'Мини-пример 3: ручной перезапуск', code: '/parser_restart site_a', explain: 'Операционный контроль нужен не только через cron, но и вручную.' }
        ],
        bigSteps: [
          'Собери таблицу статусов парсеров.',
          'Добавь агрегированные KPI по источникам.',
          'Сделай команду ручного перезапуска.',
          'Добавь alert при статусе warning/error.'
        ],
        implementationWalkthrough: [
          'Определи метрики панели: last_run, total, new, errors, status.',
          'Собирай метрики после каждого запуска источника.',
          'Сделай рендер отчёта по всем источникам в одном сообщении.',
          'Добавь команду restart для операционной реакции.',
          'Проверь, что warning/error поднимают уведомление администратору.'
        ],
        fullCode: {
          title: 'Большой пример: parser dashboard state',
          code: `PARSER_STATE = {
    "site_a": {"last_run": "09:00", "new": 32, "errors": 0, "status": "ok"},
    "site_b": {"last_run": "09:10", "new": 4, "errors": 1, "status": "warning"},
}


def build_dashboard_text(state: dict) -> str:
    lines = ["Parser dashboard:"]
    for name, s in state.items():
        lines.append(
            f"- {name}: status={s['status']} new={s['new']} errors={s['errors']} last_run={s['last_run']}"
        )
    return "\n".join(lines)


def restart_parser(name: str) -> bool:
    if name not in PARSER_STATE:
        return False
    PARSER_STATE[name]["status"] = "restarting"
    return True


print(build_dashboard_text(PARSER_STATE))
print(restart_parser("site_b"))`,
          explain: 'Код показывает минимальную управляемую панель: сводка по источникам и ручная операция restart.',
          breakdown: [
            'PARSER_STATE хранит компактный операционный срез по каждому источнику.',
            'build_dashboard_text превращает данные в читаемый формат для админа.',
            'restart_parser иллюстрирует ручной контроль через команду.',
            'Каркас легко подключается к реальным метрикам из pipeline.'
          ],
          lineByLine: [
            'status хранится явно для быстрого визуального контроля.',
            'Цикл по state собирает агрегированный отчет в единый блок.',
            'Проверка имени источника защищает от неверных команд.',
            'restarting — промежуточный статус при ручном вмешательстве.',
            'print даёт тестовый результат без UI-слоя.'
          ]
        },
        commonErrors: [
          'Нет единой панели, данные разбросаны по логам.',
          'Отсутствует ручной контроль при сбоях.',
          'Не настроены warning/error уведомления.',
          'Метрики собираются, но не используются в принятии решений.'
        ],
        resultChecklist: [
          'Есть сводка по каждому парсеру.',
          'Есть сигнал при предупреждениях и ошибках.',
          'Есть ручной restart для источника.',
          'Админ может оценить состояние системы за 30 секунд.'
        ],
        practice: [
          'Добавь поле duration по каждому источнику.',
          'Сделай отдельный список только warning/error.',
          'Добавь команду /parser_dashboard.',
          'Опиши runbook действий при status=warning.'
        ]
      }
    },
    19: {
      title: 'Модуль 19 · День 19',
      subtitle: 'Sales playbook: вопросы, ТЗ и работа с возражениями',
      goal: 'Сегодня строишь систему продаж: уточняющие вопросы, шаблон ТЗ и предсказуемая коммуникация с клиентом.',
      dayPlan: [
        'Разогрев (15 мин): разбор 3 последних диалогов, где «застрял» прогресс.',
        'БОТЫ (60–90 мин): формируем пакет вопросов и шаблон ТЗ под bot-задачи.',
        'ПАРСИНГ (60–90 мин): формируем пакет вопросов и шаблон ТЗ под parsing-задачи.',
        'Финал (20–30 мин): собираем playbook и тестируем его на 3 откликах.'
      ],
      glossary: [
        { term: 'Discovery questions', explain: 'Вопросы, которые уточняют задачу до старта разработки.' },
        { term: 'Scope', explain: 'Границы версии 1.0: что входит и что не входит.' },
        { term: 'Assumptions', explain: 'Предположения, которые нужно явно подтвердить с клиентом.' },
        { term: 'Objection handling', explain: 'Структурный ответ на сомнения клиента с доказательствами.' }
      ],
      deliverables: [
        'Список уточняющих вопросов по ботам и парсингу.',
        'Два шаблона ТЗ (bot/parsing).',
        'Матрица возражений и готовых ответов.',
        'Playbook-документ для повторяемых продаж.'
      ],
      bots: {
        why: 'Без точного ТЗ бот-проекты чаще выходят за рамки сроков и бюджета.',
        microExamples: [
          { title: 'Мини-пример 1: вопрос по версии 1.0', code: 'Какие 3 действия в боте критичны в первую очередь?', explain: 'Помогает быстро определить приоритеты и scope.' },
          { title: 'Мини-пример 2: вопрос по данным', code: 'Какие поля обязательны в заявке?', explain: 'Сразу снижает риск переделок в форме/БД.' },
          { title: 'Мини-пример 3: фиксация ограничений', code: 'В версии 1.0 не включаем интеграцию CRM.', explain: 'Ограничения нужно фиксировать письменно до старта.' }
        ],
        bigSteps: [
          'Собери 20 уточняющих вопросов для bot-задач.',
          'Подготовь шаблон ТЗ с блоками scope/срок/критерии готовности.',
          'Сделай 10 ответов на частые возражения.',
          'Проверь playbook на реальных откликах.'
        ],
        implementationWalkthrough: [
          'Раздели вопросы на блоки: цель, функции, данные, роли, дедлайны.',
          'Собери шаблон ТЗ, который заполняется за 10-15 минут.',
          'Добавь раздел «что не входит в v1.0».',
          'Подготовь короткие ответы на возражения по цене и срокам.',
          'После 3 диалогов обнови playbook по обратной связи.'
        ],
        fullCode: {
          title: 'Большой пример: шаблон ТЗ для бота',
          code: `BOT_BRIEF_TEMPLATE = {
    "goal": "Какую бизнес-проблему решаем",
    "v1_scope": ["/start", "форма заявки", "админ просмотр"],
    "out_of_scope": ["интеграция с CRM", "мультиязычность"],
    "data_fields": ["name", "phone", "comment"],
    "roles": ["user", "admin"],
    "deadline": "5 дней",
    "acceptance": [
        "пользователь проходит форму без ошибок",
        "заявка сохраняется в БД",
        "админ видит последние заявки",
    ],
}


def render_brief(brief: dict) -> str:
    return (
        f"Цель: {brief['goal']}\n"
        f"V1 scope: {', '.join(brief['v1_scope'])}\n"
        f"Не входит: {', '.join(brief['out_of_scope'])}\n"
        f"Поля: {', '.join(brief['data_fields'])}\n"
        f"Роли: {', '.join(brief['roles'])}\n"
        f"Дедлайн: {brief['deadline']}\n"
        f"Критерии: {'; '.join(brief['acceptance'])}"
    )


print(render_brief(BOT_BRIEF_TEMPLATE))`,
          explain: 'Шаблон ТЗ превращает переговоры в чёткий рабочий контракт и снижает риск «не так понял задачу».',
          breakdown: [
            'v1_scope и out_of_scope снимают риски бесконечных доработок.',
            'acceptance задаёт объективные критерии готовности.',
            'render_brief быстро превращает структуру в отправляемый документ.',
            'Один шаблон можно использовать на большинстве bot-задач.'
          ],
          lineByLine: [
            'goal фиксирует бизнес-ценность, а не только технический список.',
            'scope отделён от out_of_scope для прозрачных ожиданий.',
            'roles помогает определить доступы и сценарии.',
            'acceptance — обязательный блок для согласования результата.',
            'print даёт готовый текст для отправки клиенту.'
          ]
        },
        commonErrors: [
          'Начинают разработку без зафиксированного scope.',
          'Не обсуждают out_of_scope до старта.',
          'Нет критериев приемки — сложно закрывать этапы.',
          'Ответы на возражения импровизируются и плавают по качеству.'
        ],
        resultChecklist: [
          'Есть рабочий шаблон ТЗ для bot-проектов.',
          'Есть набор уточняющих вопросов перед стартом.',
          'Есть матрица возражений и готовых ответов.',
          'Диалоги с клиентами проходят быстрее и структурнее.'
        ],
        practice: [
          'Заполни ТЗ на 2 вымышленные задачи.',
          'Протестируй 5 вопросов на реальном отклике.',
          'Собери 10 ответов на возражения.',
          'Добавь playbook в рабочий Notion/README.'
        ]
      },
      parsing: {
        why: 'В парсинге точное ТЗ критично: от него зависят источник, объём и ценность данных.',
        microExamples: [
          { title: 'Мини-пример 1: вопрос по источнику', code: 'Какой сайт/раздел считаем приоритетным?', explain: 'Сразу сужает проект и убирает расплывчатость.' },
          { title: 'Мини-пример 2: вопрос по полям', code: 'Какие поля обязательны в выгрузке?', explain: 'Без этого выгрузка может оказаться бесполезной.' },
          { title: 'Мини-пример 3: вопрос по обновлению', code: 'Как часто нужно обновлять данные?', explain: 'Частота влияет на архитектуру и цену задачи.' }
        ],
        bigSteps: [
          'Собери 15 уточняющих вопросов для parsing-задач.',
          'Подготовь шаблон ТЗ с форматом данных и SLA.',
          'Собери типовые возражения и ответы с примерами кейсов.',
          'Внедри шаблон в 3 реальных отклика.'
        ],
        implementationWalkthrough: [
          'Раздели бриф на блоки: источник, поля, частота, формат выдачи, риски.',
          'Добавь раздел «ограничения и ответственность сторон».',
          'Подготовь short-version ТЗ для чата и full-version для документа.',
          'Свяжи ответы на возражения с твоими кейсами и метриками.',
          'После первых диалогов обнови вопросы, которые дали лучший результат.'
        ],
        fullCode: {
          title: 'Большой пример: parsing brief + objection matrix',
          code: `PARSING_BRIEF = {
    "source": "example.com/catalog",
    "required_fields": ["title", "price", "url"],
    "update_frequency": "2 раза в день",
    "output": "CSV + Google Sheets",
    "sla": "ошибки исправляются в течение 24 часов",
}

OBJECTION_MATRIX = {
    "дорого": "Мы даём регулярный поток данных и поддержку, а не разовый скрипт.",
    "а если сайт изменится": "Включаем адаптацию селекторов и мониторинг ошибок.",
    "нужно быстро": "MVP-выгрузка в течение 24-48 часов."
}


def render_parsing_brief(brief: dict) -> str:
    return (
        f"Источник: {brief['source']}\n"
        f"Поля: {', '.join(brief['required_fields'])}\n"
        f"Частота: {brief['update_frequency']}\n"
        f"Выдача: {brief['output']}\n"
        f"SLA: {brief['sla']}"
    )


print(render_parsing_brief(PARSING_BRIEF))
print(OBJECTION_MATRIX["дорого"])`,
          explain: 'Этот каркас помогает быстро согласовать задачу по парсингу и уверенно закрывать ключевые возражения.',
          breakdown: [
            'brief фиксирует обязательные параметры задачи.',
            'objection matrix экономит время на повторяющихся ответах.',
            'render_parsing_brief формирует готовый блок для клиента.',
            'Структура легко адаптируется под разные ниши.'
          ],
          lineByLine: [
            'source и required_fields задают основу технического задания.',
            'update_frequency влияет на нагрузку и стоимость.',
            'SLA заранее фиксирует ожидания по сопровождению.',
            'Матрица возражений делает ответы стабильными и предсказуемыми.',
            'print нужен для быстрой проверки формулировок перед отправкой.'
          ]
        },
        commonErrors: [
          'Не уточняют обязательные поля и отдают нерелевантную выгрузку.',
          'Частота обновления не согласована до старта.',
          'SLA не обсуждается, из-за чего возникают конфликты.',
          'Ответы на возражения не подкреплены кейсами.'
        ],
        resultChecklist: [
          'Есть шаблон ТЗ по парсингу и он используется в откликах.',
          'Есть список уточняющих вопросов перед стартом.',
          'Есть готовые ответы на частые возражения.',
          'Коммуникация с клиентом стала быстрее и точнее.'
        ],
        practice: [
          'Собери 3 short-brief для разных ниш.',
          'Протестируй 5 вопросов в откликах.',
          'Обнови матрицу возражений по реальным диалогам.',
          'Добавь блок ТЗ в портфолио-материалы.'
        ]
      }
    },
    20: {
      title: 'Модуль 20 · День 20',
      subtitle: 'Отклики на потоке: системный набор диалогов и заказов',
      goal: 'Цель дня — выйти на стабильный pipeline откликов: персонализация + релевантные кейсы + измеряемая конверсия.',
      dayPlan: [
        'Разогрев (15 мин): подготовь 3 шаблона отклика под разные типы задач.',
        'БОТЫ (60–90 мин): отправка серии персонализированных откликов с bot-кейсами.',
        'ПАРСИНГ (60–90 мин): отправка серии откликов с parsing-кейсами и KPI.',
        'Финал (20–30 мин): анализ конверсии и обновление шаблонов.'
      ],
      glossary: [
        { term: 'Outbound pipeline', explain: 'Системный процесс отправки откликов и ведения диалогов.' },
        { term: 'Personalization', explain: 'Адаптация отклика под конкретную задачу клиента.' },
        { term: 'Response rate', explain: 'Процент откликов, на которые клиент отвечает.' },
        { term: 'Follow-up', explain: 'Вежливое повторное сообщение, если клиент не ответил.' }
      ],
      deliverables: [
        'Серия откликов по ботам и парсингу в один день.',
        'Таблица воронки: отклик -> ответ -> созвон -> сделка.',
        'Обновлённые шаблоны на основе фактической реакции рынка.',
        'Чёткий план follow-up по неответившим клиентам.'
      ],
      bots: {
        why: 'Даже отличный кейс не продаётся сам — нужен объём и дисциплина коммуникации.',
        microExamples: [
          { title: 'Мини-пример 1: формула отклика', code: 'Задача клиента -> похожий кейс -> срок -> CTA', explain: 'Короткая формула держит баланс между конкретикой и скоростью.' },
          { title: 'Мини-пример 2: персональная строка', code: 'Увидел, что вам важна интеграция с CRM — это уже делал в похожем проекте.', explain: 'Одна персональная деталь заметно повышает шанс ответа.' },
          { title: 'Мини-пример 3: follow-up', code: 'Если актуально, могу показать демо и мини-план внедрения.', explain: 'Follow-up без давления часто возвращает «тихие» диалоги.' }
        ],
        bigSteps: [
          'Сформируй список релевантных bot-задач.',
          'Отправь серию персонализированных откликов с кейсами.',
          'Зафиксируй ответы и стадию каждого диалога.',
          'Сделай follow-up по неответившим через 24-48 часов.'
        ],
        implementationWalkthrough: [
          'Подготовь 2-3 шаблона отклика под разные bot-направления.',
          'Для каждого отклика укажи релевантный кейс и конкретный срок.',
          'Добавь CTA: демо/созвон/мини-план.',
          'Веди таблицу стадий диалога и обновляй её в реальном времени.',
          'В конце дня пересмотри формулировки с лучшей конверсией.'
        ],
        fullCode: {
          title: 'Большой пример: генератор отклика + трекер воронки',
          code: `def build_outreach(task: str, case_link: str, eta: str) -> str:
    return (
        f"Здравствуйте! Вижу задачу: {task}.\n"
        f"Похожий кейс: {case_link}.\n"
        f"Срок MVP: {eta}.\n"
        "Готов показать демо и предложить план на 3-5 дней."
    )


FUNNEL = []


def add_funnel_row(client: str, channel: str, status: str):
    FUNNEL.append({"client": client, "channel": channel, "status": status})


def stats(rows: list[dict]) -> dict:
    total = len(rows)
    replied = len([r for r in rows if r["status"] in {"reply", "call", "deal"}])
    calls = len([r for r in rows if r["status"] in {"call", "deal"}])
    deals = len([r for r in rows if r["status"] == "deal"])
    return {"total": total, "replied": replied, "calls": calls, "deals": deals}


text = build_outreach("бот для заявок и админ-панели", "https://example.com/case-bot", "4-6 дней")
print(text)

add_funnel_row("Client A", "kwork", "reply")
add_funnel_row("Client B", "telegram", "deal")
print(stats(FUNNEL))`,
          explain: 'Код превращает отклики в процесс с метриками: ты видишь не «ощущения», а реальную воронку.',
          breakdown: [
            'build_outreach ускоряет персонализированную отправку.',
            'FUNNEL хранит стадии и помогает управлять follow-up.',
            'stats показывает реальные показатели эффективности.',
            'На основе цифр проще улучшать тексты и стратегию.'
          ],
          lineByLine: [
            'task/case_link/eta — три ключа сильного отклика.',
            'FUNNEL можно вести в CSV/Sheets/Notion с тем же контрактом.',
            'Статусы reply/call/deal задают понятную воронку.',
            'Функция stats считает ключевые бизнес-метрики дня.',
            'print показывает quick-report по результатам отправки.'
          ]
        },
        commonErrors: [
          'Одинаковый текст для всех задач без персонализации.',
          'Нет учёта воронки, из-за чего сложно улучшать результат.',
          'Отсутствует follow-up по неответившим.',
          'Кейсы не прикладываются или не совпадают с задачей.'
        ],
        resultChecklist: [
          'Есть поток персонализированных откликов по ботам.',
          'Ведётся таблица стадий коммуникации.',
          'Есть follow-up стратегия.',
          'Появились новые диалоги/созвоны.'
        ],
        practice: [
          'Подготовь 3 варианта CTA и сравни конверсию.',
          'Сделай follow-up шаблон №1 и №2.',
          'Проверь response rate по каналам.',
          'Обнови шаблон отклика по итогам дня.'
        ]
      },
      parsing: {
        why: 'В парсинге отклик должен быстро показать бизнес-эффект данных, иначе диалог не начинается.',
        microExamples: [
          { title: 'Мини-пример 1: суть оффера', code: 'Соберу и обновлю цены 2 раза в день, выгрузка в CSV + Sheets.', explain: 'Клиенту важно сразу понять формат и регулярность результата.' },
          { title: 'Мини-пример 2: KPI в отклике', code: 'Пример: total=1800, valid=1650, new=74', explain: 'Цифры из кейса увеличивают доверие и вероятность ответа.' },
          { title: 'Мини-пример 3: следующий шаг', code: 'Могу сегодня показать демо на вашем источнике.', explain: 'Призыв к действию ускоряет переход от переписки к созвону.' }
        ],
        bigSteps: [
          'Собери релевантные parsing-задачи и офферы под них.',
          'Отправь серию персонализированных откликов с кейс-метриками.',
          'Веди таблицу ответов и стадий воронки.',
          'Сделай follow-up с новым углом выгоды.'
        ],
        implementationWalkthrough: [
          'Сформируй 2-3 шаблона оффера под разные типы parsing-задач.',
          'В каждом отклике указывай формат выдачи и частоту обновления.',
          'Добавляй минимум 1 KPI из похожего кейса.',
          'Веди таблицу каналов и response rate.',
          'По итогам дня отредактируй шаблоны на основе цифр.'
        ],
        fullCode: {
          title: 'Большой пример: parsing outreach helper + KPI report',
          code: `def build_parsing_outreach(task: str, output: str, frequency: str, kpi: str) -> str:
    return (
        f"Здравствуйте! По задаче: {task}.\n"
        f"Результат: {output}, обновление: {frequency}.\n"
        f"Похожий KPI из кейса: {kpi}.\n"
        "Могу показать демо-проход и согласовать план запуска сегодня."
    )


def conversion_report(rows: list[dict]) -> str:
    total = len(rows)
    replied = len([r for r in rows if r["status"] in {"reply", "call", "deal"}])
    deals = len([r for r in rows if r["status"] == "deal"])
    rr = round((replied / total) * 100, 2) if total else 0
    dr = round((deals / total) * 100, 2) if total else 0
    return f"total={total} reply_rate={rr}% deal_rate={dr}%"


rows = [
    {"status": "reply"},
    {"status": "deal"},
    {"status": "no_reply"},
]

print(build_parsing_outreach(
    task="мониторинг цен конкурентов",
    output="CSV + Google Sheets",
    frequency="2 раза в день",
    kpi="total=1800, valid=1650, new=74"
))
print(conversion_report(rows))`,
          explain: 'Шаблон помогает быстро делать сильные parsing-отклики и сразу считать конверсию по результатам.',
          breakdown: [
            'build_parsing_outreach сохраняет структуру сильного сообщения.',
            'conversion_report даёт измеримый итог по воронке.',
            'reply_rate/deal_rate помогают сравнивать формулировки.',
            'Процесс становится управляемым и повторяемым.'
          ],
          lineByLine: [
            'task/output/frequency/kpi покрывают главные вопросы клиента.',
            'Ставка на KPI из кейса повышает доверие к компетенции.',
            'conversion_report считает ключевые проценты, а не только абсолютные числа.',
            'Защитная проверка total предотвращает деление на ноль.',
            'Финальный print — ежедневный отчёт для улучшения стратегии.'
          ]
        },
        commonErrors: [
          'Оффер без KPI и без конкретного формата результата.',
          'Не считают конверсию по каналам и шаблонам.',
          'Нет follow-up и теряются тёплые лиды.',
          'Слишком длинные сообщения без фокуса на выгоде.'
        ],
        resultChecklist: [
          'Серия parsing-откликов отправлена системно.',
          'Есть учёт response/deal rates.',
          'Шаблоны обновлены по фактической обратной связи.',
          'Есть план follow-up на завтра.'
        ],
        practice: [
          'Сделай сравнение 2 шаблонов отклика по конверсии.',
          'Введи отдельный KPI по каналу (биржа/телеграм/личка).',
          'Подготовь follow-up на 24 и 48 часов.',
          'Добавь лучший шаблон в playbook.'
        ]
      }
    },
    21: {
      title: 'Модуль 21 · День 21',
      subtitle: 'Шаблоны доставки: очередь задач, воркеры и надёжный pipeline',
      goal: 'Переход от «всё в одном хендлере» к продовой схеме: задачи ставятся в очередь, воркеры обрабатывают их стабильно и прозрачно.',
      dayPlan: [
        'Разогрев (15 мин): выпиши 3 операции, которые сейчас делают проект нестабильным при нагрузке.',
        'БОТЫ (60–90 мин): выделяем очередь задач и worker-паттерн для тяжёлых операций.',
        'ПАРСИНГ (60–90 мин): строим batch-runner с retry и единым статусом задач.',
        'Финал (20–30 мин): фиксируем runbook «как восстановиться после падения воркера».',
        'Ретро (10 мин): сравни время отклика UI до/после выноса тяжёлой логики в очередь.'
      ],
      glossary: [
        { term: 'Queue', explain: 'Очередь задач, где запросы аккуратно ждут обработку.' },
        { term: 'Worker', explain: 'Фоновый исполнитель, который обрабатывает задачи из очереди.' },
        { term: 'Idempotent task', explain: 'Повторный запуск задачи не ломает состояние и не плодит дубли.' },
        { term: 'Dead-letter', explain: 'Хранилище задач, которые не прошли после всех retry.' }
      ],
      deliverables: [
        'Бот-процессы разделены на быстрый UI-ответ и фоновую обработку.',
        'Парсинг запускается через очередь batch-задач с retry.',
        'Есть единые статусы задач: queued/running/done/failed.',
        'Оформлен troubleshooting-блок по воркерам.',
        'Есть команда/функция повтора failed-задач.',
        'Есть метрика времени ожидания задачи в очереди.'
      ],
      bonusTips: [
        'Не отдавай тяжёлую работу в хендлер Telegram-команды — это путь к таймаутам.',
        'Каждой задаче присваивай task_id и логируй его на всех этапах.',
        'Держи отдельный список failed-задач для повторного запуска.',
        'Сначала надёжность, потом «магические оптимизации». '
      ],
      bots: {
        why: 'Очередь и worker делают бота предсказуемым под нагрузкой и повышают доверие клиента.',
        microExamples: [
          {
            title: 'Мини-пример 1: постановка задачи',
            code: 'task_id = queue_push({"type": "export", "user_id": uid})',
            explain: 'Команда быстро отвечает пользователю, а тяжёлая логика уходит в фон.'
          },
          {
            title: 'Мини-пример 2: статусы задачи',
            code: 'queued -> running -> done | failed',
            explain: 'Явные статусы дают прозрачность для админа и пользователя.'
          },
          {
            title: 'Мини-пример 3: повтор задачи',
            code: 'if task.status == "failed": requeue(task)',
            explain: 'Повтор после исправления причины экономит время и уменьшает ручную рутину.'
          }
        ],
        bigSteps: [
          'Вынеси тяжёлые операции (экспорт/массовые обновления) в очередь.',
          'Сделай worker-цикл с обработкой статусов и retry.',
          'Добавь команду /task_status <id>.',
          'Сделай журнал failed-задач и ручной requeue.',
          'Добавь блокировку повторного выполнения одной и той же задачи (idempotency key).',
          'Собери короткий ops-отчёт: queued/running/done/failed + avg wait time.'
        ],
        implementationWalkthrough: [
          'Определи модель задачи: id, type, payload, status, attempts, error.',
          'В хендлере команды только создавай задачу и возвращай task_id.',
          'Worker выбирает queued-задачу, ставит running, запускает обработчик.',
          'При успехе ставь done, при ошибке — retry или failed.',
          'Добавь команду просмотра статуса и последней ошибки.',
          'Введи idempotency_key, чтобы повторный submit не создавал дубль задачи.',
          'Добавь limit по попыткам и backoff между retry.',
          'Сохраняй created_at/started_at/finished_at для расчёта latency.'
        ],
        fullCode: {
          title: 'Большой пример: очередь задач с idempotency и retry/backoff',
          code: `from dataclasses import dataclass
    from datetime import datetime
    from typing import Any
    import time


    @dataclass
    class Task:
      id: int
      type: str
      payload: dict[str, Any]
      idempotency_key: str
      status: str = "queued"
      attempts: int = 0
      max_attempts: int = 3
      error: str = ""
      created_at: str = ""
      started_at: str = ""
      finished_at: str = ""


    TASKS: dict[int, Task] = {}
    BY_IDEMPOTENCY: dict[str, int] = {}


    def now_str() -> str:
      return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


    def queue_push(task_id: int, task_type: str, payload: dict[str, Any], idempotency_key: str) -> Task:
      if idempotency_key in BY_IDEMPOTENCY:
        return TASKS[BY_IDEMPOTENCY[idempotency_key]]

      task = Task(
        id=task_id,
        type=task_type,
        payload=payload,
        idempotency_key=idempotency_key,
        created_at=now_str(),
      )
      TASKS[task_id] = task
      BY_IDEMPOTENCY[idempotency_key] = task_id
      return task


    def execute_business_logic(task: Task) -> None:
      if task.type == "export" and not task.payload.get("user_id"):
        raise ValueError("missing_user_id")
      # Заглушка длительной операции
      time.sleep(0.1)


    def run_task(task: Task) -> None:
      task.status = "running"
      task.started_at = now_str()
      task.attempts += 1

      try:
        execute_business_logic(task)
        task.status = "done"
        task.error = ""
      except Exception as e:
        task.error = str(e)
        if task.attempts < task.max_attempts:
          backoff = task.attempts * 0.2
          time.sleep(backoff)
          task.status = "queued"
        else:
          task.status = "failed"
      finally:
        task.finished_at = now_str()


    def worker_once() -> None:
      queued = sorted(
        [t for t in TASKS.values() if t.status == "queued"],
        key=lambda t: t.id
      )
      if not queued:
        return
      run_task(queued[0])


    def task_status(task_id: int) -> dict[str, Any]:
      t = TASKS[task_id]
      return {
        "id": t.id,
        "status": t.status,
        "attempts": t.attempts,
        "error": t.error,
        "created_at": t.created_at,
        "started_at": t.started_at,
        "finished_at": t.finished_at,
      }


    queue_push(1, "export", {"user_id": 123}, idempotency_key="export-123-1")
    queue_push(2, "export", {"user_id": 0}, idempotency_key="export-0-1")
    worker_once()
    worker_once()
    worker_once()
    print(task_status(1))
    print(task_status(2))`,
          explain: 'Этот вариант ближе к прод-шаблону: защита от дублей, retry/backoff, метки времени и читаемый статус задачи.',
          breakdown: [
          'Task расширен до операционного контракта: lifecycle timestamps, attempts, max_attempts.',
          'queue_push проверяет idempotency и не создаёт дубли одной бизнес-операции.',
          'run_task централизует happy-path, retry-ветку и final failed-статус.',
          'task_status формирует API-ответ для команды /task_status.'
          ],
          lineByLine: [
          'idempotency_key связывает повторные запросы с одной задачей.',
          'BY_IDEMPOTENCY хранит быстрый индекс и предотвращает дубль-submit.',
          'created_at/started_at/finished_at позволяют считать latency и SLA.',
          'execute_business_logic отделён от orchestration и легко тестируется отдельно.',
          'при ошибке используется ограниченный retry и backoff.',
          'после исчерпания попыток задача явно переходит в failed.',
          'worker_once выбирает задачи предсказуемо (по id), без хаоса.',
          'task_status возвращает минимальный, но полезный diagnostics-срез.'
          ]
        },
        commonErrors: [
          'Тяжёлые операции выполняют прямо в хендлере и ловят таймауты.',
          'Нет единой модели статусов задач.',
          'Ошибки задач не сохраняются и их нельзя отладить.',
          'Retry делают вручную и хаотично.'
        ],
        resultChecklist: [
          'Команда ставит задачу в очередь и быстро отвечает пользователю.',
          'Worker обрабатывает задачи по единому контракту.',
          'Статусы и ошибки задач доступны для просмотра.',
          'Есть путь повторного запуска failed-задачи.'
        ],
        practice: [
          'Добавь второй тип задачи (например, report).',
          'Сделай /task_status <id> в боте.',
          'Реализуй requeue для failed-задач.',
          'Оформи mini-case про очередь задач.'
        ]
      },
      parsing: {
        why: 'Batch-очередь для парсинга позволяет контролировать загрузку и устойчиво обрабатывать несколько источников.',
        microExamples: [
          {
            title: 'Мини-пример 1: batch-задача',
            code: 'enqueue({"source": "site_a", "job": "daily_sync"})',
            explain: 'Каждый источник запускается как отдельная отслеживаемая задача.'
          },
          {
            title: 'Мини-пример 2: retry с лимитом',
            code: 'if attempts < 3: status = "queued" else: status = "failed"',
            explain: 'Лимит retries предотвращает бесконечные циклы при фатале.'
          },
          {
            title: 'Мини-пример 3: dead-letter список',
            code: 'if status == "failed": dead_letter.append(task_id)',
            explain: 'Список проблемных задач упрощает операционную диагностику.'
          }
        ],
        bigSteps: [
          'Собери очередь задач по источникам.',
          'Добавь retry с лимитом попыток.',
          'Веди отчёт по статусам queued/running/done/failed.',
          'Добавь dead-letter для задач, не прошедших все попытки.',
          'Сделай приоритизацию задач (critical > normal).',
          'Добавь команду/функцию повторного запуска dead-letter задач.'
        ],
        implementationWalkthrough: [
          'Сформируй job-модель с source, attempt, status и error.',
          'Runner берёт задачу и запускает parse-flow.',
          'При временной ошибке возвращай задачу в очередь.',
          'После max_attempts помечай failed и отправляй в dead-letter.',
          'Собирай daily-report по состоянию очереди.',
          'Раздели ошибки на retriable/non-retriable (timeout vs schema fatal).',
          'Добавь поле priority и сортировку задач перед обработкой.',
          'Фиксируй длительность выполнения каждой job для SLA-контроля.'
        ],
        fullCode: {
          title: 'Большой пример: приоритетная batch-очередь с dead-letter retry',
          code: `import time

    JOBS = [
      {"id": 1, "source": "site_a", "status": "queued", "attempts": 0, "error": "", "priority": 1},
      {"id": 2, "source": "site_b", "status": "queued", "attempts": 0, "error": "", "priority": 2},
      {"id": 3, "source": "site_c", "status": "queued", "attempts": 0, "error": "", "priority": 1},
    ]
    DEAD_LETTER = []


    def run_parse(source: str) -> tuple[bool, str]:
      if source == "site_b":
        return False, "timeout"
      if source == "site_c":
        return False, "schema_fatal"
      return True, ""


    def is_retriable(error_code: str) -> bool:
      return error_code in {"timeout", "network"}


    def run_jobs_once(max_attempts: int = 3):
      queued = sorted(
        [j for j in JOBS if j["status"] == "queued"],
        key=lambda j: (j["priority"], j["id"])
      )

      for job in queued:
        job["status"] = "running"
        job["attempts"] += 1
        started = time.time()

        ok, error_code = run_parse(job["source"])
        duration = round(time.time() - started, 3)

        if ok:
          job["status"] = "done"
          job["error"] = ""
          job["duration"] = duration
          continue

        job["error"] = error_code
        job["duration"] = duration

        if is_retriable(error_code) and job["attempts"] < max_attempts:
          job["status"] = "queued"
          continue

        job["status"] = "failed"
        DEAD_LETTER.append({"id": job["id"], "source": job["source"], "error": error_code})


    def requeue_dead_letter(job_id: int) -> bool:
      for dead in DEAD_LETTER:
        if dead["id"] == job_id:
          for job in JOBS:
            if job["id"] == job_id:
              job["status"] = "queued"
              job["error"] = ""
              return True
      return False


    run_jobs_once()
    run_jobs_once()
    print(JOBS)
    print(DEAD_LETTER)
    print(requeue_dead_letter(3))`,
          explain: 'Это уже операционный шаблон: приоритеты, классификация ошибок, dead-letter и ручной recovery.',
          breakdown: [
          'priority позволяет сначала обрабатывать самые важные источники.',
          'is_retriable разделяет временные и фатальные ошибки.',
          'run_jobs_once считает duration и пишет диагностический контекст.',
          'requeue_dead_letter создаёт путь ручного восстановления после фикса.'
          ],
          lineByLine: [
          'queued сортируется по priority и id — поведение предсказуемо.',
          'run_parse возвращает error_code, а не просто True/False.',
          'duration помогает отслеживать деградацию скорости по источникам.',
          'retriable ошибка идёт в повтор, а schema_fatal сразу в failed.',
          'dead-letter хранит минимальный контекст для разборов.',
          'requeue_dead_letter пригодится после фикса селекторов/сети.',
          'двойной run_jobs_once показывает динамику retry-сценариев.'
          ]
        },
        commonErrors: [
          'Нет лимита retry, и очередь залипает на одной проблемной задаче.',
          'Failed-задачи нигде не учитываются.',
          'Статусы задач меняются без явных правил.',
          'Нет ежедневного отчёта по очереди.'
        ],
        resultChecklist: [
          'Очередь парсинга работает через единый runner.',
          'Retry ограничен и контролируем.',
          'Есть dead-letter список проблемных задач.',
          'Состояние задач видно в понятном отчёте.'
        ],
        practice: [
          'Добавь третий источник в очередь.',
          'Сымитируй временный и фатальный сбой.',
          'Собери daily-report queued/done/failed.',
          'Оформи runbook по восстановлению batch-runner.'
        ]
      }
    },
    22: {
      title: 'Модуль 22 · День 22',
      subtitle: 'Контракты данных и валидация: стабильность без сюрпризов',
      goal: 'Формализуем вход/выход сервисов: строгие контракты данных и проверки на границе системы.',
      dayPlan: [
        'Разогрев (15 мин): выпиши 5 полей, которые чаще всего ломают твои сценарии.',
        'БОТЫ (60–90 мин): вводим DTO/схемы для заявок и команд админа.',
        'ПАРСИНГ (60–90 мин): вводим schema-check перед экспортом.',
        'Финал (20–30 мин): обновляем шаблоны с обязательной валидацией.',
        'Ретро (10 мин): зафиксируй 3 типа ошибок, которые теперь ловятся на входе.'
      ],
      glossary: [
        { term: 'Data contract', explain: 'Фиксированная структура данных между частями системы.' },
        { term: 'DTO', explain: 'Объект переноса данных с явными полями и типами.' },
        { term: 'Validation boundary', explain: 'Место, где входящие данные проверяются до бизнес-логики.' },
        { term: 'Schema drift', explain: 'Незаметное изменение структуры данных, ломающее интеграции.' }
      ],
      deliverables: [
        'Бот использует валидируемые DTO для ключевых команд.',
        'Парсер проверяет структуру rows до выгрузки.',
        'Ошибки валидации логируются в понятном формате.',
        'Шаблоны обновлены разделом «контракты данных».',
        'Добавлен quarantine-поток для невалидных записей.',
        'Собран мини-отчёт по validation coverage.'
      ],
      bonusTips: [
        'Разделяй user-facing ошибки и внутренние коды причин.',
        'Сначала валидируй, потом записывай в БД/файлы — это дешевле в поддержке.',
        'Сохраняй статистику top-ошибок валидации: так видно, что ломает поток чаще всего.',
        'Если используешь regex-проверки, добавляй понятный fallback-текст для пользователя.'
      ],
      bots: {
        why: 'Контракты данных уменьшают баги от «грязного» ввода и ускоряют диагностику.',
        microExamples: [
          {
            title: 'Мини-пример 1: DTO заявки',
            code: 'LeadDTO(name: str, phone: str, comment: str)',
            explain: 'Явная схема лучше «словаря с непонятными ключами». '
          },
          {
            title: 'Мини-пример 2: проверка номера',
            code: 'if not phone.startswith("+"): raise ValueError("phone format")',
            explain: 'Валидация на входе дешевле, чем исправления в конце pipeline.'
          },
          {
            title: 'Мини-пример 3: единый error-format',
            code: '{"error": "validation_failed", "field": "phone"}',
            explain: 'Стандартизированный ответ ускоряет отладку и поддержку.'
          }
        ],
        bigSteps: [
          'Определи DTO для 2-3 ключевых сущностей.',
          'Поставь validation boundary перед сервисным слоем.',
          'Сделай единый формат ошибок валидации.',
          'Добавь тесты на невалидные сценарии.',
          'Собери таблицу "ошибка -> поле -> как исправить" для команды.',
          'Добавь summary по частоте validation failures.'
        ],
        implementationWalkthrough: [
          'Сформируй dataclass/Pydantic-модель для Lead и AdminCommand.',
          'В хендлере валидируй вход и только потом вызывай сервис.',
          'Невалидные данные возвращай в стандартном формате ошибки.',
          'Логируй field + reason без утечки чувствительных данных.',
          'Покрой минимум 3 негативных кейса тестами.',
          'Добавь mapping error_code -> user_message для дружелюбных ответов.',
          'Собери ежедневную статистику по validation failures.'
        ],
        fullCode: {
            title: 'Большой пример: DTO + валидатор + нормализация + error mapping',
          code: `from dataclasses import dataclass
      import re


      ERROR_MAP = {
        "name_too_short": "Имя слишком короткое. Минимум 2 символа.",
        "phone_format_invalid": "Телефон должен начинаться с + и содержать 10-15 цифр.",
        "comment_too_long": "Комментарий слишком длинный (максимум 300 символов).",
      }


@dataclass
class LeadDTO:
    name: str
    phone: str
    comment: str


def validate_lead(data: dict) -> LeadDTO:
    name = str(data.get("name", "")).strip()
    phone = str(data.get("phone", "")).strip()
    comment = str(data.get("comment", "")).strip()

    if len(name) < 2:
        raise ValueError("name_too_short")
    phone_digits = re.sub(r"\D", "", phone)
    if not phone.startswith("+") or not (10 <= len(phone_digits) <= 15):
        raise ValueError("phone_format_invalid")
    if len(comment) > 300:
      raise ValueError("comment_too_long")

    normalized_phone = "+" + phone_digits
    return LeadDTO(name=name, phone=normalized_phone, comment=comment)


  def to_user_error(reason: str) -> str:
    return ERROR_MAP.get(reason, "Некорректные данные. Проверьте форму.")


def handle_lead_input(raw: dict) -> dict:
    try:
        lead = validate_lead(raw)
        return {"ok": True, "lead": lead}
    except ValueError as e:
      reason = str(e)
      return {
        "ok": False,
        "error": "validation_failed",
        "reason": reason,
        "user_message": to_user_error(reason),
      }


print(handle_lead_input({"name": "Nazar", "phone": "+79990000000", "comment": "test"}))
print(handle_lead_input({"name": "A", "phone": "7999", "comment": "bad"}))`,
        explain: 'Теперь это полноценный validation-template: нормализация, коды ошибок и user-friendly сообщения.',
          breakdown: [
            'LeadDTO фиксирует типы и обязательные поля.',
            'validate_lead концентрирует правила проверки в одном месте.',
        'to_user_error отделяет техкоды от текста для пользователя.',
        'handle_lead_input возвращает единый контракт для UI/API/логов.'
          ],
          lineByLine: [
        'ERROR_MAP задаёт стабильный словарь сообщений для фронта/бота.',
        'regex-нормализация убирает пробелы, скобки и дефисы в телефоне.',
        'проверка длины phone_digits исключает слишком короткие/длинные номера.',
        'comment_too_long предотвращает переполнение карточек и логов.',
        'normalized_phone гарантирует единый формат хранения.',
        'to_user_error предотвращает утечку внутренних деталей в UI.',
        'возвращаемый словарь пригоден для централизованного логирования и аналитики.',
        'два print дают быстрый smoke-check на валидный и невалидный путь.'
          ]
        },
        commonErrors: [
          'Валидация размазана по хендлерам и дублируется.',
          'Ошибки проверок возвращаются в разных форматах.',
          'Проверки делаются слишком поздно (после записи в БД).',
          'Логи содержат лишние персональные данные.'
        ],
        resultChecklist: [
          'DTO-контракты введены для критичных сущностей.',
          'Вход валидируется до вызова сервисов.',
          'Ошибки валидации стандартизированы.',
          'Негативные сценарии покрыты тестами.'
        ],
        practice: [
          'Добавь DTO для admin-команды.',
          'Сделай 3 unit-теста на validation ошибки.',
          'Введи единый mapping error code -> текст.',
          'Обнови README разделом «Data contracts». '
        ]
      },
      parsing: {
        why: 'Schema-check перед экспортом защищает клиентов от «битых» выгрузок и снижает число возвратов.',
        microExamples: [
          {
            title: 'Мини-пример 1: обязательные поля',
            code: 'required = {"title", "price", "url"}',
            explain: 'Явный required-набор не даёт случайно сломать контракт выгрузки.'
          },
          {
            title: 'Мини-пример 2: schema validator',
            code: 'missing = required - row.keys()',
            explain: 'Проверка пропущенных полей позволяет рано выявлять деградацию.'
          },
          {
            title: 'Мини-пример 3: quarantine row',
            code: 'if invalid: quarantine.append(row)',
            explain: 'Невалидные строки лучше изолировать, чем смешивать с результатом.'
          }
        ],
        bigSteps: [
          'Определи контракт выходной строки (row schema).',
          'Добавь validate_row перед экспортом.',
          'Введи quarantine для невалидных строк.',
          'Сделай quality-report valid/invalid ratio.'
        ],
        implementationWalkthrough: [
          'Согласуй обязательные поля и их типы.',
          'Валидация запускается сразу после parse_rows.',
          'Невалидные строки отправляй в отдельный quarantine файл.',
          'Экспортируй только valid rows.',
          'В отчёте показывай total/valid/invalid/quality.'
        ],
        fullCode: {
          title: 'Большой пример: schema-check + type-check + quarantine отчёт',
          code: `import json

REQUIRED_FIELDS = {"title", "price", "url"}


def validate_row(row: dict) -> tuple[bool, str]:
    missing = [f for f in REQUIRED_FIELDS if not row.get(f)]
    if missing:
        return False, f"missing:{','.join(missing)}"

    try:
      float(str(row.get("price", "")).replace(",", "."))
    except Exception:
      return False, "price_invalid"

    return True, ""


def split_valid_invalid(rows: list[dict]) -> tuple[list[dict], list[dict]]:
    valid, invalid = [], []
    for row in rows:
        ok, reason = validate_row(row)
        if ok:
            valid.append(row)
        else:
            invalid.append({"row": row, "reason": reason})
    return valid, invalid


  def build_quality_report(total: int, valid: int, invalid: int) -> dict:
    ratio = round((valid / total) * 100, 2) if total else 0
    return {
      "total": total,
      "valid": valid,
      "invalid": invalid,
      "quality_ratio": ratio,
    }


rows = [
    {"title": "A", "price": "100", "url": "https://x"},
    {"title": "B", "price": "", "url": "https://y"},
]

valid_rows, invalid_rows = split_valid_invalid(rows)
report = build_quality_report(total=len(rows), valid=len(valid_rows), invalid=len(invalid_rows))
print(report)
print(json.dumps(invalid_rows, ensure_ascii=False, indent=2))`,
          explain: 'Расширенный пример не только валидирует схему, но и проверяет типы и считает quality KPI.',
          breakdown: [
            'REQUIRED_FIELDS задаёт неизменяемую основу контракта.',
            'validate_row возвращает и факт ошибки, и её причину.',
            'split_valid_invalid разделяет боевой экспорт и карантин.',
            'build_quality_report даёт KPI для ежедневного контроля качества.'
          ],
          lineByLine: [
            'missing собирает отсутствующие обязательные поля.',
            'price_invalid отделяет schema-проблему от проблемы типа данных.',
            'invalid хранит исходную строку и причину — удобно для пост-анализа.',
            'quality_ratio показывает тренд качества от прогона к прогону.',
            'report можно отправлять в dashboard/уведомления.',
            'json.dumps с indent помогает быстро читать карантин-отчёт.'
          ]
        },
        commonErrors: [
          'Контракт нефиксирован, и колонки выгрузки «плавают».',
          'Невалидные строки попадают в клиентскую выдачу.',
          'Нет quarantine, из-за чего сложно разбирать ошибки качества.',
          'Не измеряется valid/invalid ratio.'
        ],
        resultChecklist: [
          'Схема rows формализована и проверяется.',
          'Невалидные строки изолируются в quarantine.',
          'Клиентская выгрузка содержит только валидные записи.',
          'Есть quality-report по каждому прогону.'
        ],
        practice: [
          'Добавь проверку типа для price.',
          'Сохрани quarantine в отдельный файл.',
          'Сделай daily-метрику quality_ratio.',
          'Добавь quality-график в отчёт.'
        ]
      }
    },
    23: {
      title: 'Модуль 23 · День 23',
      subtitle: 'Шаблон мониторинга: метрики, алерты и операционный контроль',
      goal: 'Делаем единый operational-template для ботов и парсеров: метрики, тревоги и быстрый triage инцидентов.',
      dayPlan: [
        'Разогрев (15 мин): выбери 4 метрики, которые реально влияют на деньги/качество.',
        'БОТЫ (60–90 мин): добавляем метрики по командам и ошибкам.',
        'ПАРСИНГ (60–90 мин): добавляем health-метрики pipeline и алерты.',
        'Финал (20–30 мин): оформляем единый runbook «обнаружить -> проверить -> исправить». '
      ],
      glossary: [
        { term: 'Operational metric', explain: 'Показатель, по которому видно здоровье сервиса.' },
        { term: 'Alert threshold', explain: 'Порог, после которого отправляется тревога.' },
        { term: 'Triage', explain: 'Быстрая первичная классификация инцидента.' },
        { term: 'MTTR', explain: 'Среднее время восстановления после сбоя.' }
      ],
      deliverables: [
        'Шаблон метрик для бота и парсинга.',
        'Алерты на критичные и деградационные сценарии.',
        'Runbook triage с шагами диагностики.',
        'Базовый weekly-report по стабильности.'
      ],
      bonusTips: [
        'Сначала вводи 4-6 ключевых метрик, не пытайся сразу мониторить всё.',
        'Разделяй warning и critical, чтобы алерты не превращались в шум.',
        'Для каждого алерта заранее зафиксируй «первое действие» в runbook.',
        'Сохраняй daily snapshots, иначе невозможно анализировать тренды.'
      ],
      bots: {
        why: 'Без метрик бот может «жить плохо», а ты узнаешь об этом слишком поздно.',
        microExamples: [
          {
            title: 'Мини-пример 1: счётчик команд',
            code: 'metrics["cmd_start"] += 1',
            explain: 'Количество вызовов помогает увидеть реальную активность пользователей.'
          },
          {
            title: 'Мини-пример 2: счётчик ошибок',
            code: 'metrics["errors"] += 1',
            explain: 'Рост ошибок без роста трафика — признак деградации.'
          },
          {
            title: 'Мини-пример 3: alert при пороге',
            code: 'if metrics["errors"] > 5: notify_admin("error spike")',
            explain: 'Пороговые алерты помогают реагировать до серьёзного ущерба.'
          }
        ],
        bigSteps: [
          'Введи набор базовых метрик в шаблон бота.',
          'Логируй метрики по интервалу (час/день).',
          'Добавь алерт на spikes ошибок.',
          'Сделай простую команду /ops_stats для админа.',
          'Добавь уровни alert severity: warning/critical.',
          'Собери daily snapshot для сравнений по дням.'
        ],
        implementationWalkthrough: [
          'Определи словарь метрик: commands, errors, denied_access, avg_latency.',
          'Обновляй метрики на входе и выходе ключевых команд.',
          'Добавь check_thresholds после инцидентов.',
          'Введи админ-вывод текущей статистики.',
          'Раз в день сохраняй snapshot метрик в файл.'
        ],
        fullCode: {
          title: 'Большой пример: operational metrics с severity и snapshot',
          code: `import json
    from datetime import datetime

    METRICS = {
      "commands": 0,
      "errors": 0,
      "denied_access": 0,
      "avg_response_time_ms": 0,
    }

    SNAPSHOTS = []


    def notify_admin(text: str, severity: str = "warning"):
      print(f"ALERT[{severity.upper()}]: {text}")


    def on_command(response_time_ms: int = 120):
      METRICS["commands"] += 1
      c = METRICS["commands"]
      prev = METRICS["avg_response_time_ms"]
      METRICS["avg_response_time_ms"] = round(((prev * (c - 1)) + response_time_ms) / c, 2)


    def on_error():
      METRICS["errors"] += 1
      if METRICS["errors"] > 10:
        notify_admin("bot_error_spike", severity="critical")
      elif METRICS["errors"] > 5:
        notify_admin("bot_error_growth", severity="warning")


    def on_denied_access():
      METRICS["denied_access"] += 1


    def save_daily_snapshot() -> dict:
      snap = {
        "date": datetime.now().strftime("%Y-%m-%d"),
        **METRICS,
      }
      SNAPSHOTS.append(snap)
      return snap


    def ops_stats() -> str:
      return (
        f"commands={METRICS['commands']} "
        f"errors={METRICS['errors']} "
        f"denied={METRICS['denied_access']} "
        f"avg_rt={METRICS['avg_response_time_ms']}ms"
      )


    on_command(90)
    on_command(140)
    on_error()
    on_denied_access()
    print(ops_stats())
    print(json.dumps(save_daily_snapshot(), ensure_ascii=False))`,
          explain: 'Шаблон помогает быстро добавить операционную наблюдаемость даже в небольшой проект.',
          breakdown: [
            'METRICS расширен latency-метрикой, полезной для UX-контроля.',
            'notify_admin поддерживает severity и снижает шум алертов.',
            'save_daily_snapshot создаёт основу для трендов и weekly отчётов.',
            'ops_stats теперь показывает и стабильность, и скорость ответа.'
          ],
          lineByLine: [
            'avg_response_time_ms считается инкрементально без хранения всех значений.',
            'порог >5 даёт warning, >10 даёт critical.',
            'SNAPSHOTS подходит как in-memory демо для дальнейшей записи в файл/БД.',
            'save_daily_snapshot фиксирует срез метрик в понятном JSON.',
            'ops_stats остаётся компактным, но уже информативнее.',
            'нижние вызовы моделируют небольшой рабочий день и снимок.'
          ]
        },
        commonErrors: [
          'Метрики не собираются вообще.',
          'Алерты настроены слишком шумно и игнорируются.',
          'Нет команды/способа быстро посмотреть ops-статус.',
          'Инциденты не фиксируются в runbook.'
        ],
        resultChecklist: [
          'Собираются базовые метрики по боту.',
          'Пороговые алерты отрабатывают корректно.',
          'Админ может быстро получить ops-статус.',
          'Есть runbook triage для типовых инцидентов.'
        ],
        practice: [
          'Добавь метрику avg_response_time.',
          'Сделай отдельный alert на denied_access spike.',
          'Сохраняй метрики раз в день в JSON.',
          'Оформи weekly ops-report.'
        ]
      },
      parsing: {
        why: 'Мониторинг парсинга должен ловить не только падения, но и деградацию качества/объёма.',
        microExamples: [
          {
            title: 'Мини-пример 1: baseline сравнение',
            code: 'if today_valid < baseline_valid * 0.7: alert()',
            explain: 'Просадка валидных строк часто важнее, чем формальный status=ok.'
          },
          {
            title: 'Мини-пример 2: latency контроль',
            code: 'if duration_sec > 120: alert("slow_run")',
            explain: 'Увеличение времени прогона может быть ранним сигналом проблем.'
          },
          {
            title: 'Мини-пример 3: error-rate',
            code: 'error_rate = failed_jobs / total_jobs',
            explain: 'Процент ошибок позволяет сравнивать дни и источники.'
          }
        ],
        bigSteps: [
          'Добавь baseline по ключевым KPI.',
          'Настрой алерты на quality_drop и slow_run.',
          'Собери daily health summary.',
          'Добавь triage-шаги для каждого типа алерта.'
        ],
        implementationWalkthrough: [
          'Сохраняй baseline по valid_rows и duration.',
          'После каждого прогона считай отклонение от baseline.',
          'Если отклонение > порога, отправляй алерт с контекстом.',
          'Собирай daily summary по источникам.',
          'Под каждый тип алерта распиши первый шаг диагностики.'
        ],
        fullCode: {
          title: 'Большой пример: baseline monitor для parsing pipeline',
          code: `BASELINE = {
    "valid_rows": 1000,
    "duration_sec": 60,
}


def notify_admin(text: str):
    print(f"ALERT: {text}")


def check_health(today_valid: int, today_duration: int):
    if today_valid < BASELINE["valid_rows"] * 0.7:
        notify_admin(f"quality_drop valid={today_valid}")

    if today_duration > BASELINE["duration_sec"] * 2:
        notify_admin(f"slow_run duration={today_duration}")


def daily_summary(total_jobs: int, failed_jobs: int, today_valid: int, today_duration: int) -> str:
    error_rate = round((failed_jobs / total_jobs) * 100, 2) if total_jobs else 0
    return (
        f"jobs={total_jobs} failed={failed_jobs} error_rate={error_rate}% "
        f"valid={today_valid} duration={today_duration}s"
    )


check_health(today_valid=620, today_duration=145)
print(daily_summary(total_jobs=10, failed_jobs=2, today_valid=620, today_duration=145))`,
          explain: 'Пример внедряет базовый operational-контур: baseline, алерты и ежедневная health-сводка.',
          breakdown: [
            'BASELINE задаёт эталон производительности и качества.',
            'check_health ловит деградацию даже без полного падения.',
            'daily_summary собирает ключевые KPI в один отчёт.',
            'error_rate помогает объективно оценивать стабильность.'
          ],
          lineByLine: [
            'Порог 70% для valid_rows — простой, но рабочий старт.',
            'Порог x2 по длительности ловит «подвисания» pipeline.',
            'error_rate защищён от деления на ноль.',
            'summary формат пригоден для уведомления и отчёта.',
            'check_health вызывается после каждого прогона.'
          ]
        },
        commonErrors: [
          'Мониторят только факт падения, игнорируя деградацию качества.',
          'Нет baseline, и «плохо/хорошо» оценивается на глаз.',
          'Алерты без контекста, непонятно что проверять первым.',
          'Отчёты собираются, но не используются для действий.'
        ],
        resultChecklist: [
          'Есть baseline-мониторинг качества и длительности.',
          'Настроены алерты на ключевые отклонения.',
          'Ежедневная health-сводка формируется автоматически.',
          'Есть triage-инструкция для основных инцидентов.'
        ],
        practice: [
          'Добавь baseline по new_rows.',
          'Сделай 2 уровня алертов: warning/critical.',
          'Оформи triage-таблицу в README.',
          'Собери недельный trend-report.'
        ]
      }
    },
    24: {
      title: 'Модуль 24 · День 24',
      subtitle: 'Template-release: упаковываем платформу в продаваемый продукт',
      goal: 'Финализируем reusable-платформу: bot-template + parser-template + ops-kit в формате коммерческого предложения и кейса.',
      dayPlan: [
        'Разогрев (15 мин): составь список, что входит в твой «стандартный пакет внедрения».',
        'БОТЫ (60–90 мин): собираем bot-template release candidate.',
        'ПАРСИНГ (60–90 мин): собираем parser-template release candidate.',
        'Финал (20–30 мин): упаковка комплекта в оффер и портфолио-кейс.',
        'Ретро (10 мин): оцени, какие пункты пакета реально повышают конверсию откликов.'
      ],
      glossary: [
        { term: 'Release candidate', explain: 'Версия, почти готовая к прод-поставке клиенту.' },
        { term: 'Implementation kit', explain: 'Набор шаблонов, runbook и чеклистов для быстрого внедрения.' },
        { term: 'Onboarding package', explain: 'Материалы, чтобы клиент понял и принял решение быстрее.' },
        { term: 'Standard scope', explain: 'Чётко ограниченный состав работ в базовом пакете.' }
      ],
      deliverables: [
        'bot-template RC с quickstart и quality-gate.',
        'parser-template RC с адаптерами, schema-check и ops-мониторингом.',
        'Коммерческий пакет: short offer + extended proposal.',
        'Портфолио-кейс «платформа ускоренного запуска».',
        'Сформирован onboarding-чеклист для клиента на 1 страницу.',
        'Подготовлен блок SLA/поддержка/границы работ.'
      ],
      bonusTips: [
        'Показывай не «код ради кода», а сокращение времени запуска и рисков клиента.',
        'В оффере фиксируй границы: что входит в v1.0 и что отдельно.',
        'Добавь onboarding-чеклист, чтобы клиент видел прозрачный процесс.',
        'Ставь цену за результат и скорость внедрения, а не за часы «нажатия клавиш». '
      ],
      bots: {
        why: 'Шаблон бота становится продуктом, когда у него есть release, runbook и понятный клиентский результат.',
        microExamples: [
          {
            title: 'Мини-пример 1: стандарт scope',
            code: 'v1_scope = ["/start", "lead form", "admin", "export"]',
            explain: 'Границы пакета защищают от бесконечных доработок.'
          },
          {
            title: 'Мини-пример 2: onboarding чеклист',
            code: 'token -> env -> smoke-test -> handover',
            explain: 'Чеклист ускоряет внедрение и делает процесс предсказуемым.'
          },
          {
            title: 'Мини-пример 3: handover note',
            code: 'client_docs = ["quickstart", "ops-runbook", "faq"]',
            explain: 'Передача проекта повышает ценность и снижает поддержку «в чатике». '
          }
        ],
        bigSteps: [
          'Собери bot-template RC (код + docs + checks).',
          'Определи standard scope для коммерческого внедрения.',
          'Подготовь onboarding и handover комплект.',
          'Сделай шаблон предложения под bot-заказы.',
          'Добавь acceptance criteria для закрытия этапа.',
          'Собери сравнение «ручной старт vs template start» по времени.'
        ],
        implementationWalkthrough: [
          'Зафиксируй структуру RC: src, docs, checks, examples.',
          'Проверь quality-gate по обязательным пунктам.',
          'Подготовь quickstart и admin-runbook.',
          'Определи v1_scope и out_of_scope для оффера.',
          'Собери short и extended версии коммерческого текста.'
        ],
        fullCode: {
            title: 'Большой пример: bot-template pack + acceptance + pricing tiers',
          code: `BOT_TEMPLATE_PACK = {
    "name": "Telegram Bot Starter RC",
    "v1_scope": ["/start", "lead_form", "admin_guard", "csv_export"],
    "out_of_scope": ["CRM integration", "multi-language", "payments"],
    "docs": ["quickstart.md", "ops-runbook.md", "handover.md"],
        "acceptance": [
          "smoke /start,/help,/health passed",
          "lead form stores to db",
          "admin guard blocks non-admin",
        ],
        "pricing_tiers": {
          "lite": "от 15 000",
          "standard": "от 25 000",
          "pro": "от 40 000",
        },
    "eta": "4-6 дней",
}


def build_offer(pack: dict) -> str:
    return (
        f"Пакет: {pack['name']}\n"
        f"Что входит: {', '.join(pack['v1_scope'])}\n"
        f"Что не входит: {', '.join(pack['out_of_scope'])}\n"
        f"Документация: {', '.join(pack['docs'])}\n"
        f"Критерии готовности: {'; '.join(pack['acceptance'])}\n"
        f"Тарифы: {pack['pricing_tiers']['lite']} / {pack['pricing_tiers']['standard']} / {pack['pricing_tiers']['pro']}\n"
        f"Срок внедрения: {pack['eta']}\n"
        "Результат: рабочий бот с понятным onboarding и поддержкой запуска"
    )


print(build_offer(BOT_TEMPLATE_PACK))`,
          explain: 'Пример показывает более зрелую упаковку: scope, критерии готовности и тарифные уровни в одном шаблоне.',
          breakdown: [
            'BOT_TEMPLATE_PACK фиксирует продуктовый состав, а не «просто код».',
            'build_offer быстро генерирует текст под клиента.',
            'acceptance создаёт прозрачные условия закрытия этапа.',
            'pricing tiers помогает быстро обсуждать бюджет без хаоса.'
          ],
          lineByLine: [
            'v1_scope и out_of_scope задают управляемые рамки проекта.',
            'docs показывает, что проект готов к передаче и сопровождению.',
            'acceptance фиксирует объективные критерии приёмки.',
            'pricing_tiers снижает время согласования стоимости.',
            'eta фиксирует ожидание по срокам.',
            'Финальная строка концентрируется на клиентском результате.',
            'print — быстрый предпросмотр оффера перед отправкой.'
          ]
        },
        commonErrors: [
          'Шаблон показывают без документации и клиент теряется на старте.',
          'Нет out_of_scope, и проект расползается.',
          'Оффер не фиксирует срок и состав внедрения.',
          'Нет handover-материалов после сдачи.'
        ],
        resultChecklist: [
          'bot-template RC готов как коммерческий пакет.',
          'Есть onboarding/handover документация.',
          'Scope и ограничения зафиксированы.',
          'Оффер готов к отправке клиенту.'
        ],
        practice: [
          'Собери short и extended версии оффера.',
          'Сделай чеклист внедрения на 1 страницу.',
          'Протестируй оффер на 5 откликах.',
          'Обнови пакет по обратной связи.'
        ]
      },
      parsing: {
        why: 'Parser-template продаётся лучше, когда клиент видит SLA, мониторинг и процесс адаптации под новый источник.',
        microExamples: [
          {
            title: 'Мини-пример 1: состав parser-pack',
            code: 'core + adapters + schema-check + alerts + docs',
            explain: 'Полный комплект выглядит как зрелый сервис, а не скрипт на один запуск.'
          },
          {
            title: 'Мини-пример 2: SLA строка',
            code: 'SLA: исправление критических сбоев в течение 24 часов',
            explain: 'SLA снимает тревогу клиента по сопровождению.'
          },
          {
            title: 'Мини-пример 3: адаптация источника',
            code: 'new_source_eta = "4-8 часов"',
            explain: 'Чёткая оценка адаптации повышает доверие к процессу.'
          }
        ],
        bigSteps: [
          'Собери parser-template RC с docs и SLA блоком.',
          'Добавь pricing/packaging уровни услуг.',
          'Подготовь демо-кейс с реальными метриками.',
          'Сделай готовый текст предложения для parsing-заказов.'
        ],
        implementationWalkthrough: [
          'Определи состав parser-pack и обязательные модули.',
          'Добавь SLA и политику реагирования на инциденты.',
          'Собери one-page документ по внедрению.',
          'Подготовь short/extended оффер с KPI из кейса.',
          'Проверь оффер на реальных откликах и обнови формулировки.'
        ],
        fullCode: {
          title: 'Большой пример: parser-template commercial proposal builder',
          code: `PARSER_TEMPLATE_PACK = {
    "name": "Parser Platform RC",
    "includes": [
        "multi-site adapter runner",
        "schema validation",
        "quality report",
        "alerts + baseline monitoring",
    ],
    "sla": "critical fix < 24h",
    "new_source_eta": "4-8 часов",
    "delivery": "CSV + JSON + Google Sheets",
}


def build_parsing_offer(pack: dict, kpi: str) -> str:
    return (
        f"Пакет: {pack['name']}\n"
        f"Включено: {', '.join(pack['includes'])}\n"
        f"SLA: {pack['sla']}\n"
        f"Подключение нового источника: {pack['new_source_eta']}\n"
        f"Формат выдачи: {pack['delivery']}\n"
        f"KPI из кейса: {kpi}\n"
        "Результат: стабильный поток данных и операционный контроль"
    )


print(build_parsing_offer(PARSER_TEMPLATE_PACK, "total=1800 valid=1650 new=74 time=52s"))`,
          explain: 'Этот шаблон делает parsing-предложение структурным, доказуемым и готовым к продаже.',
          breakdown: [
            'PARSER_TEMPLATE_PACK фиксирует состав зрелого решения.',
            'build_parsing_offer быстро формирует коммерческий текст.',
            'KPI строка связывает оффер с реальными результатами.',
            'SLA и ETA по адаптации повышают предсказуемость для клиента.'
          ],
          lineByLine: [
            'includes описывает ценность пакета в терминах результата.',
            'sla задаёт рамку сопровождения.',
            'new_source_eta подчёркивает скорость адаптации.',
            'kpi добавляет доказательство компетенции.',
            'Финальная строка формулирует бизнес-эффект для заказчика.'
          ]
        },
        commonErrors: [
          'Оффер по парсингу без SLA и без поддержки.',
          'Непонятно, что именно входит в пакет внедрения.',
          'Нет связи с реальными KPI кейса.',
          'Срок адаптации нового источника не фиксируется.'
        ],
        resultChecklist: [
          'parser-template RC упакован как продукт.',
          'Есть SLA и понятный scope внедрения.',
          'Есть short/extended предложения для клиентов.',
          'Оффер подкреплён реальными KPI кейса.'
        ],
        practice: [
          'Сделай one-page parsing proposal.',
          'Подготовь 2 версии CTA для оффера.',
          'Проверь конверсию 2 форматов предложения.',
          'Добавь финальный пакет в портфолио.'
        ]
      }
    },
    25: {
      title: 'Модуль 25 · День 25',
      subtitle: 'Упаковка кейсов с метриками: доказательство ценности услуг',
      goal: 'Собираем кейсы в формате «цифры + результат для клиента», чтобы увеличить доверие и конверсию в заказы.',
      dayPlan: [
        'Разогрев (15 мин): выбери 2 лучших кейса по ботам и 2 по парсингу.',
        'БОТЫ (60–90 мин): дополняем кейсы метриками времени и экономии.',
        'ПАРСИНГ (60–90 мин): дополняем кейсы метриками точности и скорости.',
        'Финал (20–30 мин): публикуем обновлённые кейсы и делаем 5 откликов.'
      ],
      glossary: [
        { term: 'Case metric', explain: 'Измеримый показатель результата проекта.' },
        { term: 'Before/After', explain: 'Сравнение состояния до внедрения и после.' },
        { term: 'Evidence block', explain: 'Скриншоты, логи, цифры, ссылки на демо.' },
        { term: 'Conversion asset', explain: 'Материал, который повышает шанс ответа клиента.' }
      ],
      deliverables: [
        '2 bot-кейса с метриками времени/экономии.',
        '2 parsing-кейса с метриками качества/скорости.',
        'Единый шаблон кейса для повторного использования.',
        '5 персонализированных откликов с новыми кейсами.'
      ],
      bots: {
        why: 'Кейсы с цифрами продают лучше, чем описания «сделал бота».',
        microExamples: [
          { title: 'Мини-пример 1: метрика времени', code: 'До: 12 мин/заявка -> После: 3 мин/заявка', explain: 'Показывает реальную экономию для бизнеса.' },
          { title: 'Мини-пример 2: метрика потерь', code: 'Потерянные заявки: 18% -> 2%', explain: 'Важный аргумент для лид-ботов.' },
          { title: 'Мини-пример 3: CTA', code: 'Готов показать живой сценарий на демо за 10 минут.', explain: 'Кейс должен заканчиваться действием.' }
        ],
        bigSteps: [
          'Собери before/after метрики по 2 ботам.',
          'Добавь блок артефактов: README, демо, скрин лога.',
          'Подготовь short-case (5 строк) и long-case (1 страница).',
          'Вставь кейсы в отклики и профиль.'
        ],
        implementationWalkthrough: [
          'Возьми журналы/логи и выпиши базовые метрики.',
          'Сформируй структуру: проблема -> решение -> цифры -> итог.',
          'Добавь 1-2 скриншота и ссылку на демо.',
          'Собери мини-карточку для чатов и бирж.',
          'Проверь читаемость кейса за 30 секунд.'
        ],
        fullCode: {
          title: 'Большой пример: генератор bot-карточки кейса',
          code: `def build_bot_case(title: str, before: dict, after: dict, links: dict) -> str:
    return (
        f"Кейс: {title}\n"
        f"До: время={before['lead_time_min']}м, потери={before['lost_percent']}%\n"
        f"После: время={after['lead_time_min']}м, потери={after['lost_percent']}%\n"
        f"Экономия: {before['lead_time_min'] - after['lead_time_min']}м на заявку\n"
        f"Доказательства: demo={links['demo']} | readme={links['readme']}\n"
        "Результат: стабильный сбор заявок и быстрый цикл обработки"
    )


print(build_bot_case(
    title="Lead Bot для малого бизнеса",
    before={"lead_time_min": 12, "lost_percent": 18},
    after={"lead_time_min": 3, "lost_percent": 2},
    links={"demo": "https://example.com/demo", "readme": "https://example.com/readme"}
))`,
          explain: 'Шаблон стандартизирует кейс и ускоряет упаковку нескольких проектов.',
          breakdown: [
            'before/after задаёт контраст, который легко считывается.',
            'links добавляет проверяемость результатов.',
            'Формат готов для откликов и портфолио.',
            'Одна функция позволяет быстро собирать новые кейсы.'
          ],
          lineByLine: [
            'Строка «экономия» даёт прямую бизнес-ценность.',
            'Ссылки на demo/readme усиливают доверие.',
            'Финальная строка делает акцент на результате, не на технологии.'
          ]
        },
        commonErrors: [
          'Кейс без цифр и без сравнения до/после.',
          'Нет ссылок на доказательства.',
          'Слишком длинное описание без структуры.',
          'Нет CTA в конце кейса.'
        ],
        resultChecklist: [
          'Кейс содержит измеримые метрики.',
          'Есть before/after и вывод для клиента.',
          'Есть ссылки на демо/README.',
          'Кейс готов для отклика в 1 клик.'
        ],
        practice: [
          'Собери 2 карточки bot-кейсов.',
          'Сделай короткую и длинную версию каждой.',
          'Протестируй в 5 откликах.',
          'Зафиксируй, где выше response rate.'
        ]
      },
      parsing: {
        why: 'Для парсинга клиенту важны точность и скорость доставки данных.',
        microExamples: [
          { title: 'Мини-пример 1: throughput', code: 'objects_per_min = total / duration_min', explain: 'Показывает производительность pipeline.' },
          { title: 'Мини-пример 2: quality', code: 'quality = valid / total', explain: 'Показывает чистоту выгрузки.' },
          { title: 'Мини-пример 3: SLA', code: 'Обновление: 2 раза в день', explain: 'Фиксирует ожидания клиента.' }
        ],
        bigSteps: [
          'Добавь метрики скорость/точность в 2 parsing-кейса.',
          'Сделай блок «формат выдачи + частота обновления».',
          'Добавь скриншоты CSV/Sheets и quality-report.',
          'Собери короткое коммерческое описание кейса.'
        ],
        implementationWalkthrough: [
          'Выпиши total/valid/new/duration из логов.',
          'Посчитай objects_per_min и quality ratio.',
          'Добавь блок рисков и мер контроля.',
          'Оформи кейс в двух форматах (short/extended).',
          'Вставь кейс в отклики с релевантным CTA.'
        ],
        fullCode: {
          title: 'Большой пример: генератор parsing-кейса с KPI',
          code: `def build_parsing_case(title: str, total: int, valid: int, new: int, duration_min: float) -> dict:
    quality = round((valid / total) * 100, 2) if total else 0
    throughput = round(total / duration_min, 2) if duration_min else 0
    return {
        "title": title,
        "kpi": {
            "total": total,
            "valid": valid,
            "new": new,
            "duration_min": duration_min,
            "quality_percent": quality,
            "objects_per_min": throughput,
        },
        "client_value": "регулярный поток чистых данных в понятном формате",
    }


case = build_parsing_case("Мониторинг цен", total=1800, valid=1650, new=74, duration_min=8.5)
print(case)`,
          explain: 'Функция формирует KPI-каркас кейса, пригодный для презентации и сравнения.',
          breakdown: [
            'quality и throughput — два ключа для parsing-проектов.',
            'Структурированный dict удобен для дальнейшей генерации текста.',
            'Можно сравнивать кейсы между собой по единым полям.',
            'Готово для отчётов и коммерческих материалов.'
          ],
          lineByLine: [
            'Защита от деления на ноль предотвращает аварии в отчётах.',
            'KPI упакован в единый раздел для быстрого чтения.',
            'client_value фиксирует бизнес-эффект простыми словами.'
          ]
        },
        commonErrors: [
          'Пишут «парсер работает» без KPI.',
          'Не показывают формат выдачи данных.',
          'Нет частоты обновления и SLA.',
          'Нет скриншотов и доказательств результата.'
        ],
        resultChecklist: [
          'Кейсы содержат throughput и quality.',
          'Добавлены артефакты (скрины/ссылки).',
          'Есть short и extended версии.',
          'Кейс используется в откликах.'
        ],
        practice: [
          'Собери 2 parsing-кейса с KPI.',
          'Сравни их в таблице.',
          'Добавь блок «риски и меры».',
          'Отправь 5 откликов с новым кейсом.'
        ]
      }
    },
    26: {
      title: 'Модуль 26 · День 26',
      subtitle: 'Подписка и сопровождение: SLA-пакеты для регулярного дохода',
      goal: 'Формируем recurring-модель: продаём не разовый проект, а сопровождение с понятными SLA.',
      dayPlan: [
        'Разогрев (15 мин): выбери 3 задачи, которые логично продавать в подписке.',
        'БОТЫ (60–90 мин): пакет поддержки 30 дней + SLA.',
        'ПАРСИНГ (60–90 мин): пакет сопровождения с alert и адаптацией.',
        'Финал (20–30 мин): подготовка шаблона предложения по подписке.'
      ],
      glossary: [
        { term: 'SLA', explain: 'Соглашение по времени реакции и фикса.' },
        { term: 'Retainer', explain: 'Ежемесячная оплата за поддержку.' },
        { term: 'Incident window', explain: 'Диапазон времени, когда обслуживаются инциденты.' },
        { term: 'Service tier', explain: 'Уровень пакета поддержки с разным объёмом услуг.' }
      ],
      deliverables: [
        'Пакет поддержки бота на 30 дней.',
        'Пакет сопровождения парсера с мониторингом.',
        'Тарифная сетка и SLA-условия.',
        'Шаблон сообщения для продажи подписки.'
      ],
      bots: {
        why: 'Поддержка ботов создаёт предсказуемый доход и повторные продажи.',
        microExamples: [
          { title: 'Мини-пример 1: SLA-response', code: 'response_time = 2h', explain: 'Клиент понимает, как быстро ты реагируешь.' },
          { title: 'Мини-пример 2: SLA-fix', code: 'critical_fix = 24h', explain: 'Фиксирует срок решения критичных проблем.' },
          { title: 'Мини-пример 3: план работ', code: 'up to 5 minor changes / month', explain: 'Ограничение объёма защищает тебя от перегруза.' }
        ],
        bigSteps: [
          'Собери 3 тарифа поддержки (Lite/Standard/Pro).',
          'Определи response/fix SLA по уровням.',
          'Добавь список, что входит и не входит.',
          'Сделай шаблон коммерческого предложения.'
        ],
        implementationWalkthrough: [
          'Определи типовые инциденты и частые доработки.',
          'Привяжи SLA к каждой категории задач.',
          'Зафиксируй лимиты задач на месяц.',
          'Сделай документ «условия сопровождения».',
          'Подготовь short-offer для отправки клиенту.'
        ],
        fullCode: {
          title: 'Большой пример: конструктор bot-SLA пакетов',
          code: `BOT_SUPPORT_PACKAGES = {
    "lite": {"price": "$80/мес", "response": "8h", "fix": "48h", "changes": 2},
    "standard": {"price": "$150/мес", "response": "4h", "fix": "24h", "changes": 5},
    "pro": {"price": "$300/мес", "response": "2h", "fix": "12h", "changes": 10},
}


def build_support_offer(tier: str) -> str:
    p = BOT_SUPPORT_PACKAGES[tier]
    return (
        f"Тариф: {tier}\n"
        f"Цена: {p['price']}\n"
        f"Response SLA: {p['response']}\n"
        f"Fix SLA: {p['fix']}\n"
        f"Доработки в месяц: {p['changes']}\n"
        "Формат: поддержка + мелкие улучшения + стабильность"
    )


print(build_support_offer("standard"))`,
          explain: 'Шаблон даёт быстрый способ обсуждать сопровождение без импровизации.',
          breakdown: [
            'Чёткие tiers снижают время согласования.',
            'SLA по response/fix повышает доверие.',
            'Лимит changes защищает от размывания scope.',
            'Текст готов для чатов и КП.'
          ],
          lineByLine: [
            'Словарь пакетов легко расширяется.',
            'build_support_offer генерирует единый формат оффера.',
            'Финальная строка фокусируется на клиентской выгоде.'
          ]
        },
        commonErrors: [
          'Нет фиксированных SLA в предложении.',
          'Не ограничен объём работ в месяц.',
          'Цена есть, а состав услуг расплывчатый.',
          'Сопровождение продаётся как «по договорённости».'
        ],
        resultChecklist: [
          'Есть 3 SLA-пакета поддержки.',
          'У каждого пакета понятные границы.',
          'Есть короткий шаблон оффера.',
          'Подписка готова к продаже.'
        ],
        practice: [
          'Подготовь 3 оффера под разные ниши.',
          'Протестируй в 5 диалогах.',
          'Уточни возражения клиентов по SLA.',
          'Скорректируй тарифы по обратной связи.'
        ]
      },
      parsing: {
        why: 'Сопровождение парсеров особенно востребовано из-за изменений верстки и источников.',
        microExamples: [
          { title: 'Мини-пример 1: SLA на инцидент', code: 'critical incident -> response 2h', explain: 'Скорость реакции — ключевой аргумент.' },
          { title: 'Мини-пример 2: alert включён', code: 'on failure -> notify client/admin', explain: 'Клиент ценит проактивные уведомления.' },
          { title: 'Мини-пример 3: monthly report', code: 'jobs, quality, failures, fixes', explain: 'Отчёт показывает ценность подписки.' }
        ],
        bigSteps: [
          'Определи SLA-пакеты для parsing-сопровождения.',
          'Добавь обязательный monthly-report.',
          'Включи адаптацию селекторов как отдельный пункт.',
          'Собери шаблон письма по сопровождению.'
        ],
        implementationWalkthrough: [
          'Собери список recurring задач сопровождения.',
          'Привяжи частоту задач к тарифам.',
          'Опиши, какие инциденты считаются critical.',
          'Добавь шаблон ежемесячного отчёта.',
          'Подготовь примеры для презентации клиенту.'
        ],
        fullCode: {
          title: 'Большой пример: parsing-retainer пакет с monthly report',
          code: `def build_monthly_report(total_jobs: int, failed: int, quality_avg: float, fixes: int) -> str:
    return (
        f"Месяц: jobs={total_jobs}, failed={failed}, quality_avg={quality_avg}%, fixes={fixes}\n"
        "Вывод: стабильность и качество под контролем"
    )


def build_parsing_retainer(price: str, response_sla: str, fix_sla: str) -> str:
    return (
        f"Parsing Support: {price}\n"
        f"Response SLA: {response_sla}\n"
        f"Fix SLA: {fix_sla}\n"
        "Включено: мониторинг, алерты, адаптация селекторов, monthly report"
    )


print(build_parsing_retainer("$120/мес", "4h", "24h"))
print(build_monthly_report(62, 3, 93.4, 5))`,
          explain: 'Пример соединяет тариф и отчётность — основу ценности подписки.',
          breakdown: [
            'retainer описывает условия сопровождения.',
            'monthly report подтверждает результат фактами.',
            'Формат пригоден для регулярной коммуникации.',
            'Клиент видит прозрачность и контроль.'
          ],
          lineByLine: [
            'Краткий отчёт должен быть читаемым за 20 секунд.',
            'SLA-поля фиксируют ожидания заранее.',
            'Список «включено» снижает риск споров.'
          ]
        },
        commonErrors: [
          'Нет регулярной отчётности в подписке.',
          'SLA не привязан к цене.',
          'Адаптация селекторов не описана в договорённости.',
          'Клиент не понимает ценность ежемесячной оплаты.'
        ],
        resultChecklist: [
          'Есть retainer-пакет по парсингу.',
          'Есть monthly-report формат.',
          'SLA и scope согласованы.',
          'Готово коммерческое сообщение для продажи.'
        ],
        practice: [
          'Сделай 2 варианта monthly report.',
          'Подготовь 3 тарифа поддержки.',
          'Протестируй оффер на текущих контактах.',
          'Собери FAQ по сопровождению.'
        ]
      }
    },
    27: {
      title: 'Модуль 27 · День 27',
      subtitle: 'Рост среднего чека: позиционирование под дорогие заказы',
      goal: 'Сдвигаем позиционирование с «дешёвых задач» на более дорогие и комплексные проекты.',
      dayPlan: [
        'Разогрев (15 мин): выпиши 3 причины, почему клиент должен взять именно тебя дороже.',
        'БОТЫ (60–90 мин): упаковываем оффер под средний/высокий чек.',
        'ПАРСИНГ (60–90 мин): позиционирование под enterprise-потребности.',
        'Финал (20–30 мин): отправка 20+ целевых откликов с новым оффером.'
      ],
      glossary: [
        { term: 'Average check', explain: 'Средняя сумма заказа.' },
        { term: 'Premium positioning', explain: 'Подача услуги как более качественной и системной.' },
        { term: 'Qualification', explain: 'Отбор проектов по бюджету/адекватности.' },
        { term: 'Value-based pricing', explain: 'Цена от ценности результата, а не от часов.' }
      ],
      deliverables: [
        'Новые офферы под средний чек по ботам и парсингу.',
        'Скрипт квалифицирующих вопросов по бюджету/срокам.',
        'Список отказов от дешёвых нерентабельных задач.',
        '20+ целевых откликов с новым позиционированием.'
      ],
      bots: {
        why: 'Повышение чека начинается с формулировок, границ и уверенной квалификации клиента.',
        microExamples: [
          { title: 'Мини-пример 1: фильтр бюджета', code: 'Какой бюджет у вас на v1.0?', explain: 'Ранний фильтр экономит время.' },
          { title: 'Мини-пример 2: ценность', code: 'Я даю не код, а рабочий поток заявок + контроль.', explain: 'Фокус на бизнес-эффекте.' },
          { title: 'Мини-пример 3: отказ', code: 'К сожалению, в этот бюджет не смогу качественно выполнить.', explain: 'Отказ — часть роста.' }
        ],
        bigSteps: [
          'Обнови оффер на value-based формулировки.',
          'Добавь квалификационный блок в переписку.',
          'Убери демпинговые пакеты из профиля.',
          'Отправь отклики только в релевантный сегмент.'
        ],
        implementationWalkthrough: [
          'Определи минимально приемлемый чек.',
          'Перепиши оффер от результата для клиента.',
          'Добавь 3 фильтра-вопроса в первый контакт.',
          'Подготовь вежливый скрипт отказа.',
          'Собери статистику ответов по новым формулировкам.'
        ],
        fullCode: {
          title: 'Большой пример: квалификация и сегментация лидов',
          code: `def qualify_lead(budget: int, deadline_days: int, scope: str) -> str:
    if budget < 15000:
        return "reject_low_budget"
    if deadline_days < 2 and "integration" in scope:
        return "risky_deadline"
    return "fit"


def build_premium_reply(task: str, value: str, eta: str) -> str:
    return (
        f"По задаче: {task}.\n"
        f"Результат для вас: {value}.\n"
        f"Срок v1.0: {eta}.\n"
        "Готов обсудить детали и дать точный план внедрения."
    )


print(qualify_lead(20000, 5, "lead bot with admin"))
print(build_premium_reply("бот для заявок", "снижение потерь лидов и контроль", "4-6 дней"))`,
          explain: 'Сегментация позволяет тратить время на проекты с лучшей экономикой.',
          breakdown: [
            'qualify_lead фильтрует рисковые заявки.',
            'premium_reply подаёт результат, а не только функционал.',
            'Подход улучшает средний чек.',
            'Снижается доля выгорающих проектов.'
          ],
          lineByLine: [
            'Бюджет и дедлайн — два самых сильных фильтра.',
            'Категория risky_deadline помогает избегать конфликтов.',
            'Текст отклика фокусируется на ценности и плане действий.'
          ]
        },
        commonErrors: [
          'Берут все задачи подряд ради «количества».',
          'Нет фильтра по бюджету.',
          'Подача услуги как «дёшево и быстро» вместо «стабильно и полезно».',
          'Отсутствует вежливый скрипт отказа.'
        ],
        resultChecklist: [
          'Есть новый оффер под средний чек.',
          'Внедрён квалификационный фильтр.',
          'Уменьшено число нерентабельных диалогов.',
          'Отправлены целевые отклики.'
        ],
        practice: [
          'Сделай 10 квалифицированных откликов.',
          'Сравни response rate со старым стилем.',
          'Подкрути фильтр бюджета.',
          'Обнови профиль под premium-позиционирование.'
        ]
      },
      parsing: {
        why: 'Enterprise-задачи по парсингу требуют зрелой подачи: SLA, безопасность, контроль качества.',
        microExamples: [
          { title: 'Мини-пример 1: enterprise-offer', code: 'SLA + quality report + alerting + support', explain: 'Набор зрелых обязательств.' },
          { title: 'Мини-пример 2: критерий входа', code: 'min_budget = 20000', explain: 'Фильтрует неподходящий сегмент.' },
          { title: 'Мини-пример 3: risk block', code: 'риски + mitigation', explain: 'Профессиональная коммуникация.' }
        ],
        bigSteps: [
          'Собери enterprise-оффер по парсингу.',
          'Добавь блок безопасности и мониторинга.',
          'Внедри фильтр по бюджету/объёму.',
          'Отправь 20 откликов в более дорогой сегмент.'
        ],
        implementationWalkthrough: [
          'Определи минимальный объём/чек.',
          'Собери документ с SLA и quality controls.',
          'Добавь шаблон ответа на enterprise-возражения.',
          'Покажи 1-2 кейса с KPI.',
          'Сравни качество лидов после смены позиционирования.'
        ],
        fullCode: {
          title: 'Большой пример: enterprise parsing offer builder',
          code: `def build_enterprise_offer(min_budget: int, sla: str, controls: list[str], kpi: str) -> str:
    return (
        f"Минимальный бюджет: {min_budget}\n"
        f"SLA: {sla}\n"
        f"Контроль качества: {', '.join(controls)}\n"
        f"KPI кейса: {kpi}\n"
        "Формат: стабильный pipeline + сопровождение + отчётность"
    )


print(build_enterprise_offer(
    min_budget=20000,
    sla="response 4h / fix 24h",
    controls=["schema check", "alerts", "daily report"],
    kpi="quality=93.4% objects/min=211"
))`,
          explain: 'Шаблон помогает структурно отвечать на enterprise-запросы.',
          breakdown: [
            'Условия входа и SLA заданы заранее.',
            'controls показывают зрелость процесса.',
            'KPI закрывают вопрос доказательств.',
            'Оффер читается быстро и по делу.'
          ],
          lineByLine: [
            'min_budget экономит время на нерелевантных запросах.',
            'controls и KPI усиливают доверие к офферу.',
            'Финальная строка закрепляет бизнес-выгоду.'
          ]
        },
        commonErrors: [
          'Отсутствуют критерии входа клиента.',
          'Оффер без SLA и качества.',
          'Нет enterprise-языка (риски, контроль, отчётность).',
          'Нет сравнения «до/после» по лидам.'
        ],
        resultChecklist: [
          'Enterprise-оффер готов и протестирован.',
          'Есть фильтр по бюджету и объёму.',
          'Добавлены KPI и control-блоки.',
          'Качество лидов выросло.'
        ],
        practice: [
          'Сделай 10 enterprise-откликов.',
          'Подготовь FAQ по рискам.',
          'Собери 2 кейса для дорогого сегмента.',
          'Сравни средний чек за неделю.'
        ]
      }
    },
    28: {
      title: 'Модуль 28 · День 28',
      subtitle: 'Средний чек в работе: один заказ с высокой маржинальностью',
      goal: 'Закрываем заказ среднего чека с опорой на шаблоны и контроль качества.',
      dayPlan: [
        'Разогрев (15 мин): выбери 1 целевой заказ и зафиксируй scope v1.0.',
        'БОТЫ (60–90 мин): сборка на шаблоне с экономией времени.',
        'ПАРСИНГ (60–90 мин): сборка на шаблоне + quality контроль.',
        'Финал (20–30 мин): сдача и мини-ретро по экономии часов.'
      ],
      glossary: [
        { term: 'Margin', explain: 'Разница между доходом и затратой времени.' },
        { term: 'Template reuse', explain: 'Переиспользование шаблонов для ускорения разработки.' },
        { term: 'Acceptance', explain: 'Критерии принятия результата клиентом.' },
        { term: 'Post-delivery review', explain: 'Короткий анализ после сдачи проекта.' }
      ],
      deliverables: [
        'Закрыт 1 заказ среднего чека.',
        'Зафиксирована экономия времени благодаря шаблонам.',
        'Собран post-delivery отчёт.',
        'Обновлён шаблон на основе реального проекта.'
      ],
      bots: {
        why: 'Шаблон в бою должен подтверждать, что ты можешь делать быстрее без потери качества.',
        microExamples: [
          { title: 'Мини-пример 1: reuse ratio', code: 'reuse_ratio = reused_lines / total_lines', explain: 'Показывает эффективность шаблона.' },
          { title: 'Мини-пример 2: delivery time', code: 'planned=8h actual=4.5h', explain: 'Главная метрика маржинальности.' },
          { title: 'Мини-пример 3: acceptance pass', code: 'all_criteria_passed == True', explain: 'Скорость без качества не считается успехом.' }
        ],
        bigSteps: [
          'Возьми заказ с чётким scope и дедлайном.',
          'Собери решение на bot-template.',
          'Пройди acceptance-checklist перед сдачей.',
          'Сравни план/факт по времени.'
        ],
        implementationWalkthrough: [
          'Зафиксируй требования в коротком брифе.',
          'Собери проект из готового scaffold.',
          'Добавь только task-specific изменения.',
          'Прогони smoke и acceptance.',
          'Запиши фактические часы и выводы.'
        ],
        fullCode: {
          title: 'Большой пример: отчёт по эффективности шаблона',
          code: `def template_efficiency(planned_hours: float, actual_hours: float, reused_lines: int, total_lines: int) -> dict:
    saved_hours = round(planned_hours - actual_hours, 2)
    reuse_ratio = round((reused_lines / total_lines) * 100, 2) if total_lines else 0
    return {
        "planned_hours": planned_hours,
        "actual_hours": actual_hours,
        "saved_hours": saved_hours,
        "reuse_ratio_percent": reuse_ratio,
    }


print(template_efficiency(8.0, 4.5, reused_lines=620, total_lines=880))`,
          explain: 'Отчёт помогает обосновать цену и показать рост производительности.',
          breakdown: [
            'saved_hours напрямую влияет на маржу.',
            'reuse_ratio показывает зрелость шаблона.',
            'Метрики пригодны для портфолио и переговоров.',
            'Можно отслеживать прогресс от проекта к проекту.'
          ],
          lineByLine: [
            'Защита total_lines предотвращает деление на ноль.',
            'Округление делает отчёт читаемым.',
            'Словарь легко сохранять в json/csv.'
          ]
        },
        commonErrors: [
          'Не фиксируют план/факт по времени.',
          'Шаблон не обновляют после реального проекта.',
          'Нет acceptance-check до сдачи.',
          'Нет данных для улучшения процессов.'
        ],
        resultChecklist: [
          'Проект сдан в срок.',
          'Есть метрика экономии времени.',
          'Есть acceptance-pass отчёт.',
          'Шаблон улучшен по итогам проекта.'
        ],
        practice: [
          'Сделай отчёт plan/fact по последнему заказу.',
          'Обнови шаблон на 2 улучшения.',
          'Добавь метрики в кейс.',
          'Сравни маржинальность до/после шаблона.'
        ]
      },
      parsing: {
        why: 'В parsing-заказах средний чек растёт, когда ты сдаёшь быстро и стабильно.',
        microExamples: [
          { title: 'Мини-пример 1: quality gate', code: 'quality >= 90%', explain: 'Минимальный стандарт перед сдачей.' },
          { title: 'Мини-пример 2: speed gate', code: 'duration <= target_duration', explain: 'Контроль эффективности pipeline.' },
          { title: 'Мини-пример 3: client report', code: 'kpi + risks + next step', explain: 'Сильная упаковка результата.' }
        ],
        bigSteps: [
          'Собери проект на parser-template.',
          'Проверь quality/speed KPI перед сдачей.',
          'Подготовь клиентский отчёт с выводами.',
          'Зафиксируй доработки шаблона.'
        ],
        implementationWalkthrough: [
          'Настрой адаптер под источник клиента.',
          'Прогони pipeline и собери KPI.',
          'Проверь quality gate.',
          'Подготовь отчёт и рекомендации.',
          'Обнови template после сдачи.'
        ],
        fullCode: {
          title: 'Большой пример: delivery gate для parsing-заказа',
          code: `def delivery_gate(quality: float, duration_min: float, max_duration: float = 12.0) -> tuple[bool, str]:
    if quality < 90:
        return False, "quality_below_threshold"
    if duration_min > max_duration:
        return False, "duration_above_target"
    return True, "ready_for_delivery"


def client_summary(total: int, valid: int, new: int, duration: float) -> str:
    return (
        f"total={total}, valid={valid}, new={new}, duration={duration}m\n"
        "Результат: данные готовы к использованию"
    )


ok, status = delivery_gate(quality=93.1, duration_min=9.7)
print(ok, status)
print(client_summary(1800, 1676, 88, 9.7))`,
          explain: 'Пример формализует момент «готово к сдаче» через прозрачные критерии.',
          breakdown: [
            'delivery_gate защищает от слабого качества.',
            'client_summary даёт готовый формат отчёта.',
            'Подход снижает риски возвратов.',
            'Критерии легко масштабировать на другие проекты.'
          ],
          lineByLine: [
            'status_code помогает быстро понять причину блокировки.',
            'Порог duration стимулирует оптимизацию.',
            'Резюме подходит для сообщения клиенту и отчёта.'
          ]
        },
        commonErrors: [
          'Сдают без quality gate.',
          'Нет формального критерия «готово».',
          'Отчёт клиенту без KPI.',
          'Шаблон не улучшается после проекта.'
        ],
        resultChecklist: [
          'Проект прошёл delivery gate.',
          'Клиент получил KPI-отчёт.',
          'Сроки соблюдены.',
          'Template обновлён по итогам.'
        ],
        practice: [
          'Введи свой порог quality/duration.',
          'Собери отчёт по 2 прогонам.',
          'Сравни проект до/после template.',
          'Добавь выводы в портфолио.'
        ]
      }
    },
    29: {
      title: 'Модуль 29 · День 29',
      subtitle: 'Метрики месяца: анализ воронки и роста дохода',
      goal: 'Подводим итоги месяца данными: отклики, конверсия, средний чек, качество проектов.',
      dayPlan: [
        'Разогрев (15 мин): собери все цифры за месяц в одну таблицу.',
        'БОТЫ (60–90 мин): анализ заказов, сроков, чеков.',
        'ПАРСИНГ (60–90 мин): анализ KPI, ретейнеров и стабильности.',
        'Финал (20–30 мин): формируем стратегию улучшений на месяц 2.'
      ],
      glossary: [
        { term: 'Funnel metric', explain: 'Показатель этапа воронки: отклик, ответ, созвон, сделка.' },
        { term: 'ARPU', explain: 'Средний доход на одного клиента.' },
        { term: 'Retention', explain: 'Доля клиентов, вернувшихся за повторной услугой.' },
        { term: 'Bottleneck', explain: 'Слабое место процесса, ограничивающее рост.' }
      ],
      deliverables: [
        'Сводная таблица метрик месяца.',
        'Выводы по сильным/слабым местам.',
        'Список 3 приоритетных улучшений.',
        'План KPI на следующий месяц.'
      ],
      bots: {
        why: 'Без аналитики невозможно масштабировать результат — только «ощущения».',
        microExamples: [
          { title: 'Мини-пример 1: conversion', code: 'deals / replies', explain: 'Показывает качество коммуникации.' },
          { title: 'Мини-пример 2: avg check', code: 'revenue / deals', explain: 'Ключевой показатель монетизации.' },
          { title: 'Мини-пример 3: on-time rate', code: 'on_time_projects / total_projects', explain: 'Качество исполнения и доверие.' }
        ],
        bigSteps: [
          'Собери метрики по bot-заказам за месяц.',
          'Посчитай conversion, avg check, on-time rate.',
          'Выяви bottleneck в воронке.',
          'Сформируй 3 улучшения на месяц 2.'
        ],
        implementationWalkthrough: [
          'Собери сырые данные из таблиц/чатов/CRM.',
          'Посчитай базовые коэффициенты.',
          'Сравни результаты по неделям.',
          'Определи узкое место и гипотезу улучшения.',
          'Запиши KPI-цели на следующий период.'
        ],
        fullCode: {
          title: 'Большой пример: monthly metrics calculator (bots)',
          code: `def monthly_metrics(sent: int, replies: int, calls: int, deals: int, revenue: float, on_time: int) -> dict:
    return {
        "reply_rate": round((replies / sent) * 100, 2) if sent else 0,
        "call_rate": round((calls / replies) * 100, 2) if replies else 0,
        "deal_rate": round((deals / replies) * 100, 2) if replies else 0,
        "avg_check": round(revenue / deals, 2) if deals else 0,
        "on_time_rate": round((on_time / deals) * 100, 2) if deals else 0,
    }


print(monthly_metrics(sent=480, replies=72, calls=26, deals=9, revenue=112000, on_time=8))`,
          explain: 'Шаблон превращает воронку в конкретные цифры для принятия решений.',
          breakdown: [
            'Считаются ключевые конверсии.',
            'avg_check показывает экономику.',
            'on_time_rate отражает качество исполнения.',
            'Показатели пригодны для целей следующего месяца.'
          ],
          lineByLine: [
            'Все метрики защищены от деления на ноль.',
            'Структура dict удобна для отчёта/дашборда.',
            'Один вызов сразу даёт срез за месяц.'
          ]
        },
        commonErrors: [
          'Смотрят только на выручку без конверсий.',
          'Не анализируют качество исполнения.',
          'Нет weekly разбивки.',
          'Нет KPI-плана на месяц 2.'
        ],
        resultChecklist: [
          'Есть расчёт ключевых метрик.',
          'Есть обнаруженный bottleneck.',
          'Есть план улучшений.',
          'Есть KPI-цели на месяц 2.'
        ],
        practice: [
          'Посчитай метрики отдельно по каналам.',
          'Собери weekly график.',
          'Определи 1 гипотезу роста.',
          'Внедри её в первую неделю месяца 2.'
        ]
      },
      parsing: {
        why: 'Для parsing-направления важны и продажи, и стабильность сервиса одновременно.',
        microExamples: [
          { title: 'Мини-пример 1: quality trend', code: 'quality_week1 -> quality_week4', explain: 'Показывает зрелость процессов.' },
          { title: 'Мини-пример 2: retainer ratio', code: 'retainer_clients / total_clients', explain: 'Показывает долю повторяемого дохода.' },
          { title: 'Мини-пример 3: failure rate', code: 'failed_runs / total_runs', explain: 'Показывает надёжность.' }
        ],
        bigSteps: [
          'Собери метрики parsing за месяц.',
          'Посчитай quality trend и failure rate.',
          'Оцени долю retainer дохода.',
          'Собери стратегию улучшения стабильности/чека.'
        ],
        implementationWalkthrough: [
          'Собери KPI по каждому источнику.',
          'Сравни trend по неделям.',
          'Выдели нестабильные источники.',
          'Определи меры улучшения.',
          'Зафиксируй цели на месяц 2.'
        ],
        fullCode: {
          title: 'Большой пример: parsing monthly health summary',
          code: `def parsing_monthly_summary(total_runs: int, failed_runs: int, quality_avg: float, clients: int, retainers: int, revenue: float) -> dict:
    return {
        "failure_rate": round((failed_runs / total_runs) * 100, 2) if total_runs else 0,
        "quality_avg": quality_avg,
        "retainer_ratio": round((retainers / clients) * 100, 2) if clients else 0,
        "avg_revenue_per_client": round(revenue / clients, 2) if clients else 0,
    }


print(parsing_monthly_summary(total_runs=310, failed_runs=11, quality_avg=92.8, clients=7, retainers=3, revenue=138000))`,
          explain: 'Сводка помогает одновременно видеть стабильность и экономику parsing-направления.',
          breakdown: [
            'failure_rate отвечает за операционный риск.',
            'retainer_ratio показывает устойчивость дохода.',
            'avg_revenue_per_client помогает оценить рост чека.',
            'Метрики пригодны для месячного planning.'
          ],
          lineByLine: [
            'Одной функцией считаются ключевые health+business KPI.',
            'Поля легко выгрузить в отчёт или dashboard.',
            'Результат удобен для сравнения с прошлым месяцем.'
          ]
        },
        commonErrors: [
          'Не считают failure_rate.',
          'Игнорируют retainer долю.',
          'Нет анализа по источникам.',
          'Нет числовых целей на месяц 2.'
        ],
        resultChecklist: [
          'Есть health summary за месяц.',
          'Есть бизнес summary за месяц.',
          'Есть bottleneck и план улучшений.',
          'Есть цели на следующий цикл.'
        ],
        practice: [
          'Сделай weekly таблицу quality/failure.',
          'Определи 2 KPI для роста retainer.',
          'Собери one-page отчёт для себя.',
          'Подготовь целевые показатели на месяц 2.'
        ]
      }
    },
    30: {
      title: 'Модуль 30 · День 30',
      subtitle: 'Финиш месяца: roadmap на месяц 2 и системный рост',
      goal: 'Закрываем первый цикл и строим план роста: новые навыки, цели дохода, продуктовые улучшения.',
      dayPlan: [
        'Разогрев (15 мин): подведи итог «что дал месяц в цифрах».',
        'БОТЫ (60–90 мин): roadmap (ООП, API, webhook, масштабирование).',
        'ПАРСИНГ (60–90 мин): roadmap (API, dashboard, proxy, устойчивость).',
        'Финал (20–30 мин): личный план на 30 дней вперёд с KPI и привычками.'
      ],
      glossary: [
        { term: 'Roadmap', explain: 'План развития по этапам с целями и сроками.' },
        { term: 'Skill gap', explain: 'Навык, которого не хватает для следующего уровня дохода.' },
        { term: 'North Star KPI', explain: 'Главная метрика, которая отражает прогресс.' },
        { term: 'Execution system', explain: 'Повторяемая система действий на каждый день/неделю.' }
      ],
      deliverables: [
        'Личный roadmap на месяц 2 по ботам и парсингу.',
        'Целевой план дохода и KPI.',
        'Список навыков для прокачки (ООП/API/архитектура).',
        'Недельный режим действий (отклики, разработка, упаковка).' 
      ],
      bots: {
        why: 'Рост дохода во 2-м месяце обычно упирается в архитектурные навыки и системность.',
        microExamples: [
          { title: 'Мини-пример 1: skill gap', code: 'FSM -> OOP services -> webhook', explain: 'Понятная лестница роста сложности.' },
          { title: 'Мини-пример 2: KPI цели', code: 'deals_per_month = 6, avg_check = +25%', explain: 'Цифры дают фокус.' },
          { title: 'Мини-пример 3: режим недели', code: 'пн-ср: разработка, чт-пт: продажи/кейсы', explain: 'Режим лучше «как получится». ' }
        ],
        bigSteps: [
          'Определи 3 ключевых навыка месяца 2.',
          'Поставь KPI по сделкам и среднему чеку.',
          'Собери недельный execution-план.',
          'Привяжи обучение к реальным проектам.'
        ],
        implementationWalkthrough: [
          'Оцени текущий уровень и пробелы.',
          'Поставь измеримые цели на 4 недели.',
          'Разбей цели на еженедельные задачи.',
          'Определи обязательные ритуалы (отклики/код/кейсы).',
          'Сделай шаблон еженедельного ревью.'
        ],
        fullCode: {
          title: 'Большой пример: roadmap generator (bots month-2)',
          code: `def build_month2_roadmap(skills: list[str], kpi: dict, weekly_plan: dict) -> dict:
    return {
        "skills": skills,
        "kpi": kpi,
        "weekly_plan": weekly_plan,
        "success_criteria": [
            "выполнено >= 80% недельных задач",
            "рост среднего чека",
            "стабильный поток релевантных диалогов",
        ],
    }


roadmap = build_month2_roadmap(
    skills=["ООП в ботах", "Webhook deploy", "REST API integration"],
    kpi={"deals": 6, "avg_check_growth_percent": 25},
    weekly_plan={"dev_days": 3, "sales_days": 2, "review_day": 1}
)
print(roadmap)`,
          explain: 'Шаблон превращает намерения в измеримый и проверяемый план действий.',
          breakdown: [
            'skills фиксирует вектор роста компетенций.',
            'kpi задаёт бизнес-результат.',
            'weekly_plan делает выполнение регулярным.',
            'success_criteria помогает объективно оценивать прогресс.'
          ],
          lineByLine: [
            'План включает и навыки, и доходные KPI.',
            'Еженедельный режим повышает шанс реального выполнения.',
            'Критерии успеха снимают субъективность оценки.'
          ]
        },
        commonErrors: [
          'Ставят цель без KPI.',
          'План без weekly режима.',
          'Не делают регулярный ревью.',
          'Обучение не связано с коммерческими задачами.'
        ],
        resultChecklist: [
          'Roadmap на месяц 2 сформирован.',
          'Есть измеримые KPI.',
          'Есть недельный execution-ритм.',
          'Есть критерии успешности.'
        ],
        practice: [
          'Сделай personal roadmap на 4 недели.',
          'Добавь еженедельный self-review.',
          'Зафиксируй 3 ключевые привычки.',
          'Поставь первую цель на неделю 1.'
        ]
      },
      parsing: {
        why: 'Во 2-м месяце parsing-рост упирается в устойчивость и продуктовую подачу сервиса.',
        microExamples: [
          { title: 'Мини-пример 1: skill path', code: 'multi-site -> dashboard -> API layer', explain: 'Логичная траектория роста.' },
          { title: 'Мини-пример 2: KPI month-2', code: 'retainers = 4, failure_rate < 2%', explain: 'Связка дохода и надёжности.' },
          { title: 'Мини-пример 3: execution loop', code: 'build -> measure -> improve', explain: 'Цикл улучшений вместо хаоса.' }
        ],
        bigSteps: [
          'Определи roadmap по parsing-направлению.',
          'Поставь KPI по стабильности и доходу.',
          'Собери weekly цикл улучшений.',
          'Подготовь продуктовый оффер месяца 2.'
        ],
        implementationWalkthrough: [
          'Определи ключевые технические улучшения.',
          'Поставь целевые пороги качества/ошибок.',
          'Разбей задачи на недельные спринты.',
          'Собери оффер под обновлённый уровень сервиса.',
          'Планируй еженедельный анализ KPI.'
        ],
        fullCode: {
          title: 'Большой пример: month-2 plan checker (parsing)',
          code: `def check_month2_targets(targets: dict, actuals: dict) -> dict:
    result = {}
    for k, target in targets.items():
        actual = actuals.get(k)
        if actual is None:
            result[k] = "missing"
            continue
        if isinstance(target, (int, float)) and isinstance(actual, (int, float)):
            result[k] = "ok" if actual >= target else "below"
        else:
            result[k] = "check_manually"
    return result


targets = {"retainers": 4, "avg_check": 25000, "quality_avg": 93}
actuals = {"retainers": 3, "avg_check": 27000, "quality_avg": 92.5}
print(check_month2_targets(targets, actuals))`,
          explain: 'Пример даёт простой инструмент контролировать выполнение целей месяца 2.',
          breakdown: [
            'targets фиксируют ожидаемый результат.',
            'actuals — фактические данные недели/месяца.',
            'checker быстро показывает, где отставание.',
            'Подходит для регулярного ревью прогресса.'
          ],
          lineByLine: [
            'missing сразу показывает дырки в сборе данных.',
            'ok/below достаточно для быстрого управления.',
            'Логику легко расширить под более сложные условия.'
          ]
        },
        commonErrors: [
          'Цели не переводят в проверяемые метрики.',
          'Нет регулярного сравнения target vs actual.',
          'Надёжность и доход оценивают отдельно и не связывают.',
          'Нет продуктового обновления оффера.'
        ],
        resultChecklist: [
          'Есть roadmap и KPI на месяц 2.',
          'Есть механизм регулярной проверки прогресса.',
          'Есть недельный цикл улучшений.',
          'Есть обновлённый оффер под новый уровень.'
        ],
        practice: [
          'Собери KPI board на месяц 2.',
          'Сделай первый weekly review.',
          'Обнови оффер под новые цели.',
          'Запусти цикл build-measure-improve.'
        ]
      }
    }
  };

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderTrack(title, data, track) {
    const microHtml = Array.isArray(data.microExamples) && data.microExamples.length
      ? data.microExamples.map((m) => `
        <h3>🔹 ${escapeHtml(m.title || 'Мини-пример')}</h3>
        <div class="code">
          <div class="code-title">Мини-пример</div>
          <pre><code>${escapeHtml(m.code || '')}</code></pre>
        </div>
        <p>${escapeHtml(m.explain || '')}</p>
      `).join('')
      : `
        <h3>🔹 Маленький фрагмент (сначала понять, потом масштабировать)</h3>
        <div class="code">
          <div class="code-title">Мини-пример</div>
          <pre><code>${escapeHtml(data.microCode || '')}</code></pre>
        </div>
        <p>${escapeHtml(data.microExplain || '')}</p>
      `;

    const commonErrorsHtml = Array.isArray(data.commonErrors) && data.commonErrors.length
      ? `
        <h3>🧯 Частые ошибки</h3>
        <ul>${data.commonErrors.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}</ul>
      `
      : '';

    const resultChecklistHtml = Array.isArray(data.resultChecklist) && data.resultChecklist.length
      ? `
        <h3>✅ Критерии «день реально закрыт»</h3>
        <ul>${data.resultChecklist.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}</ul>
      `
      : '';

    const walkthroughHtml = Array.isArray(data.implementationWalkthrough) && data.implementationWalkthrough.length
      ? `
        <h3>🧭 Пошаговый walkthrough</h3>
        <ol>${data.implementationWalkthrough.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol>
      `
      : '';

    const fullCodeHtml = data.fullCode && data.fullCode.code
      ? `
        <h3>🧱 ${escapeHtml(data.fullCode.title || 'Большой рабочий пример')}</h3>
        <div class="code">
          <div class="code-title">Полный пример</div>
          <pre><code>${escapeHtml(data.fullCode.code)}</code></pre>
        </div>
        ${data.fullCode.explain ? `<p>${escapeHtml(data.fullCode.explain)}</p>` : ''}
        ${Array.isArray(data.fullCode.breakdown) && data.fullCode.breakdown.length ? `
          <h3>🔍 Разбор большого блока</h3>
          <ul>${data.fullCode.breakdown.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
        ` : ''}
        ${Array.isArray(data.fullCode.lineByLine) && data.fullCode.lineByLine.length ? `
          <h3>🧠 Построчный/пошаговый разбор</h3>
          <ol>${data.fullCode.lineByLine.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol>
        ` : ''}
      `
      : '';

    return `
      <section class="card track-block" data-track="${track}">
        <h2>${title}</h2>
        <p>${escapeHtml(data.why)}</p>

        ${microHtml}

        <h3>🧩 Большой блок: как собрать рабочий результат</h3>
        <ol>${data.bigSteps.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol>

        ${walkthroughHtml}
        ${fullCodeHtml}
        ${commonErrorsHtml}
        ${resultChecklistHtml}

        <h3>🏋️ Практика</h3>
        <div class="check" data-practice-track="${track}">
          ${data.practice.map((p) => `<label><input type="checkbox" data-practice-check /> ${escapeHtml(p)}</label>`).join('')}
        </div>
      </section>
    `;
  }

  function restorePractice(day) {
    const key = `course_day${day}_practice_checks_v1`;
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem(key) || '[]'); } catch { saved = []; }

    const boxes = Array.from(document.querySelectorAll('input[data-practice-check]'));
    boxes.forEach((box, idx) => {
      box.checked = Boolean(saved[idx]);
      box.addEventListener('change', () => {
        const next = boxes.map((el) => el.checked);
        localStorage.setItem(key, JSON.stringify(next));
      });
    });
  }

  function init(config) {
    const day = config.day;
    const data = DAY_DATA[day];
    if (!data) return;

    const root = document.getElementById('dayDetailedRoot');
    if (!root) return;

    root.innerHTML = `
      <section class="card">
        <h1>${escapeHtml(data.title)}</h1>
        <p>${escapeHtml(data.subtitle)}</p>
        <p><strong>Цель дня:</strong> ${escapeHtml(data.goal)}</p>
        ${Array.isArray(data.dayPlan) && data.dayPlan.length ? `
          <h2>🗺️ План дня</h2>
          <ol>${data.dayPlan.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol>
        ` : ''}

        ${Array.isArray(data.glossary) && data.glossary.length ? `
          <h2>📚 Термины дня (простыми словами)</h2>
          <ul>${data.glossary.map((g) => `<li><strong>${escapeHtml(g.term)}:</strong> ${escapeHtml(g.explain)}</li>`).join('')}</ul>
        ` : ''}

        <div class="switch">
          <a class="btn" href="${escapeHtml(config.prev)}">← Предыдущий день</a>
          ${config.next ? `<a class="btn" href="${escapeHtml(config.next)}">Следующий день →</a>` : ''}
          <a class="btn" href="index.html">К модулям</a>
        </div>
        <div class="course-top-tools">
          <button id="readToggleBtn" class="read-toggle-btn" type="button">📘 Отметить день как прочитанный</button>
          <div class="track-switch">
            <button class="track-btn active" data-track="all" type="button">Все блоки</button>
            <button class="track-btn" data-track="bots" type="button">🤖 Только БОТЫ</button>
            <button class="track-btn" data-track="parsing" type="button">🕷️ Только ПАРСИНГ</button>
          </div>
        </div>
      </section>

      ${renderTrack('🤖 Блок БОТЫ: подробно и по шагам', data.bots, 'bots')}
      ${renderTrack('🕷️ Блок ПАРСИНГ: подробно и по шагам', data.parsing, 'parsing')}

      ${Array.isArray(data.deliverables) && data.deliverables.length ? `
        <section class="card">
          <h2>🎁 Что должно получиться к концу дня</h2>
          <ul>${data.deliverables.map((d) => `<li>${escapeHtml(d)}</li>`).join('')}</ul>
        </section>
      ` : ''}

      ${Array.isArray(data.bonusTips) && data.bonusTips.length ? `
        <section class="card">
          <h2>🚀 Бонус: что ускорит результат</h2>
          <ul>${data.bonusTips.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>
        </section>
      ` : ''}

      <section class="card">
        <h2>📝 Контрольные вопросы дня</h2>
        <ol>
          <li>Что в этом дне главное для клиента, а не только для разработчика?</li>
          <li>Какой минимальный рабочий результат (MVP) ты показываешь сегодня?</li>
          <li>Какие 1–2 риска могут сломать результат, и как ты их снижаешь?</li>
          <li>Что ты добавишь в портфолио по итогам дня?</li>
        </ol>
      </section>
    `;

    restorePractice(day);
    if (window.CourseTools) {
      window.CourseTools.initModulePage(day);
    }
  }

  window.CourseDayDetailed = { init };
})();