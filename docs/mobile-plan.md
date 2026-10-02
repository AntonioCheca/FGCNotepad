# Mobile plan

Goal: every page feels designed for a phone, consistently, without duplicating feature logic. Desktop stays as it is.

Baseline (2026-10-02, `docs/mobile-audit/baseline-2026-10-02.md`): average score **89/100** at 360px, strict-pass coverage **21/34 routes (62%)**, **26** inputs that make iOS zoom, **0** pages scrolling sideways. Many "passing" pages were measured empty, so the review below matters as much as the numbers.

## Decisions (2026-10-02)

- Phones and small tablets (< 900px) use a **bottom tab bar** (Home, Combos, Okis, Scenarios, More) instead of the sidebar drawer. "More" opens a bottom sheet with every other destination and Log out. Desktop keeps the sidebar. **Done.**
- **No top app bar.**
- **Admin pages are desktop-only** (`/admin/users`, `/admin/replay-combo-imports`): they show a short notice on phones and are excluded from audit coverage. **Done.** Everything else, including moderation and `/admin/situations`, must work on phones.

## Progress

| Snapshot | Avg @360 / @390 | Strict pass | iOS-zoom inputs | Notes |
| --- | --- | --- | --- | --- |
| Baseline (`baseline-2026-10-02`) | 89 / 90 | 21/34 | 26 | Before any change. |
| Phase 1 + first pages (`progress-2026-10-02-phase1`) | 97 / 97 | 25/32 | 0 | Admin pages excluded as desktop-only. Metrics corrected: form controls no longer count as nested cards; overflow inside scroll containers and nested link/button targets no longer flagged. |
| Contrast + colour tokens (`progress-2026-10-02-contrast`) | 97 / 97 | 32/32 | 0 | Remaining penalties are scenario matrix nesting/cramping only. |
| Scenario matrix (`progress-2026-10-02-matrix`) | 98 / 99 | 32/32 | 0 | Phone "By option" matrix view; matrix shell flattened on phones; audit skips chart segments and intentional grid cells. |

Done so far (all phone-only unless noted):

- Bottom tab bar + More sheet; admin desktop-only notice; `viewport-fit=cover`.
- Global styles (`AppGlobalStyles`): body font set to the theme font (**all widths**, fixes Times New Roman fallback in the scenario matrix and other raw text); on phones 16px inputs, no body margin, `border-box` sizing, `touch-action: manipulation`.
- Smaller page titles on phones (`PageShell`, scenario header).
- `HelpTip`: help icons open on tap and no longer carry an invalid `aria-label` (**all widths**, invisible change).
- Scenario detail: summary and matrix first, "Calculation settings" and "Resources" collapsed; header buttons in two rows; strategy-mix and EV charts stacked.
- Moderation queue: compact cards, title links to the item, one action row, "Show more" after 20 (84 → 4.6 screens).
- Blockstring detail: vertical route timeline.
- Turns guide: compact move rows (21.5 → 9.7 screens).
- Oki detail/edit: no more content sticking out of cards.
- Scenario matrix on phones: "By option" view (`MatrixRowFocus` + pure `rowFocusModel`) opens on the most-played option and lists its outcome against each opponent option with frequencies; "Full grid" switch keeps the existing grid (sticky header row and first column, marked `data-intentional-scroll`). Read-only matrices default to "By option", editors to the grid. Pattern from NN/g mobile tables: let users pick the subset, keep sticky headers for the full table.

Approved and done (all widths):

- **Red text contrast.** New tokens `action.primaryText` / `feedback.errorText` (`#ff6b6b`) for red text and outlines; filled buttons, charts and accents keep `#d72829`. Comparison: https://claude.ai/artifact/FgF31FJ9rzWCk8X47czW6K
- **String colour tokens.** `fgc` tokens are exposed on the MUI palette, so the 183 `sx` strings like `"fgc.surface.raised"` now resolve instead of silently falling back.
- **Teal text on raised cards.** New `accent.selectedText` (Teal Light `#a2ccdb`) where Teal Mid was used as text.
- **Strategy-bar labels** pick white or navy per bar colour.

## What the review found (cross-cutting)

