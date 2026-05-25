# Pre-Deploy Epic Backlog

This backlog captures worthwhile work to do before the first private deploy. It assumes deploy work itself is paused until there is dedicated time for it.

## Context

The existing `TODO.md` is still useful, but some items are now partially implemented. The current best pre-deploy work is less about adding new large product features and more about making the app reliable, private, testable, and credible for testers.

## Recommended Order

1. Validation baseline hardening
2. Route hygiene and public surface cleanup
3. Content visibility and authorization audit
4. Private beta access hardening
5. Creation flow polish
6. Scenario solver production hardening
7. Layer quality validator
8. Design-system compliance pass

---

## 1. Validation Baseline Hardening

### Goal

Make the repository validation commands trustworthy before adding more product surface.

### Why Now

`README.md` currently documents known baseline failures for frontend typecheck, frontend lint, PHPStan, and audit-related checks. This weakens confidence in every future feature and deploy decision.

### Scope

- Fix frontend typecheck failures.
- Fix frontend lint/config/code failures.
- Fix backend PHPStan baseline errors.
- Make backend test database setup predictable for Windows local workflow.
- Keep `make check`, `make check-frontend`, and `make check-backend` as the canonical validation path.

### Definition of Done

- `make check-frontend` passes locally.
- `make check-backend` passes locally with documented test DB setup.
- Remaining audit advisories, if any, are documented with explicit follow-up tickets.

---

## 2. Route Hygiene And Public Surface Cleanup

### Goal

Remove broken, accidental, or demo-only routes from the tester-facing app surface.

### Why Now

Testers will click navigation and direct URLs. Broken or debug pages make the product feel unfinished even if core functionality works.

### Known Issues

- No root page exists at `frontend/pages/index.*`, while the sidebar logo links to `/`.
- Navigation includes `/settings`, but there is no settings page.
- Demo/debug pages are routable:
  - `frontend/pages/frontend-testing.tsx`
  - `frontend/pages/test-speed.tsx`
  - `frontend/pages/homeMock.tsx`

### Scope

- Add or redirect `/` to the intended home route.
- Remove, guard, or hide debug/demo pages.
- Remove or implement the settings route.
- Audit sidebar navigation against real pages.
- Add a short manual route smoke checklist.

### Definition of Done

- Every visible navigation item resolves to an intentional page.
- No demo/debug page is available to normal testers unless intentionally guarded.
- Root URL behavior is intentional.

---

## 3. Content Visibility And Authorization Audit

### Goal

Apply one consistent visibility model across scenarios, posts, combos, and solver endpoints.

### Why Now

The app already has roles, moderation, and approved content states. The risk is inconsistency between read/list/solve endpoints.

### Known Issues To Verify

- Scenario `read()` has approval/owner visibility checks.
- Scenario solver endpoints such as `solve-layers` and `solve-linked-ev` load by public ID directly and should be audited for private/unapproved scenario exposure.
- Approved scenarios are public by current security config, while posts and combos appear to require authentication.
- Move creation appears available to any authenticated user and may need curator/moderator/admin restriction.

### Scope

- Centralize content visibility rules where practical.
- Apply rules consistently to list/read/solve/linked-EV/dynamic resolution endpoints.
- Decide whether approved posts and combos should be public like approved scenarios.
- Restrict data-authoring mutation endpoints where needed.
- Add backend tests for anonymous, owner, normal user, moderator, and admin access.

### Definition of Done

- Private/pending/rejected content cannot be accessed through alternate endpoints.
- Approved public content policy is explicit and consistent.
- Backend authorization tests cover the critical matrix.

---

## 4. Private Beta Access Hardening

### Goal

Prepare the app for a closed tester group before any real deploy.

### Why Now

Open registration is not ideal for a private alpha/beta unless it is a deliberate product decision.

### Options

- Manual account creation only.
- Email allowlist.
- Invite code flow.
- Expiring invite tokens.

### Scope

