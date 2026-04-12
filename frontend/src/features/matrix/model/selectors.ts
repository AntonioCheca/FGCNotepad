import {createBodyCellKey} from "./keys";
import {MatrixBodyCell, MatrixEditorState, MatrixSelectionTarget, MatrixValidationIssue} from "./stateTypes";
import {isEditableBodyCell} from "./cellGuards";

export function selectRows(state: MatrixEditorState) {
    return state.grid.rows;
}

export function selectColumns(state: MatrixEditorState) {
    return state.grid.columns;
}

export function selectRowCount(state: MatrixEditorState): number {
    return state.grid.rows.length;
}

export function selectColumnCount(state: MatrixEditorState): number {
    return state.grid.columns.length;
}

export function selectBodyCellByIds(state: MatrixEditorState, rowId: string, columnId: string): MatrixBodyCell | undefined {
    return state.grid.bodyCells[createBodyCellKey(rowId, columnId)];
}

export function selectBodyCellByIndex(
    state: MatrixEditorState,
    rowIndex: number,
    columnIndex: number
): MatrixBodyCell | undefined {
    const row = state.grid.rows[rowIndex];
    const column = state.grid.columns[columnIndex];

    if (!row || !column) {
        return undefined;
    }

    return selectBodyCellByIds(state, row.id, column.id);
}

export function selectGridValues(state: MatrixEditorState): Array<Array<number | null>> {
    return state.grid.rows.map((row) =>
        state.grid.columns.map((column) => selectBodyCellByIds(state, row.id, column.id)?.value ?? null)
    );
}

export function selectActiveTarget(state: MatrixEditorState): MatrixSelectionTarget | null {
    return state.selection.activeTarget;
}

export function selectIsEditing(state: MatrixEditorState): boolean {
    return state.editing.mode === "edit";
}

export function selectActiveDraft(state: MatrixEditorState): string | null {
    return state.editing.draft;
}

export function selectValidationForKey(state: MatrixEditorState, key: string): MatrixValidationIssue[] {
    return state.validation.byKey[key] ?? [];
}

export function selectHasValidationErrors(state: MatrixEditorState): boolean {
    if (state.validation.globalIssues.length > 0) {
        return true;
    }

    return Object.values(state.validation.byKey).some((issues) => issues.length > 0);
}

export function selectDerivedExpectedValue(state: MatrixEditorState): number | null {
    return state.derived.computedExpectedValue;
}

export function selectIsDirty(state: MatrixEditorState): boolean {
    return state.derived.isDirty;
}

export function selectViewportDensity(state: MatrixEditorState): "standard" | "compact" {
    return state.viewport.density;
}

export function selectCellValueByKey(state: MatrixEditorState, key: string): number | null {
    if (state.grid.bodyCells[key]) {
        return state.grid.bodyCells[key].value;
    }

    if (state.grid.rowSummaryCells[key]) {
        return state.grid.rowSummaryCells[key].value;
    }

    if (state.grid.columnSummaryCells[key]) {
        return state.grid.columnSummaryCells[key].value;
    }

    if (state.grid.expectedValueCell.key === key) {
        return state.grid.expectedValueCell.value;
    }

    return null;
}

export function selectIsCellEditableByKey(state: MatrixEditorState, key: string): boolean {
    const bodyCell = state.grid.bodyCells[key];
    if (bodyCell) {
        return isEditableBodyCell(bodyCell);
    }

    if (state.grid.rowSummaryCells[key]) {
        return true;
    }

    if (state.grid.columnSummaryCells[key]) {
        return true;
    }

    if (state.grid.expectedValueCell.key === key) {
        return false;
    }

    return false;
}
