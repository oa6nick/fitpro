# Деплой FitPro (прод: https://fitpro.oasixlab.com)

Прод живёт на VPS `vps-for-all-another` (204.168.243.54): systemd-юнит `fitpro`
(Node на 127.0.0.1:3000) за nginx с TLS Let's Encrypt, БД — нативный PostgreSQL 16.
Полный runbook (раскладка, бэкапы, откат, HTTPS, план ЮKassa): **`deploy/README.md`**.

## Обычный деплой

```bash
git push server main     # remote server = vps-for-all-another:/opt/fitpro/repo.git
```

Хук post-receive на сервере: релиз в `releases/<ts>` → `npm ci` → typecheck + тесты →
vite build → `db:migrate` (seed НИКОГДА не запускается на проде) → атомарное
переключение симлинка `current` → restart → smoke `/health` с автооткатом.

## Локальная разработка

```bash
npm install
npm run dev              # server: tsx watch (PGlite), client: vite
npm test                 # vitest: in-memory PGlite, 29+ тестов
npm run typecheck
```

По умолчанию dev работает на встроенном PGlite (`server/.env` не обязателен) и
`EMAIL_PROVIDER=off` — коды подтверждения печатаются в консоль сервера.

## Первичная установка на чистый сервер

1. Node ≥ 20, git, PostgreSQL (`apt install postgresql`), nginx, certbot.
2. Роль и база: `CREATE ROLE fitpro LOGIN PASSWORD '...'; CREATE DATABASE fitpro OWNER fitpro;`
3. Юзер и раскладка: `useradd -r fitpro`, `/opt/fitpro/{repo.git,releases,shared/uploads,deploy-scripts}`,
   `git init --bare /opt/fitpro/repo.git`.
4. `shared/server.env` — по образцу `server/.env.production.example` (chmod 600);
   `shared/backup-pass` — passphrase шифрования бэкапов (копию — в менеджер паролей!).
5. Установить из `deploy/`: systemd-юниты, nginx-конфиг+snippet, deploy.sh, хук post-receive,
   backup-скрипты (см. `deploy/README.md`).
6. `git push server main` → первый релиз; `systemctl enable --now fitpro fitpro-backup.timer fitpro-healthcheck.timer`.
7. TLS: A-запись → `certbot --nginx -d <домен>` → в env `COOKIE_SECURE=true`, `PUBLIC_URL/CLIENT_ORIGIN=https://...`.

## Включение почты (Resend)

В `shared/server.env`: `EMAIL_PROVIDER=resend`, `RESEND_API_KEY=...`,
`EMAIL_FROM="FitPro <hello@oasixlab.com>"` (домен верифицирован в Resend) → `systemctl restart fitpro`.
Пока `EMAIL_PROVIDER=off` — коды видны в `journalctl -u fitpro`.

## Подключение ЮKassa

См. раздел в `deploy/README.md` — потребуется оферта на сайте и магазин ЮKassa;
схема и тарифы (`server/src/services/plans.ts`) уже готовы к активации подписок.
