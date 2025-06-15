up:
	docker-compose up -d --build

down:
	docker-compose down

logs:
	docker-compose logs -f

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

bash:
	docker exec -it fgc_backend bash

psql:
	docker exec -it fgc_postgres psql -U fgc_user -d fgc_db
