# FGCNotepad AI Entry Point

This file is the mandatory entry point for AI-assisted work in this repository.

## Environment default assumption

- Assume local development is Ubuntu on WSL with the Docker workflow unless the user explicitly says otherwise.
- Prefer Docker-based commands (`make build`, `make up`, `docker compose exec -T backend ...`, `docker compose exec -T frontend ...`) over host-installed tooling.
- The Windows host setup (`make local-*`) is a secondary option; it needs host PHP 8.4+ and Node 24.
- Production (Lightsail) is also Ubuntu running Docker, so the Docker workflow is the closest match to production.
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

In the default Docker workflow, run React Doctor inside the frontend container:

```bash
docker compose exec -T frontend sh -c 'CI=1 npx react-doctor@0.8.1 --no-telemetry --verbose'
```

When running React Doctor from `frontend/` on a Windows host instead, use the non-interactive command with the explicit Node 24 PATH override:

```powershell
$env:CI = "1"; $env:Path = "C:\Users\Pc-com\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.18.0-win-x64;$env:Path"; npx react-doctor@0.8.1 --no-telemetry --verbose
```

Use `CI=1` to force non-interactive behavior, `--no-telemetry` to avoid the telemetry prompt, `react-doctor@0.8.1` to pin the expected version, and the PATH prefix so `node` resolves to Node `24.18.0` instead of the older local PATH Node. If Node PATH is already correct, this shorter command is acceptable from `frontend/`:

```powershell
$env:CI = "1"; npx react-doctor@0.8.1 --no-telemetry --verbose
```

## Dependency Security Maintenance

- Run dependency audits before releases and at least monthly.
- In the Linux Docker workflow, run `docker compose exec -T frontend npm audit` and `docker compose exec -T backend composer audit`.
- Apply non-breaking npm remediation first with `docker compose exec -T frontend npm audit fix`; inspect the resulting manifest and lockfile changes.
- Do not use `npm audit fix --force` without explicit user approval because it may introduce breaking major-version updates.
- After dependency changes, run `npm ci`, `npm run check`, and a production frontend build using the project-supported runtime.
- When project OpenCode skills change, quit and restart OpenCode before relying on them.

## Mobile and responsive UI requirements

- New or updated frontend screens must be mobile-first unless explicitly scoped to desktop-only tooling.
- App-level navigation must not permanently consume mobile viewport width. Use persistent/sidebar chrome on desktop and closed/off-canvas or equivalent mobile navigation on small screens.
- Do not solve responsive issues by patching isolated fixed widths when a shared wrapper/layout primitive can solve the pattern.
- Classify fixed widths before changing them:
  - layout widths must be responsive and centralized
  - content max widths are allowed for readability
  - control widths may be desktop-specific but should become full-width or wrap on mobile
  - dense data grids may use intrinsic widths only inside explicit scroll containers
- Standard responsive pattern for data-heavy views: desktop table, mobile card/list, internal scroll only for true matrix/grid editors.
- Page body must not horizontally overflow at common mobile widths.
- Prefer `100dvh`/`100svh` over plain `100vh` where mobile browser chrome affects layout.
- Preserve touch usability: important interactive controls should remain comfortably tappable on mobile.
- Mobile QA for frontend changes should include 320px, 360px, 390px, 430px, 768px, 1024px, and desktop widths.
- React Doctor does not validate responsive layout. Use browser/manual QA or Playwright viewport checks for mobile overflow and navigation behavior.
- Every task that touches frontend pages or components must run the mobile audit before finishing (see `docs/mobile-audit.md`):
  - `make mobile-audit ONLY='<regex of touched routes>'`, or the full `make mobile-audit` when shared components, theme or layout change. It logs in through a dev-only one-time login link; no credentials are needed.
  - Touched routes must keep strict pass (✓) at 360px and 390px and must not drop more than 5 points against the latest snapshot in `docs/mobile-audit/`.
  - New routes must be added to `resolveRoutes` in `frontend/scripts/mobile-audit/audit.mjs`; desktop-only routes are flagged there and stay limited to the Admin section.
  - Report the before/after scores in the task summary; if the audit cannot run, say so explicitly.
- Follow `docs/mobile-plan.md` and the `mobile-ui` skill for page compositions.

### Hybrid responsive page architecture

