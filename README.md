# FGCNotepad

<p align="center">
  <img src="frontend/public/logos/fgt-completo-color-pos.svg" alt="FGCNotepad logo" width="480">
</p>

FGCNotepad is a forum-wiki hybrid for fighting game analysis from a game theory perspective. It helps players study matchups, combos, oki setups, scenarios, and strategic decisions, with the current data focus on Street Fighter 6.

## Stack

- Backend: Symfony 7.2, PHP `>=8.2`, Composer, Doctrine ORM.
- Frontend: Next.js 16, React 19, TypeScript, npm `10.8.1`.
- Node.js: `>=22.13.0` for host development and frontend validation.
- Database: PostgreSQL 15.
- Optional solver/runtime work: Python, called through Symfony services.

## Repository Structure

- `backend/`: Symfony API, Doctrine entities/migrations, services, tests, and Python integration files.
- `frontend/`: Next.js app, React UI, hooks, services, styles, and frontend checks.
- `docker/`: development and production Nginx/Docker support files.
- `scripts/`: production deploy and backup helpers.
- `docs/`: specialised planning and feature notes.
- `AGENTS.md`: required entry point for AI-assisted work.
- `docs/ai/`: detailed implementation rules for AI-assisted backend, frontend, and config/ops work.
- `CONTRIBUTING.md`: fork, branch, pull request, and review workflow.

## Environment Files

- Use tracked examples as references: `backend/.env.example`, `backend/.env.test.example`, `frontend/.env.example`, and `.env.prod.example`.
- Keep real local overrides in ignored files such as `backend/.env.local`, `backend/.env.test.local`, or `frontend/.env.local`.
- Keep real production values in ignored `.env.prod` on the server. Never commit production secrets or JWT private keys.
- Generate JWT keys with `make create-jwt-keys` for Docker development or `make local-create-jwt-keys` for local host development.

## Development Paths

### Docker Development

Recommended for Linux contributors and deployment-parity work.

`docker-compose.yml` is the development Compose file. It starts PostgreSQL, Symfony PHP-FPM, Nginx, and a frontend container with bind-mounted source.

```bash
make build
make up
make composer-install
make npm-install
make create-jwt-keys
make create-test-database
make migrate
make migrate-test
```

Run the frontend dev server in the frontend container when needed:

```bash
make frontend-dev
```

Frontend: `http://localhost:3000`. Backend through development Nginx: `http://localhost:8000`.

### Local Host Development

Recommended for Windows contributors.

Install PHP `>=8.2`, Composer, Node.js `>=22.13.0`, npm, PostgreSQL 15 or compatible, and Symfony CLI. Put machine-specific database settings in `backend/.env.local` and test settings in `backend/.env.test.local` when needed.

```bash
make local-setup
```

Run the app in two terminals:

```bash
make local-serve
```

```bash
make local-frontend
```

Frontend: `http://localhost:3000`.

## Main Commands

- `make help`: list available project commands.
- `make up`: start Docker development services.
- `make stop`: stop Docker development services.
- `make logs`: follow Docker service logs.
- `make local-setup`: install dependencies, create JWT keys, create databases, and run migrations for host development.
- `make local-serve`: start the local Symfony server.
- `make local-frontend`: start the local Next.js dev server.
- `make check`: run the canonical validation workflow.

## Validation

Run this before opening a pull request:

```bash
make check
```

`make check` runs `npm run check` in `frontend/` and `composer check` in `backend/`. That currently includes frontend type checks, frontend tests, ESLint, React Doctor, backend PHPUnit, and PHPStan. No separate React Doctor command is required.

## Production Notes

- `docker-compose.prod.yml` is the production Compose file. It builds production images, runs Nginx as the public entry point, and keeps application services on the Docker network.
- Copy `.env.prod.example` to ignored `.env.prod` on the server and fill in real secrets before starting production.
- Start production with `docker compose -f docker-compose.prod.yml up -d --build`.
- Run production migrations explicitly with `docker compose -f docker-compose.prod.yml exec backend php bin/console doctrine:migrations:migrate --no-interaction`.
- PostgreSQL is bound to `127.0.0.1:5432` in production for SSH tunnel access only. Do not open PostgreSQL to the public internet.
- `NEXT_PUBLIC_API_URL=/api` is the production frontend API setting.
- Production JWT keys live in the `jwt_keys` Docker volume and must not be committed.
- `scripts/deploy-prod.sh` and `scripts/backup-prod-db.sh` provide deploy and backup helpers.

## More Documentation

- Contribution workflow: `CONTRIBUTING.md`.
- AI agent rules: `AGENTS.md`.
- Backend architecture and rules: `docs/ai/BACKEND_FEATURE_MASTER.md`.
- Frontend architecture and UI rules: `docs/ai/FRONTEND_FEATURE_MASTER.md`.
- Config, operations, and deployment conventions: `docs/ai/CONFIG_OPS_MASTER.md`.
- FAT frame-data attribution: `docs/FAT_ATTRIBUTION.md`.
- Replay Lab notes: `docs/replay-lab-0x-plan.md`.
- Brand asset notice: `NOTICE.md`.

## License

FGCNotepad source code is licensed under `AGPL-3.0-only`. See `LICENSE`.

Logo and brand assets are covered separately in `NOTICE.md`.

FAT frame-data attribution is documented separately in `docs/FAT_ATTRIBUTION.md`.
