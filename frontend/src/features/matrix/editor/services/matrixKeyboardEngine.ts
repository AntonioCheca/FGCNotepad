import {MatrixAction, matrixActions} from "@/src/features/matrix/state/actions";
import {createBodyCellKey, createColumnSummaryKey, createRowSummaryKey, MatrixEditorState, MatrixSelectionTarget, selectCellValueByKey, selectIsCellEditableByKey} from "@/src/features/matrix/model";

export interface MatrixKeyEventLike {
    key: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    altKey?: boolean;
}

export interface MatrixKeyboardOutcome {
    actions: MatrixAction[];
    handled: boolean;
}

function isPrintableKey(event: MatrixKeyEventLike): boolean {
    return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
}

function firstBodyTarget(state: MatrixEditorState): MatrixSelectionTarget | null {
    const firstRow = state.grid.rows[0];
    const firstColumn = state.grid.columns[0];

    if (!firstRow || !firstColumn) {
        return null;
    }

    return {
        zone: "body",
        rowId: firstRow.id,
        columnId: firstColumn.id,
        key: createBodyCellKey(firstRow.id, firstColumn.id),
    };
}

function moveBodySelection(state: MatrixEditorState, rowDelta: number, columnDelta: number): MatrixSelectionTarget | null {
    const active = state.selection.activeTarget;
    if (!active || active.zone !== "body") {
        return firstBodyTarget(state);
    }

    const rowIndex = state.grid.rows.findIndex((row) => row.id === active.rowId);
    const columnIndex = state.grid.columns.findIndex((column) => column.id === active.columnId);

    if (rowIndex < 0 || columnIndex < 0) {
        return firstBodyTarget(state);
    }

    const nextRowIndex = Math.max(0, Math.min(state.grid.rows.length - 1, rowIndex + rowDelta));
    const nextColumnIndex = Math.max(0, Math.min(state.grid.columns.length - 1, columnIndex + columnDelta));

    const nextRow = state.grid.rows[nextRowIndex];
    const nextColumn = state.grid.columns[nextColumnIndex];

    return {
        zone: "body",
        rowId: nextRow.id,
        columnId: nextColumn.id,
        key: createBodyCellKey(nextRow.id, nextColumn.id),
    };
}

function clearSelectedCell(state: MatrixEditorState, key: string): MatrixAction[] {
    if (!selectIsCellEditableByKey(state, key)) {
        return [
            matrixActions.setValidationForKey(key, [{code: "readonly_cell", message: "This cell is read-only."}]),
        ];
    }

    const active = state.selection.activeTarget;
    if (!active) {
        return [];
    }

    if (active.zone === "body") {
        return [matrixActions.setCellValue(key, null)];
    }

    if (active.zone === "rowSummary") {
        return [matrixActions.setRowSummaryValue(active.rowId, null)];
    }

    if (active.zone === "columnSummary") {
        return [matrixActions.setColumnSummaryValue(active.columnId, null)];
    }

    return [
        matrixActions.setValidationForKey(key, [{code: "readonly_cell", message: "This cell is read-only."}]),
    ];
}

function startEditing(state: MatrixEditorState, key: string, draft: string): MatrixAction[] {
    if (!selectIsCellEditableByKey(state, key)) {
        return [
            matrixActions.setValidationForKey(key, [{code: "readonly_cell", message: "This cell is read-only."}]),
        ];
    }

    return [matrixActions.startEditing(key, draft)];
}

function ensureActiveTarget(state: MatrixEditorState): MatrixSelectionTarget | null {
    return state.selection.activeTarget ?? firstBodyTarget(state);
}

export function interpretMatrixKeyDown(state: MatrixEditorState, event: MatrixKeyEventLike): MatrixKeyboardOutcome {
    if (state.editing.mode === "edit") {
        if (event.key === "Enter") {
            return {handled: true, actions: [matrixActions.commitEditing()]};
        }

        if (event.key === "Escape") {
            return {handled: true, actions: [matrixActions.cancelEditing()]};
        }

        if (event.key === "ArrowUp") {
            return {
                handled: true,
                actions: [
                    matrixActions.commitEditing(),
                    matrixActions.setActiveSelection(moveBodySelection(state, -1, 0)),
                ],
            };
        }

        if (event.key === "ArrowDown") {
            return {
                handled: true,
                actions: [
                    matrixActions.commitEditing(),
                    matrixActions.setActiveSelection(moveBodySelection(state, 1, 0)),
                ],
            };
        }

        if (event.key === "ArrowLeft") {
            return {
                handled: true,
                actions: [
                    matrixActions.commitEditing(),
                    matrixActions.setActiveSelection(moveBodySelection(state, 0, -1)),
                ],
            };
        }

        if (event.key === "ArrowRight") {
            return {
                handled: true,
                actions: [
                    matrixActions.commitEditing(),
                    matrixActions.setActiveSelection(moveBodySelection(state, 0, 1)),
                ],
            };
        }

        return {handled: false, actions: []};
    }

    const active = ensureActiveTarget(state);

    if (event.key === "ArrowUp") {
        return {
            handled: true,
            actions: [matrixActions.setActiveSelection(moveBodySelection(state, -1, 0))],
        };
    }

    if (event.key === "ArrowDown") {
        return {
            handled: true,
            actions: [matrixActions.setActiveSelection(moveBodySelection(state, 1, 0))],
        };
    }

    if (event.key === "ArrowLeft") {
        return {
            handled: true,
            actions: [matrixActions.setActiveSelection(moveBodySelection(state, 0, -1))],
        };
    }

    if (event.key === "ArrowRight") {
        return {
            handled: true,
            actions: [matrixActions.setActiveSelection(moveBodySelection(state, 0, 1))],
        };
    }

    if (!active) {
        return {handled: false, actions: []};
    }

    if (event.key === "Enter") {
        const initialValue = selectCellValueByKey(state, active.key);
        const draft = initialValue === null ? "" : String(initialValue);
        return {
            handled: true,
            actions: startEditing(state, active.key, draft),
        };
    }

    if (event.key === "Backspace" || event.key === "Delete") {
        return {
            handled: true,
            actions: clearSelectedCell(state, active.key),
        };
    }

    if (isPrintableKey(event)) {
        return {
            handled: true,
            actions: startEditing(state, active.key, event.key),
        };
    }

    return {handled: false, actions: []};
}

export function toSelectionTarget(zone: "body" | "rowSummary" | "columnSummary" | "expectedValue", idA?: string, idB?: string): MatrixSelectionTarget {
    if (zone === "body") {
        const rowId = idA ?? "";
        const columnId = idB ?? "";
        return {
            zone,
            rowId,
            columnId,
            key: createBodyCellKey(rowId, columnId),
        };
    }

    if (zone === "rowSummary") {
        const rowId = idA ?? "";
        return {
            zone,
            rowId,
            key: createRowSummaryKey(rowId),
        };
    }

    if (zone === "columnSummary") {
        const columnId = idA ?? "";
        return {
            zone,
            columnId,
            key: createColumnSummaryKey(columnId),
        };
    }

    return {
        zone: "expectedValue",
        key: "expected-value",
    };
}
