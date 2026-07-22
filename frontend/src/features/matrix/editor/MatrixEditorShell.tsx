import React from "react";

import {MatrixPayload} from "@/src/types/matrixPayload";
import {MatrixLinkedCellResolution} from "@/src/features/matrix/model";
import useSolverGames from "@/hooks/useSolverGame";
import useMoves from "@/hooks/useMoves";
import {useMatrixEditorController} from "./state/useMatrixEditorController";
import {useMoveLabels} from "./hooks/useMoveLabels";
import {useDynamicComboResolver} from "./hooks/useDynamicComboResolver";
import {useSolveMatrix} from "./hooks/useSolveMatrix";
import {useMatrixEditorPanels} from "./hooks/useMatrixEditorPanels";
import {useMatrixEditorPermissions} from "./hooks/useMatrixEditorPermissions";
import {useMatrixEditorViewModel} from "./hooks/useMatrixEditorViewModel";
import {useMatrixReferenceViewModel} from "./hooks/useMatrixReferenceViewModel";
import {useMatrixEditorInteractions} from "./hooks/useMatrixEditorInteractions";
import {MatrixResourceContext} from "./services/matrixResourceGating";
import {resolveEditorLinkedReferences} from "./services/linkedReferenceResolutionService";
import {MatrixEditorWorkspace} from "./rendering/MatrixEditorWorkspace";
import {MatrixEditorInlinePanels} from "./rendering/MatrixEditorInlinePanels";

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
    displayFrequenciesAsPercent?: boolean;
    resourceContext?: MatrixResourceContext | null;
    currentScenarioId?: string | null;
    linkedCellResolutions?: Record<string, MatrixLinkedCellResolution>;
}

