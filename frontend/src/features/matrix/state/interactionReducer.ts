import {createExpectedValueKey, isBodyCellKey, isColumnSummaryKey, isRowSummaryKey} from "../model/keys";
import {MatrixEditorState} from "../model/stateTypes";
import {validateCommittedNumericDraft} from "../model/numericValidation";
import {MatrixAction} from "./actions";
import {createSelectionSlice} from "./selectionSlice";

/** Selection, editing, validation, derived values and viewport. Returns null for other actions. */
export function reduceInteractionAction(state: MatrixEditorState, action: MatrixAction): MatrixEditorState | null {
    switch (action.type) {
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
            return null;
    }
}
