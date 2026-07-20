import React from "react";

import {MatrixDensityMode, MatrixEditorState, MatrixResourceRequirement, MatrixSelectionTarget, MatrixValidationIssue} from "@/src/features/matrix/model";
import {useMode} from "@/src/context/ThemeContext";
import {MatrixGridHeader} from "./MatrixGridHeader";
import {MatrixGridBody} from "./MatrixGridBody";
import {MatrixSummaryAxes} from "./MatrixSummaryAxes";
import {resolveDensityProfile} from "./gridDensity";
import {FloatingAxisRequirementEditor} from "./AxisRequirementEditor";
import {MatrixHeatmapTone} from "../services/matrixInsightService";

type RequirementEditorTarget = {
    axis: "rows" | "columns";
    axisId: string;
    anchorRect: DOMRect;
};

const EMPTY_DISPLAY_LABELS_BY_KEY: Record<string, string> = {};
const EMPTY_UNAVAILABLE_ROW_IDS = new Set<string>();
const EMPTY_UNAVAILABLE_COLUMN_IDS = new Set<string>();
const EMPTY_UNAVAILABLE_REASON_BY_ROW_ID: Record<string, string> = {};
const EMPTY_UNAVAILABLE_REASON_BY_COLUMN_ID: Record<string, string> = {};
const EMPTY_HEATMAP_TONE_BY_CELL_KEY: Record<string, MatrixHeatmapTone> = {};

interface MatrixGridProps {
    state: MatrixEditorState;
    attackerCharacterName?: string | null;
    defenderCharacterName?: string | null;
    expectedValue: number | null;
    activeTarget: MatrixSelectionTarget | null;
    activeKey: string | null;
    activeRowId: string | null;
    activeColumnId: string | null;
    editingKey: string | null;
    draft: string;
    draftHasFormatError: boolean;
    validationByKey: Record<string, MatrixValidationIssue[]>;
    displayedBodyValues: Record<string, number | null>;
    displayLabelsByKey?: Record<string, string>;
    moveLabelById: Record<string, string>;
    unavailableRowIds?: Set<string>;
    unavailableColumnIds?: Set<string>;
    unavailableReasonByRowId?: Record<string, string>;
    unavailableReasonByColumnId?: Record<string, string>;
    canEditRowStructure: boolean;
    canEditColumnStructure: boolean;
    canEditRowAxisLabels: boolean;
    canEditColumnAxisLabels: boolean;
    canEditRowLayers: boolean;
    canEditColumnLayers: boolean;
    canEditBodyValues: boolean;
    canEditSummaries: boolean;
    onAddRow: () => void;
    onAddColumn: () => void;
    onRemoveRow: (rowId: string) => void;
    onRemoveColumn: (columnId: string) => void;
    onRowLabelChange: (rowId: string, label: string) => void;
    onColumnLabelChange: (columnId: string, label: string) => void;
    onRowLayerChange: (rowId: string, layer: number) => void;
    onColumnLayerChange: (columnId: string, layer: number) => void;
    onAddRowRequirement: (rowId: string, requirement: MatrixResourceRequirement) => void;
    onUpdateRowRequirement: (rowId: string, index: number, requirement: MatrixResourceRequirement) => void;
    onRemoveRowRequirement: (rowId: string, index: number) => void;
    onAddColumnRequirement: (columnId: string, requirement: MatrixResourceRequirement) => void;
    onUpdateColumnRequirement: (columnId: string, index: number, requirement: MatrixResourceRequirement) => void;
    onRemoveColumnRequirement: (columnId: string, index: number) => void;
    onSelectRowHeader: (rowId: string) => void;
    onSelectColumnHeader: (columnId: string) => void;
    onSelectBodyCell: (rowId: string, columnId: string) => void;
    onSelectRowSummary: (rowId: string) => void;
    onOpenReferenceLink: (key: string) => void;
    onOpenDynamicCombo: (key: string) => void;
    onSelectColumnSummary: (columnId: string) => void;
    onSelectExpectedValue: () => void;
    onStartEdit: (key: string) => void;
    onStartOverwriteEdit: (key: string, firstCharacter: string) => void;
    onDraftChange: (draft: string) => void;
    onCommitEdit: () => void;
    onCancelEdit: () => void;
    density: MatrixDensityMode;
    showLayerControls: boolean;
    summaryValueFormatter?: (value: number | null) => string;
    heatmapToneByCellKey?: Record<string, MatrixHeatmapTone>;
}

