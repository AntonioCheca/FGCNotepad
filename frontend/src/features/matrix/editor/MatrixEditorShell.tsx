import React from "react";

import {MatrixPayload} from "@/src/types/matrixPayload";
import {isTemporarilyValidNumericDraft, selectCellValueByKey, selectGridValues} from "@/src/features/matrix/model";
import {useScenarioTableEditor} from "@/hooks/useScenarioTableEditor";
import {computeExpectedValue} from "./services/matrixComputationService";
import {useMatrixEditorController} from "./state/useMatrixEditorController";
import {MatrixEditorLayout} from "./rendering/MatrixEditorLayout";
import {MatrixGrid} from "./rendering/MatrixGrid";
import {ScenarioLinkPanel} from "./rendering/ScenarioLinkPanel";
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
    const {handleDelete, handleBottomAreaClick, handleMatrixChange} = useScenarioTableEditor(nodeKey);
    const {state, dispatch, actions} = useMatrixEditorController({matrix, onMatrixChange: handleMatrixChange});
    const stateRef = React.useRef(state);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [linkTargetKey, setLinkTargetKey] = React.useState<string | null>(null);

    React.useEffect(() => {
        stateRef.current = state;
    }, [state]);

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
        const currentValue = selectCellValueByKey(stateRef.current, key);
        const draft = currentValue === null ? "" : String(currentValue);
        dispatch(actions.startEditing(key, draft));
    }, [actions, dispatch]);

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

    const openLinkPanelForKey = React.useCallback((key: string) => {
        setLinkTargetKey(key);
    }, []);

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            onClick={handleBottomAreaClick}
            onPaste={(event) => {
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
                const outcome = interpretMatrixKeyDown(state, {
                    key: event.key,
                    ctrlKey: event.ctrlKey,
                    metaKey: event.metaKey,
                    altKey: event.altKey,
                });

                if (outcome.handled) {
                    event.preventDefault();
                    outcome.actions.forEach((action) => dispatch(action));
                }
            }}
        >
            <MatrixEditorLayout
                title={state.grid.metadata.title}
                onDelete={handleDelete}
                warnings={displayWarnings}
            >
                <div style={{display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap"}}>
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
                    <button
                        type="button"
                        onClick={() =>
                            dispatch(
                                actions.patchViewport({
                                    density: state.viewport.density === "standard" ? "compact" : "standard",
                                })
                            )
                        }
                    >
                        Density: {state.viewport.density === "compact" ? "Dense" : "Standard"}
                    </button>
                    <span style={{fontSize: 12, color: "#595959"}}>
                        {state.grid.rows.length}x{state.grid.columns.length}
                    </span>
                    {selectedReferenceLabel ? <span style={{fontSize: 12, color: "#8c8c8c"}}>Linked: {selectedReferenceLabel}</span> : null}
                </div>
                {inspectorData ? <ReferenceInspector data={inspectorData}/> : null}
                <MatrixGrid
                    state={state}
                    expectedValue={expectedValue}
                    activeKey={state.selection.activeTarget?.key ?? null}
                    activeRowId={axisContext.activeRowId}
                    activeColumnId={axisContext.activeColumnId}
                    editingKey={state.editing.mode === "edit" ? state.editing.activeKey : null}
                    draft={state.editing.draft ?? ""}
                    draftHasFormatError={draftHasFormatError}
                    validationByKey={state.validation.byKey}
                    displayedBodyValues={referenceResolution.displayedBodyValues}
                    onAddRow={() => dispatch(actions.addRow())}
                    onAddColumn={() => dispatch(actions.addColumn())}
                    onRowLabelChange={(rowId, label) => dispatch(actions.setAxisLabel("rows", rowId, label))}
                    onColumnLabelChange={(columnId, label) => dispatch(actions.setAxisLabel("columns", columnId, label))}
                    onSelectBodyCell={(rowId, columnId) => selectTarget(toSelectionTarget("body", rowId, columnId))}
                    onSelectRowSummary={(rowId) => selectTarget(toSelectionTarget("rowSummary", rowId))}
                    onSelectColumnSummary={(columnId) => selectTarget(toSelectionTarget("columnSummary", columnId))}
                    onSelectExpectedValue={() => selectTarget(toSelectionTarget("expectedValue"))}
                    onOpenReferenceLink={openLinkPanelForKey}
                    onStartEdit={(key) => startEditForKey(key)}
                    onDraftChange={(draft) => dispatch(actions.updateDraft(draft))}
                    onCommitEdit={commitEditAndRefocus}
                    onCancelEdit={cancelEditAndRefocus}
                    density={state.viewport.density}
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
        </div>
    );
}
