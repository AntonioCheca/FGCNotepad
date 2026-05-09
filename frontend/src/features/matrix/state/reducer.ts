import {createBodyCellKey, createColumnSummaryKey, createExpectedValueKey, createRowSummaryKey, isBodyCellKey, isColumnSummaryKey, isRowSummaryKey} from "../model/keys";
import {MatrixAxisItem, MatrixEditorState, MatrixResourceRequirement, MatrixSelectionTarget} from "../model/stateTypes";
import {validateCommittedNumericDraft} from "../model/numericValidation";
import {isEditableBodyCell} from "../model/cellGuards";
import {MatrixAction} from "./actions";

function createNextAxisItem(axis: MatrixAxisItem[], prefix: "row" | "column"): MatrixAxisItem {
    const nextIndex = axis.length + 1;
    return {
        id: `${prefix}_${nextIndex}`,
        label: `${prefix === "row" ? "Row" : "Column"} ${nextIndex}`,
        layer: 1,
        requirements: [],
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

function createSelectionSlice(target: MatrixSelectionTarget | null): MatrixEditorState["selection"] {
    return {
        activeTarget: target,
        anchorTarget: target,
        selectedKeys: target ? [target.key] : [],
    };
}

export function matrixEditorReducer(state: MatrixEditorState, action: MatrixAction): MatrixEditorState {
    switch (action.type) {
        case "grid/replaceState": {
            return action.payload.state;
        }

        case "grid/setCellValue": {
            const cell = state.grid.bodyCells[action.payload.key];
            if (!isEditableBodyCell(cell)) {
                return state;
            }

            return {
                ...state,
                grid: {
                    ...state.grid,
                    bodyCells: {
                        ...state.grid.bodyCells,
                        [cell.key]: {
                            ...cell,
                            value: action.payload.value,
                        },
                    },
                },
                derived: {
                    ...state.derived,
                    isDirty: true,
                },
            };
        }

        case "grid/updateReferenceCache": {
            const cell = state.grid.bodyCells[action.payload.key];
            if (!cell || cell.kind !== "reference" || !cell.reference) {
                return state;
            }

            return {
                ...state,
                grid: {
                    ...state.grid,
                    bodyCells: {
                        ...state.grid.bodyCells,
                        [action.payload.key]: {
                            ...cell,
                            reference: {
                                ...cell.reference,
                                cachedValue: action.payload.cachedValue,
                            },
                        },
                    },
                },
            };
        }

        case "grid/batchUpdateReferenceCache": {
            if (action.payload.updates.length === 0) {
                return state;
            }

            let hasChanges = false;
            const nextBodyCells = {...state.grid.bodyCells};

            action.payload.updates.forEach((update) => {
                const cell = nextBodyCells[update.key];
                if (!cell || cell.kind !== "reference" || !cell.reference) {
                    return;
                }

                if (cell.reference.cachedValue === update.cachedValue) {
                    return;
                }

                hasChanges = true;
                nextBodyCells[update.key] = {
                    ...cell,
                    reference: {
                        ...cell.reference,
                        cachedValue: update.cachedValue,
                    },
                };
            });

            if (!hasChanges) {
                return state;
            }

            return {
                ...state,
                grid: {
                    ...state.grid,
                    bodyCells: nextBodyCells,
                },
            };
        }

        case "grid/linkReferenceCell": {
            const cell = state.grid.bodyCells[action.payload.key];
            if (!cell) {
                return state;
            }

            return {
                ...state,
                grid: {
                    ...state.grid,
                    bodyCells: {
                        ...state.grid.bodyCells,
                        [action.payload.key]: {
                            ...cell,
                            kind: "reference",
                            dynamicCombo: null,
                            reference: {
                                kind: "reference",
                                scenarioId: action.payload.scenarioId,
                                scenarioLabel: action.payload.scenarioLabel,
                                cachedValue: cell.value,
                                preValue: cell.kind === "reference" && cell.reference ? cell.reference.preValue : {kind: "none"},
                            },
                        },
                    },
                },
                validation: {
                    ...state.validation,
                    byKey: {
                        ...state.validation.byKey,
                        [action.payload.key]: [],
                    },
                },
                derived: {
                    ...state.derived,
                    isDirty: true,
                },
            };
        }

        case "grid/setReferencePreValue": {
            const cell = state.grid.bodyCells[action.payload.key];
            if (!cell || cell.kind !== "reference" || !cell.reference) {
                return state;
            }

            return {
                ...state,
                grid: {
                    ...state.grid,
                    bodyCells: {
                        ...state.grid.bodyCells,
                        [action.payload.key]: {
                            ...cell,
                            reference: {
                                ...cell.reference,
                                preValue: action.payload.preValue,
                            },
                        },
                    },
                },
                derived: {
                    ...state.derived,
                    isDirty: true,
                },
            };
        }

        case "grid/unlinkReferenceCell": {
            const cell = state.grid.bodyCells[action.payload.key];
            if (!cell || cell.kind !== "reference") {
                return state;
            }

            return {
                ...state,
                grid: {
                    ...state.grid,
                    bodyCells: {
                        ...state.grid.bodyCells,
                        [action.payload.key]: {
                            ...cell,
                            kind: "static",
                            value: cell.value ?? cell.reference?.cachedValue ?? null,
                            reference: null,
                            dynamicCombo: null,
                        },
                    },
                },
                validation: {
                    ...state.validation,
                    byKey: {
                        ...state.validation.byKey,
                        [action.payload.key]: [],
                    },
                },
                derived: {
                    ...state.derived,
                    isDirty: true,
                },
            };
        }

        case "grid/setDynamicComboCell": {
            const cell = state.grid.bodyCells[action.payload.key];
            if (!cell) {
                return state;
            }

            return {
                ...state,
                grid: {
                    ...state.grid,
                    bodyCells: {
                        ...state.grid.bodyCells,
                        [action.payload.key]: {
                            ...cell,
                            kind: "dynamic_combo",
                            value: null,
                            reference: null,
                            dynamicCombo: {
                                attackerCharacterId: action.payload.dynamicCombo.attackerCharacterId,
                                ...(typeof action.payload.dynamicCombo.isComboInitiatorAttacker === "boolean" ? {isComboInitiatorAttacker: action.payload.dynamicCombo.isComboInitiatorAttacker} : {}),
                                starterMoveIds: [...action.payload.dynamicCombo.starterMoveIds],
                                starterContext: {
                                    isPunishCounter: action.payload.dynamicCombo.starterContext.isPunishCounter,
                                    isCounterHit: action.payload.dynamicCombo.starterContext.isCounterHit,
                                },
                            },
                        },
                    },
                },
                validation: {
                    ...state.validation,
                    byKey: {
                        ...state.validation.byKey,
                        [action.payload.key]: [],
                    },
                },
                derived: {
                    ...state.derived,
                    isDirty: true,
                },
            };
        }

        case "grid/setDynamicComboResolvedValue": {
            const cell = state.grid.bodyCells[action.payload.key];
            if (!cell || cell.kind !== "dynamic_combo") {
                return state;
            }

            return {
                ...state,
                grid: {
                    ...state.grid,
                    bodyCells: {
                        ...state.grid.bodyCells,
                        [action.payload.key]: {
                            ...cell,
                            value: action.payload.value,
                        },
                    },
                },
                derived: {
                    ...state.derived,
                    isDirty: true,
                },
            };
        }

        case "grid/setRowSummaryValue": {
            const key = createRowSummaryKey(action.payload.rowId);
            const current = state.grid.rowSummaryCells[key];
            if (!current) {
                return state;
            }

            return {
                ...state,
                grid: {
                    ...state.grid,
                    rowSummaryCells: {
                        ...state.grid.rowSummaryCells,
                        [key]: {
                            ...current,
                            value: action.payload.value,
                        },
                    },
                },
                derived: {
                    ...state.derived,
                    isDirty: true,
                },
            };
        }

        case "grid/setColumnSummaryValue": {
            const key = createColumnSummaryKey(action.payload.columnId);
            const current = state.grid.columnSummaryCells[key];
            if (!current) {
                return state;
            }

            return {
                ...state,
                grid: {
                    ...state.grid,
                    columnSummaryCells: {
                        ...state.grid.columnSummaryCells,
                        [key]: {
                            ...current,
                            value: action.payload.value,
                        },
                    },
                },
                derived: {
                    ...state.derived,
                    isDirty: true,
                },
            };
        }

        case "grid/setExpectedValue": {
            return {
                ...state,
                grid: {
                    ...state.grid,
                    expectedValueCell: {
                        ...state.grid.expectedValueCell,
                        value: action.payload.value,
                    },
                },
                derived: {
                    ...state.derived,
                    isDirty: true,
                },
            };
        }

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

        case "selection/setActive": {
            return {
                ...state,
                selection: createSelectionSlice(action.payload.target),
            };
        }

        case "editing/start": {
            return {
                ...state,
                editing: {
                    mode: "edit",
                    activeKey: action.payload.key,
                    draft: action.payload.draft,
                },
                validation: {
                    ...state.validation,
                    byKey: {
                        ...state.validation.byKey,
                        [action.payload.key]: [],
                    },
                },
            };
        }

        case "editing/updateDraft": {
            if (state.editing.mode !== "edit") {
                return state;
            }

            return {
                ...state,
                editing: {
                    ...state.editing,
                    draft: action.payload.draft,
                },
            };
        }

        case "editing/commit": {
            if (state.editing.mode !== "edit" || state.editing.activeKey === null) {
                return state;
            }

            const {activeKey, draft} = state.editing;
            const parsed = validateCommittedNumericDraft(draft ?? "");
            const validation = {...state.validation.byKey, [activeKey]: parsed.issues};

            if (isBodyCellKey(activeKey) && state.grid.bodyCells[activeKey]) {
                const nextValue = parsed.issues.length === 0 ? parsed.value : state.grid.bodyCells[activeKey].value;
                return {
                    ...state,
                    grid: {
                        ...state.grid,
                        bodyCells: {
                            ...state.grid.bodyCells,
                            [activeKey]: {
                                ...state.grid.bodyCells[activeKey],
                                value: nextValue,
                            },
                        },
                    },
                    editing: {
                        mode: "view",
                        activeKey: null,
                        draft: null,
                    },
                    validation: {
                        ...state.validation,
                        byKey: validation,
                    },
                    derived: {
                        ...state.derived,
                        isDirty: true,
                    },
                };
            }

            if (isRowSummaryKey(activeKey) && state.grid.rowSummaryCells[activeKey]) {
                const nextValue = parsed.issues.length === 0 ? parsed.value : state.grid.rowSummaryCells[activeKey].value;
                return {
                    ...state,
                    grid: {
                        ...state.grid,
                        rowSummaryCells: {
                            ...state.grid.rowSummaryCells,
                            [activeKey]: {
                                ...state.grid.rowSummaryCells[activeKey],
                                value: nextValue,
                            },
                        },
                    },
                    editing: {
                        mode: "view",
                        activeKey: null,
                        draft: null,
                    },
                    validation: {
                        ...state.validation,
                        byKey: validation,
                    },
                    derived: {
                        ...state.derived,
                        isDirty: true,
                    },
                };
            }

            if (isColumnSummaryKey(activeKey) && state.grid.columnSummaryCells[activeKey]) {
                const nextValue = parsed.issues.length === 0 ? parsed.value : state.grid.columnSummaryCells[activeKey].value;
                return {
                    ...state,
                    grid: {
                        ...state.grid,
                        columnSummaryCells: {
                            ...state.grid.columnSummaryCells,
                            [activeKey]: {
                                ...state.grid.columnSummaryCells[activeKey],
                                value: nextValue,
                            },
                        },
                    },
                    editing: {
                        mode: "view",
                        activeKey: null,
                        draft: null,
                    },
                    validation: {
                        ...state.validation,
                        byKey: validation,
                    },
                    derived: {
                        ...state.derived,
                        isDirty: true,
                    },
                };
            }

            if (activeKey === createExpectedValueKey()) {
                return {
                    ...state,
                    editing: {
                        mode: "view",
                        activeKey: null,
                        draft: null,
                    },
                    validation: {
                        ...state.validation,
                        byKey: {
                            ...validation,
                            [activeKey]: [{code: "readonly_cell", message: "This cell is read-only."}],
                        },
                    },
                };
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

        case "editing/cancel": {
            return {
                ...state,
                editing: {
                    mode: "view",
                    activeKey: null,
                    draft: null,
                },
            };
        }

        case "validation/setForKey": {
            return {
                ...state,
                validation: {
                    ...state.validation,
                    byKey: {
                        ...state.validation.byKey,
                        [action.payload.key]: action.payload.issues,
                    },
                },
            };
        }

        case "validation/setGlobal": {
            return {
                ...state,
                validation: {
                    ...state.validation,
                    globalIssues: action.payload.issues,
                },
            };
        }

        case "derived/setComputed": {
            return {
                ...state,
                derived: {
                    ...state.derived,
                    computedExpectedValue: action.payload.expectedValue,
                    rowComputed: action.payload.rowComputed ?? state.derived.rowComputed,
                    columnComputed: action.payload.columnComputed ?? state.derived.columnComputed,
                    lastComputedAt: Date.now(),
                },
            };
        }

        case "derived/markDirty": {
            return {
                ...state,
                derived: {
                    ...state.derived,
                    isDirty: action.payload.isDirty,
                },
            };
        }

        case "viewport/patch": {
            return {
                ...state,
                viewport: {
                    ...state.viewport,
                    ...action.payload,
                },
            };
        }

        default:
            return state;
    }
}
