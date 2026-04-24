# FGCNotepad

FGCNotepad is a forum-wiki hybrid platform designed to analyze fighting games from a Game Theory perspective. It helps
players break down matchups, explore optimal combos and oki setups, and structure in-depth strategic thinking. The
platform is currently focused on Street Fighter 6, with plans for extensibility in the future.

### 🌐 Project Structure

Backend made in Symfony (PHP) with frontend made in Next.js, and database in Postgresql.

## 🚀 Getting Started

## 🔧 Setup

Choose your preferred development environment:

### Option A: Docker (Recommended for Linux/Mac)

**Prerequisites:**

- Docker and Docker Compose

**One-Time Setup:**
Clone the repo and run:

```bash
make build
make composer-install
make create-jwt-keys
make create-test-database
make migrate
make migrate-test
```

**Development:**

- Start: `make up`
- Stop: `make stop`

Once running, access the frontend via http://localhost:3000.

### Option B: Local Development (Windows-friendly)

**Prerequisites:**

- PHP 8.1+ with extensions (pdo_pgsql, curl, mbstring, xml, zip)
- Node.js 18+
- PostgreSQL 14+
- Composer
- Symfony

**Database Setup:**

1. Create a PostgreSQL database and user
2. Copy `.env.example` to `.env` and configure your database connection:
   ```
   DATABASE_URL="postgresql://username:password@127.0.0.1:5432/fgc_db"
   ```

**One-Time Setup:**
Clone the repo and run:

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

**Development:**
Start both servers in separate terminals:

```bash
# Terminal 1 - Backend
make local-serve

# Terminal 2 - Frontend  
make local-frontend
```

**Testing:**
You can check the backend works by running:

```bash
make local-test
```

Once running, access the frontend via http://localhost:3000.

### 🆘 Need Help?

Run `make help` to see all available commands for both Docker and local development.

### 🧰 Makefile Commands

Command Description

`make up` Start containers and build the project

`make down` Stop and remove all containers

`make logs` Show and follow logs from all services

`make composer-install`    Install PHP dependencies via Composer

`make create-jwt-keys`    Generate JWT keys for Symfony auth

`make migrate`    Run backend DB migrations

`make migrate-test`    Run test DB migrations

`make create-test-database`    Create a PostgreSQL database for test purposes

`make bash`    Open a bash shell inside the backend container

`make psql`    Access PostgreSQL CLI inside the container

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
