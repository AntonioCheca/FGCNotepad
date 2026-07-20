import React from "react";

import {MatrixBodyCell, MatrixEditorState, MatrixResourceRequirement} from "@/src/features/matrix/model";
import {MatrixAction, matrixActions} from "@/src/features/matrix/state/actions";
import {ReferenceInspectorData} from "../services/referenceInspector";
import {MatrixInsights} from "../services/matrixInsightService";
import {toSelectionTarget} from "../services/matrixKeyboardEngine";
import {MatrixEditorLayout} from "./MatrixEditorLayout";
import {MatrixEditorToolbar} from "./MatrixEditorToolbar";
import {ReferenceInspector} from "./ReferenceInspector";
import {MatrixInsightsDashboard} from "./MatrixInsightsDashboard";
import {MatrixGrid} from "./MatrixGrid";

interface MatrixEditorResourceGatingView {
    unavailableRowIds: Set<string>;
    unavailableColumnIds: Set<string>;
    reasonByRowId: Record<string, string>;
    reasonByColumnId: Record<string, string>;
}

interface MatrixEditorWorkspaceProps {
    state: MatrixEditorState;
    filteredVisibleState: MatrixEditorState;
    attackerCharacterName?: string | null;
    defenderCharacterName?: string | null;
    onDelete?: () => void;
    displayWarnings: string[];
    inspectorData: ReferenceInspectorData | null;
    matrixInsights: MatrixInsights;
    showAllLayers: boolean;
    selectedLayer: number;
    onShowAllLayersChange: (value: boolean) => void;
    onSelectedLayerChange: (value: number) => void;
    canEditRowStructure: boolean;
    canEditColumnStructure: boolean;
    canEditRowAxisLabels: boolean;
    canEditColumnAxisLabels: boolean;
    canEditRowLayers: boolean;
    canEditColumnLayers: boolean;
    canEditBodyValues: boolean;
    canEditSummaries: boolean;
    canEditReferences: boolean;
    canEditDynamicCombos: boolean;
    selectedBodyCell: MatrixBodyCell | null;
    selectedReferenceLabel: string | null;
    onOpenReferenceLink: (key: string) => void;
    onOpenDynamicCombo: (key: string) => void;
    onSolve: () => Promise<void>;
    isSolving: boolean;
    editable: boolean;
    showLayerControls: boolean;
    onShowLayerControlsChange: (value: boolean) => void;
    displayedExpectedValue: number | null;
    activeRowId: string | null;
    activeColumnId: string | null;
    draftHasFormatError: boolean;
    displayedBodyValues: Record<string, number | null>;
    referenceDisplayLabels: Record<string, string>;
    moveLabelById: Record<string, string>;
    resourceGating: MatrixEditorResourceGatingView;
    dispatch: React.Dispatch<MatrixAction>;
    actions: typeof matrixActions;
    selectTarget: (target: ReturnType<typeof toSelectionTarget>, shouldFocus?: boolean) => void;
    startEditForKey: (key: string) => void;
    startOverwriteEditForKey: (key: string, firstCharacter: string) => void;
    commitEditAndRefocus: () => void;
    cancelEditAndRefocus: () => void;
    summaryValueFormatter?: (value: number | null) => string;
    inlinePanels: React.ReactNode;
}

