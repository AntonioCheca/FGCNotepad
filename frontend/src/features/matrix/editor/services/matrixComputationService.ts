import {createBodyCellKey, MatrixEditorState} from "@/src/features/matrix/model";

export function computeExpectedValue(values: Array<Array<number | null>>, rowWeights: Array<number | null>, columnWeights: Array<number | null>): number | null {
    if (values.length === 0 || values[0]?.length === 0) {
        return null;
    }

    let expectedValue = 0;
    let hasUsableTerm = false;

    for (let rowIndex = 0; rowIndex < values.length; rowIndex++) {
        for (let columnIndex = 0; columnIndex < values[rowIndex].length; columnIndex++) {
            const value = values[rowIndex][columnIndex];
            const rowWeight = rowWeights[rowIndex];
            const columnWeight = columnWeights[columnIndex];

            if (value === null || rowWeight === null || columnWeight === null) {
                continue;
            }

            expectedValue += value * rowWeight * columnWeight;
            hasUsableTerm = true;
        }
    }

    return hasUsableTerm ? Number(expectedValue.toFixed(4)) : null;
}

export function computeDisplayedExpectedValue(targetState: MatrixEditorState, displayedBodyValues: Record<string, number | null>): number | null {
    let value = 0;
    let hasUsableTerm = false;

    targetState.grid.rows.forEach((row) => {
        const rowWeight = targetState.grid.rowSummaryCells[`row-summary::${row.id}`]?.value;
        targetState.grid.columns.forEach((column) => {
            const columnWeight = targetState.grid.columnSummaryCells[`column-summary::${column.id}`]?.value;
            const key = createBodyCellKey(row.id, column.id);
            const cellValue = displayedBodyValues[key] ?? targetState.grid.bodyCells[key]?.value ?? null;
            if (cellValue === null || rowWeight === null || columnWeight === null) {
                return;
            }

            value += cellValue * rowWeight * columnWeight;
            hasUsableTerm = true;
        });
    });

    return hasUsableTerm ? Number(value.toFixed(4)) : null;
}
