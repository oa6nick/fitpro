#!/usr/bin/env bash
# Проверка восстановимости последнего бэкапа: restore во временную базу,
# подсчёт таблиц/строк, drop. Запускать вручную ~раз в месяц (runbook).
set -euo pipefail

LATEST=/var/backups/fitpro/latest
TEST_DB=fitpro_restore_test

[ -f "$LATEST/db.dump" ] || { echo "Нет $LATEST/db.dump"; exit 1; }

echo "==> Проверка контрольных сумм"
(cd "$LATEST" && sha256sum -c SHA256SUMS)

echo "==> Restore в $TEST_DB"
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $TEST_DB;"
sudo -u postgres psql -c "CREATE DATABASE $TEST_DB;"
sudo -u postgres pg_restore --no-owner --no-acl -d "$TEST_DB" "$LATEST/db.dump"

TABLES=$(sudo -u postgres psql -tAc \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" "$TEST_DB")
USERS=$(sudo -u postgres psql -tAc "SELECT count(*) FROM users;" "$TEST_DB" 2>/dev/null || echo "0")
echo "==> Таблиц: $TABLES, пользователей: $USERS"

sudo -u postgres psql -c "DROP DATABASE $TEST_DB;"

if [ "$TABLES" -lt 20 ]; then
  echo "!! Подозрительно мало таблиц ($TABLES) — проверить бэкап"
  exit 1
fi
echo "==> Restore-test пройден"
