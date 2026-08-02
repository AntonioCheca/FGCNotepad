# FGCNotepad AI Entry Point

This file is the mandatory entry point for AI-assisted work in this repository.

## Environment default assumption

- Assume local development is Windows unless the user explicitly says otherwise.
- On Windows, prefer host-installed tooling and `make local-*` commands.
- On Linux, prefer Docker-based workflow (`make build`, `make up`, and related Docker commands).
- Do not switch workflow style mid-task unless requested.

Before writing code, the agent must read and follow:

1. `docs/ai/BACKEND_FEATURE_MASTER.md`
2. `docs/ai/FRONTEND_FEATURE_MASTER.md`
3. `docs/ai/CONFIG_OPS_MASTER.md`

If any instruction conflicts, apply this order of precedence:

1. User request in the current conversation
2. Safety constraints from the runtime/system
3. This `AGENTS.md`
4. The three master files under `docs/ai/`
5. Existing code conventions in the touched area

## Non-negotiable rules

- Never import MUI directly outside frontend UI wrapper files.
- Backend data truth always lives in Postgres and is accessed through Symfony API endpoints.
- Controllers orchestrate I/O; business logic must live in dedicated services.
- Backend behavior changes require tests.
- Avoid mocking by default, especially in backend domain/service tests.
- Use strict typing whenever possible (backend mandatory, frontend target state).
- Any Entity or Doctrine migration change requires explicit user confirmation before implementation.
- Do not use JSON or JSONB columns in migrations; model data with normal typed columns or relational tables/foreign keys instead.

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

## Lightsail VM production command notes

- Production runs on the Lightsail VM from `~/FGCNotepad` using `docker-compose.prod.yml`.
- VM commands usually need `sudo docker compose -f docker-compose.prod.yml ...`.
- Before deploy instructions, remind the user that `.env.prod` is ignored and must be reviewed manually after pulling changes.
- Production env rows that commonly need manual review after deploy-related changes: `APP_PUBLIC_DOMAIN`, `CORS_ALLOW_ORIGIN`, `SYMFONY_TRUSTED_HOSTS`, `NEXT_PUBLIC_API_URL`, `NEXT_SERVER_API_URL`, and `REGISTRATION_ENABLED`.
- Use `sudo docker compose -f docker-compose.prod.yml config` to validate production Compose on the VM.
- Use `sudo docker compose -f docker-compose.prod.yml exec -T backend php bin/console doctrine:migrations:migrate --no-interaction` for production migrations.
- Use `sudo docker compose -f docker-compose.prod.yml exec -T backend php bin/console app:registration-invite:create --label="alpha-tester-name"` to create a one-time registration invite code.
- Use `sudo docker compose -f docker-compose.prod.yml exec -T nginx nginx -t` to validate production Nginx after TLS/config changes.
- Current HTTPS/TLS production cert files are expected only on the VM at `/opt/fightinggametheory/secrets/tls/cloudflare-origin.pem` and `/opt/fightinggametheory/secrets/tls/cloudflare-origin.key`; never commit or print their contents.
- Production Nginx publishes only ports `80` and `443`; Postgres remains bound to `127.0.0.1:5432` and app services remain internal.

## React Doctor workflow

When running React Doctor from `frontend/` on Windows, use the non-interactive command with the explicit Node 24 PATH override:

```powershell
$env:CI = "1"; $env:Path = "C:\Users\Pc-com\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.18.0-win-x64;$env:Path"; npx react-doctor@0.8.1 --no-telemetry --verbose
```

Use `CI=1` to force non-interactive behavior, `--no-telemetry` to avoid the telemetry prompt, `react-doctor@0.8.1` to pin the expected version, and the PATH prefix so `node` resolves to Node `24.18.0` instead of the older local PATH Node. If Node PATH is already correct, this shorter command is acceptable from `frontend/`:

```powershell
$env:CI = "1"; npx react-doctor@0.8.1 --no-telemetry --verbose
```

## FGC Tactical Editorial UI System

This project uses a tactical editorial visual system anchored to two separate artist palettes. Do not merge them into a single 8-color set.

### Artist palette split

- Light theme palette only:
  - Red `#d72829`
  - Orange `#f78002`
  - Amber `#fcbf49`
  - Cream `#eae2b7`
- Dark theme palette only:
  - Navy `#003049`
  - Teal Dark `#246f89`
  - Teal Mid `#4d9eba`
  - Teal Light `#a2ccdb`
- Derived shades are allowed only when needed for accessibility/state clarity, and must be documented and tokenized in the global theme.

### Semantic token rules

- Use semantic tokens (theme-level) instead of raw hex in page components.
- Derived shades are implemented and documented in `frontend/styles/theme.ts` via `lightTokens`, `darkTokens`, and explicit semantic mappings under `getDesignTokens`.
- Required semantic groups:
  - `background.default`, `background.paper`
  - `surface.raised`, `surface.subtle`, `surface.sunken`
  - `text.primary`, `text.secondary`, `text.disabled`
  - `border.default`, `border.strong`
  - `action.primary`, `action.primaryHover`, `action.secondary`, `action.danger`, `action.disabled`
  - `feedback.error`, `feedback.warning`, `feedback.success`, `feedback.info`
  - `selection.active`, `selection.hover`
  - `focus.outline`
