build:
	docker compose build --no-cache

up:
	docker compose up

stop:
	docker compose stop

logs:
	docker compose logs -f

create-jwt-keys:
	docker exec -it fgc_backend php bin/console lexik:jwt:generate-keypair

migrate:
	docker exec -it fgc_backend php bin/console doctrine:migrations:migrate --no-interaction

migrate-test:
	docker exec -it fgc_backend php bin/console doctrine:migrations:migrate --env=test --no-interaction

create-test-database:
	docker exec -i fgc_postgres createdb -U fgc_user fgc_db_test

composer-install:
	docker exec -it fgc_backend composer install

# Install frontend dependencies (creates node_modules on host)
npm-install:
	docker exec -it fgc_frontend npm install

# Install all dependencies
install: composer-install npm-install

# Start frontend development server
frontend-dev:
	docker exec -it fgc_frontend npm run dev

# Setup frame data and basic fixtures
setup-frame-data:
	@echo "Setting up frame data and fixtures..."
	@echo "Step 1: Downloading FAT JSON frame data..."
	docker exec -it fgc_backend php bin/console frame-data:download:fat-json
	@echo "Step 2: Importing frame data from FAT JSON..."
	docker exec -it fgc_backend php bin/console frame-data:import:fat-json
	@echo "Step 3: Creating minimum fixtures (combo types, visibilities, season)..."
	docker exec -it fgc_backend php bin/console app:create-fixtures
	@echo "Step 4: Generating leaf combo sequences from moves..."
	docker exec -it fgc_backend php bin/console app:generate-leafs
	@echo "Frame data setup complete!"

bash:
	docker exec -it fgc_backend bash

frontend-bash:
	docker exec -it fgc_frontend bash

psql:
	docker exec -it fgc_postgres psql -U fgc_user -d fgc_db

# Local development commands
local-setup:
	@echo "Setting up local development environment..."
	@echo "Make sure you have PHP, Node.js, and PostgreSQL installed!"
	$(MAKE) local-composer-install
	$(MAKE) local-npm-install
	$(MAKE) local-create-jwt-keys
	$(MAKE) local-create-database
	$(MAKE) local-create-test-database
	$(MAKE) local-migrate
	$(MAKE) local-migrate-test

local-composer-install:
	cd backend && composer install

local-npm-install:
	cd frontend && npm install

local-create-jwt-keys:
	cd backend && php bin/console lexik:jwt:generate-keypair

local-migrate:
	cd backend && php bin/console doctrine:migrations:migrate --no-interaction

local-migrate-test:
	cd backend && php bin/console doctrine:migrations:migrate --env=test --no-interaction

local-create-database:
	cd backend && php bin/console doctrine:database:create --if-not-exists

local-create-test-database:
	cd backend && php bin/console doctrine:database:create --env=test --if-not-exists

local-serve:
	@echo "Starting Symfony development server..."
	@echo "Frontend should be started separately with: npm run dev"
	@echo "Ensuring no stale Symfony process is registered..."
	-cd backend && symfony server:stop
	cd backend && symfony server:start -d --no-tls
	cd backend && symfony server:status
	@echo "Streaming backend logs (Ctrl+C to stop log tail)..."
	cd backend && symfony server:log

local-serve-detached:
	cd backend && symfony server:start -d

local-frontend:
	cd frontend && npm run dev

local-stop:
	cd backend && symfony server:stop

local-psql:
	psql -U fgc_user -d fgc_db

local-test:
	cd backend && php bin/phpunit

# Convenience commands that work for both
help:
	@echo "Available commands:"
	@echo ""
	@echo "Docker commands:"
	@echo "  build                - Build and start Docker containers"
	@echo "  up                   - Start Docker containers"
	@echo "  stop                 - Stop Docker containers"
	@echo "  composer-install     - Install PHP dependencies in Docker"
	@echo "  create-jwt-keys      - Generate JWT keys in Docker"
	@echo "  migrate              - Run migrations in Docker"
	@echo "  migrate-test         - Run test migrations in Docker"
	@echo "  create-test-database - Create test database in Docker"
	@echo ""
	@echo "Local development commands:"
	@echo "  local-setup          - Complete local environment setup"
	@echo "  local-composer-install - Install PHP dependencies locally"
	@echo "  local-npm-install    - Install Node.js dependencies locally"
	@echo "  local-create-jwt-keys - Generate JWT keys locally"
	@echo "  local-migrate        - Run migrations locally"
	@echo "  local-migrate-test   - Run test migrations locally"
	@echo "  local-create-database - Create database locally"
	@echo "  local-create-test-database - Create test database locally"
	@echo "  local-serve          - Start Symfony dev server"
	@echo "  local-frontend       - Start frontend dev server"
	@echo "  local-stop           - Stop Symfony dev server"
	@echo "  local-test           - Run PHPUnit tests locally"
	@echo ""
	@echo "Run 'make help' to see this message"

.PHONY: build up stop logs create-jwt-keys migrate migrate-test create-test-database composer-install bash frontend-bash psql local-setup local-composer-install local-npm-install local-create-jwt-keys local-migrate local-migrate-test local-create-database local-create-test-database local-serve local-serve-detached local-frontend local-stop local-psql local-test help
