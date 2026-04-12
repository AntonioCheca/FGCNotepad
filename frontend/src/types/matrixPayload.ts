export const MATRIX_PAYLOAD_KIND = "matrix-editor" as const;
export const MATRIX_PAYLOAD_SCHEMA_VERSION = 1 as const;

export type MatrixCellType = "value" | "reference" | "computed" | "summary";
export type MatrixCellDataType = "number" | "text" | "empty";

export interface MatrixCellPayload {
    cellType: MatrixCellType;
    dataType: MatrixCellDataType;
    value: number | string | null;
    metadata?: Record<string, unknown>;
    extensions?: Record<string, unknown>;
}

export interface MatrixAxesPayload {
    rows: string[];
    columns: string[];
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
    values: Array<Array<number | string | null | undefined>>;
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
