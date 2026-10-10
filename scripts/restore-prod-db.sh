#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f .env.prod ]; then
    echo "Missing .env.prod. Copy .env.prod.example to .env.prod and fill production values first." >&2
    exit 1
fi

BACKUP="${BACKUP:-}"
CONFIRM_PROD_DB_RESTORE="${CONFIRM_PROD_DB_RESTORE:-}"
COMPOSE="${COMPOSE:-docker compose}"

if [ -z "$BACKUP" ]; then
    echo "Missing BACKUP. Usage: make prod-db-restore BACKUP=/path/to/backup.dump CONFIRM_PROD_DB_RESTORE=restore" >&2
    exit 1
fi

if [ ! -f "$BACKUP" ]; then
    echo "Backup file not found: ${BACKUP}" >&2
    exit 1
fi

if [ "$CONFIRM_PROD_DB_RESTORE" != "restore" ]; then
    echo "Refusing to restore production database without confirmation." >&2
    echo "Run with CONFIRM_PROD_DB_RESTORE=restore after verifying the backup path." >&2
    exit 1
fi

restart_app() {
    $COMPOSE -f docker-compose.prod.yml up -d backend frontend >/dev/null
}

trap restart_app EXIT

echo "Stopping application services before restore..."
$COMPOSE -f docker-compose.prod.yml stop frontend backend

echo "Restoring production Postgres database from: ${BACKUP}"
cat "$BACKUP" | $COMPOSE -f docker-compose.prod.yml exec -T postgres sh -c \
    'PGPASSWORD="$POSTGRES_PASSWORD" pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --no-privileges'

echo "Restore complete. Restarting application services. Run smoke checks before continuing data work."
