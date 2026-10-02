import React from "react";

import {useMode} from "@/src/context/ThemeContext";
import {resolveDensityProfile} from "./gridDensity";
import {
    EMPTY_DISPLAY_LABELS_BY_KEY,
    EMPTY_HEATMAP_TONE_BY_CELL_KEY,
    EMPTY_UNAVAILABLE_COLUMN_IDS,
    EMPTY_UNAVAILABLE_REASON_BY_COLUMN_ID,
    EMPTY_UNAVAILABLE_REASON_BY_ROW_ID,
    EMPTY_UNAVAILABLE_ROW_IDS,
} from "./matrix-grid/matrixGridDefaults";
import {MatrixGridRequirementOverlay} from "./matrix-grid/MatrixGridRequirementOverlay";
import {MatrixGridScrollFrame} from "./matrix-grid/MatrixGridScrollFrame";
import {MatrixGridStructureControls} from "./matrix-grid/MatrixGridStructureControls";
import {MatrixGridTable} from "./matrix-grid/MatrixGridTable";
import type {MatrixGridProps} from "./matrix-grid/matrixGridTypes";
import {useMatrixGridRequirements} from "./matrix-grid/useMatrixGridRequirements";
import {MatrixRowFocus} from "./matrix-grid/MatrixRowFocus";
import {buildRowFocusRows, pickDefaultRowId} from "./matrix-grid/rowFocusModel";
import {createRowSummaryKey} from "../../model/keys";
import styles from "./matrixEditorRendering.module.css";
import {PhoneLayoutSwitch, type PhoneMatrixLayout} from "./matrix-grid/PhoneLayoutSwitch";


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
    permissions,
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
    viewOptions,
    summaryValueFormatter,
    heatmapToneByCellKey = EMPTY_HEATMAP_TONE_BY_CELL_KEY,
}: MatrixGridProps) {
    const {theme} = useMode();
    const profile = React.useMemo(
        () => resolveDensityProfile(viewOptions.density, state.grid.rows.length, state.grid.columns.length),
        [viewOptions.density, state.grid.rows.length, state.grid.columns.length]
    );
    const {
        requirementTarget,
        selectedColumnHeaderId,
        selectedRowHeaderId,
        activeRequirementAxis,
        canEditActiveRequirementAxis,
        openRowRequirements,
        openColumnRequirements,
        closeRequirements,
    } = useMatrixGridRequirements({
        state,
        activeTarget,
        canEditRowAxisLabels: permissions.canEditRowAxisLabels,
        canEditColumnAxisLabels: permissions.canEditColumnAxisLabels,
        onSelectRowHeader,
        onSelectColumnHeader,
    });

    const structureSelection = {
        columnId: selectedColumnHeaderId,
        rowId: selectedRowHeaderId,
    };

    const [phoneLayout, setPhoneLayout] = React.useState<PhoneMatrixLayout>(permissions.canEditBodyValues ? "grid" : "rows");
    const focusRows = React.useMemo(() => buildRowFocusRows({
        grid: state.grid,
        displayedBodyValues,
        displayLabelsByKey,
        unavailableRowIds,
        unavailableColumnIds,
        formatFrequency: summaryValueFormatter,
    }), [state.grid, displayedBodyValues, displayLabelsByKey, unavailableRowIds, unavailableColumnIds, summaryValueFormatter]);
    const defaultFocusRowId = React.useMemo(() => pickDefaultRowId(
        focusRows,
        Object.fromEntries(state.grid.rows.map((row) => [row.id, state.grid.rowSummaryCells[createRowSummaryKey(row.id)]?.value ?? null])),
    ), [focusRows, state.grid.rows, state.grid.rowSummaryCells]);

    return (
        <>
            <div className={styles.phoneOnly}>
                <PhoneLayoutSwitch value={phoneLayout} onChange={setPhoneLayout}/>
                {phoneLayout === "rows" ? (
                    <MatrixRowFocus
                        rows={focusRows}
                        defaultRowId={defaultFocusRowId}
                        rowAxisLabel={attackerCharacterName ?? "P1"}
                        columnAxisLabel={defenderCharacterName ?? "P2"}
                    />
                ) : null}
            </div>
            <div className={phoneLayout === "rows" ? styles.hiddenOnPhone : undefined}>
                <MatrixGridScrollFrame borderColor={theme.fgc.border.default} backgroundColor={theme.fgc.surface.base}>
                    <MatrixGridTable
                        state={state}
                        attackerCharacterName={attackerCharacterName}
                        defenderCharacterName={defenderCharacterName}
                        expectedValue={expectedValue}
                        activeTarget={activeTarget}
                        activeKey={activeKey}
                        activeRowId={activeRowId}
                        activeColumnId={activeColumnId}
                        editingKey={editingKey}
                        draft={draft}
                        draftHasFormatError={draftHasFormatError}
                        validationByKey={validationByKey}
                        displayedBodyValues={displayedBodyValues}
                        displayLabelsByKey={displayLabelsByKey}
                        moveLabelById={moveLabelById}
                        unavailableRowIds={unavailableRowIds}
                        unavailableColumnIds={unavailableColumnIds}
                        unavailableReasonByRowId={unavailableReasonByRowId}
                        unavailableReasonByColumnId={unavailableReasonByColumnId}
                        permissions={permissions}
                        onRowLabelChange={onRowLabelChange}
                        onColumnLabelChange={onColumnLabelChange}
                        onRowLayerChange={onRowLayerChange}
                        onColumnLayerChange={onColumnLayerChange}
                        onSelectRowHeader={onSelectRowHeader}
                        onSelectColumnHeader={onSelectColumnHeader}
                        onSelectBodyCell={onSelectBodyCell}
                        onSelectRowSummary={onSelectRowSummary}
                        onOpenReferenceLink={onOpenReferenceLink}
                        onOpenDynamicCombo={onOpenDynamicCombo}
                        onSelectColumnSummary={onSelectColumnSummary}
                        onSelectExpectedValue={onSelectExpectedValue}
                        onStartEdit={onStartEdit}
                        onStartOverwriteEdit={onStartOverwriteEdit}
                        onDraftChange={onDraftChange}
                        onCommitEdit={onCommitEdit}
                        onCancelEdit={onCancelEdit}
                        viewOptions={viewOptions}
                        summaryValueFormatter={summaryValueFormatter}
                        heatmapToneByCellKey={heatmapToneByCellKey}
                        profile={profile}
                        onOpenRowRequirements={openRowRequirements}
                        onOpenColumnRequirements={openColumnRequirements}
                    />
                    <MatrixGridStructureControls
                        permissions={permissions}
                        selection={structureSelection}
                        cellHeight={profile.cellHeight}
                        labelFontSize={profile.labelFontSize}
                        borderColor={theme.fgc.border.subtle}
                        backgroundColor={theme.fgc.surface.subtle}
                        onAddRow={onAddRow}
                        onAddColumn={onAddColumn}
                        onRemoveRow={onRemoveRow}
                        onRemoveColumn={onRemoveColumn}
                    />
                </MatrixGridScrollFrame>
            </div>

            <MatrixGridRequirementOverlay
                target={requirementTarget}
                activeAxis={activeRequirementAxis}
                readOnly={!canEditActiveRequirementAxis}
                onAddRowRequirement={onAddRowRequirement}
                onUpdateRowRequirement={onUpdateRowRequirement}
                onRemoveRowRequirement={onRemoveRowRequirement}
                onAddColumnRequirement={onAddColumnRequirement}
                onUpdateColumnRequirement={onUpdateColumnRequirement}
                onRemoveColumnRequirement={onRemoveColumnRequirement}
                onClose={closeRequirements}
            />
        </>
    );
}
