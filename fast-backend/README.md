# fast-backend (отдельный FastAPI backend)

Это отдельный бэкенд для сайта из папки `plan`.

## Что умеет
- `GET /api/health` — проверка, что сервер жив
- `GET /api/state/{key}` — прочитать состояние по ключу
- `PUT /api/state/{key}` — записать состояние по ключу

Разрешённые ключи состояния:
- `main_tracker`
- `verification`
- `burnout`
- `character_profile`
- `profile_cosmetics`
- `shop_achievements`
- `code_dungeon`
- `bot_builder`
- `game_stats`
- `parser_defense`

## Быстрый запуск (локально)
1. Создай/активируй виртуальное окружение Python.
2. Установи зависимости из `requirements.txt`.
3. Запусти сервер командой:
   - `python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --app-dir .`

Или просто запусти `start_backend.ps1`.

## Подключение фронтенда
Во фронтенде задай:
- `localStorage.setItem('planApiBase', 'http://127.0.0.1:8001/api')`

После этого страницы будут ходить в новый отдельный backend.

## Деплой в онлайн (Render)
1. Залей папку `plan/fast-backend` в GitHub.
2. На Render создай Web Service из репозитория.
3. Render автоматически подхватит `Dockerfile` (или `render.yaml`).
4. Дождись статуса `Live` и проверь:
   - `GET https://<твой-домен>.onrender.com/api/health` → `{ "status": "ok" }`

## Подключение фронта к онлайн API
Открой сайт в браузере и один раз выполни в консоли:
- `localStorage.setItem('planApiBase', 'https://<твой-домен>.onrender.com/api')`

После перезагрузки все страницы будут использовать онлайн backend.

## Полный сброс прогресса
- На главной странице `30d-main-tasks.html` есть кнопка `RESET` в верхней панели.
- Она очищает и локальное состояние, и backend-состояние.
