import {MatrixGridBody} from "../MatrixGridBody";
import {MatrixGridHeader} from "../MatrixGridHeader";
import {MatrixSummaryAxes} from "../MatrixSummaryAxes";
import type {MatrixDensityProfile} from "../gridDensity";
import type {MatrixGridProps} from "./matrixGridTypes";

interface MatrixGridTableProps extends Omit<MatrixGridProps,
    "onAddRow" |
    "onAddColumn" |
    "onRemoveRow" |
    "onRemoveColumn" |
    "onAddRowRequirement" |
    "onUpdateRowRequirement" |
    "onRemoveRowRequirement" |
    "onAddColumnRequirement" |
    "onUpdateColumnRequirement" |
    "onRemoveColumnRequirement"
> {
    profile: MatrixDensityProfile;
    onOpenRowRequirements: (rowId: string, anchor: HTMLElement) => void;
    onOpenColumnRequirements: (columnId: string, anchor: HTMLElement) => void;
    onSelectRowHeader: (rowId: string) => void;
    onSelectColumnHeader: (columnId: string) => void;
    onSelectBodyCell: (rowId: string, columnId: string) => void;
    onSelectRowSummary: (rowId: string) => void;
    onSelectColumnSummary: (columnId: string) => void;
    onSelectExpectedValue: () => void;
}

export function MatrixGridTable({
    state,
    attackerCharacterName,
    defenderCharacterName,
    expectedValue,
    activeKey,
    activeRowId,
    activeColumnId,
    editingKey,
    draft,
    draftHasFormatError,
    validationByKey,
    displayedBodyValues,
    displayLabelsByKey,
    moveLabelById,
    unavailableRowIds,
    unavailableColumnIds,
    unavailableReasonByRowId,
    unavailableReasonByColumnId,
    permissions,
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
    viewOptions,
    summaryValueFormatter,
    heatmapToneByCellKey,
    profile,
    onOpenRowRequirements,
    onOpenColumnRequirements,
}: MatrixGridTableProps) {
    return (
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
                unavailableColumnIds={unavailableColumnIds!}
                unavailableReasonByColumnId={unavailableReasonByColumnId!}
                permissions={permissions}
                onColumnLabelChange={onColumnLabelChange}
                onColumnLayerChange={onColumnLayerChange}
                onOpenColumnRequirements={onOpenColumnRequirements}
                onSelectColumnHeader={onSelectColumnHeader}
                densityProfile={profile}
                viewOptions={viewOptions}
            />
            <MatrixGridBody
                state={state}
                activeKey={activeKey}
                activeRowId={activeRowId}
                activeColumnId={activeColumnId}
                unavailableRowIds={unavailableRowIds!}
                unavailableColumnIds={unavailableColumnIds!}
                unavailableReasonByRowId={unavailableReasonByRowId!}
                unavailableReasonByColumnId={unavailableReasonByColumnId!}
                editingKey={editingKey}
                draft={draft}
                draftHasFormatError={draftHasFormatError}
                validationByKey={validationByKey}
                displayedBodyValues={displayedBodyValues}
                displayLabelsByKey={displayLabelsByKey}
                moveLabelById={moveLabelById}
                permissions={permissions}
                onRowLabelChange={onRowLabelChange}
                onRowLayerChange={onRowLayerChange}
                onOpenRowRequirements={onOpenRowRequirements}
                onSelectRowHeader={onSelectRowHeader}
                onSelectBodyCell={onSelectBodyCell}
                onSelectRowSummary={onSelectRowSummary}
                onOpenReferenceLink={onOpenReferenceLink}
                onOpenDynamicCombo={onOpenDynamicCombo}
                onStartEdit={onStartEdit}
                onStartOverwriteEdit={onStartOverwriteEdit}
                onDraftChange={onDraftChange}
                onCommitEdit={onCommitEdit}
                onCancelEdit={onCancelEdit}
                densityProfile={profile}
                viewOptions={viewOptions}
                summaryValueFormatter={summaryValueFormatter}
                heatmapToneByCellKey={heatmapToneByCellKey}
            />
            <MatrixSummaryAxes
                state={state}
                defenderCharacterName={defenderCharacterName}
                activeKey={activeKey}
                activeColumnId={activeColumnId}
                unavailableColumnIds={unavailableColumnIds!}
                unavailableReasonByColumnId={unavailableReasonByColumnId!}
                editingKey={editingKey}
                draft={draft}
                draftHasFormatError={draftHasFormatError}
                validationByKey={validationByKey}
                canEditSummaries={permissions.canEditSummaries}
                onSelectColumnSummary={onSelectColumnSummary}
                onSelectExpectedValue={onSelectExpectedValue}
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
    );
}