export function MatrixEditorWorkspace({
    state,
    filteredVisibleState,
    attackerCharacterName,
    defenderCharacterName,
    onDelete,
    displayWarnings,
    inspectorData,
    matrixInsights,
    showAllLayers,
    selectedLayer,
    onShowAllLayersChange,
    onSelectedLayerChange,
    canEditRowStructure,
    canEditColumnStructure,
    canEditRowAxisLabels,
    canEditColumnAxisLabels,
    canEditRowLayers,
    canEditColumnLayers,
    canEditBodyValues,
    canEditSummaries,
    canEditReferences,
    canEditDynamicCombos,
    selectedBodyCell,
    selectedReferenceLabel,
    onOpenReferenceLink,
    onOpenDynamicCombo,
    onSolve,
    isSolving,
    editable,
    showLayerControls,
    onShowLayerControlsChange,
    displayedExpectedValue,
    activeRowId,
    activeColumnId,
    draftHasFormatError,
    displayedBodyValues,
    referenceDisplayLabels,
    moveLabelById,
    resourceGating,
    dispatch,
    actions,
    selectTarget,
    startEditForKey,
    startOverwriteEditForKey,
    commitEditAndRefocus,
    cancelEditAndRefocus,
    summaryValueFormatter,
    inlinePanels,
}: MatrixEditorWorkspaceProps) {
    return (
        <MatrixEditorLayout
            title={state.grid.metadata.title}
            onDelete={canEditRowStructure || canEditColumnStructure ? onDelete : undefined}
            warnings={displayWarnings}
        >
            <MatrixEditorToolbar
                showAllLayers={showAllLayers}
                selectedLayer={selectedLayer}
                onShowAllLayersChange={onShowAllLayersChange}
                onSelectedLayerChange={onSelectedLayerChange}
                canEditReferences={canEditReferences}
                canEditDynamicCombos={canEditDynamicCombos}
                selectedBodyCell={selectedBodyCell}
                onOpenReferenceLink={onOpenReferenceLink}
                onOpenDynamicCombo={onOpenDynamicCombo}
                onSolve={onSolve}
                isSolving={isSolving}
                rowCount={filteredVisibleState.grid.rows.length}
                columnCount={filteredVisibleState.grid.columns.length}
                editable={editable}
                selectedReferenceLabel={selectedReferenceLabel}
                showLayerControls={showLayerControls}
                onShowLayerControlsChange={onShowLayerControlsChange}
            />
            {inspectorData ? <ReferenceInspector data={inspectorData}/> : null}
            <MatrixInsightsDashboard insights={matrixInsights}/>

            <div style={{display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-start", width: "100%", minWidth: 0}}>
                <div style={{flex: "1 1 560px", minWidth: 0, width: "100%"}}>
                    <MatrixGrid
                        state={filteredVisibleState}
                        attackerCharacterName={attackerCharacterName}
                        defenderCharacterName={defenderCharacterName}
                        expectedValue={displayedExpectedValue}
                        activeTarget={state.selection.activeTarget}
                        activeKey={state.selection.activeTarget?.key ?? null}
                        activeRowId={activeRowId}
                        activeColumnId={activeColumnId}
                        editingKey={state.editing.mode === "edit" ? state.editing.activeKey : null}
                        draft={state.editing.draft ?? ""}
                        draftHasFormatError={draftHasFormatError}
                        validationByKey={state.validation.byKey}
                        displayedBodyValues={displayedBodyValues}
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
                        onAddRowRequirement={(rowId, requirement: MatrixResourceRequirement) => dispatch(actions.addAxisRequirement("rows", rowId, requirement))}
                        onUpdateRowRequirement={(rowId, index, requirement: MatrixResourceRequirement) => dispatch(actions.updateAxisRequirement("rows", rowId, index, requirement))}
                        onRemoveRowRequirement={(rowId, index) => dispatch(actions.removeAxisRequirement("rows", rowId, index))}
                        onAddColumnRequirement={(columnId, requirement: MatrixResourceRequirement) => dispatch(actions.addAxisRequirement("columns", columnId, requirement))}
                        onUpdateColumnRequirement={(columnId, index, requirement: MatrixResourceRequirement) => dispatch(actions.updateAxisRequirement("columns", columnId, index, requirement))}
                        onRemoveColumnRequirement={(columnId, index) => dispatch(actions.removeAxisRequirement("columns", columnId, index))}
                        onSelectBodyCell={(rowId, columnId) => selectTarget(toSelectionTarget("body", rowId, columnId))}
                        onSelectRowHeader={(rowId) => selectTarget(toSelectionTarget("rowSummary", rowId), false)}
                        onSelectColumnHeader={(columnId) => selectTarget(toSelectionTarget("columnSummary", columnId), false)}
                        onSelectRowSummary={(rowId) => selectTarget(toSelectionTarget("rowSummary", rowId))}
                        onSelectColumnSummary={(columnId) => selectTarget(toSelectionTarget("columnSummary", columnId))}
                        onSelectExpectedValue={() => selectTarget(toSelectionTarget("expectedValue"))}
                        onOpenReferenceLink={onOpenReferenceLink}
                        onOpenDynamicCombo={onOpenDynamicCombo}
                        onStartEdit={startEditForKey}
                        onStartOverwriteEdit={startOverwriteEditForKey}
                        onDraftChange={(draft) => dispatch(actions.updateDraft(draft))}
                        onCommitEdit={commitEditAndRefocus}
                        onCancelEdit={cancelEditAndRefocus}
                        density="standard"
                        showLayerControls={showLayerControls}
                        summaryValueFormatter={summaryValueFormatter}
                        heatmapToneByCellKey={matrixInsights.heatmapToneByCellKey}
                    />
                </div>

                {inlinePanels}
            </div>
        </MatrixEditorLayout>
    );
}
