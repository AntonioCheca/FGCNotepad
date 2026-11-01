import {MatrixAxisItem, MatrixEditorState} from "@/src/features/matrix/model";
import {axisPayoffAdjustment} from "./matrixAxisResourceCost";

interface BuildPayoffMatrixOptions {
    state: MatrixEditorState;
    rows: MatrixAxisItem[];
    columns: MatrixAxisItem[];
    displayedBodyValues: Record<string, number | null>;
    dynamicOverrides: Record<string, number | null>;
}

export function buildPayoffMatrix({state, rows, columns, displayedBodyValues, dynamicOverrides}: BuildPayoffMatrixOptions): Record<string, Record<string, number>> {
    return rows.reduce<Record<string, Record<string, number>>>((rowAcc, row) => {
        const rowLabel = row.label.trim() || row.id;
        const rowAdjustment = axisPayoffAdjustment(row);
        const rowValues = columns.reduce<Record<string, number>>((columnAcc, column) => {
            const key = `body::${row.id}::${column.id}`;
            const displayed = displayedBodyValues[key];
            const overriddenDynamicValue = dynamicOverrides[key];
            const sourceValue =
                state.grid.bodyCells[key]?.kind === "dynamic_combo"
                    ? overriddenDynamicValue
                    : typeof displayed === "number"
                        ? displayed
                        : state.grid.bodyCells[key]?.value;

            const baseValue = typeof sourceValue === "number" && Number.isFinite(sourceValue) ? sourceValue : 0;
            columnAcc[column.label.trim() || column.id] = baseValue + rowAdjustment + axisPayoffAdjustment(column);
            return columnAcc;
        }, {});

        rowAcc[rowLabel] = rowValues;
        return rowAcc;
    }, {});
}

export function toSolveRowsAndColumns(state: MatrixEditorState, layerLimit: number | null): {rows: MatrixAxisItem[]; columns: MatrixAxisItem[]} {
    if (layerLimit === null) {
        return {
            rows: state.grid.rows,
            columns: state.grid.columns,
        };
    }

    return {
        rows: state.grid.rows.filter((row) => row.layer <= layerLimit),
        columns: state.grid.columns.filter((column) => column.layer <= layerLimit),
    };
}
