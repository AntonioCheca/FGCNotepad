
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

# NEW: Install frontend dependencies (creates node_modules on host)
npm-install:
	docker exec -it fgc_frontend npm install

# NEW: Install all dependencies
install: composer-install npm-install

# NEW: Start frontend development server
frontend-dev:
	docker exec -it fgc_frontend npm run dev

bash:
	docker exec -it fgc_backend bash

frontend-bash:
	docker exec -it fgc_frontend bash

psql:
	docker exec -it fgc_postgres psql -U fgc_user -d fgc_db
