# Matrix Editor Non-Goals Contract (Phase 1)

This document explicitly blocks scope creep for the new matrix editor track.

## Product Non-Goals
- Not a general spreadsheet product.
- Not a formula language engine.
- Not a formatting/styling canvas (font, color, merged cells, rich cell styles).
- Not an enterprise-scale grid targeting very large matrix sizes as a primary goal.
- Not a mobile-first editor in this phase.

## Interaction Non-Goals (Phase 1)
- No advanced multi-range selection semantics.
- No autofill/drag-handle replication behavior.
- No undo/redo stack redesign in this ticket.
- No keyboard-navigation engine implementation in this ticket.

## Data/Model Non-Goals
- No legacy matrix state migration requirements.
- No backward adapter for obsolete matrix structures unless required by active Lexical/forum persistence.
- No schema polymorphism explosion; contract stays versioned and explicit.

## UI/Architecture Non-Goals
- No large refactor of weak legacy components if replacement path exists.
- No cross-feature abstraction framework beyond current matrix module boundaries.
- No new design-system layer for matrix-specific visuals in this phase.

## Backend/Platform Non-Goals
- No backend schema/entity/migration changes.
- No backend enforcement of matrix field semantics in this phase.
- No solver pipeline redesign in this ticket.

## Guardrail for Future Tickets
- Any proposed feature that makes matrix behavior closer to a generic spreadsheet must include:
  - clear fighting-game analysis value,
  - bounded scope,
  - explicit fit with summary-axis rules.
