# Matrix Editor Architecture Map

## Entry Point
- `MatrixEditorShell.tsx`
  - Future default matrix editor container for Lexical and forum embedding.
  - Connects payload <-> typed state and wires render modules.

## Module Groups
- `rendering/`
  - `MatrixEditorLayout.tsx`: shell chrome and top-level actions.
  - `MatrixGrid.tsx`: composition layer for grid render pieces.
  - `MatrixGridHeader.tsx`: column labels and column actions.
  - `MatrixGridBody.tsx`: row labels and body cell rendering.
  - `MatrixSummaryAxes.tsx`: summary row/column + EV display.

- `state/`
  - `useMatrixEditorController.ts`: reducer wiring and parent sync (`onMatrixChange`).

- `modules/`
  - `payloadAdapter.ts`: conversion between serialization payload and typed state.

- `services/`
  - `matrixComputationService.ts`: derived EV math from grid and summary axes.

- `utils/`
  - `numberUtils.ts`: parse/format helpers for numeric inputs.

## Feature Boundary
- Domain model and generic reducer/selectors stay in:
  - `frontend/src/features/matrix/model/*`
  - `frontend/src/features/matrix/state/*`
- Serialization contract stays in:
  - `frontend/src/features/matrix/serialization/*`

## Integration Contract (Do Not Break)
- Lexical node type remains `scenario-table`.
- `ScenarioTableNode` remains owner of persisted `matrix` payload.
- `MatrixEditorShell` receives `matrix`, `nodeKey`, and `onMatrixChange`.
- Backend forum post body remains opaque JSON storage.
