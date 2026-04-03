# ONLINE DEPLOY CHECKLIST

## 1) Backend (fast-backend)
- Папка: `plan/fast-backend`
- Файлы для деплоя уже готовы:
  - `Dockerfile`
  - `render.yaml`
  - `requirements.txt`

### Render
1. Push в GitHub.
2. На Render -> New -> Web Service -> подключи репозиторий.
3. Убедись, что сервис стартует и `GET /api/health` возвращает `{"status":"ok"}`.

## 2) Frontend (папка plan)
- Это статический сайт, можно выкладывать на GitHub Pages / Cloudflare Pages.

### После публикации фронта
В консоли браузера на сайте выполнить:

`localStorage.setItem('planApiBase', 'https://<backend-domain>/api')`

и обновить страницу.

## 3) Проверка после выкладки
- Открыть `30d-main-tasks.html`, отметить 1 задачу, обновить страницу -> прогресс сохранён.
- Открыть `profile-cosmetics.html` -> уровень не растёт без действий.
- Открыть любую игру, получить XP, вернуться в план -> XP учитывается корректно и без повторной накрутки.
- Нажать `RESET` на главной -> прогресс очищается.

## 4) Что осталось вручную
- Регистрация/логин в Render и GitHub.
- Привязка доменов (если нужен кастомный).
- Запуск фронта на выбранном static-host сервисе.
