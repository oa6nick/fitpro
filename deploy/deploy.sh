#!/usr/bin/env bash
# Деплой FitPro: вызывается post-receive-хуком (или вручную: deploy.sh <sha>).
# Релизы в /opt/fitpro/releases/<ts>, атомарное переключение симлинка current,
# smoke-проверка /health с автооткатом. Seed НИКОГДА не запускается.
set -euo pipefail

BASE=/opt/fitpro
REPO=$BASE/repo.git
RELEASES=$BASE/releases
SHARED=$BASE/shared
KEEP=5
SHA="${1:?Использование: deploy.sh <git-sha|ветка>}"

TS=$(date +%Y%m%d-%H%M%S)
REL=$RELEASES/$TS
echo "==> Релиз $TS из $SHA"

mkdir -p "$REL"
git --git-dir="$REPO" --work-tree="$REL" checkout -f "$SHA" -- .

cd "$REL"
# Секреты: server/.env -> shared (dotenv подхватит при старте)
ln -sfn "$SHARED/server.env" server/.env

echo "==> npm ci (полные зависимости: tsx/vite нужны в рантайме и сборке)"
npm ci --no-audit --no-fund

echo "==> typecheck + тесты"
npm run typecheck
npm test

echo "==> Сборка фронта"
npm run prod:build

echo "==> Миграции БД (без seed!)"
npm run db:migrate

echo "==> Права: релиз переходит юзеру fitpro"
chown -R fitpro:fitpro "$REL"

PREV=$(readlink -f "$BASE/current" 2>/dev/null || true)
echo "==> Переключение current -> $REL (пред.: ${PREV:-нет})"
ln -sfnT "$REL" "$BASE/current"
sudo -n systemctl restart fitpro 2>/dev/null || systemctl restart fitpro

echo "==> Smoke-проверка /health"
ok=""
for i in $(seq 1 15); do
  sleep 2
  if curl -sf http://127.0.0.1:3000/health | grep -q '"status":"ok"'; then
    ok=1
    break
  fi
done

if [ -z "$ok" ]; then
  echo "!! Smoke провален — откат"
  if [ -n "$PREV" ] && [ -d "$PREV" ]; then
    ln -sfnT "$PREV" "$BASE/current"
    sudo -n systemctl restart fitpro 2>/dev/null || systemctl restart fitpro
    echo "!! Откатились на $PREV"
  fi
  exit 1
fi

curl -s http://127.0.0.1:3000/health
echo ""

echo "==> Чистка старых релизов (храним $KEEP)"
ls -1dt "$RELEASES"/* 2>/dev/null | tail -n +$((KEEP + 1)) | while read -r old; do
  [ "$old" != "$(readlink -f "$BASE/current")" ] && rm -rf "$old" && echo "   удалён $old"
done

echo "==> Готово: $TS"
