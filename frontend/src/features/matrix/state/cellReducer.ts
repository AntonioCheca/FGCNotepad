import {createColumnSummaryKey, createRowSummaryKey} from "../model/keys";
import {MatrixEditorState} from "../model/stateTypes";
import {isEditableBodyCell} from "../model/cellGuards";
import {MatrixAction} from "./actions";

/** Body cells, references, dynamic combos and summary values. Returns null for other actions. */
export function reduceCellAction(state: MatrixEditorState, action: MatrixAction): MatrixEditorState | null {
    switch (action.type) {
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

                if (cell.reference.cachedValue === update.cachedValue && cell.value === update.cachedValue) {
                    return;
                }

                // The cell value follows the cache, as a payload round trip would; a stale value would
                // otherwise ask for the same update after every render.
                hasChanges = true;
                nextBodyCells[update.key] = {
                    ...cell,
                    value: update.cachedValue,
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
                                weight: cell.kind === "reference" && cell.reference ? cell.reference.weight : undefined,
                                perspective: cell.kind === "reference" && cell.reference ? cell.reference.perspective : undefined,
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

        case "grid/setReferenceWeight": {
            const cell = state.grid.bodyCells[action.payload.key];
            const weight = action.payload.weight;
            if (!cell || cell.kind !== "reference" || !cell.reference || !(weight > 0 && weight <= 1) || (cell.reference.weight ?? 1) === weight) {
                return state;
            }

            return {
                ...state,
                grid: {
                    ...state.grid,
                    bodyCells: {
                        ...state.grid.bodyCells,
                        [action.payload.key]: {...cell, reference: {...cell.reference, weight}},
                    },
                },
                derived: {...state.derived, isDirty: true},
            };
        }

        case "grid/setReferencePerspective": {
            const cell = state.grid.bodyCells[action.payload.key];
            const perspective = action.payload.perspective;
            if (!cell || cell.kind !== "reference" || !cell.reference || (cell.reference.perspective ?? "same") === perspective) {
                return state;
            }

            return {
                ...state,
                grid: {
                    ...state.grid,
                    bodyCells: {
                        ...state.grid.bodyCells,
                        [action.payload.key]: {...cell, reference: {...cell.reference, perspective}},
                    },
                },
                derived: {...state.derived, isDirty: true},
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
                                    ...(action.payload.dynamicCombo.starterContext.isPerfectParry === true ? {isPerfectParry: true} : {}),
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

        default:
            return null;
    }
}
