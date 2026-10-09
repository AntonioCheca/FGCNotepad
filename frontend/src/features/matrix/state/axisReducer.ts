import {createBodyCellKey, createColumnSummaryKey, createExpectedValueKey, createRowSummaryKey} from "../model/keys";
import {MatrixAxisItem, MatrixEditorState, MatrixResourceRequirement, MatrixSelectionTarget} from "../model/stateTypes";
import {MatrixAction} from "./actions";
import {createSelectionSlice} from "./selectionSlice";

function createNextAxisItem(axis: MatrixAxisItem[], prefix: "row" | "column"): MatrixAxisItem {
    const nextIndex = axis.length + 1;
    return {
        id: `${prefix}_${nextIndex}`,
        label: `${prefix === "row" ? "Row" : "Column"} ${nextIndex}`,
        layer: 1,
        requirements: [],
        colorTag: null,
    };
}

function normalizeRequirement(requirement: MatrixResourceRequirement): MatrixResourceRequirement {
    const resource = requirement.resource === "drive" || requirement.resource === "super" ? requirement.resource : "health";
    const rawThreshold = Number.isFinite(requirement.threshold) ? requirement.threshold : 0;

    return {
        owner: requirement.owner === "defender" ? "defender" : "attacker",
        resource,
        operator: ">=",
        threshold: Math.max(0, resource === "drive" ? rawThreshold : Math.trunc(rawThreshold)),
    };
}

function updateAxisRequirements(
    state: MatrixEditorState,
    axis: "rows" | "columns",
    axisId: string,
    updater: (requirements: MatrixResourceRequirement[]) => MatrixResourceRequirement[]
): MatrixEditorState {
    const currentAxis = state.grid[axis];
    const nextAxis = currentAxis.map((item) =>
        item.id === axisId ? {...item, requirements: updater(item.requirements)} : item
    );

    return {
        ...state,
        grid: {
            ...state.grid,
            [axis]: nextAxis,
        },
        derived: {
            ...state.derived,
            isDirty: true,
        },
    };
}

function clearEditingIfMissing(state: MatrixEditorState): MatrixEditorState {
    const activeKey = state.editing.activeKey;
    if (!activeKey) {
        return state;
    }

    const exists =
        Boolean(state.grid.bodyCells[activeKey]) ||
        Boolean(state.grid.rowSummaryCells[activeKey]) ||
        Boolean(state.grid.columnSummaryCells[activeKey]) ||
        activeKey === createExpectedValueKey();

    if (exists) {
        return state;
    }

    return {
        ...state,
        editing: {
            mode: "view",
            activeKey: null,
            draft: null,
        },
    };
}

function clearSelectionForMissingKey(state: MatrixEditorState): MatrixEditorState {
    const active = state.selection.activeTarget;
    if (!active) {
        return state;
    }

    const key = active.key;
    const exists =
        Boolean(state.grid.bodyCells[key]) ||
        Boolean(state.grid.rowSummaryCells[key]) ||
        Boolean(state.grid.columnSummaryCells[key]) ||
        key === createExpectedValueKey();

    if (exists) {
        return state;
    }

    return {
        ...state,
        selection: {
            activeTarget: null,
            anchorTarget: null,
            selectedKeys: [],
        },
    };
}

