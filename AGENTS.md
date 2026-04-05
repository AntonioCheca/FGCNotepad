# FGCNotepad AI Entry Point

This file is the mandatory entry point for AI-assisted work in this repository.

## Environment default assumption

- Assume local development is Windows unless the user explicitly says otherwise.
- On Windows, prefer host-installed tooling and `make local-*` commands.
- On Linux, prefer Docker-based workflow (`make build`, `make up`, and related Docker commands).
- Do not switch workflow style mid-task unless requested.

Before writing code, the agent must read and follow:

1. `BACKEND_FEATURE_MASTER.md`
2. `FRONTEND_FEATURE_MASTER.md`
3. `CONFIG_OPS_MASTER.md`

If any instruction conflicts, apply this order of precedence:

1. User request in the current conversation
2. Safety constraints from the runtime/system
3. This `AGENTS.md`
4. The three master files
5. Existing code conventions in the touched area

## Non-negotiable rules

- Never import MUI directly outside frontend UI wrapper files.
- Backend data truth always lives in Postgres and is accessed through Symfony API endpoints.
- Controllers orchestrate I/O; business logic must live in dedicated services.
- Backend behavior changes require tests.
- Avoid mocking by default, especially in backend domain/service tests.
- Use strict typing whenever possible (backend mandatory, frontend target state).
- Any Entity or Doctrine migration change requires explicit user confirmation before implementation.

## Planning contract (required for every feature)

When presenting a plan to the user for approval, keep it short and use this vocabulary:

- `Creating a new API endpoint in the backend for X action`
- `Creating or updating backend service to isolate Y responsibility`
- `Creation said hook to read from that endpoint in frontend`
- `Creating or updating frontend component to render Z`
- `Adding backend tests for endpoint/service behavior`

Do not present long design docs in approval steps; provide concise action bullets.

## Execution contract

- If schema/entity changes are needed, stop and request confirmation first.
- If uncertain, prefer consistency with existing touched files over broad refactors.
- Do not perform opportunistic rewrites outside the feature scope.
- Keep files understandable by reading; comments only for non-obvious behavior.
