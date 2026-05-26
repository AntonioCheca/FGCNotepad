# FGCNotepad

FGCNotepad is a forum-wiki hybrid platform designed to analyze fighting games from a Game Theory perspective. It helps
players break down matchups, explore optimal combos and oki setups, and structure in-depth strategic thinking. The
platform is currently focused on Street Fighter 6, with plans for extensibility in the future.

### Project Structure

Backend is Symfony/PHP, frontend is Next.js/React, and the database is PostgreSQL.

## Getting Started

### Expected Tooling

- PHP `>=8.2` with required Symfony extensions such as `pdo_pgsql`, `curl`, `mbstring`, `xml`, and `zip`.
- Node.js `>=20`; Node 20 is the recommended local baseline.
- npm is the current frontend package manager. Do not use Bun, pnpm, or yarn for this project baseline.
- Composer is used for backend PHP dependencies.
- PostgreSQL 15 is used by `docker-compose.yml`.
- Symfony CLI is used by the local backend server commands.

### Environment Files

- Backend defaults are tracked in `backend/.env` for Symfony compatibility.
- Safe setup reference values are in `backend/.env.example` and `frontend/.env.example`.
- Test setup reference values are in `backend/.env.test.example`.
- Real local overrides should go in ignored files such as `backend/.env.local`, `backend/.env.dev.local`, `backend/.env.test.local`, or `frontend/.env.local`.
- Generate local JWT keys with `make local-create-jwt-keys` for host development or `make create-jwt-keys` for Docker development.

### Option A: Docker

Docker is the recommended workflow for Linux contributors and deployment-like parity.

Prerequisites:

- Docker and Docker Compose

One-time setup:

```bash
make build
make up
make composer-install
make create-jwt-keys
make create-test-database
make migrate
make migrate-test
```

Development:

- `make build` builds the containers.
- `make up` starts containers with `docker compose up`; it does not build them.
- `make stop` stops containers.
- `make logs` follows service logs.

Once running, access the frontend via http://localhost:3000.

### Option B: Local Development

Local host development is the recommended Windows workflow.

Prerequisites:

- PHP `>=8.2`
- Node.js `>=20`
- npm
- PostgreSQL 15 or compatible local PostgreSQL server
- Composer
- Symfony CLI

Database setup:

1. Create a PostgreSQL database and user.
2. Use `backend/.env.example` as the safe reference for required variables.
3. Put machine-specific connection details in `backend/.env.local`.

Windows local test DB setup (required for `make check-backend`):

1. Copy `backend/.env.test.example` values into `backend/.env.test.local` when your host/test credentials differ.
2. Keep `POSTGRES_DB` set to the base name (for example `fgc_db`); Symfony appends `_test` in test env.
3. Create and migrate the test database with:

```bash
make local-create-test-database
make local-migrate-test
```

4. Run backend validation with:

```bash
make check-backend
```

One-time setup:

```bash
make local-setup
```

Or step by step:

```bash
make local-composer-install
make local-npm-install
make local-create-jwt-keys
make local-create-database
make local-create-test-database
make local-migrate
make local-migrate-test
```

Development:

```bash
# Terminal 1 - Backend
make local-serve

# Terminal 2 - Frontend
make local-frontend
```

Once running, access the frontend via http://localhost:3000.

### Makefile Commands

- `make help` lists available commands.
- `make build` builds Docker containers.
- `make up` starts Docker containers.
- `make stop` stops Docker containers.
- `make logs` follows Docker service logs.
- `make composer-install` installs backend dependencies in Docker.
- `make npm-install` installs frontend dependencies in Docker.
- `make create-jwt-keys` generates Symfony JWT keys in Docker.
- `make migrate` runs backend database migrations in Docker.
- `make migrate-test` runs test database migrations in Docker.
- `make create-test-database` creates the Docker test database.
- `make bash` opens a shell inside the backend container.
- `make psql` opens PostgreSQL CLI inside the database container.
- `make local-setup` runs the local host setup sequence.
- `make local-test` runs backend PHPUnit locally.

### Validation