/** Axis labels, layers, colours, requirements and row/column structure. Returns null for other actions. */
export function reduceAxisAction(state: MatrixEditorState, action: MatrixAction): MatrixEditorState | null {
    switch (action.type) {
        case "grid/setAxisLabel": {
            const target = action.payload.axis === "rows" ? state.grid.rows : state.grid.columns;
            const updated = target.map((axis) =>
                axis.id === action.payload.axisId ? {...axis, label: action.payload.label} : axis
            );

            return {
                ...state,
                grid: {
                    ...state.grid,
                    [action.payload.axis]: updated,
                },
                derived: {
                    ...state.derived,
                    isDirty: true,
                },
            };
        }

        case "grid/setAxisLayer": {
            const target = action.payload.axis === "rows" ? state.grid.rows : state.grid.columns;
            const updated = target.map((axis) =>
                axis.id === action.payload.axisId ? {...axis, layer: Math.trunc(action.payload.layer)} : axis
            );

            return {
                ...state,
                grid: {
                    ...state.grid,
                    [action.payload.axis]: updated,
                },
                derived: {
                    ...state.derived,
                    isDirty: true,
                },
            };
        }

        case "grid/setAxisColorTag": {
            const target = action.payload.axis === "rows" ? state.grid.rows : state.grid.columns;
            const updated = target.map((axis) =>
                axis.id === action.payload.axisId ? {...axis, colorTag: action.payload.colorTag} : axis
            );

            return {
                ...state,
                grid: {
                    ...state.grid,
                    [action.payload.axis]: updated,
                },
                derived: {
                    ...state.derived,
                    isDirty: true,
                },
            };
        }

        case "grid/addAxisRequirement": {
            return updateAxisRequirements(state, action.payload.axis, action.payload.axisId, (requirements) => [
                ...requirements,
                normalizeRequirement(action.payload.requirement),
            ]);
        }

        case "grid/updateAxisRequirement": {
            return updateAxisRequirements(state, action.payload.axis, action.payload.axisId, (requirements) =>
                requirements.map((requirement, index) =>
                    index === action.payload.index ? normalizeRequirement(action.payload.requirement) : requirement
                )
            );
        }

        case "grid/removeAxisRequirement": {
            return updateAxisRequirements(state, action.payload.axis, action.payload.axisId, (requirements) =>
                requirements.filter((_, index) => index !== action.payload.index)
            );
        }

        case "grid/addRow": {
            const nextRow = createNextAxisItem(state.grid.rows, "row");
            const bodyCells = {...state.grid.bodyCells};

            state.grid.columns.forEach((column) => {
                const key = createBodyCellKey(nextRow.id, column.id);
                bodyCells[key] = {
                    key,
                    rowId: nextRow.id,
                    columnId: column.id,
                    kind: "static",
                    value: null,
                    reference: null,
                    dynamicCombo: null,
                };
            });

            const rowSummaryKey = createRowSummaryKey(nextRow.id);
            const nextTarget: MatrixSelectionTarget = {
                zone: "rowSummary",
                rowId: nextRow.id,
                key: rowSummaryKey,
            };

            return {
                ...state,
                grid: {
                    ...state.grid,
                    rows: [...state.grid.rows, nextRow],
                    bodyCells,
                    rowSummaryCells: {
                        ...state.grid.rowSummaryCells,
                        [rowSummaryKey]: {key: rowSummaryKey, value: null},
                    },
                },
                selection: createSelectionSlice(nextTarget),
                derived: {
                    ...state.derived,
                    isDirty: true,
                },
            };
        }

        case "grid/removeRow": {
            if (state.grid.rows.length <= 1) {
                return state;
            }

            const removedIndex = state.grid.rows.findIndex((row) => row.id === action.payload.rowId);
            if (removedIndex < 0) {
                return state;
            }

            const rows = state.grid.rows.filter((row) => row.id !== action.payload.rowId);
            const bodyCells = Object.fromEntries(
                Object.entries(state.grid.bodyCells).filter(([, cell]) => cell.rowId !== action.payload.rowId)
            );
            const fallbackIndex = Math.min(removedIndex, rows.length - 1);
            const fallbackRow = rows[fallbackIndex] ?? null;
            const nextTarget: MatrixSelectionTarget | null = fallbackRow
                ? {
                    zone: "rowSummary",
                    rowId: fallbackRow.id,
                    key: createRowSummaryKey(fallbackRow.id),
                }
                : null;

            const nextState = {
                ...state,
                grid: {
                    ...state.grid,
                    rows,
                    bodyCells,
                    rowSummaryCells: Object.fromEntries(
                        Object.entries(state.grid.rowSummaryCells).filter(([key]) => key !== createRowSummaryKey(action.payload.rowId))
                    ),
                },
                selection: createSelectionSlice(nextTarget),
                derived: {
                    ...state.derived,
                    isDirty: true,
                },
            };

            return clearEditingIfMissing(clearSelectionForMissingKey(nextState));
        }

        case "grid/addColumn": {
            const nextColumn = createNextAxisItem(state.grid.columns, "column");
            const bodyCells = {...state.grid.bodyCells};

            state.grid.rows.forEach((row) => {
                const key = createBodyCellKey(row.id, nextColumn.id);
                bodyCells[key] = {
                    key,
                    rowId: row.id,
                    columnId: nextColumn.id,
                    kind: "static",
                    value: null,
                    reference: null,
                    dynamicCombo: null,
                };
            });

            const columnSummaryKey = createColumnSummaryKey(nextColumn.id);
            const nextTarget: MatrixSelectionTarget = {
                zone: "columnSummary",
                columnId: nextColumn.id,
                key: columnSummaryKey,
            };

            return {
                ...state,
                grid: {
                    ...state.grid,
                    columns: [...state.grid.columns, nextColumn],
                    bodyCells,
                    columnSummaryCells: {
                        ...state.grid.columnSummaryCells,
                        [columnSummaryKey]: {key: columnSummaryKey, value: null},
                    },
                },
                selection: createSelectionSlice(nextTarget),
                derived: {
                    ...state.derived,
                    isDirty: true,
                },
            };
        }

        case "grid/removeColumn": {
            if (state.grid.columns.length <= 1) {
                return state;
            }

            const removedIndex = state.grid.columns.findIndex((column) => column.id === action.payload.columnId);
            if (removedIndex < 0) {
                return state;
            }

            const columns = state.grid.columns.filter((column) => column.id !== action.payload.columnId);
            const bodyCells = Object.fromEntries(
                Object.entries(state.grid.bodyCells).filter(([, cell]) => cell.columnId !== action.payload.columnId)
            );
            const fallbackIndex = Math.min(removedIndex, columns.length - 1);
            const fallbackColumn = columns[fallbackIndex] ?? null;
            const nextTarget: MatrixSelectionTarget | null = fallbackColumn
                ? {
                    zone: "columnSummary",
                    columnId: fallbackColumn.id,
                    key: createColumnSummaryKey(fallbackColumn.id),
                }
                : null;

            const nextState = {
                ...state,
                grid: {
                    ...state.grid,
                    columns,
                    bodyCells,
                    columnSummaryCells: Object.fromEntries(
                        Object.entries(state.grid.columnSummaryCells).filter(
                            ([key]) => key !== createColumnSummaryKey(action.payload.columnId)
                        )
                    ),
                },
                selection: createSelectionSlice(nextTarget),
                derived: {
                    ...state.derived,
                    isDirty: true,
                },
            };

            return clearEditingIfMissing(clearSelectionForMissingKey(nextState));
        }

        default:
            return null;
    }
}
