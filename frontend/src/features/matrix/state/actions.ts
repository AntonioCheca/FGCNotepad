import {MatrixSelectionTarget, MatrixValidationIssue, MatrixViewportSlice} from "../model/stateTypes";

export type MatrixAction =
    | { type: "grid/setCellValue"; payload: { key: string; value: number | null } }
    | { type: "grid/setAxisLabel"; payload: { axis: "rows" | "columns"; axisId: string; label: string } }
    | { type: "grid/addRow" }
    | { type: "grid/removeRow"; payload: { rowId: string } }
    | { type: "grid/addColumn" }
    | { type: "grid/removeColumn"; payload: { columnId: string } }
    | { type: "selection/setActive"; payload: { target: MatrixSelectionTarget | null } }
    | { type: "editing/start"; payload: { key: string; draft: string } }
    | { type: "editing/updateDraft"; payload: { draft: string } }
    | { type: "editing/commit" }
    | { type: "editing/cancel" }
    | { type: "validation/setForKey"; payload: { key: string; issues: MatrixValidationIssue[] } }
    | { type: "validation/setGlobal"; payload: { issues: MatrixValidationIssue[] } }
    | {
        type: "derived/setComputed";
        payload: {
            expectedValue: number | null;
            rowComputed?: Record<string, number | null>;
            columnComputed?: Record<string, number | null>;
        };
    }
    | { type: "derived/markDirty"; payload: { isDirty: boolean } }
    | { type: "viewport/patch"; payload: Partial<MatrixViewportSlice> };

export const matrixActions = {
    setCellValue: (key: string, value: number | null): MatrixAction => ({
        type: "grid/setCellValue",
        payload: {key, value},
    }),
    setAxisLabel: (axis: "rows" | "columns", axisId: string, label: string): MatrixAction => ({
        type: "grid/setAxisLabel",
        payload: {axis, axisId, label},
    }),
    addRow: (): MatrixAction => ({type: "grid/addRow"}),
    removeRow: (rowId: string): MatrixAction => ({type: "grid/removeRow", payload: {rowId}}),
    addColumn: (): MatrixAction => ({type: "grid/addColumn"}),
    removeColumn: (columnId: string): MatrixAction => ({type: "grid/removeColumn", payload: {columnId}}),
    setActiveSelection: (target: MatrixSelectionTarget | null): MatrixAction => ({
        type: "selection/setActive",
        payload: {target},
    }),
    startEditing: (key: string, draft: string): MatrixAction => ({
        type: "editing/start",
        payload: {key, draft},
    }),
    updateDraft: (draft: string): MatrixAction => ({
        type: "editing/updateDraft",
        payload: {draft},
    }),
    commitEditing: (): MatrixAction => ({type: "editing/commit"}),
    cancelEditing: (): MatrixAction => ({type: "editing/cancel"}),
    setValidationForKey: (key: string, issues: MatrixValidationIssue[]): MatrixAction => ({
        type: "validation/setForKey",
        payload: {key, issues},
    }),
    setGlobalValidation: (issues: MatrixValidationIssue[]): MatrixAction => ({
        type: "validation/setGlobal",
        payload: {issues},
    }),
    setComputed: (
        expectedValue: number | null,
        rowComputed?: Record<string, number | null>,
        columnComputed?: Record<string, number | null>
    ): MatrixAction => ({
        type: "derived/setComputed",
        payload: {expectedValue, rowComputed, columnComputed},
    }),
    markDirty: (isDirty: boolean): MatrixAction => ({
        type: "derived/markDirty",
        payload: {isDirty},
    }),
    patchViewport: (payload: Partial<MatrixViewportSlice>): MatrixAction => ({
        type: "viewport/patch",
        payload,
    }),
};
