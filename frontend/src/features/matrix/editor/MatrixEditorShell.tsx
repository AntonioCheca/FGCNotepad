import React from "react";

import {MatrixPayload} from "@/src/types/matrixPayload";
import {createBodyCellKey, isTemporarilyValidNumericDraft, MatrixEditorState, MatrixLinkedCellResolution, selectCellValueByKey, selectGridValues, selectIsCellEditableByKey} from "@/src/features/matrix/model";
import useSolverGames from "@/hooks/useSolverGame";
import useMoves from "@/hooks/useMoves";
import {computeExpectedValue} from "./services/matrixComputationService";
import {useMatrixEditorController} from "./state/useMatrixEditorController";
import {MatrixEditorLayout} from "./rendering/MatrixEditorLayout";
import {MatrixGrid} from "./rendering/MatrixGrid";
import {MatrixEditorToolbar} from "./rendering/MatrixEditorToolbar";
import {MatrixInsightsDashboard} from "./rendering/MatrixInsightsDashboard";
import {ScenarioLinkPanel} from "./rendering/ScenarioLinkPanel";
import {DynamicComboPanel} from "./rendering/DynamicComboPanel";
import {ReferenceInspector} from "./rendering/ReferenceInspector";
import {interpretMatrixKeyDown, toSelectionTarget} from "./services/matrixKeyboardEngine";
import {applyMatrixPaste} from "./services/matrixPasteEngine";
import {deriveActiveAxisContext} from "./services/matrixContextVisibility";
import {createMapReferenceResolver, resolveReferenceDisplayValues} from "./services/referenceResolutionService";
import {buildReferenceInspectorData} from "./services/referenceInspector";
import {useMatrixLayerVisibility} from "./hooks/useMatrixLayerVisibility";
import {useMoveLabels} from "./hooks/useMoveLabels";
import {useDynamicComboResolver} from "./hooks/useDynamicComboResolver";
import {useSolveMatrix} from "./hooks/useSolveMatrix";
import {useMatrixEditorPanels} from "./hooks/useMatrixEditorPanels";
import {buildMatrixResourceGating, MatrixResourceContext} from "./services/matrixResourceGating";
import {resolveEditorLinkedReferences} from "./services/linkedReferenceResolutionService";
import {buildMatrixInsights} from "./services/matrixInsightService";

interface MatrixEditorShellProps {
    matrix: MatrixPayload;
    attackerCharacterName?: string | null;
    defenderCharacterName?: string | null;
    onMatrixChange: (next: MatrixPayload) => void;
    editable?: boolean;
    allowRowStructureEdit?: boolean;
    allowColumnStructureEdit?: boolean;
    allowRowAxisLabelEdit?: boolean;
    allowColumnAxisLabelEdit?: boolean;
    allowRowLayerEdit?: boolean;
    allowColumnLayerEdit?: boolean;
    columnVisibilityByLabel?: Record<string, boolean> | null;
    onDelete?: () => void;
    onRefreshDynamicCells?: () => Promise<MatrixPayload>;
    onResolveDynamicComboCell?: (dynamicCombo: {
        attackerCharacterId: string;
        isComboInitiatorAttacker?: boolean;
        starterMoveIds: string[];
        starterContext: {isPunishCounter: boolean; isCounterHit: boolean};
    }) => Promise<number | null>;
    layerSolveSnapshots?: Record<number, {rowAxis: Array<number | null>; columnAxis: Array<number | null>; expectedValue: number | null}>;
    onLayerViewChange?: (layerLimit: number | null) => void;
    displayFrequenciesAsPercent?: boolean;
    resourceContext?: MatrixResourceContext | null;
    currentScenarioId?: string | null;
    linkedCellResolutions?: Record<string, MatrixLinkedCellResolution>;
}