1. **No mobile navigation chrome.** A floating menu button sat above a very large title, losing ~90px on every page. Fixed by the bottom bar.
2. **Cards inside cards.** 23 of 34 routes nest boxes 3+ deep (up to 6); each level adds padding and border, so inner content gets cramped and sometimes sticks out (oki steps, combo parser steps, scenario matrix).
3. **Desktop order kept on phones.** Primary content sits below secondary controls: scenario matrix under 1.5 screens of resource sliders, Neutral Stats results under 1.3 screens of filters.
4. **Action clutter.** Several pages stack 3–4 full-width buttons, often with two red "primary" buttons (scenario detail, profile); the moderation queue repeats Open/Approve/Reject/Hide per item, making it 85 screens long.
5. **Form controls not sized for touch.** 26 inputs under 16px (iOS zoom); long checkbox walls (oki setup flags and option properties).
6. **Horizontal strips.** Sequences (blockstring route, scenario matrix) scroll sideways inside cards instead of stacking.
7. **Font leak.** The scenario matrix area renders in a serif fallback font.

The combo list (table → cards + mobile sort) and combo summary (`MobileFact`) already follow the right pattern; the plan generalises them.

## Page archetypes and target mobile composition

Each route belongs to one archetype. The archetype decides the mobile composition, so pages of the same kind feel the same.

| Archetype | Mobile composition |
| --- | --- |
| **A. Browse / search** | Filters behind a "Filters (n)" button opening a bottom sheet; result count + sort row; results as compact cards (2–4 key facts); per-item secondary actions in a ⋯ menu; pagination or "load more". |
| **B. Detail / read** | One-line title + key-facts grid; primary content first; sequences as a vertical timeline; secondary sections collapsible; one primary action, others in a ⋯ menu; no duplicate "back to" links. |
| **C. Editor / form** | Single column; flags as chip toggles instead of checkbox lists; advanced fields collapsed; sticky bottom action bar with the submit button and readiness state; 16px inputs. |
| **D. Analysis** | Filter summary chip + sheet; results first; charts full width; matrices get a mobile "mix" view (strategy bars + per-row option cards) with the full grid in an explicit scroll container. |
| **E. Media workspace** | Player full width and sticky at top; annotation list below; controls in a bottom bar. Heavy editing may be explicitly scoped "best on desktop". |
| **F. Shell / entry** | Bottom tab bar + "More" sheet on phones; sidebar on desktop; safe-area insets. |

## Route review

Scores are baseline @360px. "Empty" means the page loaded without data locally.

| Route | Archetype | What the user does here | Score | Main mobile problems | Target |
| --- | --- | --- | --- | --- | --- |
| `/` | F | Jump into a feature | 100 | — | Keep; adopt app bar. |
| `/combos` | A | Find combos for a character/situation | 89 (empty) | Filter panel long; nesting | Filter sheet; keep existing cards. |
| `/combos/new` | C | Paste notation, verify parse, submit | 97 | Submit section before advanced fields; parser output state unmeasured | Sticky submit bar; collapse advanced; audit the parsed state. |
| `/combos/[id]` | B | Read a combo's route, damage and cost | 83 | Steps stick out of card; giant title; redundant "Back" | Vertical step timeline; key facts first; actions in ⋯ menu. |
| `/profile/recommend-combo` | D | Get combo suggestions | 96 | Zooming inputs | Theme fix only. |
| `/okis` | A | Find okis by ender/options | 92 | Small text; nesting | Filter sheet; compact cards. |
| `/okis/new`, `/okis/[id]/edit` | C | Build an oki tree | 89 / 86 | Checkbox walls; tree nested 4 deep; content overflow | Chip toggles; flatten tree cards; sticky submit. |
| `/okis/[id]` | B | Read setups and routes | 86 | Step cards overflow; repeated facts | Vertical timeline; dedupe summary vs setup facts. |
| `/okis/reversals` | A/C | Reference reversal list (moderators edit) | 87 | Small text, cramped | Compact cards; editor in a sheet for moderators. |
| `/blockstrings/offense`, `/defense` | A | Browse pressure strings | 97 (empty) | Nesting | Filter sheet; cards. |
| `/blockstrings/new` | C | Author a blockstring | 97 | Unmeasured with steps added | Same editor pattern as okis. |
| `/blockstrings/[id]` | B | Read route, gaps and defense | 91 | Route strip scrolls sideways and is clipped | Vertical timeline with gap markers between steps. |
| `/scenarios` | A | Find scenarios | 93 | Tiny targets; nesting | Filter sheet; cards. |
| `/scenarios/[id]` | B + D | Read a matrix and its solution | 52 | Matrix buried; 2 red primaries; overflow; serif font; zooming inputs | Summary + mix view first; resources collapsed; one primary; fix font. |
| `/scenarios/new`, `/[id]/edit` | C + D | Build a decision matrix | 60 / 55 | Same as detail plus editing in a clipped grid | Row/column editor as list on phones; grid in explicit scroller. |
| `/neutral-stats` | D | Explore neutral move stats | 89 | Filters take 1.3 screens before results | Filter summary + sheet (sticky bar exists); results first. |
| `/guides/turns` | B | Learn a concept | 80 | 21 screens; sections > 3 screens | Table of contents + collapsible sections. |
| `/replay-lab/*` | E / A | Review replays, practice, study | 95–100 (empty) | Unmeasured with data | Measure with a seeded video; decide desktop scoping for export. |
| `/profile` | C | Set controls and combo knowledge | 86 | Three red save buttons; zooming selects | One save action per section, quiet style; 16px controls. |
| `/about/aboutUs` | B | Read about the project | 93 | Long sections | Minor. |
| `/moderation/queue` | A | Approve/reject submissions | 76 | 85 screens; 4 buttons per item | Compact item + primary Approve + ⋯ menu; pagination. |
| `/moderation/frame-data`, `/resources`, `/admin/situations` | C | Edit reference data | 97 (empty) | Unmeasured with a character selected | Must work on phones: editor pattern, measure with a character selected. |
| `/admin/users` | A | Manage roles | 81 | Small text; cramped | Desktop-only (notice shown on phones). |
| `/admin/replay-combo-imports` | C | Import replay exports | 100 (empty) | Desktop tooling | Desktop-only (notice shown on phones). |

