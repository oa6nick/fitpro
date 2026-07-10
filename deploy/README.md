# Деплой и эксплуатация FitPro (runbook)

Сервер: `vps-for-all-another` (204.168.243.54), Ubuntu 24.04. Приложение: systemd-юнит `fitpro`,
Node слушает `127.0.0.1:3000`, наружу смотрит nginx. БД: нативный PostgreSQL 16, база `fitpro`.

## Раскладка на сервере

```
/opt/fitpro/
  repo.git/            # bare-репозиторий — приёмник git push
  releases/<ts>/       # выкладки (храним 5)
  current -> releases/<ts>
  deploy.sh            # копия deploy/deploy.sh (обновляется при изменении)
  deploy-scripts/      # backup.sh, restore-test.sh
  shared/
    server.env         # ЕДИНСТВЕННОЕ место секретов (600, owner fitpro)
    backup-pass        # passphrase шифрования бэкапов (600; копия в менеджере паролей)
    uploads/           # файлы пользователей (UPLOADS_DIR)
/var/backups/fitpro/<ts>/   # db.dump, uploads.tgz, server.env.gpg, SHA256SUMS
```

## Деплой

С ноутбука: `git push server main` (remote `server` = `vps-for-all-another:/opt/fitpro/repo.git`).
Хук post-receive запускает `deploy.sh`: checkout релиза → npm ci → typecheck+тесты → vite build →
`db:migrate` (seed НЕ запускается) → переключение `current` → restart → smoke `/health`
с автооткатом на предыдущий релиз при провале.

Ручной откат: `ln -sfnT /opt/fitpro/releases/<старый> /opt/fitpro/current && systemctl restart fitpro`.

## Бэкапы

- Ежедневно 02:47 UTC (`fitpro-backup.timer`): pg_dump custom + uploads.tgz +
  **server.env.gpg** (шифрованные секреты — восстановимы из любого бэкапа).
- Ретенция 14 дней, `latest` — симлинк на свежий.
- **Раз в месяц**: `sudo /opt/fitpro/deploy-scripts/restore-test.sh` (восстановление во временную базу).
- **Off-server копия** (с ноутбука): `scp -r vps-for-all-another:/var/backups/fitpro/latest/ <локально>`.
- Расшифровка секретов: `gpg -d --passphrase "<из менеджера паролей>" server.env.gpg`.

## Push-уведомления (web-push / VAPID)

Ключи в `shared/server.env`: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.
Без них push выключен — приложение работает как раньше (кнопка подписки скрыта).
Генерация: `node -e "console.log(require('web-push').generateVAPIDKeys())"`.
Push отправляется автоматически из `notify()` — любое уведомление-колокольчик
дублируется в браузер, если пользователь подписался. Мёртвые подписки (404/410)
чистятся сами. Service worker: `client/public/push-sw.js` (только push, не кэш).

## Фоновые задачи

- `fitpro-reminders.timer` (09:00 UTC, Persistent) → `npm run job:reminders`:
  уведомляет клиента и тренера за 5 дней до конца оплаченного периода.
  Идемпотентно: `payments.reminded_at` не даст отправить дважды.
  Ручной прогон: `systemctl start fitpro-reminders.service`,
  логи: `journalctl -u fitpro-reminders`.

## Наблюдаемость

- Логи приложения: `journalctl -u fitpro -f`.
- Healthcheck: `fitpro-healthcheck.timer` (каждые 5 мин, рестарт при падении /health).
- Access-логи: `/var/log/nginx/fitpro.access.log` (+ GoAccess-отчёт — по образцу oasix-stats).

## Включение HTTPS (поддомен fitpro.oasixlab.com)

1. A-запись `fitpro` → 204.168.243.54 в GoDaddy (у пользователя API-доступ).
2. `certbot --nginx -d fitpro.oasixlab.com`.
3. В `shared/server.env`: `COOKIE_SECURE=true`, `CLIENT_ORIGIN=https://fitpro.oasixlab.com`,
   `PUBLIC_URL=https://fitpro.oasixlab.com` → `systemctl restart fitpro`.
4. В IP-блоке nginx заменить тело на `return 301 https://fitpro.oasixlab.com$request_uri;`.

## Подключение ЮKassa (когда появится)

Что потребуется: домен+HTTPS (см. выше), публичная оферта на сайте, магазин в ЮKassa
(shopId + секретный ключ в `server.env`). Код: таблица `payment_intents` (аддитивная миграция),
`services/yookassa.ts` (создание платежа + вебхук с проверкой подписи и идемпотентностью),
кнопки тарифов уже ведут на `/register?plan=` — активация подписки в вебхуке через
`trainer_subscriptions` (upsert plan/paidUntil/clientLimit из `services/plans.ts`).
До этого тарифы активируются вручную: UPDATE в `trainer_subscriptions`.

## Первичная установка (выполнено при переводе в прод — для справки)

См. историю: создание юзера `fitpro`, bare-репо + хук, nginx `sites-available/fitpro` +
`snippets/fitpro-common.conf`, `systemctl enable fitpro fitpro-backup.timer fitpro-healthcheck.timer`,
`ufw deny 3000` не требуется (Node слушает 127.0.0.1).