- `make check` runs frontend and backend validation.
- `make check-frontend` runs `npm run check` in `frontend/`.
- `make check-backend` runs `composer check` in `backend/`.
- `make audit` runs frontend and backend security audits.
- `make audit-frontend` runs `npm audit` in `frontend/`.
- `make audit-backend` runs `composer audit` in `backend/`.

Frontend scripts:

- `npm run typecheck` runs TypeScript without emitting output.
- `npm test` runs existing `node:test` test files.
- `npm run lint` runs ESLint CLI with the existing flat config.
- `npm run check` runs typecheck, tests, then lint.

Backend scripts:

- `composer test` runs PHPUnit.
- `composer phpstan` runs PHPStan with a 1G memory limit.
- `composer check` runs PHPUnit, then PHPStan.

Known baseline failures:

- Frontend `node:test` tests compile through the existing TypeScript compiler before running on Node.
- Frontend lint currently reports warnings (no lint errors), so `make check-frontend` passes.
- Backend PHPUnit requires a reachable test database; configure `backend/.env.test.local` and run `make local-create-test-database` + `make local-migrate-test` when host defaults do not match.
- Security audit commands currently report advisories. Remediation is tracked as follow-up tickets below.

Audit follow-up tickets:

- `SEC-FE-001`: Upgrade `axios`/`follow-redirects` chain in `frontend/` and re-run `make audit-frontend`.
- `SEC-FE-002`: Upgrade `next`/`postcss` in `frontend/` and validate app-router/cache related advisories.
- `SEC-FE-003`: Evaluate `react-use` major upgrade path required to remediate `js-cookie` advisory.
- `SEC-BE-001`: Upgrade Symfony components to patched ranges (`>=7.4.12` where applicable) and re-run `make audit-backend`.
- `SEC-BE-002`: Upgrade `twig/twig` to `>=3.26.0` and validate template/sandbox compatibility.
- `SEC-BE-003`: Upgrade `league/commonmark` and re-verify markdown sanitization behavior.
- `SEC-BE-004`: Upgrade dev dependency `phpunit/phpunit` to a patched version and re-run backend checks.

Future tickets should address these failures directly instead of hiding them from validation commands.

## ✍️ Contribution Guidelines

We follow Clean Code principles:

- Descriptive variable and class names

- Short, focused functions

- Low indentation levels

- Self-documenting code, no comments unless justified

Pull Requests

- Fork the repository
- Create a feature branch
- Submit a pull request for review
- Backend code should include tests (PHPUnit) where applicable
- Documentation is optional if the code is clean
- No front-end test suite is currently in place

## 🎨 Theme Tokens

The tactical/editorial theme is configured in `frontend/styles/theme.ts` and consumed through semantic tokens.

- Light mode now uses neutral product surfaces (`background.default`, `background.paper`, `surface.subtle`) with brand colors kept as accents.
- Cream is reserved for highlight usage (`highlight.surface`) instead of full page backgrounds.
- Dark mode surface roles are explicit and reusable: `app.canvas`, `app.sidebar`, `surface.base`, `surface.raised`, `surface.sunken`, and `control.default`.
- Dark mode accent semantics are strict: `accent.parser`, `accent.primary`, `accent.selected`, `accent.warning`, `accent.success`, `accent.danger`.
- Active navigation and parser states should use `accent.selected`; parser actions should use `accent.parser`; warnings/success/danger must use matching semantic accent tokens only.

When styling feature pages (including Create Combo), prefer semantic token usage over hardcoded color values.

## 🧭 Roadmap

### ✅ Current Features

- Create and edit posts using a Lexical editor
- Tag moves directly inside posts
- Model and solve payoff tables with a Mixed Equilibrium optimiser
- Define and analyze in-game scenarios

### 🛣️ In Progress / Planned

- Excel-like payoff matrix input UX
- Secondary table referencing for scenario trees
- Improved modeling for combos
- Automatically suggest optimal combo paths starting from a selected move
- Support for hit-confirmability (whether something is a read or can be reacted to)
- Add Drive Gauge and Meter as resources in analysis
- Support for moderator roles to help with content review
- Replay integration: automatically extract data from uploaded match videos

## 📜 License

MIT License

## Issues

For bugs, feature requests, or discussion:

Open a GitHub Issue

Use GitHub Discussions

Or reach out to us through the Discord
