import {MatrixEditorState} from "@/src/features/matrix/model";

export function computeHighestLayer(state: MatrixEditorState): number {
    const layers = [
        ...state.grid.rows.map((row) => row.layer),
        ...state.grid.columns.map((column) => column.layer),
    ].filter((value) => Number.isFinite(value));

    if (layers.length === 0) {
        return 1;
    }

    return Math.max(1, ...layers);
}

export function buildVisibleMatrixState(state: MatrixEditorState, layerLimit: number | null): MatrixEditorState {
    if (layerLimit === null) {
        return state;
    }

    const visibleRows = state.grid.rows.filter((row) => row.layer <= layerLimit);
    const visibleColumns = state.grid.columns.filter((column) => column.layer <= layerLimit);
    const visibleRowIds = new Set(visibleRows.map((row) => row.id));
    const visibleColumnIds = new Set(visibleColumns.map((column) => column.id));

    const visibleBodyCells = Object.fromEntries(
        Object.entries(state.grid.bodyCells).filter(([, cell]) => visibleRowIds.has(cell.rowId) && visibleColumnIds.has(cell.columnId))
    );
    const visibleRowSummaryCells = Object.fromEntries(
        Object.entries(state.grid.rowSummaryCells).filter(([, summary]) => {
            const rowId = summary.key.replace("row-summary::", "");
            return visibleRowIds.has(rowId);
        })
    );
    const visibleColumnSummaryCells = Object.fromEntries(
        Object.entries(state.grid.columnSummaryCells).filter(([, summary]) => {
            const columnId = summary.key.replace("column-summary::", "");
            return visibleColumnIds.has(columnId);
        })
    );

    return {
        ...state,
        grid: {
            ...state.grid,
            rows: visibleRows,
            columns: visibleColumns,
            bodyCells: visibleBodyCells,
            rowSummaryCells: visibleRowSummaryCells,
            columnSummaryCells: visibleColumnSummaryCells,
        },
    };
}
