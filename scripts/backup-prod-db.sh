#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f .env.prod ]; then
    echo "Missing .env.prod. Copy .env.prod.example to .env.prod and fill production values first." >&2
    exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-/opt/fightinggametheory/backups/postgres}"
BACKUP_RETENTION="${BACKUP_RETENTION:-14}"
COMPOSE="${COMPOSE:-docker compose}"
POSTGRES_DB="$($COMPOSE -f docker-compose.prod.yml exec -T postgres sh -c 'printf "%s" "$POSTGRES_DB"')"
SAFE_DB_NAME="$(printf "%s" "$POSTGRES_DB" | tr -c 'A-Za-z0-9_.-' '_')"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/${SAFE_DB_NAME}_${TIMESTAMP}.dump"

mkdir -p "$BACKUP_DIR"

echo "Creating Postgres backup: ${BACKUP_FILE}"
$COMPOSE -f docker-compose.prod.yml exec -T postgres sh -c \
    'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --compress=9 --file=-' \
    > "$BACKUP_FILE"

echo "Backup complete: ${BACKUP_FILE}"

if [ "$BACKUP_RETENTION" -gt 0 ]; then
    ls -1t "${BACKUP_DIR}"/*.dump 2>/dev/null | tail -n +$((BACKUP_RETENTION + 1)) | xargs -r rm --
    echo "Retained latest ${BACKUP_RETENTION} backup(s)."
fi