- Frontend pages must be designed for mobile as first-class screens, not compressed desktop layouts.
- Preserve desktop composition and behavior unless the task explicitly asks for desktop changes.
- Keep business logic shared across viewport variants, including API calls, form state, validation, parsing, submit behavior, filters, calculations, and event handlers.
- Do not create separate desktop/mobile page implementations when they duplicate feature logic.
- Use responsive CSS or container queries for visual-only changes such as width, spacing, typography, columns, wrapping, information density, and secondary information visibility.
- Use explicit mobile-specific composition only when mobile interaction or hierarchy genuinely changes, such as drawer/sheet inspectors, master/detail flows, progressive disclosure, persistent controls, or table-to-list presentation.
- Mobile-specific components should control presentation and composition only; changes to shared feature components, hooks, and handlers must automatically apply to all viewport variants.
- Prefer small reusable responsive primitives when a pattern clearly repeats, but do not extract abstractions prematurely.

## UI/UX Design Principles — Functional Minimalism

FGCNotepad is a practical analysis tool. Complexity should come from the fighting-game data, not from decoration or repeated explanations. Apply these principles to every new or changed page unless a concrete usability or domain reason justifies an exception.

### A. Information-first design

- Prioritize actionable data, controls and a clear hierarchy.
- Organize with typography, alignment, whitespace and short labels before reaching for containers, color or icons.

### B. Avoid decorative overcompartmentalization

- Prefer `Page -> Controls` over `Page -> Card -> Section card -> Inner card -> Controls`.
- Add a container only when it gives meaningful structure (for example Setup vs Submit on a form, or a results table vs its filters). Filters need no "Search Filters" or "Primary Filters" wrapper.
- `SectionCard` has no decorative variants: no header icons and no colored accent edges. Do not add them back per page.
- Small uppercase group labels are acceptable inside dense filter sets; recreating card-per-group layouts is not.

### C. No tutorial-style permanent subtitles

- Do not add helper text that restates what a field, button or section does ("Auto-filled from notation", "Leave unclassified if...", "Lock only scenario-wide assumptions...").
- When a domain concept genuinely needs explanation (for example Punish tip spacing), use targeted contextual help such as `HelpTip`, not a permanent paragraph.

### D. Use icons and color purposefully

- Use established fighting-game abbreviations as plain text: `PC`, `CH`, `PP`, `B. DI Stun`. Combo conditions come from `comboConditions.ts` and render with `ComboConditionText`; do not wrap them in colored chips or icon badges.
- In lists, starter conditions prefix the notation (`PC 2HP > 5MP > ...`). In detail/editor headers, keep the title and show conditions as a plain-text subtitle without repeating what the title already says.
- Reserve color for meaningful states and visualizations (validation, danger, resource gauges). Decorative lightning icons, neon accents and redundant badges are not standard patterns.

### E. Optimize information density

- Use compact controls: `TriStateFilter` (Any/Yes/No) for boolean search filters, plain checkboxes for boolean form fields, short numeric fields sized to their content.
- Order controls by how often players need them (for combos: move filters, then PC/CH/Corner/Spacing/PP/available resources; damage ranges last).
- Use horizontal space on desktop and let rows wrap on mobile.

### F. Reuse patterns across related pages

- Creation and editing of the same entity share sections, labels, checkbox behavior, validation and autofill semantics (for combos: `ComboSetupSection`, `SubmitSection`, `useComboFillDetails`).
- When changing a shared pattern, review every consumer.

### G. Preserve information and functionality

- Minimalism removes presentation overhead, not domain information, interactions or validation.
- Hide unsupported controls (filters for values nobody can set yet) instead of deleting the underlying data. Do not make destructive model or database changes for cosmetic cleanup.

### H. Keep default states quiet

- An empty selection needs no "None selected" message; a ready form needs no "Ready" badge; an idle search needs no "Auto search on" chip.
- Do not disable a submit button without saying why. Keep it enabled and, on submit, show actionable feedback next to the action or field that needs attention.
- Suppress values that only restate a default (0 Drive used, 0 Super used, the 0.1 Safe Drive baseline). Keep values that are always informative, such as resource gain.

### I. Prefer accurate compact visualizations

- Use a visualization when it reads faster than text, for example the segmented Drive gain gauge and the Super numeral + partial bar (`ResourceGainGauges`).
- Visualizations must be numerically exact (2.5 Drive is two full segments plus a half segment), expose the value as text or an accessible label, and use tokenized colors (`resourceGauge.*`).

### J. Treat these as defaults

- New pages and changes to existing pages follow these principles by default. Deviate only for a concrete usability or domain reason, and keep the deviation local.

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
- Group related controls with spacing and alignment first; add a bordered section only when it gives the page real structure (see Functional Minimalism below).
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
- Avoid decorative chips, subtitles, and detailed explanatory text by default; this frontend should stay minimalist unless the extra UI element directly changes user behavior or comprehension.
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
- Mobile:
  - `make mobile-audit` run for the touched routes, strict pass kept, no score drop above 5 points
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
