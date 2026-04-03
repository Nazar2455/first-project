# Plan Backend (FastAPI)

Бэкенд для сайта из папки `plan`.

## Что умеет

- `GET /api/health` — проверка состояния сервера
- `GET /api/state/{key}` — получить сохранённое состояние
- `PUT /api/state/{key}` — сохранить состояние
- `user_id` поддерживается через query-параметр или заголовок `X-User-ID`

Разрешённые ключи:
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

## Переменные окружения

- `DEFAULT_USER_ID=local` — пользователь по умолчанию для локального режима
- `CORS_ORIGINS=*` — список доменов фронта через запятую
- `ENV=development` — режим запуска
- `DATABASE_URL=` — PostgreSQL-строка подключения; если пусто, используется локальный SQLite-файл

## Запуск

1. Установить зависимости из `requirements.txt`
2. Запустить сервер:

`uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`

## Как это использовать для онлайна

- Пока фронт не передаёт пользователя, данные идут в `local`-scope.
- Когда добавишь авторизацию, просто начни передавать `X-User-ID` или `user_id`.
- Это позволит сохранить совместимость без переделки всех страниц сразу.

## Что делает PostgreSQL-режим

Если задан `DATABASE_URL`, backend автоматически:

- подключается к PostgreSQL;
- хранит `state_store` как `JSONB`;
- создаёт таблицу `users` для будущей авторизации;
- использует индекс по `(user_id, key)`.