export function MatrixGrid({
                                state,
                                attackerCharacterName,
                                defenderCharacterName,
                                expectedValue,
                                activeTarget,
                                activeKey,
                                activeRowId,
                                activeColumnId,
                               editingKey,
                               draft,
                                draftHasFormatError,
                                    validationByKey,
                                    displayedBodyValues,
                                     displayLabelsByKey = EMPTY_DISPLAY_LABELS_BY_KEY,
                                     moveLabelById,
                                    unavailableRowIds = EMPTY_UNAVAILABLE_ROW_IDS,
                                   unavailableColumnIds = EMPTY_UNAVAILABLE_COLUMN_IDS,
                                    unavailableReasonByRowId = EMPTY_UNAVAILABLE_REASON_BY_ROW_ID,
                                   unavailableReasonByColumnId = EMPTY_UNAVAILABLE_REASON_BY_COLUMN_ID,
                                   canEditRowStructure,
                                 canEditColumnStructure,
                                 canEditRowAxisLabels,
                                 canEditColumnAxisLabels,
                                 canEditRowLayers,
                                 canEditColumnLayers,
                                 canEditBodyValues,
                                canEditSummaries,
                                onAddRow,
                                onAddColumn,
                                onRemoveRow,
                                 onRemoveColumn,
                                 onRowLabelChange,
                                 onColumnLabelChange,
                                    onRowLayerChange,
                                    onColumnLayerChange,
                                   onAddRowRequirement,
                                   onUpdateRowRequirement,
                                   onRemoveRowRequirement,
                                   onAddColumnRequirement,
                                   onUpdateColumnRequirement,
                                   onRemoveColumnRequirement,
                                  onSelectRowHeader,
                                  onSelectColumnHeader,
                                  onSelectBodyCell,
                                 onSelectRowSummary,
                                onOpenReferenceLink,
                                onOpenDynamicCombo,
                                onSelectColumnSummary,
                                onSelectExpectedValue,
                                onStartEdit,
                                onStartOverwriteEdit,
                                  onDraftChange,
                                  onCommitEdit,
                                  onCancelEdit,
                                 density,
                                  showLayerControls,
                                  summaryValueFormatter,
                                  heatmapToneByCellKey = EMPTY_HEATMAP_TONE_BY_CELL_KEY,
                                  }: MatrixGridProps) {
    const {theme} = useMode();
    const [requirementTarget, setRequirementTarget] = React.useState<RequirementEditorTarget | null>(null);

    const profile = React.useMemo(
        () => resolveDensityProfile(density, state.grid.rows.length, state.grid.columns.length),
        [density, state.grid.rows.length, state.grid.columns.length]
    );

    const structureSelection = React.useMemo(() => {
        if (requirementTarget) {
            return {
                axis: requirementTarget.axis === "rows" ? "row" : "column",
                id: requirementTarget.axisId,
            };
        }

        if (activeTarget?.zone === "rowSummary") {
            return {axis: "row", id: activeTarget.rowId} as const;
        }

        if (activeTarget?.zone === "columnSummary") {
            return {axis: "column", id: activeTarget.columnId} as const;
        }

        return null;
    }, [activeTarget, requirementTarget]);

    const handleSelectColumnHeader = React.useCallback((columnId: string) => {
        onSelectColumnHeader(columnId);
    }, [onSelectColumnHeader]);

    const handleSelectRowHeader = React.useCallback((rowId: string) => {
        onSelectRowHeader(rowId);
    }, [onSelectRowHeader]);

    const handleSelectBodyCell = React.useCallback((rowId: string, columnId: string) => {
        onSelectBodyCell(rowId, columnId);
    }, [onSelectBodyCell]);

    const handleSelectRowSummary = React.useCallback((rowId: string) => {
        onSelectRowSummary(rowId);
    }, [onSelectRowSummary]);

    const handleSelectColumnSummary = React.useCallback((columnId: string) => {
        onSelectColumnSummary(columnId);
    }, [onSelectColumnSummary]);

    const handleSelectExpectedValue = React.useCallback(() => {
        onSelectExpectedValue();
    }, [onSelectExpectedValue]);

    const handleOpenRowRequirements = React.useCallback((rowId: string, anchor: HTMLElement) => {
        onSelectRowHeader(rowId);
        setRequirementTarget({axis: "rows", axisId: rowId, anchorRect: anchor.getBoundingClientRect()});
    }, [onSelectRowHeader]);

    const handleOpenColumnRequirements = React.useCallback((columnId: string, anchor: HTMLElement) => {
        onSelectColumnHeader(columnId);
        setRequirementTarget({axis: "columns", axisId: columnId, anchorRect: anchor.getBoundingClientRect()});
    }, [onSelectColumnHeader]);

    const selectedColumnHeaderId = structureSelection?.axis === "column" ? structureSelection.id : null;
    const selectedRowHeaderId = structureSelection?.axis === "row" ? structureSelection.id : null;
    const showRemoveColumn = canEditColumnStructure && selectedColumnHeaderId !== null;
    const showRemoveRow = canEditRowStructure && selectedRowHeaderId !== null;
    const activeRequirementAxis = requirementTarget
        ? state.grid[requirementTarget.axis].find((axis) => axis.id === requirementTarget.axisId) ?? null
        : null;
    const canEditActiveRequirementAxis = requirementTarget?.axis === "rows" ? canEditRowAxisLabels : canEditColumnAxisLabels;

    return (
        <>
        <div
            style={{
                overflow: "auto",
                maxWidth: "100%",
                minWidth: 0,
                maxHeight: "62vh",
                border: `1px solid ${theme.fgc.border.default}`,
                borderRadius: 10,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
                width: "100%",
                background: theme.fgc.surface.base,
            }}
        >
            <table
                style={{
                    borderCollapse: "separate",
                    borderSpacing: 0,
                    width: "max-content",
                    minWidth: "100%",
                    fontSize: profile.valueFontSize,
                    lineHeight: 1.2,
                }}
            >
                <MatrixGridHeader
                    state={state}
                    attackerCharacterName={attackerCharacterName}
                    defenderCharacterName={defenderCharacterName}
                    activeColumnId={activeColumnId}
                    unavailableColumnIds={unavailableColumnIds}
                    unavailableReasonByColumnId={unavailableReasonByColumnId}
                    canEditColumnAxisLabels={canEditColumnAxisLabels}
                    canEditColumnLayers={canEditColumnLayers}
                    onColumnLabelChange={onColumnLabelChange}
                    onColumnLayerChange={onColumnLayerChange}
                    onOpenColumnRequirements={handleOpenColumnRequirements}
                    onSelectColumnHeader={handleSelectColumnHeader}
                    densityProfile={profile}
                    showLayerControls={showLayerControls}
                />
                <MatrixGridBody
                    state={state}
                    activeKey={activeKey}
                    activeRowId={activeRowId}
                    activeColumnId={activeColumnId}
                    unavailableRowIds={unavailableRowIds}
                    unavailableColumnIds={unavailableColumnIds}
                    unavailableReasonByRowId={unavailableReasonByRowId}
                    unavailableReasonByColumnId={unavailableReasonByColumnId}
                    editingKey={editingKey}
                    draft={draft}
                    draftHasFormatError={draftHasFormatError}
                    validationByKey={validationByKey}
                    displayedBodyValues={displayedBodyValues}
                    displayLabelsByKey={displayLabelsByKey}
                    moveLabelById={moveLabelById}
                    canEditRowAxisLabels={canEditRowAxisLabels}
                    canEditRowLayers={canEditRowLayers}
                    canEditBodyValues={canEditBodyValues}
                    canEditSummaries={canEditSummaries}
                    onRowLabelChange={onRowLabelChange}
                    onRowLayerChange={onRowLayerChange}
                    onOpenRowRequirements={handleOpenRowRequirements}
                    onSelectRowHeader={handleSelectRowHeader}
                    onSelectBodyCell={handleSelectBodyCell}
                    onSelectRowSummary={handleSelectRowSummary}
                    onOpenReferenceLink={onOpenReferenceLink}
                    onOpenDynamicCombo={onOpenDynamicCombo}
                    onStartEdit={onStartEdit}
                    onStartOverwriteEdit={onStartOverwriteEdit}
                    onDraftChange={onDraftChange}
                    onCommitEdit={onCommitEdit}
                    onCancelEdit={onCancelEdit}
                    densityProfile={profile}
                    showLayerControls={showLayerControls}
                    summaryValueFormatter={summaryValueFormatter}
                    heatmapToneByCellKey={heatmapToneByCellKey}
                />
                <MatrixSummaryAxes
                    state={state}
                    defenderCharacterName={defenderCharacterName}
                    activeKey={activeKey}
                    activeColumnId={activeColumnId}
                    unavailableColumnIds={unavailableColumnIds}
                    unavailableReasonByColumnId={unavailableReasonByColumnId}
                    editingKey={editingKey}
                    draft={draft}
                    draftHasFormatError={draftHasFormatError}
                    validationByKey={validationByKey}
                    canEditSummaries={canEditSummaries}
                    onSelectColumnSummary={handleSelectColumnSummary}
                    onSelectExpectedValue={handleSelectExpectedValue}
                    onStartEdit={onStartEdit}
                    onStartOverwriteEdit={onStartOverwriteEdit}
                    onDraftChange={onDraftChange}
                    onCommitEdit={onCommitEdit}
                    onCancelEdit={onCancelEdit}
                    expectedValue={expectedValue}
                    densityProfile={profile}
                    summaryValueFormatter={summaryValueFormatter}
                />
            </table>
            {canEditRowStructure || canEditColumnStructure ? (
                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        padding: "10px 12px",
                        borderTop: `1px solid ${theme.fgc.border.subtle}`,
                        background: theme.fgc.surface.subtle,
                        position: "sticky",
                        bottom: 0,
                    }}
                >
                    {canEditRowStructure ? (
                        <button type="button" onClick={onAddRow} style={{minHeight: profile.cellHeight, fontSize: profile.labelFontSize}}>
                            + Row
                        </button>
                    ) : null}
                    {canEditColumnStructure ? (
                        <button type="button" onClick={onAddColumn} style={{minHeight: profile.cellHeight, fontSize: profile.labelFontSize}}>
                            + Col
                        </button>
                    ) : null}
                    {showRemoveColumn ? (
                        <button
                            type="button"
                            onClick={() => onRemoveColumn(selectedColumnHeaderId!)}
                            style={{minHeight: profile.cellHeight, fontSize: profile.labelFontSize}}
                        >
                            - Col
                        </button>
                    ) : null}
                    {showRemoveRow ? (
                        <button
                            type="button"
                            onClick={() => onRemoveRow(selectedRowHeaderId!)}
                            style={{minHeight: profile.cellHeight, fontSize: profile.labelFontSize}}
                        >
                            - Row
                        </button>
                    ) : null}
                </div>
            ) : null}
        </div>
        {requirementTarget && activeRequirementAxis ? (
            <FloatingAxisRequirementEditor
                axisLabel={activeRequirementAxis.label || (requirementTarget.axis === "rows" ? "Row" : "Column")}
                requirements={activeRequirementAxis.requirements}
                readOnly={!canEditActiveRequirementAxis}
                anchorRect={requirementTarget.anchorRect}
                onAdd={(requirement) => {
                    if (requirementTarget.axis === "rows") {
                        onAddRowRequirement(requirementTarget.axisId, requirement);
                        return;
                    }
                    onAddColumnRequirement(requirementTarget.axisId, requirement);
                }}
                onUpdate={(index, requirement) => {
                    if (requirementTarget.axis === "rows") {
                        onUpdateRowRequirement(requirementTarget.axisId, index, requirement);
                        return;
                    }
                    onUpdateColumnRequirement(requirementTarget.axisId, index, requirement);
                }}
                onRemove={(index) => {
                    if (requirementTarget.axis === "rows") {
                        onRemoveRowRequirement(requirementTarget.axisId, index);
                        return;
                    }
                    onRemoveColumnRequirement(requirementTarget.axisId, index);
                }}
                onClose={() => setRequirementTarget(null)}
            />
        ) : null}
        </>
    );
}
