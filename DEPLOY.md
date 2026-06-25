# Деплой FitPro по IP (без домена)

MVP разворачивается как **один Node-процесс**: Express отдаёт и собранный фронт (`client/dist`),
и API на одном порту. Доступ — `http://<IP>:<PORT>`. БД по умолчанию — встроенный **PGlite**
(файл, без Docker). Этого достаточно для демо.

## Требования на сервере
- Node.js ≥ 20, git.
- Открытый в firewall порт (например 8080).

## Шаги
```bash
# 1. Получить код
git clone <repo-url> fitpro && cd fitpro

# 2. Зависимости
npm install                      # ставит и server, и client (workspaces)

# 3. Конфиг продакшена
cp server/.env.production.example server/.env
#   В server/.env обязательно:
#   JWT_SECRET=<openssl rand -hex 32>
#   PORT=8080  HTTP_HOST=0.0.0.0  SERVE_CLIENT=true  COOKIE_SECURE=false  NODE_ENV=production

# 4. Собрать фронт
npm run prod:build               # vite build -> client/dist

# 5. Создать БД и демо-данные (один раз)
npm run prod:setup               # db:migrate + seed (читает server/.env)

# 6. Запуск
npm start                        # Express на 0.0.0.0:8080, отдаёт SPA + API
```

Открыть: `http://<IP>:8080`. Демо-логины: `trainer@fitpro.ru` / `client1@fitpro.ru` / `password123`.

## Фон/автозапуск (любой из вариантов)
- **pm2:** `pm2 start "npm start" --name fitpro && pm2 save`
- **systemd:** unit с `ExecStart=/usr/bin/npm start`, `WorkingDirectory=/opt/fitpro`, `EnvironmentFile`.

## Заметки про «по IP без домена»
- Работает по plain HTTP. Поэтому `COOKIE_SECURE=false` (иначе браузер не шлёт сессионную cookie).
- Когда появится домен — поставить за Caddy/nginx с TLS, тогда `COOKIE_SECURE=true` и порт 443.
- Для нагрузки/нескольких инстансов — переключить БД на внешний Postgres: `DB_DRIVER=pg` + `DATABASE_URL`.
