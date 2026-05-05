import {serializeMatrixPayload} from "@/src/features/matrix/serialization/serializeMatrixPayload";
import {deserializeMatrixPayload} from "@/src/features/matrix/serialization/deserializeMatrixPayload";
import {createColumnSummaryKey, createExpectedValueKey, createRowSummaryKey} from "@/src/features/matrix/model";
import {createInitialMatrixEditorState} from "@/src/features/matrix/state";
import {MatrixDynamicComboPayload, MatrixPayload} from "@/src/types/matrixPayload";
import {MatrixEditorState} from "@/src/features/matrix/model";

function toDynamicComboPayload(value: unknown): MatrixDynamicComboPayload | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    const record = value as Record<string, unknown>;
    const starterContext =
        record.starterContext && typeof record.starterContext === "object" && !Array.isArray(record.starterContext)
            ? (record.starterContext as Record<string, unknown>)
            : null;

    if (
        typeof record.attackerCharacterId !== "string" ||
        !Array.isArray(record.starterMoveIds) ||
        !starterContext ||
        typeof starterContext.isPunishCounter !== "boolean" ||
        typeof starterContext.isCounterHit !== "boolean"
    ) {
        return null;
    }

    return {
        attackerCharacterId: record.attackerCharacterId,
        ...(typeof record.isComboInitiatorAttacker === "boolean" ? {isComboInitiatorAttacker: record.isComboInitiatorAttacker} : {}),
        starterMoveIds: record.starterMoveIds.filter((moveId): moveId is string => typeof moveId === "string"),
        starterContext: {
            isPunishCounter: starterContext.isPunishCounter,
            isCounterHit: starterContext.isCounterHit,
        },
    };
}

export function matrixPayloadToEditorState(matrix: MatrixPayload) {
    const safe = deserializeMatrixPayload(matrix).payload;
    const runtime = createInitialMatrixEditorState({
        matrixId: safe.metadata.matrixId,
        title: safe.metadata.title,
        rowCount: safe.axes.rows.length,
        columnCount: safe.axes.columns.length,
    });

    runtime.grid.rows = safe.axes.rows.map((label, index) => ({
        id: `row_${index + 1}`,
        label,
        layer: typeof safe.axes.rowLayers?.[index] === "number" ? safe.axes.rowLayers[index] : 1,
        requirements: safe.axes.rowRequirements?.[index] ?? [],
    }));
    runtime.grid.columns = safe.axes.columns.map((label, index) => ({
        id: `column_${index + 1}`,
        label,
        layer: typeof safe.axes.columnLayers?.[index] === "number" ? safe.axes.columnLayers[index] : 1,
        requirements: safe.axes.columnRequirements?.[index] ?? [],
    }));

    safe.axes.rows.forEach((_, rowIndex) => {
        safe.axes.columns.forEach((__, columnIndex) => {
            const cell = safe.cells[rowIndex]?.[columnIndex];
            const key = `body::row_${rowIndex + 1}::column_${columnIndex + 1}`;
            const dynamicCombo = toDynamicComboPayload(cell?.dynamicCombo);
            const isDynamicCombo = cell?.cellType === "dynamic_combo";
            runtime.grid.bodyCells[key] = {
                key,
                rowId: `row_${rowIndex + 1}`,
                columnId: `column_${columnIndex + 1}`,
                kind: isDynamicCombo
                    ? "dynamic_combo"
                    : cell?.cellType === "reference" || cell?.cellType === "computed"
                        ? "reference"
                        : "static",
                value: typeof cell?.value === "number" ? cell.value : null,
                dynamicCombo,
                reference:
                    !isDynamicCombo && (cell?.cellType === "reference" || cell?.cellType === "computed")
                        ? {
                            kind:
                                cell.cellType === "computed" || cell.metadata?.referenceKind === "computed"
                                    ? "computed"
                                    : "reference",
                            scenarioId:
                                typeof cell.metadata?.scenarioId === "string"
                                    ? cell.metadata.scenarioId
                                    : `ref_${rowIndex + 1}_${columnIndex + 1}`,
                            scenarioLabel:
                                typeof cell.metadata?.scenarioLabel === "string"
                                    ? cell.metadata.scenarioLabel
                                    : undefined,
                            cachedValue:
                                typeof cell.metadata?.cachedValue === "number"
                                    ? cell.metadata.cachedValue
                                    : typeof cell.value === "number"
                                        ? cell.value
                                        : null,
                        }
                        : null,
            };
        });
    });

    safe.axes.rows.forEach((_, rowIndex) => {
        const key = createRowSummaryKey(`row_${rowIndex + 1}`);
        runtime.grid.rowSummaryCells[key] = {
            key,
            value: typeof safe.summary.rowAxis[rowIndex]?.value === "number" ? safe.summary.rowAxis[rowIndex].value : null,
        };
    });

    safe.axes.columns.forEach((_, columnIndex) => {
        const key = createColumnSummaryKey(`column_${columnIndex + 1}`);
        runtime.grid.columnSummaryCells[key] = {
            key,
            value:
                typeof safe.summary.columnAxis[columnIndex]?.value === "number"
                    ? safe.summary.columnAxis[columnIndex].value
                    : null,
        };
    });

    runtime.grid.expectedValueCell = {
        key: createExpectedValueKey(),
        value: typeof safe.summary.expectedValue.value === "number" ? safe.summary.expectedValue.value : null,
    };

    return runtime;
}

