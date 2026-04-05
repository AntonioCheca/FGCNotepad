# Frontend Feature Master

This document defines how frontend features must be implemented in FGCNotepad.

## Stack and architecture baseline

- Framework: Next.js + React.
- Current project shape includes both `pages` and `app` directories.
- UI system: wrapper-first architecture.
- Backend communication: frontend reads/writes data only through backend `/api` endpoints.

## Non-negotiable UI wrapper rule

Never import MUI directly outside frontend UI wrapper files.

- Allowed: MUI imports inside wrapper files under `frontend/src/components/ui/*` (or designated wrapper modules).
- Disallowed: MUI imports in pages, feature components, hooks, or data modules.
- If a needed wrapper does not exist, create/update the wrapper first, then consume wrapper everywhere else.

This rule protects global theming and avoids one-by-one UI rewrites.

## Current feature domains

Frontend work should follow existing domains and folder patterns:

- Auth flows (login/register + token-aware API access).
- Home and navigation layout components.
- Forum post editor and tag-driven interactions.
- Combo creation/list/filter tables and step-based editors.
- Lexical/editor plugins and scenario table tooling.
- Shared typed models under `src/types`.

## Data flow rules

- Backend is the single source of truth for domain data.
- Components should not hardcode business/domain truth that belongs in backend.
- API access goes through dedicated hooks/services (not directly scattered calls in view components).
- Keep request/response mapping close to hook/service boundaries.

## Typing and code quality standards

- TypeScript strict mode is enabled; new/updated frontend code should be strongly typed.
- Avoid `any`; if temporary `any` is unavoidable, keep scope minimal and prefer immediate follow-up typing.
- Prefer explicit interfaces/types in `src/types` for domain payloads.
- Keep components small and focused; split large UI blocks into hierarchical components.
- Comments should be rare; rely on clear naming and decomposition.
- Avoid JSX noise comments and "temporary" explanatory comments unless behavior is genuinely non-obvious.
- Remove temporary debug `console.log` calls before finalizing feature work.

## Naming and structure conventions

- React components use `PascalCase` file and symbol names.
- Hooks use `use*` naming and should encapsulate data/API behavior, not render concerns.
- Utility/helper functions use descriptive `camelCase` names.
- Keep domain types near `src/types` and reuse them across hooks/components instead of re-defining inline shapes repeatedly.

## Class/function size guidance

- Keep component render blocks readable; extract subcomponents when JSX grows too large.
- Keep hooks focused on one domain responsibility (for example: combos, auth, moves, connections).
- Avoid mixing too many responsibilities in a single file (UI rendering, API orchestration, and transformation logic should be separated).

## Component and hook responsibility boundaries

- Components:
  - Render UI.
  - Handle local UI state and user interactions.
  - Use wrapper components for visual primitives.
- Hooks/services:
  - Own API orchestration.
  - Normalize response data.
  - Expose loading/error/success behavior to UI.

## Theme and design system rules

- Global visual behavior should be controlled centrally (theme + wrappers), not ad hoc per component.
- Repeated style patterns should be promoted into wrapper props or shared style tokens.
- When changing button/text/field defaults, implement in wrapper/theme locations first.

## Frontend testing policy

- There is currently no mandatory frontend test suite.
- For frontend changes, prioritize strong typing, clear boundaries, and manual verification steps.
- Do not invent a new testing framework unless explicitly requested.

## Definition of done for frontend features

- No direct MUI imports outside wrapper files.
- Data comes from backend APIs through hooks/services.
- Component tree remains readable and modular.
- Types are explicit and `any` usage is minimized.
- Changes preserve existing conventions in touched files.
- New code does not introduce avoidable debug output or heavy comment clutter.
