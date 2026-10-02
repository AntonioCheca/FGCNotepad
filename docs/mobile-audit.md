# Mobile audit

A repeatable scorecard for how every route behaves on phones. Run it before and after mobile work and keep the result in `docs/mobile-audit/` so progress is measurable.

## Running it

Requirements: the Docker dev stack is up and the frontend dev server is running (`make frontend-dev`).

```bash
# Seed one oki, blockstring and scenario so detail pages have content (safe to re-run).
make mobile-audit-seed

# Full audit. Output: frontend/mobile-audit-results/mobile-audit-<date>.{json,md}
make mobile-audit

# Options: SCREENSHOTS=1 saves full-page screenshots, ONLY='^/okis' limits routes (regex).
make mobile-audit SCREENSHOTS=1 ONLY='^/scenarios'
```

No password is involved. Each run asks the backend for a **dev-only one-time login link** (`php bin/console app:dev:login-link mobile-audit --create --role=ROLE_ADMIN --role=ROLE_QA_TESTER`), which creates the local `mobile-audit` user on first use. The command, its route (`/api/dev/login-check`) and the login-link authenticator exist only in the `dev` and `test` environments; production has none of them. Links are signed with `APP_SECRET`, expire after 5 minutes and work once.

The audit runs in the official Playwright image at phone widths **360×780** (small Android) and **390×844** (iPhone 14/15), with touch emulation. Code lives in `frontend/scripts/mobile-audit/`.

To record a new baseline, copy the generated `.json` and `.md` into `docs/mobile-audit/` with the date in the filename.

## What it measures

| Check | Threshold | Why |
| --- | --- | --- |
| Page scrolls sideways | any overflow | Breaks the whole page on touch. |
| Content past the screen edge | any element not inside a scroll container | Cut-off text or controls. |
| Content sticks out of its card | child box wider than its parent card | Broken nesting (oki steps, combo parser steps). |
| Desktop table visible | `<table>` outside a scroll container | Tables should become cards on phones. |
| Wide sideways scroller | scroll width > 1.5× its box | Too much hidden content; needs a mobile composition. |
| Tap targets | < 24×24 px, with the WCAG spacing exception | WCAG 2.2 SC 2.5.8 (AA). Below 44 px is counted as "below recommended". |
| Inputs that trigger iOS zoom | input/select font-size < 16px | iOS Safari zooms the page when such a field is focused. |
| Tiny / small text | > 5% of characters < 12px, > 40% < 14px | Readability. |
| Section taller than 3 screens | single block with no dominant child | "Component too big to read" on a phone. |
| Page longer than 12 screens | document height / viewport | Needs pagination, collapsing or a summary. |
| Cards nested 3+ deep | bordered/filled boxes inside each other | Each level eats padding and width. |
| Cramped card content | narrowest text card < 60% of screen width | Result of deep nesting. |
| Accessibility | axe serious/critical violations (WCAG 2.2 AA tags) | Same engine as the Playwright smoke test. |

Opt-outs, so measurements stay honest:

- `data-intentional-scroll` on a scroll container marks a true grid editor that may scroll sideways (allowed by AGENTS.md); its cells are not counted as cards.
- `data-chart` on a chart container excludes its bars and segments from card nesting.

Each route gets a **score out of 100** (capped penalties per check, see `scoring.mjs`) and a **strict pass** flag: no sideways scroll, nothing past the edge or out of its card, no desktop table, no undersized target, no zooming input, no serious axe violation.

Site-level numbers to track:

- **Strict-pass coverage**: routes passing at every phone width ÷ all routes.
- **Average score** per width.
- **Zooming inputs** and **undersized targets** totals.

## Limits

- It measures the state a page loads in. Pages that need input before showing their main content (combo parser output, a solved matrix, frame-data with a character selected) need scripted states; see Phase 0 in `docs/mobile-plan.md`.
- Local data shapes results: combos are all `pending_review` locally, so `/combos` is measured empty; Replay Lab has no videos.
- It cannot judge hierarchy or redundancy (two primary buttons, information order). Those are covered by the page review in `docs/mobile-plan.md`.

## Sources

- WCAG 2.2 SC 2.5.8 Target Size (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- iOS input zoom below 16px: https://defensivecss.dev/tip/input-zoom-safari/
- Mobile tables (NN/g): https://www.nngroup.com/articles/mobile-tables/
- Vercel Web Interface Guidelines: https://github.com/vercel-labs/web-interface-guidelines
