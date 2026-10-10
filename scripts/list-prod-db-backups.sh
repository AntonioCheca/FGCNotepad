#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BACKUP_DIR="${BACKUP_DIR:-/opt/fightinggametheory/backups/postgres}"

if [ ! -d "$BACKUP_DIR" ]; then
    echo "Backup directory does not exist: ${BACKUP_DIR}"
    exit 0
fi

find "$BACKUP_DIR" -maxdepth 1 -type f -name '*.dump' -printf '%TY-%Tm-%Td %TH:%TM  %s bytes  %p\n' | sort -r
