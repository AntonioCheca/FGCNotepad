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
# Under sudo, pull as the invoking user so root never writes into the user-owned checkout.
if [ -n "${SUDO_USER:-}" ]; then
    sudo -u "$SUDO_USER" git pull --ff-only
else
    git pull --ff-only
fi

echo "Validating production Compose config..."
compose config >/dev/null

echo "Building production images..."
compose build

echo "Starting production services..."
compose up -d

echo "Restarting Nginx..."
# Nginx resolves the backend/frontend upstreams only at startup, so recreated app containers leave it pointing at stale IPs.
compose exec -T nginx nginx -t
compose restart nginx

echo "Running Doctrine migrations..."
compose exec -T backend php bin/console doctrine:migrations:migrate --no-interaction

echo "Checking Symfony production runtime..."
compose exec -T backend php bin/console about --env=prod

echo "Deploy complete. Check /api/health through the production proxy."
