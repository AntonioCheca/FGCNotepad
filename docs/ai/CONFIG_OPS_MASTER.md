# Config and Ops Master

This document defines rules for configuration, environments, Docker/local operations, and cross-runtime integrations.

## Runtime topology

- Backend: Symfony/PHP.
- Frontend: Next.js/React.
- Database: Postgres.
- Algorithm runtime: PHP services under Symfony.
- Primary local orchestration: Docker Compose + Makefile helpers.

## Supported development setups (both are first-class)

FGCNotepad intentionally supports two local development modes:

1. Windows-first host setup (recommended on Windows contributors).
2. Linux Docker setup (recommended on Linux contributors and deployment-like parity).

Both setups must remain supported when changing config/ops files.

## Environment and secrets policy

- Never commit secrets, private keys, or local-only credential files.
- Keep environment-specific values in `.env*` files expected by Symfony/Next.
- Use existing environment variable names and conventions.
- If a required env var is missing for a feature, document it clearly in the task output.

## Docker and local workflow policy

Use existing project commands and avoid introducing parallel tooling unless requested.

- Windows workflow (default unless user says otherwise):
  - Prefer host-installed PHP/Composer/Node/Postgres.
  - Use `make local-*` commands (`local-setup`, `local-serve`, `local-frontend`, `local-test`, etc.).
- Linux workflow:
  - Prefer Docker Compose flow (`make build`, `make up`, `make stop`, container-based commands).
- Docker-oriented workflow is defined by root `docker-compose.yml` and `Makefile` targets.
- Local workflow is defined by `make local-*` commands.
- Prefer extending existing commands over replacing workflow patterns.
- Do not assume Docker on Windows unless explicitly requested.
- Do not remove support for either setup while improving the other.

## Database operations policy

- Data truth is Postgres.
- Doctrine migrations are authoritative for schema evolution.
- Any schema-impacting change (Entity/migration) requires explicit user confirmation before implementation.
- Migration quality expectations:
  - Clear description.
  - Reversible down path when feasible.
  - No destructive assumptions without explicit approval.

## External runtime integration policy

- External runtime usage is allowed only when isolated behind one Symfony service boundary.
- Controllers must call the Symfony service, not external scripts directly.
- External scripts should exchange data through explicit JSON contracts.
- Handle process failure and invalid output deterministically.
- If migrating external runtime logic into PHP is proposed, treat it as explicit scoped work, not opportunistic refactor.

## Build, lint, and validation expectations

- Backend changes should be validated with backend tests.
- Frontend changes should be validated with type/lint/build commands when relevant.
- Prefer project-standard commands (`make` and package scripts) over ad hoc command chains.
- Validation should follow the active setup style (Windows local commands vs Linux Docker commands).

## Change-scope policy

- Keep config/ops changes scoped to the requested feature.
- Do not rewrite unrelated Docker, nginx, or Compose definitions without need.
- Preserve compatibility with current development flow (Docker + local setup support).

## Planning and approval behavior for AI-assisted tasks

When presenting implementation plans for approval, keep them concise and use this vocabulary:

- `Creating a new API endpoint in the backend for X action`
- `Creating or updating backend service to isolate Y responsibility`
- `Creation said hook to read from that endpoint in frontend`
- `Creating or updating frontend component to render Z`
- `Adding backend tests for endpoint/service behavior`

Do not provide long design documents during approval steps.

## Definition of done for config/ops changes

- No secret leakage or unsafe defaults introduced.
- Existing Docker/local workflow remains functional.
- Any schema-affecting change was explicitly confirmed first.
- External runtime/Symfony integration boundaries remain clean and testable.
