import React from "react";
import {useLexicalComposerContext} from "@lexical/react/LexicalComposerContext";

import {MatrixPayload} from "@/src/types/matrixPayload";
import {isTemporarilyValidNumericDraft, selectCellValueByKey, selectGridValues, selectIsCellEditableByKey} from "@/src/features/matrix/model";
import {useScenarioTableEditor} from "@/hooks/useScenarioTableEditor";
import useSolverGames from "@/hooks/useSolverGame";
import useMoves from "@/hooks/useMoves";
import {computeExpectedValue} from "./services/matrixComputationService";
import {useMatrixEditorController} from "./state/useMatrixEditorController";
import {MatrixEditorLayout} from "./rendering/MatrixEditorLayout";
import {MatrixGrid} from "./rendering/MatrixGrid";
import {ScenarioLinkPanel} from "./rendering/ScenarioLinkPanel";
import {DynamicComboPanel} from "./rendering/DynamicComboPanel";
import {ReferenceInspector} from "./rendering/ReferenceInspector";
import {interpretMatrixKeyDown, toSelectionTarget} from "./services/matrixKeyboardEngine";
import {applyMatrixPaste} from "./services/matrixPasteEngine";
import {deriveActiveAxisContext} from "./services/matrixContextVisibility";
import {createMapReferenceResolver, resolveReferenceDisplayValues} from "./services/referenceResolutionService";
import {buildReferenceInspectorData} from "./services/referenceInspector";

interface MatrixEditorShellProps {
    matrix: MatrixPayload;
    nodeKey: string;
}

