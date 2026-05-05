export type MatrixCellKind = "static" | "reference" | "dynamic_combo";
export type MatrixReferenceKind = "reference" | "computed";
export type MatrixEditorMode = "view" | "edit";
export type MatrixDensityMode = "standard" | "compact";
export type MatrixFocusedRegion = "none" | "grid" | "toolbar";
export type MatrixResourceOwner = "attacker" | "defender";
export type MatrixResourceType = "health" | "drive" | "super";
export type MatrixResourceOperator = ">=";

export interface MatrixResourceRequirement {
    owner: MatrixResourceOwner;
    resource: MatrixResourceType;
    operator: MatrixResourceOperator;
    threshold: number;
}

export interface MatrixAxisItem {
    id: string;
    label: string;
    layer: number;
    requirements: MatrixResourceRequirement[];
}

export interface MatrixReferenceData {
    kind: MatrixReferenceKind;
    scenarioId: string;
    scenarioLabel?: string;
    cachedValue: number | null;
}

export interface MatrixDynamicComboStarterContext {
    isPunishCounter: boolean;
    isCounterHit: boolean;
}

export interface MatrixDynamicComboData {
    attackerCharacterId: string;
    isComboInitiatorAttacker?: boolean;
    starterMoveIds: string[];
    starterContext: MatrixDynamicComboStarterContext;
}

export interface MatrixBodyCell {
    key: string;
    rowId: string;
    columnId: string;
    kind: MatrixCellKind;
    value: number | null;
    reference: MatrixReferenceData | null;
    dynamicCombo: MatrixDynamicComboData | null;
}

export interface MatrixSummaryCell {
    key: string;
    value: number | null;
}

export interface MatrixGridDataSlice {
    rows: MatrixAxisItem[];
    columns: MatrixAxisItem[];
    bodyCells: Record<string, MatrixBodyCell>;
    rowSummaryCells: Record<string, MatrixSummaryCell>;
    columnSummaryCells: Record<string, MatrixSummaryCell>;
    expectedValueCell: MatrixSummaryCell;
    metadata: {
        matrixId: string;
        title: string | null;
    };
}

export type MatrixSelectionTarget =
    | { zone: "body"; key: string; rowId: string; columnId: string }
    | { zone: "rowSummary"; key: string; rowId: string }
    | { zone: "columnSummary"; key: string; columnId: string }
    | { zone: "expectedValue"; key: string };

export interface MatrixSelectionSlice {
    activeTarget: MatrixSelectionTarget | null;
    anchorTarget: MatrixSelectionTarget | null;
    selectedKeys: string[];
}

export interface MatrixEditingSlice {
    mode: MatrixEditorMode;
    activeKey: string | null;
    draft: string | null;
}

export interface MatrixValidationIssue {
    code: "invalid_number" | "out_of_range" | "readonly_cell" | "unknown";
    message: string;
}

export interface MatrixValidationSlice {
    byKey: Record<string, MatrixValidationIssue[]>;
    globalIssues: MatrixValidationIssue[];
}

export interface MatrixDerivedSlice {
    computedExpectedValue: number | null;
    rowComputed: Record<string, number | null>;
    columnComputed: Record<string, number | null>;
    isDirty: boolean;
    lastComputedAt: number | null;
}

export interface MatrixViewportSlice {
    scrollTop: number;
    scrollLeft: number;
    density: MatrixDensityMode;
    showValidation: boolean;
    focusedRegion: MatrixFocusedRegion;
}

export interface MatrixEditorState {
    grid: MatrixGridDataSlice;
    selection: MatrixSelectionSlice;
    editing: MatrixEditingSlice;
    validation: MatrixValidationSlice;
    derived: MatrixDerivedSlice;
    viewport: MatrixViewportSlice;
}

export interface CreateMatrixStateOptions {
    matrixId?: string;
    title?: string | null;
    rowCount?: number;
    columnCount?: number;
    defaultCellValue?: number | null;
}
