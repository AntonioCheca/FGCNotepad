#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f .env.prod ]; then
    echo "Missing .env.prod. Copy .env.prod.example to .env.prod and fill production values first." >&2
    exit 1
fi

compose() {
    docker compose -f docker-compose.prod.yml "$@"
}

echo "Updating repository..."
git pull --ff-only

echo "Validating production Compose config..."
compose config >/dev/null

echo "Building production images..."
compose build

echo "Starting production services..."
compose up -d

echo "Running Doctrine migrations..."
compose exec -T backend php bin/console doctrine:migrations:migrate --no-interaction

echo "Checking Symfony production runtime..."
compose exec -T backend php bin/console about --env=prod

echo "Deploy complete. Check /api/health through the production proxy."
