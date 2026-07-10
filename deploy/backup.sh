#!/usr/bin/env bash
# Бэкап FitPro: pg_dump (custom) + uploads + ШИФРОВАННАЯ копия server.env.
# По образцу skilldrill/deploy/online/backup-online.sh.
# Passphrase шифрования: /opt/fitpro/shared/backup-pass (chmod 600),
# копия passphrase — ТОЛЬКО в менеджере паролей.
set -euo pipefail

SHARED=/opt/fitpro/shared
DEST_ROOT=/var/backups/fitpro
RETENTION_DAYS=14
TS=$(date +%Y%m%d-%H%M%S)
DEST=$DEST_ROOT/$TS

# DATABASE_URL из server.env
DATABASE_URL=$(grep -E '^DATABASE_URL=' "$SHARED/server.env" | cut -d= -f2-)
[ -n "$DATABASE_URL" ] || { echo "DATABASE_URL не найден в $SHARED/server.env"; exit 1; }

mkdir -p "$DEST"

echo "==> pg_dump"
pg_dump --format=custom --no-owner --no-acl "$DATABASE_URL" > "$DEST/db.dump"

echo "==> uploads"
tar -czf "$DEST/uploads.tgz" -C "$SHARED" uploads

echo "==> Шифрованная копия секретов"
if [ -f "$SHARED/backup-pass" ]; then
  gpg --batch --yes --symmetric --cipher-algo AES256 \
      --passphrase-file "$SHARED/backup-pass" \
      -o "$DEST/server.env.gpg" "$SHARED/server.env"
else
  echo "!! $SHARED/backup-pass отсутствует — секреты НЕ сохранены в бэкап" >&2
fi

echo "==> Контрольные суммы и метаданные"
(cd "$DEST" && sha256sum ./* > SHA256SUMS)
cat > "$DEST/metadata.json" <<META
{"ts":"$TS","host":"$(hostname)","db":"fitpro","files":$(ls "$DEST" | wc -l)}
META

ln -sfnT "$DEST" "$DEST_ROOT/latest"

echo "==> Ретенция: $RETENTION_DAYS дней"
find "$DEST_ROOT" -maxdepth 1 -type d -name '20*' -mtime +$RETENTION_DAYS -exec rm -rf {} \;

echo "==> Готово: $DEST"
du -sh "$DEST"
