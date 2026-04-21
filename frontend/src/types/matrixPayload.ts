export const MATRIX_PAYLOAD_KIND = "matrix-editor" as const;
export const MATRIX_PAYLOAD_SCHEMA_VERSION = 1 as const;

/**
 * Starter context mirrors combo requirement booleans:
 * - normal hit: isPunishCounter=false, isCounterHit=false
 * - punish counter: isPunishCounter=true, isCounterHit=false
 * - counter hit: isPunishCounter=false, isCounterHit=true
 * The pair true/true is invalid.
 */
export interface MatrixDynamicComboStarterContext {
    isPunishCounter: boolean;
    isCounterHit: boolean;
}

/**
 * V1 dynamic combo definition for scenario matrix cells.
 * It stores combo lookup inputs (not a fixed damage value).
 */
export interface MatrixDynamicComboPayload {
    attackerCharacterId: string;
    starterMoveIds: string[];
    starterContext: MatrixDynamicComboStarterContext;
}

export type MatrixCellType = "value" | "reference" | "computed" | "dynamic_combo" | "summary";
export type MatrixCellDataType = "number" | "text" | "empty";

export interface MatrixCellPayload {
    cellType: MatrixCellType;
    dataType: MatrixCellDataType;
    value: number | string | null;
    dynamicCombo?: MatrixDynamicComboPayload;
    metadata?: Record<string, unknown>;
    extensions?: Record<string, unknown>;
}

export interface MatrixAxesPayload {
    rows: string[];
    columns: string[];
    rowLayers?: number[];
    columnLayers?: number[];
}

export interface MatrixSummaryPayload {
    rowAxis: MatrixCellPayload[];
    columnAxis: MatrixCellPayload[];
    expectedValue: MatrixCellPayload;
}

export interface MatrixMetadataPayload {
    matrixId: string;
    title?: string | null;
    notes?: string | null;
    source?: "editor" | "import" | "unknown";
    createdAt?: string;
    updatedAt?: string;
}

export interface MatrixPayload {
    kind: typeof MATRIX_PAYLOAD_KIND;
    schemaVersion: typeof MATRIX_PAYLOAD_SCHEMA_VERSION;
    axes: MatrixAxesPayload;
    cells: MatrixCellPayload[][];
    summary: MatrixSummaryPayload;
    metadata: MatrixMetadataPayload;
    extensions?: Record<string, unknown>;
}

export interface MatrixSerializationInput {
    rows: string[];
    columns: string[];
    rowLayers?: Array<number | string | null | undefined>;
    columnLayers?: Array<number | string | null | undefined>;
    values: Array<Array<number | string | null | undefined>>;
    bodyCellTypes?: Array<Array<"value" | "reference" | "computed" | "dynamic_combo" | undefined>>;
    bodyCellMetadata?: Array<Array<Record<string, unknown> | undefined>>;
    bodyCellDynamicCombos?: Array<Array<MatrixDynamicComboPayload | undefined>>;
    rowFrequencies?: Array<number | string | null | undefined>;
    columnFrequencies?: Array<number | string | null | undefined>;
    expectedValue?: number | string | null;
    metadata?: Partial<MatrixMetadataPayload>;
    extensions?: Record<string, unknown>;
}

export interface MatrixEditorState {
    rows: string[];
    columns: string[];
    values: number[][];
    rowFrequencies: Array<number | string>;
    columnFrequencies: Array<number | string>;
    expectedValue: number;
}

export interface MatrixDeserializationResult {
    payload: MatrixPayload;
    issues: string[];
    isValid: boolean;
}
