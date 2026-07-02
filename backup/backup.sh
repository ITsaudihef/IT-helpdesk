#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/backups"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
TIMESTAMP="$(date -u +%Y%m%d-%H%M%S)"
FILE="$BACKUP_DIR/helpdesk-$TIMESTAMP.dump"

mkdir -p "$BACKUP_DIR"

echo "[backup] $(date -u -Iseconds) starting pg_dump -> $FILE"
pg_dump "$DATABASE_URL" --format=custom --file="$FILE"

# Sanity check: a corrupt/truncated dump fails to list its own table of contents
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

echo "[backup] $(date -u -Iseconds) done"
