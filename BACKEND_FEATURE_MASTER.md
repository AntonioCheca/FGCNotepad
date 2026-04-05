# Backend Feature Master

This document defines how backend features must be implemented in FGCNotepad.

## Stack and architecture baseline

- Framework: Symfony (PHP 8.2+), Doctrine ORM, Postgres.
- Data source of truth: Postgres only.
- Backend/frontend contract: Symfony JSON APIs under `/api/*`.
- Layering rule:
  - Controller = request parsing, auth checks, HTTP responses.
  - Service = business logic.
  - Repository = persistence/query concerns.
  - Entity = domain data model + ORM mapping.

## Current feature domains

Implement new work following existing domains and naming patterns:

- Auth: registration and login check.
- Moves: search/list/read move data.
- Characters: list character data.
- Connection types: list connection metadata.
- Combos/sequences: list/create/read/update/delete and full combo creation.
- Posts/forum: create/read/list/update/delete posts with tags/components.
- Mixed strategy game solver: controller delegates to a single service that invokes Python.
- Data ingestion commands: frame-data download/import and minimum fixtures generation.

## Mandatory coding standards

- Every new PHP file must use `declare(strict_types=1);`.
- Type declarations are mandatory for parameters, returns, and properties whenever possible.
- Keep methods focused and short; one responsibility per method.
- Prefer value objects/services over dumping logic in controllers.
- No broad refactors outside scope of requested feature.
- Comments should be rare; only keep them for truly non-obvious behavior.
- Do not leave commented-out code blocks.
- Use meaningful names over explanatory comments.

## Naming and structure conventions

- PHP classes use `PascalCase`.
- Methods and variables use `camelCase`.
- Entities follow existing Doctrine mapping style in this repo (including snake_case DB column alignment where already established).
- Controllers should use resource-oriented route prefixes under `/api/*`.
- Keep one clear responsibility per class:
  - Controller classes end with `Controller`.
  - Repository classes end with `Repository`.
  - Services should have explicit intent in naming (`*Service`, `*Solver`, `*Extractor`, etc.).

## Class/function size guidance

- Prefer small methods that can be read quickly in one pass.
- When a controller action starts combining validation, orchestration, and domain decisions, extract domain decisions into a service method.
- Avoid classes that become "god objects"; split by capability when responsibilities drift.

## Controller rules

- Controllers must not contain domain algorithms.
- Controllers may:
  - Validate/parse request payloads.
  - Call services/repositories.
  - Return proper status codes and payloads.
- Controllers must not:
  - Implement matrix/solver/business rules directly.
  - Build complex SQL in-place.

## Service rules

- Create or update a service when business behavior is non-trivial.
- Services should be deterministic and directly testable.
- Python interaction is allowed only through dedicated Symfony services.
- If Python is used, keep a single backend entry service that owns script invocation and output decoding.

## Repository and query rules

- Query complexity belongs in repositories.
- Keep repository APIs explicit (`findAllLeafs`, `findAllNonLeafs`, etc.).
- Preserve Postgres-aware performance practices:
  - Avoid N+1 when loading related data.
  - Select only needed fields/relations.
  - Keep indexing and FK impact in mind for any schema proposal.

## Entity and migration safety gate

Any change to Doctrine entities or migrations is blocked until user confirmation.

Required behavior:

1. Detect that the task requires Entity/schema/migration change.
2. Stop implementation.
3. Present short impact summary (tables, columns, relations, migration intent).
4. Ask explicit confirmation.
5. Continue only after approval.

This applies to both major and minor schema changes.

## Testing policy (mandatory)

- Backend behavior changes require tests.
- Default testing approach:
  - Service/domain logic: unit-style tests with real logic, avoid mocking by default.
  - Controller/API behavior: integration-style tests (request/response status + payload).
  - Repository behavior: query/result tests where behavior is custom.
- Avoid mocks unless external boundary cannot reasonably be exercised.
- Do not merge backend behavior changes without passing backend tests.
- For Python-backed behavior, test both service output contract and controller response behavior.

## API contract guidelines

- Keep endpoint naming consistent with existing style.
- Validate request payloads and fail with explicit client errors.
- Return machine-friendly JSON structures.
- Preserve backwards compatibility unless a breaking change is explicitly requested.
- Remove ad-hoc debug output (`dump`, temporary logs) before finishing implementation unless logging is intentionally part of behavior.

## Definition of done for backend features

- Endpoint/service/repository responsibilities are cleanly separated.
- Strict typing is respected.
- No schema change was made without explicit user approval.
- Backend tests were added/updated and run successfully.
- Implementation stays readable without explanatory comments.
