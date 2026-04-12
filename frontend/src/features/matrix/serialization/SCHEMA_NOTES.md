# Matrix Payload Schema Notes

## Contract
- Root object is `MatrixPayload` (`kind: "matrix-editor"`, `schemaVersion: 1`).
- `axes.rows` and `axes.columns` define matrix dimensions.
- `cells` is always rectangular and matches `rows x columns`.
- `summary.rowAxis` maps to row frequencies.
- `summary.columnAxis` maps to column frequencies.
- `summary.expectedValue` stores EV as a typed cell.
- `metadata` is required and includes `matrixId`.
- `extensions` is optional and reserved for future additions.

## Cell Types
- `cellType`: `value | reference | computed | summary`.
- `dataType`: `number | text | empty`.
- `value`: `number | string | null`.
- `metadata` and `extensions` are optional per-cell expansion points.

## Validation + Recovery
- Deserializer only accepts `kind: "matrix-editor"` and `schemaVersion: 1`.
- Invalid payloads do not throw; they return a safe default matrix.
- Non-rectangular input is repaired by deterministic pad/clip behavior.
- Missing or malformed cell entries are normalized to empty/value defaults.

## Lexical / Forum Integration Assumptions
- Lexical node type stays `scenario-table`.
- `ScenarioTableNode.exportJSON()` stores matrix data under `matrix`.
- `ScenarioTableNode.importJSON()` uses the deserializer and never trusts raw data.
- Forum backend stores post body as JSON string opaquely; no backend schema migration is required for this contract.