export function MatrixEditorShell({matrix, nodeKey}: MatrixEditorShellProps) {
    const [editor] = useLexicalComposerContext();
    const {solveGame} = useSolverGames();
    const [isEditorEditable, setIsEditorEditable] = React.useState<boolean>(() => editor.isEditable());
    const [isSolving, setIsSolving] = React.useState(false);
    const [moveLabelById, setMoveLabelById] = React.useState<Record<string, string>>({});
    const {handleDelete, handleBottomAreaClick, handleMatrixChange} = useScenarioTableEditor(nodeKey);
    const {getSpecificMove} = useMoves();
    const getSpecificMoveRef = React.useRef(getSpecificMove);
    const {state, dispatch, actions} = useMatrixEditorController({
        matrix,
        onMatrixChange: handleMatrixChange,
        persistChanges: isEditorEditable,
    });
    const stateRef = React.useRef(state);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [linkTargetKey, setLinkTargetKey] = React.useState<string | null>(null);
    const [dynamicComboTargetKey, setDynamicComboTargetKey] = React.useState<string | null>(null);
    const isAnyModalOpen = linkTargetKey !== null || dynamicComboTargetKey !== null;

    const canEditStructure = isEditorEditable;
    const canEditAxisLabels = isEditorEditable;
    const canEditBodyValues = isEditorEditable;
    const canEditReferences = isEditorEditable;
    const canEditDynamicCombos = isEditorEditable;
    const canEditSummaries = true;

    React.useEffect(() => {
        setIsEditorEditable(editor.isEditable());
        return editor.registerEditableListener((nextEditable) => {
            setIsEditorEditable(nextEditable);
        });
    }, [editor]);

    React.useEffect(() => {
        stateRef.current = state;
    }, [state]);

    React.useEffect(() => {
        getSpecificMoveRef.current = getSpecificMove;
    }, [getSpecificMove]);

    const expectedValue = React.useMemo(() => {
        const values = selectGridValues(state);
        const rowWeights = state.grid.rows.map((row) => state.grid.rowSummaryCells[`row-summary::${row.id}`]?.value ?? null);
        const columnWeights = state.grid.columns.map(
            (column) => state.grid.columnSummaryCells[`column-summary::${column.id}`]?.value ?? null
        );
        return computeExpectedValue(values, rowWeights, columnWeights);
    }, [state]);

    React.useEffect(() => {
        if (state.grid.expectedValueCell.value !== expectedValue) {
            dispatch(actions.setExpectedValue(expectedValue));
        }
    }, [dispatch, expectedValue, actions, state.grid.expectedValueCell.value]);

    const focusContainer = React.useCallback(() => {
        containerRef.current?.focus();
    }, []);

    const selectTarget = React.useCallback((target: ReturnType<typeof toSelectionTarget>) => {
        dispatch(actions.setActiveSelection(target));
        focusContainer();
    }, [actions, dispatch, focusContainer]);

    const startEditForKey = React.useCallback((key: string) => {
        const currentState = stateRef.current;
        const active = currentState.selection.activeTarget;

        if (!active || active.key !== key) {
            return;
        }

        if (active.zone === "body" && !canEditBodyValues) {
            dispatch(actions.setValidationForKey(key, [{code: "readonly_cell", message: "This cell is read-only."}]));
            return;
        }

        if ((active.zone === "rowSummary" || active.zone === "columnSummary") && !canEditSummaries) {
            dispatch(actions.setValidationForKey(key, [{code: "readonly_cell", message: "This cell is read-only."}]));
            return;
        }

        const currentValue = selectCellValueByKey(stateRef.current, key);
        const draft = currentValue === null ? "" : String(currentValue);
        dispatch(actions.startEditing(key, draft));
    }, [actions, canEditBodyValues, canEditSummaries, dispatch]);

    const startOverwriteEditForKey = React.useCallback((key: string, firstCharacter: string) => {
        const currentState = stateRef.current;
        const active = currentState.selection.activeTarget;

        if (!active || active.key !== key) {
            return;
        }

        if (active.zone === "body" && !canEditBodyValues) {
            dispatch(actions.setValidationForKey(key, [{code: "readonly_cell", message: "This cell is read-only."}]));
            return;
        }

        if ((active.zone === "rowSummary" || active.zone === "columnSummary") && !canEditSummaries) {
            dispatch(actions.setValidationForKey(key, [{code: "readonly_cell", message: "This cell is read-only."}]));
            return;
        }

        if (!selectIsCellEditableByKey(currentState, key)) {
            dispatch(actions.setValidationForKey(key, [{code: "readonly_cell", message: "This cell is read-only."}]));
            return;
        }

        dispatch(actions.startEditing(key, firstCharacter));
    }, [actions, canEditBodyValues, canEditSummaries, dispatch]);

    const commitEditAndRefocus = React.useCallback(() => {
        dispatch(actions.commitEditing());
        requestAnimationFrame(() => {
            focusContainer();
        });
    }, [actions, dispatch, focusContainer]);

    const cancelEditAndRefocus = React.useCallback(() => {
        dispatch(actions.cancelEditing());
        requestAnimationFrame(() => {
            focusContainer();
        });
    }, [actions, dispatch, focusContainer]);

    const draftHasFormatError = React.useMemo(() => {
        if (state.editing.mode !== "edit") {
            return false;
        }

        return !isTemporarilyValidNumericDraft(state.editing.draft ?? "");
    }, [state.editing.mode, state.editing.draft]);

    const axisContext = React.useMemo(
        () => deriveActiveAxisContext(state.selection.activeTarget),
        [state.selection.activeTarget]
    );

    const referenceSourceMap = React.useMemo(() => {
        const raw = matrix.extensions?.referenceValueByScenarioId;
        if (raw && typeof raw === "object" && !Array.isArray(raw)) {
            return raw as Record<string, unknown>;
        }
        return {};
    }, [matrix.extensions]);

    const referenceMetadataMap = React.useMemo(() => {
        const raw = matrix.extensions?.referenceMetadataByScenarioId;
        if (raw && typeof raw === "object" && !Array.isArray(raw)) {
            return raw as Record<string, unknown>;
        }
        return {};
    }, [matrix.extensions]);

    const referenceResolution = React.useMemo(() => {
        const resolver = createMapReferenceResolver(referenceSourceMap);
        return resolveReferenceDisplayValues(state, resolver);
    }, [state, referenceSourceMap]);

    React.useEffect(() => {
        if (referenceResolution.cacheUpdates.length === 0) {
            return;
        }

        dispatch(actions.batchUpdateReferenceCache(referenceResolution.cacheUpdates));
    }, [referenceResolution.cacheUpdates, actions, dispatch]);

    const displayWarnings = React.useMemo(() => {
        const messages = state.validation.globalIssues.map((issue) => issue.message);
        referenceResolution.issues.forEach((issue) => {
            if (!messages.includes(issue.message)) {
                messages.push(issue.message);
            }
        });
        const activeKey = state.selection.activeTarget?.key;

        if (activeKey) {
            const activeIssue = state.validation.byKey[activeKey]?.[0]?.message;
            if (activeIssue && !messages.includes(activeIssue)) {
                messages.unshift(activeIssue);
            }
        }

        return messages;
    }, [state.validation.globalIssues, state.validation.byKey, state.selection.activeTarget, referenceResolution.issues]);

    const selectedBodyCell = React.useMemo(() => {
        const active = state.selection.activeTarget;
        if (!active || active.zone !== "body") {
            return null;
        }

        return state.grid.bodyCells[active.key] ?? null;
    }, [state.selection.activeTarget, state.grid.bodyCells]);

    const selectedReferenceLabel = React.useMemo(() => {
        if (!selectedBodyCell || selectedBodyCell.kind !== "reference") {
            return null;
        }

        return selectedBodyCell.reference?.scenarioLabel ?? selectedBodyCell.reference?.scenarioId ?? null;
    }, [selectedBodyCell]);

    React.useEffect(() => {
        const allMoveIds = new Set<string>();

        Object.values(state.grid.bodyCells).forEach((cell) => {
            if (cell.kind !== "dynamic_combo" || !cell.dynamicCombo) {
                return;
            }

            cell.dynamicCombo.starterMoveIds.forEach((starterMoveId) => {
                allMoveIds.add(starterMoveId);
            });
        });

        const missingMoveIds = Array.from(allMoveIds).filter((moveId) => !moveLabelById[moveId]);
        if (missingMoveIds.length === 0) {
            return;
        }

        let canceled = false;

        Promise.all(
            missingMoveIds.map(async (moveId) => {
                try {
                    const move = await getSpecificMoveRef.current(moveId);
                    if (!move || typeof move !== "object") {
                        return [moveId, `Move #${moveId}`] as const;
                    }

                    const record = move as Record<string, unknown>;
                    const notation = typeof record.numpad_notation === "string" ? record.numpad_notation : null;
                    const character = typeof record.character === "string" ? record.character : null;
                    const label = notation ? `${character ? `${character} ` : ""}${notation}` : `Move #${moveId}`;

                    return [moveId, label] as const;
                } catch {
                    return [moveId, `Move #${moveId}`] as const;
                }
            })
        ).then((pairs) => {
            if (canceled) {
                return;
            }

            setMoveLabelById((previous) => {
                const next = {...previous};
                pairs.forEach(([moveId, label]) => {
                    next[moveId] = label;
                });
                return next;
            });
        });

        return () => {
            canceled = true;
        };
    }, [state.grid.bodyCells, moveLabelById]);

    const inspectorData = React.useMemo(() => {
        return buildReferenceInspectorData(
            state,
            state.selection.activeTarget,
            referenceResolution.displayedBodyValues,
            referenceMetadataMap
        );
    }, [state, referenceResolution.displayedBodyValues, referenceMetadataMap]);

    const closeLinkPanel = React.useCallback(() => {
        setLinkTargetKey(null);
        requestAnimationFrame(() => {
            focusContainer();
        });
    }, [focusContainer]);

    const closeDynamicComboPanel = React.useCallback(() => {
        setDynamicComboTargetKey(null);
        requestAnimationFrame(() => {
            focusContainer();
        });
    }, [focusContainer]);

    const openLinkPanelForKey = React.useCallback((key: string) => {
        if (!canEditReferences) {
            return;
        }

        setDynamicComboTargetKey(null);
        setLinkTargetKey(key);
    }, [canEditReferences]);

    const openDynamicComboPanelForKey = React.useCallback((key: string) => {
        if (!canEditDynamicCombos) {
            return;
        }

        setLinkTargetKey(null);
        setDynamicComboTargetKey(key);
    }, [canEditDynamicCombos]);

    const solveCurrentMatrix = React.useCallback(async () => {
        const currentState = stateRef.current;

        const payoffMatrix = currentState.grid.rows.reduce<Record<string, Record<string, number>>>((rowAcc, row) => {
            const rowLabel = row.label.trim() || row.id;
            const rowValues = currentState.grid.columns.reduce<Record<string, number>>((colAcc, column) => {
                const key = `body::${row.id}::${column.id}`;
                const displayed = referenceResolution.displayedBodyValues[key];
                const sourceValue = typeof displayed === "number" ? displayed : currentState.grid.bodyCells[key]?.value;
                colAcc[column.label.trim() || column.id] = typeof sourceValue === "number" && Number.isFinite(sourceValue) ? sourceValue : 0;
                return colAcc;
            }, {});
            rowAcc[rowLabel] = rowValues;
            return rowAcc;
        }, {});

        setIsSolving(true);

        try {
            const result = await solveGame(payoffMatrix);
            const equilibrium = Array.isArray(result?.equilibria) ? result.equilibria[0] : null;
            if (!equilibrium || typeof equilibrium !== "object") {
                dispatch(actions.setGlobalValidation([{code: "unknown", message: "Solver returned no equilibria for this matrix."}]));
                return;
            }

            const nextActions = currentState.grid.rows.flatMap((row) => {
                const rowKey = row.label.trim() || row.id;
                const p1Value = (equilibrium as Record<string, Record<string, unknown>>).P1?.[rowKey];
                const numeric = typeof p1Value === "number" && Number.isFinite(p1Value) ? p1Value : 0;
                return actions.setRowSummaryValue(row.id, numeric);
            });

            const nextColumnActions = currentState.grid.columns.flatMap((column) => {
                const columnKey = column.label.trim() || column.id;
                const p2Value = (equilibrium as Record<string, Record<string, unknown>>).P2?.[columnKey];
                const numeric = typeof p2Value === "number" && Number.isFinite(p2Value) ? p2Value : 0;
                return actions.setColumnSummaryValue(column.id, numeric);
            });

            [...nextActions, ...nextColumnActions].forEach((action) => dispatch(action));
            dispatch(actions.setGlobalValidation([]));
        } catch {
            dispatch(actions.setGlobalValidation([{code: "unknown", message: "Unable to solve game right now. Please retry."}]));
        } finally {
            setIsSolving(false);
        }
    }, [actions, dispatch, referenceResolution.displayedBodyValues, solveGame]);

    const canMutateActiveSelection = React.useMemo(() => {
        const active = state.selection.activeTarget;
        if (!active) {
            return false;
        }

        if (active.zone === "body") {
            return canEditBodyValues;
        }

        if (active.zone === "rowSummary" || active.zone === "columnSummary") {
            return canEditSummaries;
        }

        return false;
    }, [canEditBodyValues, canEditSummaries, state.selection.activeTarget]);

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            style={{width: "100%", maxWidth: "100%", minWidth: 0, overflowX: "hidden", boxSizing: "border-box"}}
            onClick={(event) => {
                if (isAnyModalOpen) {
                    event.stopPropagation();
                    return;
                }

                handleBottomAreaClick(event);
            }}
            onPaste={(event) => {
                if (isAnyModalOpen) {
                    return;
                }

                if (!canEditBodyValues) {
                    event.preventDefault();
                    return;
                }

                if (state.editing.mode === "edit") {
                    return;
                }

                const pastedText = event.clipboardData?.getData("text/plain") ?? "";
                const result = applyMatrixPaste(state, pastedText);

                result.actions.forEach((action) => dispatch(action));

                if (result.handled || result.actions.length > 0) {
                    event.preventDefault();
                }
            }}
            onKeyDown={(event) => {
                if (isAnyModalOpen) {
                    return;
                }

                if (!canMutateActiveSelection && (event.key === "Enter" || event.key === "Backspace" || event.key === "Delete" || (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey))) {
                    event.preventDefault();
                    return;
                }

                const outcome = interpretMatrixKeyDown(state, {
                    key: event.key,
                    ctrlKey: event.ctrlKey,
                    metaKey: event.metaKey,
                    altKey: event.altKey,
                });

                if (outcome.handled) {
                    event.preventDefault();
                    outcome.actions.forEach((action) => dispatch(action));

                    if (state.editing.mode === "edit" && event.key.startsWith("Arrow")) {
                        requestAnimationFrame(() => {
                            focusContainer();
                        });
                    }
                }
            }}
        >
            <MatrixEditorLayout
                title={state.grid.metadata.title}
                onDelete={canEditStructure ? handleDelete : undefined}
                warnings={displayWarnings}
            >
                <div style={{display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap"}}>
                    {canEditReferences ? (
                        <button
                            type="button"
                            disabled={!selectedBodyCell}
                            onClick={() => {
                                if (selectedBodyCell) {
                                    openLinkPanelForKey(selectedBodyCell.key);
                                }
                            }}
                        >
                            {selectedBodyCell?.kind === "reference" ? "Relink Scenario" : "Link Scenario"}
                        </button>
                    ) : null}
                    {canEditDynamicCombos ? (
                        <button
                            type="button"
                            disabled={!selectedBodyCell}
                            onClick={() => {
                                if (selectedBodyCell) {
                                    openDynamicComboPanelForKey(selectedBodyCell.key);
                                }
                            }}
                        >
                            {selectedBodyCell?.kind === "dynamic_combo" ? "Edit Dynamic Combo" : "Set Dynamic Combo"}
                        </button>
                    ) : null}
                    <button type="button" onClick={solveCurrentMatrix} disabled={isSolving}>
                        {isSolving ? "Solving..." : "Solve Game"}
                    </button>
                    <span style={{fontSize: 12, color: "#595959"}}>
                        {state.grid.rows.length}x{state.grid.columns.length}
                    </span>
                    <span style={{fontSize: 12, color: "#8c8c8c"}}>{isEditorEditable ? "Mode: Edit" : "Mode: View"}</span>
                    {selectedReferenceLabel ? <span style={{fontSize: 12, color: "#8c8c8c"}}>Linked: {selectedReferenceLabel}</span> : null}
                </div>
                {inspectorData ? <ReferenceInspector data={inspectorData}/> : null}
                <MatrixGrid
                    state={state}
                    expectedValue={expectedValue}
                    activeTarget={state.selection.activeTarget}
                    activeKey={state.selection.activeTarget?.key ?? null}
                    activeRowId={axisContext.activeRowId}
                    activeColumnId={axisContext.activeColumnId}
                    editingKey={state.editing.mode === "edit" ? state.editing.activeKey : null}
                    draft={state.editing.draft ?? ""}
                    draftHasFormatError={draftHasFormatError}
                    validationByKey={state.validation.byKey}
                    displayedBodyValues={referenceResolution.displayedBodyValues}
                    moveLabelById={moveLabelById}
                    canEditStructure={canEditStructure}
                    canEditAxisLabels={canEditAxisLabels}
                    canEditBodyValues={canEditBodyValues}
                    canEditSummaries={canEditSummaries}
                    onAddRow={() => {
                        if (canEditStructure) {
                            dispatch(actions.addRow());
                        }
                    }}
                    onAddColumn={() => {
                        if (canEditStructure) {
                            dispatch(actions.addColumn());
                        }
                    }}
                    onRemoveRow={(rowId) => {
                        if (canEditStructure) {
                            dispatch(actions.removeRow(rowId));
                        }
                    }}
                    onRemoveColumn={(columnId) => {
                        if (canEditStructure) {
                            dispatch(actions.removeColumn(columnId));
                        }
                    }}
                    onRowLabelChange={(rowId, label) => dispatch(actions.setAxisLabel("rows", rowId, label))}
                    onColumnLabelChange={(columnId, label) => dispatch(actions.setAxisLabel("columns", columnId, label))}
                    onSelectBodyCell={(rowId, columnId) => selectTarget(toSelectionTarget("body", rowId, columnId))}
                    onSelectRowSummary={(rowId) => selectTarget(toSelectionTarget("rowSummary", rowId))}
                    onSelectColumnSummary={(columnId) => selectTarget(toSelectionTarget("columnSummary", columnId))}
                    onSelectExpectedValue={() => selectTarget(toSelectionTarget("expectedValue"))}
                    onOpenReferenceLink={openLinkPanelForKey}
                    onOpenDynamicCombo={openDynamicComboPanelForKey}
                    onStartEdit={(key) => startEditForKey(key)}
                    onStartOverwriteEdit={(key, firstCharacter) => startOverwriteEditForKey(key, firstCharacter)}
                    onDraftChange={(draft) => dispatch(actions.updateDraft(draft))}
                    onCommitEdit={commitEditAndRefocus}
                    onCancelEdit={cancelEditAndRefocus}
                    density="standard"
                />
            </MatrixEditorLayout>

            <ScenarioLinkPanel
                open={linkTargetKey !== null}
                initialScenarioId={
                    linkTargetKey && state.grid.bodyCells[linkTargetKey]?.kind === "reference"
                        ? state.grid.bodyCells[linkTargetKey].reference?.scenarioId
                        : undefined
                }
                onClose={closeLinkPanel}
                onConfirm={(item) => {
                    if (!linkTargetKey) {
                        return;
                    }

                    dispatch(actions.linkReferenceCell(linkTargetKey, item.id, item.label));
                    closeLinkPanel();
                }}
            />

            <DynamicComboPanel
                open={dynamicComboTargetKey !== null}
                initialValue={
                    dynamicComboTargetKey && state.grid.bodyCells[dynamicComboTargetKey]?.kind === "dynamic_combo"
                        ? state.grid.bodyCells[dynamicComboTargetKey].dynamicCombo
                        : null
                }
                moveLabelById={moveLabelById}
                onClose={closeDynamicComboPanel}
                onConfirm={(value, starterLabels) => {
                    if (!dynamicComboTargetKey) {
                        return;
                    }

                    setMoveLabelById((previous) => ({
                        ...previous,
                        ...starterLabels,
                    }));
                    dispatch(actions.setDynamicComboCell(dynamicComboTargetKey, value));
                    closeDynamicComboPanel();
                }}
            />
        </div>
    );
}
