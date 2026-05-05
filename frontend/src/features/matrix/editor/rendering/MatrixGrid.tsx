import React from "react";

import {MatrixDensityMode, MatrixEditorState, MatrixSelectionTarget, MatrixValidationIssue} from "@/src/features/matrix/model";
import {useMode} from "@/src/context/ThemeContext";
import {MatrixGridHeader} from "./MatrixGridHeader";
import {MatrixGridBody} from "./MatrixGridBody";
import {MatrixSummaryAxes} from "./MatrixSummaryAxes";
import {resolveDensityProfile} from "./gridDensity";

interface MatrixGridProps {
    state: MatrixEditorState;
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
    moveLabelById: Record<string, string>;
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
}

export function MatrixGrid({
                                state,
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
                                  moveLabelById,
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
                               }: MatrixGridProps) {
    const {theme} = useMode();
    const [structureSelection, setStructureSelection] = React.useState<{axis: "row" | "column"; id: string} | null>(null);

    const profile = React.useMemo(
        () => resolveDensityProfile(density, state.grid.rows.length, state.grid.columns.length),
        [density, state.grid.rows.length, state.grid.columns.length]
    );

    React.useEffect(() => {
        if (!activeTarget || activeTarget.zone === "body" || activeTarget.zone === "expectedValue") {
            setStructureSelection(null);
            return;
        }

        if (activeTarget.zone === "rowSummary") {
            setStructureSelection((prev) => {
                if (prev?.axis === "row" && prev.id === activeTarget.rowId) {
                    return prev;
                }
                return {axis: "row", id: activeTarget.rowId};
            });
            return;
        }

        setStructureSelection((prev) => {
            if (prev?.axis === "column" && prev.id === activeTarget.columnId) {
                return prev;
            }
            return {axis: "column", id: activeTarget.columnId};
        });
    }, [activeTarget]);

    const handleSelectColumnHeader = React.useCallback((columnId: string) => {
        setStructureSelection({axis: "column", id: columnId});
        onSelectColumnHeader(columnId);
    }, [onSelectColumnHeader]);

    const handleSelectRowHeader = React.useCallback((rowId: string) => {
        setStructureSelection({axis: "row", id: rowId});
        onSelectRowHeader(rowId);
    }, [onSelectRowHeader]);

    const handleSelectBodyCell = React.useCallback((rowId: string, columnId: string) => {
        setStructureSelection(null);
        onSelectBodyCell(rowId, columnId);
    }, [onSelectBodyCell]);

    const handleSelectRowSummary = React.useCallback((rowId: string) => {
        setStructureSelection(null);
        onSelectRowSummary(rowId);
    }, [onSelectRowSummary]);

    const handleSelectColumnSummary = React.useCallback((columnId: string) => {
        setStructureSelection(null);
        onSelectColumnSummary(columnId);
    }, [onSelectColumnSummary]);

    const handleSelectExpectedValue = React.useCallback(() => {
        setStructureSelection(null);
        onSelectExpectedValue();
    }, [onSelectExpectedValue]);

    const selectedColumnHeaderId = structureSelection?.axis === "column" ? structureSelection.id : null;
    const selectedRowHeaderId = structureSelection?.axis === "row" ? structureSelection.id : null;
    const showRemoveColumn = canEditColumnStructure && selectedColumnHeaderId !== null;
    const showRemoveRow = canEditRowStructure && selectedRowHeaderId !== null;

    return (
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
                    activeColumnId={activeColumnId}
                    canEditColumnAxisLabels={canEditColumnAxisLabels}
                    canEditColumnLayers={canEditColumnLayers}
                    onColumnLabelChange={onColumnLabelChange}
                    onColumnLayerChange={onColumnLayerChange}
                    onSelectColumnHeader={handleSelectColumnHeader}
                    densityProfile={profile}
                    showLayerControls={showLayerControls}
                />
                <MatrixGridBody
                    state={state}
                    activeKey={activeKey}
                    activeRowId={activeRowId}
                    activeColumnId={activeColumnId}
                    editingKey={editingKey}
                    draft={draft}
                    draftHasFormatError={draftHasFormatError}
                    validationByKey={validationByKey}
                    displayedBodyValues={displayedBodyValues}
                    moveLabelById={moveLabelById}
                    canEditRowAxisLabels={canEditRowAxisLabels}
                    canEditRowLayers={canEditRowLayers}
                    canEditBodyValues={canEditBodyValues}
                    canEditSummaries={canEditSummaries}
                    onRowLabelChange={onRowLabelChange}
                    onRowLayerChange={onRowLayerChange}
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
                />
                <MatrixSummaryAxes
                    state={state}
                    activeKey={activeKey}
                    activeColumnId={activeColumnId}
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
    );
}
