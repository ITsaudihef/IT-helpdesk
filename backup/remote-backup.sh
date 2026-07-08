#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/var/lib/postgresql/data/backups"
RETENTION_DAYS="7"
TIMESTAMP="$(date -u +%Y%m%d-%H%M%S)"
FILE="$BACKUP_DIR/helpdesk-$TIMESTAMP.dump"

mkdir -p "$BACKUP_DIR"

echo "[backup] $(date -u -Iseconds) starting pg_dump -> $FILE"
pg_dump "$DATABASE_URL" --format=custom --file="$FILE"

if ! pg_restore --list "$FILE" > /dev/null; then
  echo "[backup] ERROR: dump failed integrity check, removing partial file" >&2
  rm -f "$FILE"
  exit 1
fi

SIZE="$(du -h "$FILE" | cut -f1)"
echo "[backup] pg_dump finished successfully ($SIZE)"

echo "[backup] pruning backups older than $RETENTION_DAYS days"
find "$BACKUP_DIR" -name 'helpdesk-*.dump' -mtime +"$RETENTION_DAYS" -print -delete

echo "[backup] current backups on volume:"
ls -lh "$BACKUP_DIR"

# Refresh staging from this backup — best-effort, does not fail the backup job itself.
if [ -n "${STAGING_DATABASE_URL:-}" ]; then
  echo "[backup] refreshing staging from this backup"
  if pg_restore --clean --if-exists --no-owner --no-privileges \
      --dbname="$STAGING_DATABASE_URL" "$FILE" 2>&1; then
    echo "[backup] staging refresh finished successfully"
  else
    echo "[backup] WARNING: staging refresh had errors (see above) — production backup is unaffected" >&2
  fi
else
  echo "[backup] STAGING_DATABASE_URL not set, skipping staging refresh"
fi

echo "[backup] $(date -u -Iseconds) done"
