# TODO

## Epic Backlog (High-Level)

- Excel-like payoff matrix input UX.
- Secondary table referencing for scenario trees.
- Improved modeling for combos.
- Automatically suggest optimal combo paths starting from a selected move.
- Support hit-confirmability (read vs reactable) in analysis.
- Add Drive Gauge and Meter as resources in analysis.
- Introduce moderator roles for content review.
- Replay integration to extract data from uploaded match videos.

## Detailed Actions for the First 4 Epics

### 1) Excel-like payoff matrix input UX

- Audit current matrix entry screens and list missing spreadsheet behaviors (keyboard nav, paste, multi-cell edit).
- Define a minimal matrix interaction spec (supported shortcuts, selection behavior, validation states).
- Add a typed matrix grid state model in frontend and wire it to existing table data structures.
- Implement rectangular cell selection and arrow/tab navigation in the matrix editor component.
- Implement paste-from-clipboard parsing for TSV/CSV blocks into selected cells.
- Add inline validation feedback for invalid numeric inputs without blocking normal editing flow.
- Perform manual verification on desktop/mobile and document known edge cases in this file.

### 2) Secondary table referencing for scenario trees

- Map existing scenario tree data flow and identify where secondary table links are currently missing.
- Define backend API contract for linking a scenario node to a secondary table reference.
- Implement backend endpoint/service update to persist and return secondary table references.
- Add frontend typed models for secondary table reference payloads.
- Create hook methods to fetch, attach, detach, and display secondary table references.
- Render reference badges/links in the scenario tree UI with clear empty and loading states.
- Add backend tests for create/read/update behavior of node-to-table references.

### 3) Improved modeling for combos

- Review current combo domain fields and document modeling gaps (resources, timing, branching, confirm type).
- Define a versioned combo payload shape for backend and frontend shared understanding.
- Refactor combo service logic to isolate validation and normalization rules.
- Add backend validation rules for inconsistent combo states and return explicit error messages.
- Update combo list/read responses to expose normalized fields required by future analysis steps.
- Update frontend combo types and adapters to consume the improved response shape.
- Add backend tests covering valid combos, invalid combos, and normalization behavior.

### 4) Automatically suggest optimal combo paths from a selected move

- Define the objective function for "optimal" (damage, resource efficiency, position, or configurable weighting).
- Add backend endpoint to request combo suggestions from a starting move and constraints.
- Implement suggestion service that scores and ranks candidate combo paths.
- Add deterministic tie-break rules so repeated requests return stable ordering.
- Create frontend hook to call suggestions endpoint with selected move and user constraints.
- Build UI panel that lists top suggestions with concise reasons (score factors and resource cost).
- Add backend tests for ranking behavior and controller response shape.