- Do not add one-off color values in feature components.

### CTA hierarchy

- Each screen should have one clear primary CTA.
- Secondary actions must be visually quieter (`outlined`/subtle surface treatment).
- Destructive actions should use danger semantics and should not compete with primary actions.

### Surface rules

- Use layered surfaces with clear hierarchy: `background` -> `paper` -> `surface.raised/subtle/sunken`.
- In dark mode, enforce these reusable roles before adding feature-specific styling:
  - `app.canvas` = deepest page background
  - `app.sidebar` = navigation chrome
  - `surface.base` = normal content panels
  - `surface.raised` = active/high-priority panels
  - `surface.sunken` = grouped inner regions
  - `control.default` = fields/inputs/select/button bases
- Keep border treatment consistent via semantic border tokens.
- Prefer segmented/grouped sections over long flat blocks.
- Avoid gradient backgrounds on tactical/editorial forms and page shells unless explicitly requested.

### Accent semantics (dark mode)

- Use explicit accent tokens and keep accent families constrained on primary workflows:
  - `accent.parser` = parser/ingestion actions
  - `accent.primary` = final primary CTA on the page
  - `accent.selected` = selected/focused/active UI states
  - `accent.warning` = warnings only
  - `accent.success` = success/readiness only
  - `accent.danger` = destructive/danger states only
- Do not use ad hoc purple accents unless they are intentionally documented as a brand accent.

### Density and layout tone

- Favor dense, elegant layouts for advanced workflows.
- Constrain field widths by expected input size (for example short title/damage fields should not span full-width containers on desktop).
- Prefer compact section spacing and avoid oversized "giant card" treatments for routine form sections.

### Copy density and redundancy

- Prefer one clear title per screen or section; do not add subtitles by default.
- Remove helper text that restates visible controls, counts, filenames, selected values, button labels, or obvious page purpose.
- Keep explanatory copy only when it changes user behavior: warnings, privacy/security constraints, destructive actions, validation, permissions, loading/error/empty states, or non-obvious workflow requirements.
- Avoid repeating the same entity name in page title, section title, card title, and row title; show it once in the highest-value location.
- When copy is needed, make it short and specific rather than instructional marketing text.
- Super important: remove redundant functionality and redundant text. Do not add a button/link that goes to the same destination as another visible page or sidebar action, and do not add text that says something trivial, implicitly assumed, or already stated elsewhere on the screen.

### Feedback, error, and success rules

- Prefer inline or toast feedback; avoid blocking native dialogs for routine form flows.
- Map messages to semantic feedback roles (`error`, `warning`, `success`, `info`).
- Keep validation feedback near relevant form sections.

### Icon usage rules

- Use consistent icon families and tokenized icon colors.
- Meaningful icons/controls must maintain at least `3:1` contrast against adjacent surfaces.
- Do not use color alone to convey critical status; include label or context text.

### Accessibility contrast requirements

- Normal text: minimum `4.5:1` contrast ratio.
- Large text (18pt regular or 14pt bold equivalent): minimum `3:1`.
- Meaningful UI graphics/icons/controls and state indicators: minimum `3:1`.
- Focus states must always be visible and should meet non-text contrast guidance.

### Page migration QA checklist

- Visual:
  - no horizontal overflow
  - consistent spacing scale
  - consistent radius and border treatment
  - adjacent controls in the same row must be center-aligned on desktop (for example token strip vs editor panel, and primary input vs primary CTA rows)
  - no random raw hex values in page components
- Theme:
  - light mode and dark mode both verified
  - artist palette split respected per mode
  - derived shades only through documented semantic tokens
- UX:
  - one clear primary CTA
  - secondary actions quieter than primary
  - loading/error/empty states visible and clear
  - feedback shown inline/toast (not blocking alerts)
- Accessibility:
  - text and controls meet WCAG AA contrast targets
  - focus indicators visible
  - inputs have accessible labels
- Regression:
  - existing functionality still works
  - no API behavior changes
  - no data model/schema changes

### UI Library Strategy

- Strategy choice: Hybrid approach (Option D).
- MUI remains useful as the underlying accessibility and complex input foundation (inputs, autocomplete, dialogs, data-heavy controls).
- Brand-heavy tactical/editorial surfaces should use shared project components and semantic tokens first, with MUI treated as an implementation detail behind wrappers.
- New UI work should prefer:
  1. Semantic theme tokens in `frontend/styles/theme.ts`
  2. Wrapper-level primitives in `frontend/src/components/ui/*`
  3. Tactical shared surfaces/components for page composition
- To avoid mixing visual systems accidentally:
  - never import MUI directly outside wrapper files
  - avoid raw hex values in feature/page components
  - do not introduce parallel ad hoc styling systems for the same page area