const EMPTY_LINKED_CELL_RESOLUTIONS: Record<string, MatrixLinkedCellResolution> = {};

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
    displayFrequenciesAsPercent = false,
    resourceContext = null,
    currentScenarioId = null,
    linkedCellResolutions = EMPTY_LINKED_CELL_RESOLUTIONS,
}: MatrixEditorShellProps) {
    const {solveGame} = useSolverGames();
    const {getSpecificMove} = useMoves();
    const {state, dispatch, actions} = useMatrixEditorController({matrix, onMatrixChange, persistChanges: editable});
    const stateRef = React.useRef(state);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [showLayerControls, setShowLayerControls] = React.useState(false);
    const [editorLinkedCellResolutions, setEditorLinkedCellResolutions] = React.useState<Record<string, MatrixLinkedCellResolution>>({});

    React.useEffect(() => {
        stateRef.current = state;
    }, [state]);

    const focusContainer = React.useCallback(() => {
        containerRef.current?.focus();
    }, []);

    const permissions = useMatrixEditorPermissions({
        editable,
        allowRowStructureEdit,
        allowColumnStructureEdit,
        allowRowAxisLabelEdit,
        allowColumnAxisLabelEdit,
        allowRowLayerEdit,
        allowColumnLayerEdit,
    });

    const {moveLabelById, mergeMoveLabels} = useMoveLabels({bodyCells: state.grid.bodyCells, getSpecificMove});

    const {resolveDynamicComboValue, resolveDynamicCellsForSolve} = useDynamicComboResolver({
        stateRef,
        dispatch,
        actions,
        getSpecificMove,
        onRefreshDynamicCells,
        onResolveDynamicComboCell,
    });

    const viewModel = useMatrixEditorViewModel({
        state,
        dispatch,
        actions,
        editable,
        columnVisibilityByLabel,
        displayFrequenciesAsPercent,
        layerSolveSnapshots,
        resourceContext,
    });

    const referenceModel = useMatrixReferenceViewModel({
        matrix,
        state,
        filteredVisibleState: viewModel.filteredVisibleState,
        linkedCellResolutions,
        editorLinkedCellResolutions,
        dispatch,
        actions,
    });

    const resolveLinkedCellsForSolve = React.useCallback(() => resolveEditorLinkedReferences({
        state: stateRef.current,
        currentScenarioId,
        baseDisplayedBodyValues: referenceModel.referenceResolution.displayedBodyValues,
        existingResolutions: referenceModel.effectiveLinkedCellResolutions,
        solveGame,
    }), [currentScenarioId, referenceModel.effectiveLinkedCellResolutions, referenceModel.referenceResolution.displayedBodyValues, solveGame]);

    const {isSolving, solveCurrentMatrix} = useSolveMatrix({
        stateRef,
        dispatch,
        actions,
        effectiveLayerLimit: viewModel.effectiveLayerLimit,
        displayedBodyValues: referenceModel.referenceResolution.displayedBodyValues,
        solveGame,
        resolveDynamicCellsForSolve,
        resolveLinkedCellsForSolve,
        onLinkedCellsResolved: setEditorLinkedCellResolutions,
        forceSolveColumnIds: viewModel.forceSolveColumnIds,
        unavailableRowIds: viewModel.resourceGating.unavailableRowIds,
        unavailableColumnIds: viewModel.resourceGating.unavailableColumnIds,
    });

    const panels = useMatrixEditorPanels({
        canEditReferences: permissions.canEditReferences,
        canEditDynamicCombos: permissions.canEditDynamicCombos,
        focusContainer,
    });
    const {
        linkTargetKey,
        dynamicComboTargetKey,
        isAnyModalOpen,
        closeLinkPanel,
        closeDynamicComboPanel,
        dismissPanels,
        openLinkPanelForKey,
        openDynamicComboPanelForKey,
    } = panels;

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

    const interactions = useMatrixEditorInteractions({
        state,
        stateRef,
        dispatch,
        actions,
        containerRef,
        focusContainer,
        canEditBodyValues: permissions.canEditBodyValues,
        canEditSummaries: permissions.canEditSummaries,
        isAnyModalOpen,
    });

    const inlinePanelMode = React.useMemo<"link" | "dynamic" | null>(() => {
        if (linkTargetKey) {
            return "link";
        }

        if (dynamicComboTargetKey) {
            return "dynamic";
        }

        return null;
    }, [linkTargetKey, dynamicComboTargetKey]);

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            role="application"
            aria-label="Matrix editor"
            style={{width: "100%", maxWidth: "100%", minWidth: 0, overflowX: "hidden", boxSizing: "border-box"}}
            onPaste={interactions.handlePaste}
            onKeyDown={interactions.handleKeyDown}
        >
            <MatrixEditorWorkspace
                state={state}
                filteredVisibleState={viewModel.filteredVisibleState}
                attackerCharacterName={attackerCharacterName}
                defenderCharacterName={defenderCharacterName}
                onDelete={onDelete}
                displayWarnings={referenceModel.displayWarnings}
                inspectorData={referenceModel.inspectorData}
                matrixInsights={referenceModel.matrixInsights}
                showAllLayers={viewModel.showAllLayers}
                selectedLayer={viewModel.selectedLayer}
                onShowAllLayersChange={viewModel.setShowAllLayers}
                onSelectedLayerChange={viewModel.setSelectedLayer}
                permissions={permissions}
                selectedBodyCell={referenceModel.selectedBodyCell}
                selectedReferenceLabel={referenceModel.selectedReferenceLabel}
                onOpenReferenceLink={openLinkPanelForKey}
                onOpenDynamicCombo={openDynamicComboPanelForKey}
                onSolve={solveCurrentMatrix}
                isSolving={isSolving}
                showLayerControls={showLayerControls}
                onShowLayerControlsChange={setShowLayerControls}
                displayedExpectedValue={referenceModel.displayedExpectedValue}
                activeRowId={interactions.axisContext.activeRowId}
                activeColumnId={interactions.axisContext.activeColumnId}
                draftHasFormatError={interactions.draftHasFormatError}
                displayedBodyValues={referenceModel.referenceResolution.displayedBodyValues}
                referenceDisplayLabels={referenceModel.referenceDisplayLabels}
                moveLabelById={moveLabelById}
                resourceGating={viewModel.resourceGating}
                dispatch={dispatch}
                actions={actions}
                selectTarget={interactions.selectTarget}
                startEditForKey={interactions.startEditForKey}
                startOverwriteEditForKey={interactions.startOverwriteEditForKey}
                commitEditAndRefocus={interactions.commitEditAndRefocus}
                cancelEditAndRefocus={interactions.cancelEditAndRefocus}
                summaryValueFormatter={viewModel.summaryValueFormatter}
                inlinePanels={
                    <MatrixEditorInlinePanels
                        state={state}
                        mode={inlinePanelMode}
                        linkTargetKey={linkTargetKey}
                        dynamicComboTargetKey={dynamicComboTargetKey}
                        moveLabelById={moveLabelById}
                        dispatch={dispatch}
                        actions={actions}
                        mergeMoveLabels={mergeMoveLabels}
                        resolveDynamicComboValue={resolveDynamicComboValue}
                        closeLinkPanel={closeLinkPanel}
                        closeDynamicComboPanel={closeDynamicComboPanel}
                    />
                }
            />
        </div>
    );
}
