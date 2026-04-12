# Context Visibility QA Notes (Phase 2 / Ticket D)

## Goal
Verify users can keep row/column context while reading or editing medium-sized grids (10x10 target).

## Manual QA Checklist
- Create a matrix with at least 10 rows and 10 columns.
- Scroll horizontally and confirm row labels stay visible (frozen first column).
- Scroll vertically and confirm column labels stay visible (sticky header).
- Select any body cell and verify:
  - active row label is highlighted,
  - active column header is highlighted,
  - body cells in active row/column have subtle axis cue.
- Enter edit mode on a body cell and confirm active axis cues remain visible.
- Select row-summary cell and confirm row context highlight remains clear.
- Select column-summary cell and confirm column context highlight remains clear.
- Verify expected value selection does not incorrectly highlight unrelated axis.

## Pass Criteria
- Coordinates remain readable during scroll.
- Active axis is identifiable at a glance.
- No overlap or jitter from sticky/frozen surfaces in normal desktop viewport.
