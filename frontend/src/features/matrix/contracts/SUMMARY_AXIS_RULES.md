# Matrix Editor Summary Axis Rules (Phase 1)

This document defines the product behavior for summary axes in the new matrix editor model.

## Purpose
- Keep row/column summary semantics explicit and consistent across all future tickets.
- Prevent accidental spreadsheet-like behavior from creeping into summary cells.

## Canonical Mapping
- **Final column (`rowSummaryCells`)**: opponent expected usage input per row action.
- **Final row (`columnSummaryCells`)**: player optimal usage result per column action.
- **Expected value (`expectedValueCell`)**: scalar result derived from body values and both summary axes.

## Source of Truth by Axis
- `rowSummaryCells`: user-editable in current phase.
- `columnSummaryCells`: user-editable in current phase; later phases may switch to solver-driven writes.
- `expectedValueCell`: derived display value; must not be hand-authored by default UI flows.

## Numeric Semantics
- Summary values are nullable numbers (`number | null`) in state.
- Empty input maps to `null`.
- Non-numeric drafts are invalid and must surface validation feedback.
- No implicit coercion to `0` for invalid summary input.

## Range Policy (Current)
- Intended domain is probability-like values between `0` and `1`.
- Phase 1 keeps parser permissive for implementation velocity; strict range enforcement can be enabled via validation rules in later tickets.
- Future strict mode should reject values outside `[0, 1]` with explicit `out_of_range` errors.

## Compute Rules
- `expectedValue` is computed from body matrix + row summary + column summary.
- Terms containing `null` in any factor are skipped.
- If no usable term exists, expected value is `null`.
- Derived value is presentation-safe rounded numeric output (currently 4 decimals).

## Mutation Rules
- Add/remove row must add/remove matching `rowSummaryCells` entries.
- Add/remove column must add/remove matching `columnSummaryCells` entries.
- Axis label edits must not reset summary values.
- Structural mutations must preserve remaining summary values by key, not by fragile index assumptions.

## Interaction Baseline
- Summary axes are first-class selectable/editable targets in state model.
- Mixed operations that include readonly targets (future computed modes) must skip readonly entries, not overwrite them.

## Integration Contract
- Runtime state fields:
  - `grid.rowSummaryCells`
  - `grid.columnSummaryCells`
  - `grid.expectedValueCell`
- Serialization mapping:
  - `summary.rowAxis`
  - `summary.columnAxis`
  - `summary.expectedValue`
- Lexical node type remains `scenario-table`; payload remains under `matrix`.