- Pick the simplest closed-beta access model.
- Add or update registration behavior accordingly.
- Improve registration success UX with a clear next action.
- Add basic password and abuse protections where practical.
- Add backend tests for allowed and blocked registration paths.

### Schema Note

Invite tokens or persisted allowlists may require entity/migration changes. If so, implementation requires explicit confirmation before schema work starts.

### Definition of Done

- Random users cannot self-register into the beta environment.
- Tester account creation flow is documented and usable.
- Backend tests cover the closed registration policy.

---

## 5. Creation Flow Polish

### Goal

Make content creation flows feel reliable and understandable for testers.

### Why Now

Creating posts, combos, and scenarios is central to real beta feedback. Bad feedback states create confusion and false bug reports.

### Known Issues

- Post creation still uses a blocking native `alert()` on success.
- Some forms need clearer success redirects, inline errors, and validation feedback.

### Scope

- Replace native alerts with inline or toast feedback.
- Add success redirects or `view created item` CTAs.
- Standardize validation/error display across post, combo, scenario, login, and registration flows.
- Ensure loading, error, empty, and success states are visible.

### Definition of Done

- No routine creation flow uses blocking native dialogs.
- Users get a clear next step after successful creation.
- Common API errors are displayed near the relevant form or in a consistent toast/notice.

---

## 6. Scenario Solver Production Hardening

### Goal

Make solver behavior safer, clearer, and more credible before testers rely on it.

### Why Now

The solver is core to the product's credibility. Solver failures or unclear results will look like product failure, not just technical debt.

### Current State

- Python-backed mixed strategy solving exists.
- Layer solving exists.
- Linked expected value and capped recursive scenario references exist.
- Resource-adjusted combo value is partially implemented.

### Scope

- Add or verify solver timeouts and input-size limits.
- Improve deterministic error responses for solver failures.
- Add frontend error states for solver failure and invalid matrices.
- Explain linked EV formulas and recursion depth in the UI.
- Add tests for invalid, large, empty, and edge-case matrices.

### Definition of Done

- Solver failure modes are graceful and understandable.
- Large or malformed inputs cannot hang the app indefinitely.
- Linked EV and recursive-depth behavior is visible enough for users to trust results.

---

## 7. Layer Quality Validator

### Goal

Detect scenario layers that do not add meaningful strategic or pedagogical value.

### Why Now

Layer solving already exists. The missing feature is interpreting whether a new layer actually changes the scenario.

### Scope

- Compare layer N against layer N-1 solutions.
- Warn about empty layers.
- Warn about redundant layers.
- Warn about dominated options that never affect optimal play.
- Warn when a new layer does not change expected value or strategy in a meaningful way.
- Render warnings clearly in the scenario editor/viewer.

### Definition of Done

- Scenario authors receive clear warnings for obvious bad layers.
- Backend service tests cover empty, redundant, and no-impact layer cases.
- Warnings are advisory and do not block saving unless explicitly chosen later.

---

## 8. Design-System Compliance Pass

### Goal

Bring shipped complex pages closer to the tactical editorial UI system.

### Why Now

The app has a stronger visual identity now, but some complex areas still use raw styles and native controls. This should be cleaned before external testers see the product extensively.

### Priority Areas

- Matrix/scenario editor.
- Scenario viewer.
- Profile page.
- Lexical scenario table controls.

### Scope

- Remove raw hex values from feature/page components.
- Use semantic theme tokens.
- Replace native controls with project wrappers where practical.
- Verify light mode, dark mode, mobile, and no horizontal overflow.

### Definition of Done

- No avoidable raw hex values remain in prioritized shipped pages.
- Pages respect the existing theme token system.
- Mobile and dark mode are manually verified.

---

## Lower Priority For Now

### Automatic Combo Difficulty

Still valuable, but it should wait until combo metadata is richer. A defensible score needs data such as link windows, confirm windows, cancel timing, input complexity, delay precision, rhythm changes, and step count.

### Actual AWS/Private Deploy

Still important, but intentionally paused. The useful work now is making the repo, validation, auth, routes, and solver behavior ready before deployment time.