## Shared building blocks

Built once under `frontend/src/components/ui/` (MUI stays inside wrappers), used everywhere. Business logic stays shared; these only change composition.

| Building block | Replaces | First users |
| --- | --- | --- |
| `MobileBottomNav` + `MobileMoreSheet` (done) | Floating hamburger + drawer | All pages |
| Theme: 16px inputs on xs, mobile type scale for `PageShell` | Per-page font tweaks | All forms |
| Surface depth rule: nested `SectionCard`s flatten (no border/padding) on xs from depth 2 | Card-in-card padding loss | All pages |
| `ResponsiveDataView` (columns with priority → table on desktop, cards on phones) | Hand-written dual renders (ComboTable) | Lists in archetype A |
| `FilterSheet` (button with active count + bottom sheet + apply) | Long inline filter panels | Combos, okis, blockstrings, scenarios, Neutral Stats |
| `ActionMenu` (⋯ overflow) + `MobileActionBar` (sticky bottom, safe-area) | Stacked full-width buttons | Details, editors, moderation |
| `KeyFactsGrid` (generalised `MobileFact`) | Repeated label/value stacks | Combo, oki, blockstring, scenario details |
| `SequenceTimeline` (vertical steps with connectors/gaps) | Overflowing step cards, sideways strips | Combo parser, oki routes, blockstring routes |
| `ChipToggleGroup` | Checkbox walls | Oki editor, filters |
| `CollapsibleSection` | Always-open secondary sections | Scenario resources, guides, advanced form fields |

## Phases

**Phase 0 — Measurement (done in this ticket, small follow-ups)**
- Done: audit tool, seed script, baseline, `make mobile-audit`.
- Add a `data-mobile-primary` marker on each page's main content and a check that it starts within the first ~0.6 screen.
- Add scripted states for pages that need input (combo parse, scenario solve, frame-data character).
- Add `compare.mjs`: fail when a route loses strict-pass or drops more than 5 points against the latest baseline.

**Phase 1 — Foundations (lifts every page)**
- Done: bottom tab bar + More sheet, `viewport-fit=cover`, desktop-only notice for admin pages.
- Next: 16px inputs, type scale, surface-depth flattening, serif font fix.
- Build the shared blocks above with one real consumer each.

**Phase 2 — Core content: combos and okis**
- Combo detail, combo create, oki detail/new/edit, oki list.

**Phase 3 — Worst scores: scenarios and analysis**
- Scenario detail/edit/new (mix view, resources collapsed), Neutral Stats filter sheet, recommend.

**Phase 4 — Remaining content**
- Blockstrings, guides, profile, about.

**Phase 5 — QA and staff areas**
- Replay Lab (with seeded video), moderation queue, reference-data editors (frame data, resources, situations).

Each phase ends with `make mobile-audit`, a new baseline in `docs/mobile-audit/`, and the mobile smoke test.

## Targets

| Metric | Baseline | Target |
| --- | --- | --- |
| Strict-pass coverage (desktop-only routes excluded) | 20/32 (63%) | 32/32 (100%) |
| Average score @360 / @390 | 89 / 90 | ≥ 95 |
| Inputs that zoom on iOS | 26 | 0 |
| Content sticking out of cards | 6 routes | 0 |
| Max card nesting on phones | up to 6 (23 routes ≥ 3) | ≤ 2 |
| Pages longer than 12 screens | 2 | 0 (guides get a table of contents) |
| Primary content starts within first screen | not measured | all detail and analysis pages |