export function matrixEditorStateToPayload(state: MatrixEditorState, previous?: MatrixPayload): MatrixPayload {
    const rows = state.grid.rows.map((row) => row.label);
    const columns = state.grid.columns.map((column) => column.label);
    const rowLayers = state.grid.rows.map((row) => row.layer);
    const columnLayers = state.grid.columns.map((column) => column.layer);
    const rowRequirements = state.grid.rows.map((row) => row.requirements);
    const columnRequirements = state.grid.columns.map((column) => column.requirements);
    const values = state.grid.rows.map((row) =>
        state.grid.columns.map((column) => state.grid.bodyCells[`body::${row.id}::${column.id}`]?.value ?? null)
    );
    const bodyCellTypes = state.grid.rows.map((row) =>
        state.grid.columns.map((column) => {
            const cell = state.grid.bodyCells[`body::${row.id}::${column.id}`];
            if (cell?.kind === "reference") {
                return cell.reference?.kind === "computed" ? "computed" : "reference";
            }
            if (cell?.kind === "dynamic_combo") {
                return "dynamic_combo";
            }
            return "value";
        })
    );
    const bodyCellMetadata = state.grid.rows.map((row) =>
        state.grid.columns.map((column) => {
            const cell = state.grid.bodyCells[`body::${row.id}::${column.id}`];
            if (cell?.kind !== "reference" || !cell.reference) {
                return undefined;
            }

            return {
                scenarioId: cell.reference.scenarioId,
                scenarioLabel: cell.reference.scenarioLabel,
                cachedValue: cell.reference.cachedValue,
                referenceKind: cell.reference.kind,
            };
        })
    );
    const bodyCellDynamicCombos = state.grid.rows.map((row) =>
        state.grid.columns.map((column) => {
            const cell = state.grid.bodyCells[`body::${row.id}::${column.id}`];
            if (cell?.kind !== "dynamic_combo" || !cell.dynamicCombo) {
                return undefined;
            }

            return {
                attackerCharacterId: cell.dynamicCombo.attackerCharacterId,
                ...(typeof cell.dynamicCombo.isComboInitiatorAttacker === "boolean" ? {isComboInitiatorAttacker: cell.dynamicCombo.isComboInitiatorAttacker} : {}),
                starterMoveIds: [...cell.dynamicCombo.starterMoveIds],
                starterContext: {
                    isPunishCounter: cell.dynamicCombo.starterContext.isPunishCounter,
                    isCounterHit: cell.dynamicCombo.starterContext.isCounterHit,
                },
            };
        })
    );
    const rowFrequencies = state.grid.rows.map((row) => state.grid.rowSummaryCells[createRowSummaryKey(row.id)]?.value ?? null);
    const columnFrequencies = state.grid.columns.map(
        (column) => state.grid.columnSummaryCells[createColumnSummaryKey(column.id)]?.value ?? null
    );

    return serializeMatrixPayload({
        rows,
        columns,
        rowLayers,
        columnLayers,
        rowRequirements,
        columnRequirements,
        values,
        bodyCellTypes,
        bodyCellMetadata,
        bodyCellDynamicCombos,
        rowFrequencies,
        columnFrequencies,
        expectedValue: state.grid.expectedValueCell.value,
        metadata: previous?.metadata ?? {
            matrixId: state.grid.metadata.matrixId,
            title: state.grid.metadata.title,
            source: "editor",
        },
        extensions: previous?.extensions,
    });
}
