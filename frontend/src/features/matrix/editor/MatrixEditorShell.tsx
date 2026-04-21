import React from "react";

import {MatrixPayload} from "@/src/types/matrixPayload";
import {isTemporarilyValidNumericDraft, selectCellValueByKey, selectGridValues, selectIsCellEditableByKey} from "@/src/features/matrix/model";
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
import {matrixPayloadToEditorState} from "./modules/payloadAdapter";

interface MatrixEditorShellProps {
    matrix: MatrixPayload;
    onMatrixChange: (next: MatrixPayload) => void;
    editable?: boolean;
    onDelete?: () => void;
    onRefreshDynamicCells?: () => Promise<MatrixPayload>;
    onResolveDynamicComboCell?: (dynamicCombo: {
        attackerCharacterId: string;
        starterMoveIds: string[];
        starterContext: {isPunishCounter: boolean; isCounterHit: boolean};
    }) => Promise<number | null>;
}

export function MatrixEditorShell({
    matrix,
    onMatrixChange,
    editable = true,
    onDelete,
    onRefreshDynamicCells,
    onResolveDynamicComboCell,
}: MatrixEditorShellProps) {
    const {solveGame} = useSolverGames();
    const isEditorEditable = editable;
    const [isSolving, setIsSolving] = React.useState(false);
    const [moveLabelById, setMoveLabelById] = React.useState<Record<string, string>>({});
    const {getSpecificMove} = useMoves();
    const getSpecificMoveRef = React.useRef(getSpecificMove);
    const {state, dispatch, actions} = useMatrixEditorController({
        matrix,
        onMatrixChange,
        persistChanges: isEditorEditable,
    });
    const stateRef = React.useRef(state);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [linkTargetKey, setLinkTargetKey] = React.useState<string | null>(null);
    const [dynamicComboTargetKey, setDynamicComboTargetKey] = React.useState<string | null>(null);
    const isAnyModalOpen = linkTargetKey !== null || dynamicComboTargetKey !== null;
    const [selectedLayer, setSelectedLayer] = React.useState(1);
    const [showAllLayers, setShowAllLayers] = React.useState<boolean>(isEditorEditable);

    const canEditStructure = isEditorEditable;
    const canEditAxisLabels = isEditorEditable;
    const canEditBodyValues = isEditorEditable;
    const canEditReferences = isEditorEditable;
    const canEditDynamicCombos = isEditorEditable;
    const canEditSummaries = true;

    const highestLayer = React.useMemo(() => {
        const layers = [
            ...state.grid.rows.map((row) => row.layer),
            ...state.grid.columns.map((column) => column.layer),
        ].filter((value) => Number.isFinite(value));

        if (layers.length === 0) {
            return 1;
        }

        return Math.max(1, ...layers);
    }, [state.grid.columns, state.grid.rows]);

    React.useEffect(() => {
        if (selectedLayer > highestLayer) {
            setSelectedLayer(highestLayer);
        }
    }, [highestLayer, selectedLayer]);

    const effectiveLayerLimit = showAllLayers ? null : selectedLayer;

    React.useEffect(() => {
        stateRef.current = state;
    }, [state]);

    React.useEffect(() => {
        getSpecificMoveRef.current = getSpecificMove;
    }, [getSpecificMove]);

    const extractMoveDamage = React.useCallback((move: unknown): number | null => {
        if (!move || typeof move !== "object") {
            return null;
        }

        const record = move as Record<string, unknown>;
        const summary = record.summary_frame_data;
        if (summary && typeof summary === "object" && !Array.isArray(summary)) {
            const damage = (summary as Record<string, unknown>).damage;
            if (typeof damage === "number" && Number.isFinite(damage)) {
                return damage;
            }
            if (typeof damage === "string") {
                const parsed = Number(damage.trim());
                if (Number.isFinite(parsed)) {
                    return parsed;
                }
            }
        }

        const full = record.full_frame_data;
        if (full && typeof full === "object" && !Array.isArray(full)) {
            const damage = (full as Record<string, unknown>).damage;
            if (typeof damage === "number" && Number.isFinite(damage)) {
                return damage;
            }
            if (typeof damage === "string") {
                const parsed = Number(damage.trim());
                if (Number.isFinite(parsed)) {
                    return parsed;
                }
            }
        }

        return null;
    }, []);

    const resolveDynamicComboFallbackDamage = React.useCallback(async (starterMoveIds: string[]): Promise<number | null> => {
        if (starterMoveIds.length === 0) {
            return null;
        }

        const damages = await Promise.all(
            starterMoveIds.map(async (starterMoveId) => {
                try {
                    const move = await getSpecificMoveRef.current(starterMoveId);
                    return extractMoveDamage(move);
                } catch {
                    return null;
                }
            })
        );

        const numericDamages = damages.filter((damage): damage is number => typeof damage === "number" && Number.isFinite(damage));
        if (numericDamages.length === 0) {
            return null;
        }

        return Math.max(...numericDamages);
    }, [extractMoveDamage]);

    const resolveDynamicCellsForSolve = React.useCallback(async (): Promise<Record<string, number | null>> => {
        if (onRefreshDynamicCells) {
            try {
                const refreshedMatrix = await onRefreshDynamicCells();
                const refreshedState = matrixPayloadToEditorState(refreshedMatrix);
                dispatch(actions.replaceState(refreshedState));

                const overrides: Record<string, number | null> = {};
                Object.values(refreshedState.grid.bodyCells).forEach((cell) => {
                    if (cell.kind === "dynamic_combo") {
                        overrides[cell.key] = cell.value;
                    }
                });

                return overrides;
            } catch {
            }
        }

        const currentState = stateRef.current;
        const dynamicCells = Object.values(currentState.grid.bodyCells).filter(
            (cell) => cell.kind === "dynamic_combo" && Array.isArray(cell.dynamicCombo?.starterMoveIds)
        );

        const updates = await Promise.all(
            dynamicCells.map(async (cell) => {
                let value: number | null = null;

                if (cell.dynamicCombo && onResolveDynamicComboCell) {
                    try {
                        value = await onResolveDynamicComboCell(cell.dynamicCombo);
                    } catch {
                        value = null;
                    }
                }

                if (value === null) {
                    value = await resolveDynamicComboFallbackDamage(cell.dynamicCombo?.starterMoveIds ?? []);
                }

                return {key: cell.key, value};
            })
        );

        const overrides: Record<string, number | null> = {};
        updates.forEach((update) => {
            overrides[update.key] = update.value;
            dispatch(actions.setDynamicComboResolvedValue(update.key, update.value));
        });

        return overrides;
    }, [actions, dispatch, onRefreshDynamicCells, onResolveDynamicComboCell, resolveDynamicComboFallbackDamage]);

    const expectedValue = React.useMemo(() => {
        const values = selectGridValues(state);
        const rowWeights = state.grid.rows.map((row) => state.grid.rowSummaryCells[`row-summary::${row.id}`]?.value ?? null);
        const columnWeights = state.grid.columns.map(
            (column) => state.grid.columnSummaryCells[`column-summary::${column.id}`]?.value ?? null
        );
        return computeExpectedValue(values, rowWeights, columnWeights);
    }, [state]);

    const visibleState = React.useMemo(() => {
        if (effectiveLayerLimit === null) {
            return state;
        }

        const visibleRows = state.grid.rows.filter((row) => row.layer <= effectiveLayerLimit);
        const visibleColumns = state.grid.columns.filter((column) => column.layer <= effectiveLayerLimit);
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
    }, [effectiveLayerLimit, state]);

    const displayedExpectedValue = React.useMemo(() => {
        const values = selectGridValues(visibleState);
        const rowWeights = visibleState.grid.rows.map((row) => visibleState.grid.rowSummaryCells[`row-summary::${row.id}`]?.value ?? null);
        const columnWeights = visibleState.grid.columns.map(
            (column) => visibleState.grid.columnSummaryCells[`column-summary::${column.id}`]?.value ?? null
        );

        return computeExpectedValue(values, rowWeights, columnWeights);
    }, [visibleState]);

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
        setIsSolving(true);

        try {
            const dynamicOverrides = await resolveDynamicCellsForSolve();
            const currentState = stateRef.current;
            const solveRows = effectiveLayerLimit === null
                ? currentState.grid.rows
                : currentState.grid.rows.filter((row) => row.layer <= effectiveLayerLimit);
            const solveColumns = effectiveLayerLimit === null
                ? currentState.grid.columns
                : currentState.grid.columns.filter((column) => column.layer <= effectiveLayerLimit);

            const payoffMatrix = solveRows.reduce<Record<string, Record<string, number>>>((rowAcc, row) => {
                const rowLabel = row.label.trim() || row.id;
                const rowValues = solveColumns.reduce<Record<string, number>>((colAcc, column) => {
                    const key = `body::${row.id}::${column.id}`;
                    const displayed = referenceResolution.displayedBodyValues[key];
                    const overriddenDynamicValue = dynamicOverrides[key];
                    const sourceValue =
                        currentState.grid.bodyCells[key]?.kind === "dynamic_combo"
                            ? overriddenDynamicValue
                            : typeof displayed === "number"
                                ? displayed
                                : currentState.grid.bodyCells[key]?.value;
                    colAcc[column.label.trim() || column.id] = typeof sourceValue === "number" && Number.isFinite(sourceValue) ? sourceValue : 0;
                    return colAcc;
                }, {});
                rowAcc[rowLabel] = rowValues;
                return rowAcc;
            }, {});

            const result = await solveGame(payoffMatrix);
            const equilibrium = Array.isArray(result?.equilibria) ? result.equilibria[0] : null;
            if (!equilibrium || typeof equilibrium !== "object") {
                dispatch(actions.setGlobalValidation([{code: "unknown", message: "Solver returned no equilibria for this matrix."}]));
                return;
            }

            const nextActions = solveRows.flatMap((row) => {
                const rowKey = row.label.trim() || row.id;
                const p1Value = (equilibrium as Record<string, Record<string, unknown>>).P1?.[rowKey];
                const numeric = typeof p1Value === "number" && Number.isFinite(p1Value) ? p1Value : 0;
                return actions.setRowSummaryValue(row.id, numeric);
            });

            const nextColumnActions = solveColumns.flatMap((column) => {
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
    }, [actions, dispatch, effectiveLayerLimit, referenceResolution.displayedBodyValues, resolveDynamicCellsForSolve, solveGame]);

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
                }
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
                onDelete={canEditStructure ? onDelete : undefined}
                warnings={displayWarnings}
            >
                <div style={{display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap"}}>
                    <label style={{display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12}}>
                        View
                        <select
                            value={showAllLayers ? "all" : "layer"}
                            onChange={(event) => setShowAllLayers(event.target.value === "all")}
                            style={{height: 28}}
                        >
                            <option value="layer">Up To Layer</option>
                            <option value="all">All Layers</option>
                        </select>
                    </label>
                    {!showAllLayers ? (
                        <label style={{display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12}}>
                            Layer
                            <input
                                type="number"
                                min={1}
                                step={1}
                                value={selectedLayer}
                                onChange={(event) => {
                                    const next = Number(event.target.value);
                                    setSelectedLayer(Number.isFinite(next) ? Math.max(1, Math.trunc(next)) : 1);
                                }}
                                style={{width: 72, height: 28}}
                            />
                        </label>
                    ) : null}
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
                        {visibleState.grid.rows.length}x{visibleState.grid.columns.length}
                    </span>
                    <span style={{fontSize: 12, color: "#8c8c8c"}}>{isEditorEditable ? "Mode: Edit" : "Mode: View"}</span>
                    {selectedReferenceLabel ? <span style={{fontSize: 12, color: "#8c8c8c"}}>Linked: {selectedReferenceLabel}</span> : null}
                </div>
                {inspectorData ? <ReferenceInspector data={inspectorData}/> : null}
                <MatrixGrid
                    state={visibleState}
                    expectedValue={displayedExpectedValue}
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
                    onRowLayerChange={(rowId, layer) => dispatch(actions.setAxisLayer("rows", rowId, layer))}
                    onColumnLayerChange={(columnId, layer) => dispatch(actions.setAxisLayer("columns", columnId, layer))}
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

                    (async () => {
                        setMoveLabelById((previous) => ({
                            ...previous,
                            ...starterLabels,
                        }));

                        dispatch(actions.setDynamicComboCell(dynamicComboTargetKey, value));

                        let resolvedValue: number | null = null;
                        if (onResolveDynamicComboCell) {
                            try {
                                resolvedValue = await onResolveDynamicComboCell(value);
                            } catch {
                                resolvedValue = null;
                            }
                        }

                        if (resolvedValue === null) {
                            resolvedValue = await resolveDynamicComboFallbackDamage(value.starterMoveIds);
                        }

                        dispatch(actions.setDynamicComboResolvedValue(dynamicComboTargetKey, resolvedValue));

                        closeDynamicComboPanel();
                    })();
                }}
            />
        </div>
    );
}
