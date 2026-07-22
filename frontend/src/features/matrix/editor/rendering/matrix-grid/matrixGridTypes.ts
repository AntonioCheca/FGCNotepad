import type {MatrixDensityMode, MatrixEditorState, MatrixResourceRequirement, MatrixSelectionTarget, MatrixValidationIssue} from "@/src/features/matrix/model";
import type {MatrixEditorPermissions} from "../../hooks/useMatrixEditorPermissions";
import type {MatrixHeatmapTone} from "../../services/matrixInsightService";

export type RequirementEditorTarget = {
    axis: "rows" | "columns";
    axisId: string;
    anchorRect: DOMRect;
};

export type MatrixGridStructureSelection = {
    axis: "row" | "column";
    id: string;
} | null;

export interface MatrixGridViewOptions {
    density: MatrixDensityMode;
    showLayerControls: boolean;
}

export interface MatrixGridProps {
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
    permissions: MatrixEditorPermissions;
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
    viewOptions: MatrixGridViewOptions;
    summaryValueFormatter?: (value: number | null) => string;
    heatmapToneByCellKey?: Record<string, MatrixHeatmapTone>;
}