function computeDisplayedExpectedValue(targetState: MatrixEditorState, displayedBodyValues: Record<string, number | null>): number | null {
    let value = 0;
    let hasUsableTerm = false;

    targetState.grid.rows.forEach((row) => {
        const rowWeight = targetState.grid.rowSummaryCells[`row-summary::${row.id}`]?.value;
        targetState.grid.columns.forEach((column) => {
            const columnWeight = targetState.grid.columnSummaryCells[`column-summary::${column.id}`]?.value;
            const key = createBodyCellKey(row.id, column.id);
            const cellValue = displayedBodyValues[key] ?? targetState.grid.bodyCells[key]?.value ?? null;
            if (cellValue === null || rowWeight === null || columnWeight === null) {
                return;
            }

            value += cellValue * rowWeight * columnWeight;
            hasUsableTerm = true;
        });
    });

    return hasUsableTerm ? Number(value.toFixed(4)) : null;
}

export function MatrixEditorShell({
    matrix,
    attackerCharacterName,
    defenderCharacterName,
    onMatrixChange,
    editable = true,
    allowRowStructureEdit,
    allowColumnStructureEdit,
    allowRowAxisLabelEdit,
    allowColumnAxisLabelEdit,
    allowRowLayerEdit,
    allowColumnLayerEdit,
    columnVisibilityByLabel,
    onDelete,
    onRefreshDynamicCells,
    onResolveDynamicComboCell,
    layerSolveSnapshots,
    onLayerViewChange,
    displayFrequenciesAsPercent = false,
    resourceContext = null,
    currentScenarioId = null,
    linkedCellResolutions = {},
}: MatrixEditorShellProps) {
    const {solveGame} = useSolverGames();
    const isEditorEditable = editable;
    const {getSpecificMove} = useMoves();
    const {state, dispatch, actions} = useMatrixEditorController({
        matrix,
        onMatrixChange,
        persistChanges: isEditorEditable,
    });
    const stateRef = React.useRef(state);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const canEditRowStructure = isEditorEditable && (allowRowStructureEdit ?? true);
    const canEditColumnStructure = isEditorEditable && (allowColumnStructureEdit ?? true);
    const canEditRowAxisLabels = isEditorEditable && (allowRowAxisLabelEdit ?? true);
    const canEditColumnAxisLabels = isEditorEditable && (allowColumnAxisLabelEdit ?? true);
    const canEditRowLayers = isEditorEditable && (allowRowLayerEdit ?? true);
    const canEditColumnLayers = isEditorEditable && (allowColumnLayerEdit ?? true);
    const [showLayerControls, setShowLayerControls] = React.useState(false);
    const [editorLinkedCellResolutions, setEditorLinkedCellResolutions] = React.useState<Record<string, MatrixLinkedCellResolution>>({});
    const canEditBodyValues = isEditorEditable;
    const canEditReferences = isEditorEditable;
    const canEditDynamicCombos = isEditorEditable;
    const canEditSummaries = true;

    React.useEffect(() => {
        stateRef.current = state;
    }, [state]);

    const {
        selectedLayer,
        setSelectedLayer,
        showAllLayers,
        setShowAllLayers,
        effectiveLayerLimit,
        visibleState,
    } = useMatrixLayerVisibility({
        state,
        editable: isEditorEditable,
    });

    const {moveLabelById, mergeMoveLabels} = useMoveLabels({
        bodyCells: state.grid.bodyCells,
        getSpecificMove,
    });

    const {resolveDynamicComboValue, resolveDynamicCellsForSolve} = useDynamicComboResolver({
        stateRef,
        dispatch,
        actions,
        getSpecificMove,
        onRefreshDynamicCells,
        onResolveDynamicComboCell,
    });

    const expectedValue = React.useMemo(() => {
        const values = selectGridValues(state);
        const rowWeights = state.grid.rows.map((row) => state.grid.rowSummaryCells[`row-summary::${row.id}`]?.value ?? null);
        const columnWeights = state.grid.columns.map(
            (column) => state.grid.columnSummaryCells[`column-summary::${column.id}`]?.value ?? null
        );
        return computeExpectedValue(values, rowWeights, columnWeights);
    }, [state]);

    const columnVisibilitySet = React.useMemo(() => {
        if (!columnVisibilityByLabel) {
            return null;
        }

        const visible = new Set<string>();
        state.grid.columns.forEach((column) => {
            if (columnVisibilityByLabel[column.label] !== false) {
                visible.add(column.id);
            }
        });

        return visible;
    }, [columnVisibilityByLabel, state.grid.columns]);

    const filteredVisibleState = React.useMemo(() => {
        if (!columnVisibilitySet) {
            return visibleState;
        }

        const filteredColumns = visibleState.grid.columns.filter((column) => columnVisibilitySet.has(column.id));
        const filteredColumnIds = new Set(filteredColumns.map((column) => column.id));
        const bodyCells = Object.fromEntries(
            Object.entries(visibleState.grid.bodyCells).filter(([, cell]) => filteredColumnIds.has(cell.columnId))
        );
        const columnSummaryCells = Object.fromEntries(
            Object.entries(visibleState.grid.columnSummaryCells).filter(([, summary]) => {
                const columnId = summary.key.replace("column-summary::", "");
                return filteredColumnIds.has(columnId);
            })
        );

        return {
            ...visibleState,
            grid: {
                ...visibleState.grid,
                columns: filteredColumns,
                bodyCells,
                columnSummaryCells,
            },
        };
    }, [columnVisibilitySet, visibleState]);

    const resourceGating = React.useMemo(() => buildMatrixResourceGating(state, resourceContext), [resourceContext, state]);

    const hasResourceRequirements = React.useMemo(() => {
        return state.grid.rows.some((row) => row.requirements.length > 0) || state.grid.columns.some((column) => column.requirements.length > 0);
    }, [state.grid.columns, state.grid.rows]);

    const forceSolveColumnIds = React.useMemo(() => {
        if (!columnVisibilitySet) {
            return null;
        }

        return Array.from(columnVisibilitySet);
    }, [columnVisibilitySet]);

    const summaryValueFormatter = React.useMemo(() => {
        if (!displayFrequenciesAsPercent) {
            return undefined;
        }

        return (value: number | null): string => {
            if (value === null) {
                return "";
            }
            return `${(value * 100).toFixed(2)}%`;
        };
    }, [displayFrequenciesAsPercent]);

    React.useEffect(() => {
        if (onLayerViewChange) {
            onLayerViewChange(effectiveLayerLimit);
        }
    }, [effectiveLayerLimit, onLayerViewChange]);

    React.useEffect(() => {
        if (isEditorEditable || showAllLayers || effectiveLayerLimit === null || !layerSolveSnapshots || (resourceContext && hasResourceRequirements)) {
            return;
        }

        const snapshot = layerSolveSnapshots[effectiveLayerLimit];
        if (!snapshot) {
            return;
        }

        state.grid.rows.forEach((row, index) => {
            const value = snapshot.rowAxis[index];
            if (typeof value === "number" && Number.isFinite(value)) {
                const current = state.grid.rowSummaryCells[`row-summary::${row.id}`]?.value;
                if (current !== value) {
                    dispatch(actions.setRowSummaryValue(row.id, value));
                }
            }
        });

        state.grid.columns.forEach((column, index) => {
            const value = snapshot.columnAxis[index];
            if (typeof value === "number" && Number.isFinite(value)) {
                const current = state.grid.columnSummaryCells[`column-summary::${column.id}`]?.value;
                if (current !== value) {
                    dispatch(actions.setColumnSummaryValue(column.id, value));
                }
            }
        });

        if (typeof snapshot.expectedValue === "number" && Number.isFinite(snapshot.expectedValue) && state.grid.expectedValueCell.value !== snapshot.expectedValue) {
            dispatch(actions.setExpectedValue(snapshot.expectedValue));
        }
    }, [
        actions,
        dispatch,
        effectiveLayerLimit,
        isEditorEditable,
        layerSolveSnapshots,
        hasResourceRequirements,
        resourceContext,
        showAllLayers,
        state.grid.columns,
        state.grid.columnSummaryCells,
        state.grid.expectedValueCell.value,
        state.grid.rowSummaryCells,
        state.grid.rows,
    ]);

    React.useEffect(() => {
        if (state.grid.expectedValueCell.value !== expectedValue) {
            dispatch(actions.setExpectedValue(expectedValue));
        }
    }, [dispatch, expectedValue, actions, state.grid.expectedValueCell.value]);

    const focusContainer = React.useCallback(() => {
        containerRef.current?.focus();
    }, []);

    const {
        linkTargetKey,
        dynamicComboTargetKey,
        isAnyModalOpen,
        closeLinkPanel,
        closeDynamicComboPanel,
        dismissPanels,
        openLinkPanelForKey,
        openDynamicComboPanelForKey,
    } = useMatrixEditorPanels({
        canEditReferences,
        canEditDynamicCombos,
        focusContainer,
    });

    React.useEffect(() => {
        const active = state.selection.activeTarget;
        const activeBodyKey = active?.zone === "body" ? active.key : null;

        if (linkTargetKey && activeBodyKey !== linkTargetKey) {
            dismissPanels();
            return;
        }

        if (dynamicComboTargetKey && activeBodyKey !== dynamicComboTargetKey) {
            dismissPanels();
        }
    }, [state.selection.activeTarget, linkTargetKey, dynamicComboTargetKey, dismissPanels]);

    const selectTarget = React.useCallback((target: ReturnType<typeof toSelectionTarget>, shouldFocus = true) => {
        dispatch(actions.setActiveSelection(target));
        if (shouldFocus) {
            focusContainer();
        }
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

    const effectiveLinkedCellResolutions = React.useMemo(() => ({
        ...linkedCellResolutions,
        ...editorLinkedCellResolutions,
    }), [editorLinkedCellResolutions, linkedCellResolutions]);

    const referenceResolution = React.useMemo(() => {
        const resolver = createMapReferenceResolver(referenceSourceMap);
        const cellValueByKey = Object.entries(effectiveLinkedCellResolutions).reduce<Record<string, number>>((acc, [key, resolution]) => {
            acc[key] = resolution.finalValue;
            return acc;
        }, {});

        return resolveReferenceDisplayValues(state, resolver, {
            cellValueByKey,
            resolverExpected: Object.keys(referenceSourceMap).length > 0 || Object.keys(cellValueByKey).length > 0,
        });
    }, [state, referenceSourceMap, effectiveLinkedCellResolutions]);

    const referenceDisplayLabels = React.useMemo(() => {
        return Object.entries(effectiveLinkedCellResolutions).reduce<Record<string, string>>((acc, [key, resolution]) => {
            acc[key] = resolution.displayFormula;
            return acc;
        }, {});
    }, [effectiveLinkedCellResolutions]);

    const displayedExpectedValue = React.useMemo(
        () => computeDisplayedExpectedValue(filteredVisibleState, referenceResolution.displayedBodyValues),
        [filteredVisibleState, referenceResolution.displayedBodyValues]
    );

    const matrixInsights = React.useMemo(
        () => buildMatrixInsights(filteredVisibleState, referenceResolution.displayedBodyValues, displayedExpectedValue),
        [displayedExpectedValue, filteredVisibleState, referenceResolution.displayedBodyValues]
    );

    const resolveLinkedCellsForSolve = React.useCallback(() => resolveEditorLinkedReferences({
        state: stateRef.current,
        currentScenarioId,
        baseDisplayedBodyValues: referenceResolution.displayedBodyValues,
        existingResolutions: effectiveLinkedCellResolutions,
        solveGame,
    }), [currentScenarioId, effectiveLinkedCellResolutions, referenceResolution.displayedBodyValues, solveGame]);

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

    const inspectorData = React.useMemo(() => {
        return buildReferenceInspectorData(
            state,
            state.selection.activeTarget,
            referenceResolution.displayedBodyValues,
            referenceMetadataMap
        );
    }, [state, referenceResolution.displayedBodyValues, referenceMetadataMap]);


    const {isSolving, solveCurrentMatrix} = useSolveMatrix({
        stateRef,
        dispatch,
        actions,
        effectiveLayerLimit,
        displayedBodyValues: referenceResolution.displayedBodyValues,
        solveGame,
        resolveDynamicCellsForSolve,
        resolveLinkedCellsForSolve,
        onLinkedCellsResolved: setEditorLinkedCellResolutions,
        forceSolveColumnIds,
        unavailableRowIds: resourceGating.unavailableRowIds,
        unavailableColumnIds: resourceGating.unavailableColumnIds,
    });

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

    const inlinePanelMode = React.useMemo<"link" | "dynamic" | null>(() => {
        if (linkTargetKey) {
            return "link";
        }

        if (dynamicComboTargetKey) {
            return "dynamic";
        }

        return null;
    }, [linkTargetKey, dynamicComboTargetKey]);

    const shouldBypassMatrixKeyHandling = React.useCallback((eventTarget: EventTarget | null) => {
        if (!(eventTarget instanceof HTMLElement)) {
            return false;
        }

        if (eventTarget.isContentEditable) {
            return true;
        }

        const tagName = eventTarget.tagName;
        return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
    }, []);

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            style={{width: "100%", maxWidth: "100%", minWidth: 0, overflowX: "hidden", boxSizing: "border-box"}}
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
                if (shouldBypassMatrixKeyHandling(event.target)) {
                    return;
                }

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
                onDelete={canEditRowStructure || canEditColumnStructure ? onDelete : undefined}
                warnings={displayWarnings}
            >
                <MatrixEditorToolbar
                    showAllLayers={showAllLayers}
                    selectedLayer={selectedLayer}
                    onShowAllLayersChange={setShowAllLayers}
                    onSelectedLayerChange={setSelectedLayer}
                    canEditReferences={canEditReferences}
                    canEditDynamicCombos={canEditDynamicCombos}
                    selectedBodyCell={selectedBodyCell}
                    onOpenReferenceLink={openLinkPanelForKey}
                    onOpenDynamicCombo={openDynamicComboPanelForKey}
                    onSolve={solveCurrentMatrix}
                    isSolving={isSolving}
                    rowCount={filteredVisibleState.grid.rows.length}
                    columnCount={filteredVisibleState.grid.columns.length}
                    editable={isEditorEditable}
                    selectedReferenceLabel={selectedReferenceLabel}
                    showLayerControls={showLayerControls}
                    onShowLayerControlsChange={setShowLayerControls}
                />
                {inspectorData ? <ReferenceInspector data={inspectorData}/> : null}
                <MatrixInsightsDashboard insights={matrixInsights} />

                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 10,
                        alignItems: "flex-start",
                        width: "100%",
                        minWidth: 0,
                    }}
                >
                    <div style={{flex: "1 1 560px", minWidth: 0, width: "100%"}}>
                        <MatrixGrid
                        state={filteredVisibleState}
                        attackerCharacterName={attackerCharacterName}
                        defenderCharacterName={defenderCharacterName}
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
                        displayLabelsByKey={referenceDisplayLabels}
                        moveLabelById={moveLabelById}
                        unavailableRowIds={resourceGating.unavailableRowIds}
                        unavailableColumnIds={resourceGating.unavailableColumnIds}
                        unavailableReasonByRowId={resourceGating.reasonByRowId}
                        unavailableReasonByColumnId={resourceGating.reasonByColumnId}
                        canEditRowStructure={canEditRowStructure}
                        canEditColumnStructure={canEditColumnStructure}
                        canEditRowAxisLabels={canEditRowAxisLabels}
                        canEditColumnAxisLabels={canEditColumnAxisLabels}
                        canEditRowLayers={canEditRowLayers}
                        canEditColumnLayers={canEditColumnLayers}
                        canEditBodyValues={canEditBodyValues}
                        canEditSummaries={canEditSummaries}
                        onAddRow={() => {
                            if (canEditRowStructure) {
                                dispatch(actions.addRow());
                            }
                        }}
                        onAddColumn={() => {
                            if (canEditColumnStructure) {
                                dispatch(actions.addColumn());
                            }
                        }}
                        onRemoveRow={(rowId) => {
                            if (canEditRowStructure) {
                                dispatch(actions.removeRow(rowId));
                            }
                        }}
                        onRemoveColumn={(columnId) => {
                            if (canEditColumnStructure) {
                                dispatch(actions.removeColumn(columnId));
                            }
                        }}
                        onRowLabelChange={(rowId, label) => dispatch(actions.setAxisLabel("rows", rowId, label))}
                        onColumnLabelChange={(columnId, label) => dispatch(actions.setAxisLabel("columns", columnId, label))}
                        onRowLayerChange={(rowId, layer) => dispatch(actions.setAxisLayer("rows", rowId, layer))}
                        onColumnLayerChange={(columnId, layer) => dispatch(actions.setAxisLayer("columns", columnId, layer))}
                        onAddRowRequirement={(rowId, requirement) => dispatch(actions.addAxisRequirement("rows", rowId, requirement))}
                        onUpdateRowRequirement={(rowId, index, requirement) => dispatch(actions.updateAxisRequirement("rows", rowId, index, requirement))}
                        onRemoveRowRequirement={(rowId, index) => dispatch(actions.removeAxisRequirement("rows", rowId, index))}
                        onAddColumnRequirement={(columnId, requirement) => dispatch(actions.addAxisRequirement("columns", columnId, requirement))}
                        onUpdateColumnRequirement={(columnId, index, requirement) => dispatch(actions.updateAxisRequirement("columns", columnId, index, requirement))}
                        onRemoveColumnRequirement={(columnId, index) => dispatch(actions.removeAxisRequirement("columns", columnId, index))}
                        onSelectBodyCell={(rowId, columnId) => selectTarget(toSelectionTarget("body", rowId, columnId))}
                        onSelectRowHeader={(rowId) => selectTarget(toSelectionTarget("rowSummary", rowId), false)}
                        onSelectColumnHeader={(columnId) => selectTarget(toSelectionTarget("columnSummary", columnId), false)}
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
                        showLayerControls={showLayerControls}
                        summaryValueFormatter={summaryValueFormatter}
                        heatmapToneByCellKey={matrixInsights.heatmapToneByCellKey}
                    />
                    </div>

                    {inlinePanelMode ? (
                        <div
                            style={{
                                flex: "0 1 340px",
                                width: "100%",
                                maxWidth: 360,
                                minWidth: 0,
                                border: "1px solid #d9e2ec",
                                borderRadius: 10,
                                background: "linear-gradient(180deg, #f8fbff 0%, #f1f6fc 100%)",
                                padding: 10,
                                maxHeight: "62vh",
                                overflowY: "auto",
                                overflowX: "hidden",
                                boxSizing: "border-box",
                            }}
                        >
                            {inlinePanelMode === "link" ? (
                                <ScenarioLinkPanel
                                    open={linkTargetKey !== null}
                                    presentation="inline"
                                    initialScenarioId={
                                        linkTargetKey && state.grid.bodyCells[linkTargetKey]?.kind === "reference"
                                            ? state.grid.bodyCells[linkTargetKey].reference?.scenarioId
                                            : undefined
                                    }
                                    initialScenarioLabel={
                                        linkTargetKey && state.grid.bodyCells[linkTargetKey]?.kind === "reference"
                                            ? state.grid.bodyCells[linkTargetKey].reference?.scenarioLabel
                                            : undefined
                                    }
                                    initialPreValue={
                                        linkTargetKey && state.grid.bodyCells[linkTargetKey]?.kind === "reference"
                                            ? state.grid.bodyCells[linkTargetKey].reference?.preValue
                                            : {kind: "none"}
                                    }
                                    moveLabelById={moveLabelById}
                                    onClose={closeLinkPanel}
                                    onConfirm={(item, preValue, starterLabels) => {
                                        if (!linkTargetKey) {
                                            return;
                                        }

                                        mergeMoveLabels(starterLabels);
                                        dispatch(actions.linkReferenceCell(linkTargetKey, item.id, item.label));
                                        dispatch(actions.setReferencePreValue(linkTargetKey, preValue));
                                        closeLinkPanel();
                                    }}
                                    onRemove={() => {
                                        if (!linkTargetKey) {
                                            return;
                                        }

                                        dispatch(actions.unlinkReferenceCell(linkTargetKey));
                                        closeLinkPanel();
                                    }}
                                />
                            ) : null}

                            {inlinePanelMode === "dynamic" ? (
                                <DynamicComboPanel
                                    open={dynamicComboTargetKey !== null}
                                    presentation="inline"
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

                                        const targetKey = dynamicComboTargetKey;

                                        void (async () => {
                                            mergeMoveLabels(starterLabels);
                                            dispatch(actions.setDynamicComboCell(targetKey, value));

                                            const resolvedValue = await resolveDynamicComboValue(value);
                                            dispatch(actions.setDynamicComboResolvedValue(targetKey, resolvedValue));
                                            closeDynamicComboPanel();
                                        })();
                                    }}
                                />
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </MatrixEditorLayout>
        </div>
    );
}
