import {
    MATRIX_PAYLOAD_KIND,
    MATRIX_PAYLOAD_SCHEMA_VERSION,
    MatrixCellPayload,
    MatrixMetadataPayload,
    MatrixPayload,
    MatrixSerializationInput,
} from "@/src/types/matrixPayload";

const DEFAULT_MATRIX_SIZE = 2;

function createMatrixId(): string {
    return `matrix_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeAxisLabel(value: unknown, fallback: string): string {
    if (typeof value !== "string") {
        return fallback;
    }

    const trimmed = value.trim();
    return trimmed === "" ? fallback : trimmed;
}

function toCellPayload(value: number | string | null | undefined, cellType: MatrixCellPayload["cellType"]): MatrixCellPayload {
    if (typeof value === "number" && Number.isFinite(value)) {
        return {
            cellType,
            dataType: "number",
            value,
        };
    }

    if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed === "") {
            return {
                cellType,
                dataType: "empty",
                value: null,
            };
        }

        const numeric = Number(trimmed);
        if (Number.isFinite(numeric)) {
            return {
                cellType,
                dataType: "number",
                value: numeric,
            };
        }

        return {
            cellType,
            dataType: "text",
            value: trimmed,
        };
    }

    return {
        cellType,
        dataType: "empty",
        value: null,
    };
}

function sanitizeMetadata(metadata?: Partial<MatrixMetadataPayload>): MatrixMetadataPayload {
    return {
        matrixId: typeof metadata?.matrixId === "string" && metadata.matrixId !== "" ? metadata.matrixId : createMatrixId(),
        title: typeof metadata?.title === "string" ? metadata.title : null,
        notes: typeof metadata?.notes === "string" ? metadata.notes : null,
        source: metadata?.source ?? "editor",
        createdAt: metadata?.createdAt,
        updatedAt: new Date().toISOString(),
    };
}

function normalizeMatrixShape(input: MatrixSerializationInput): {
    rows: string[];
    columns: string[];
    values: Array<Array<number | string | null | undefined>>;
} {
    const rowCount = Math.max(input.rows.length, 1);
    const columnCount = Math.max(input.columns.length, 1);

    const rows = Array.from({length: rowCount}, (_, index) =>
        normalizeAxisLabel(input.rows[index], `Row ${index + 1}`)
    );
    const columns = Array.from({length: columnCount}, (_, index) =>
        normalizeAxisLabel(input.columns[index], `Column ${index + 1}`)
    );

    const values = Array.from({length: rowCount}, (_, rowIndex) => {
        const sourceRow = input.values[rowIndex] ?? [];
        return Array.from({length: columnCount}, (_, columnIndex) => sourceRow[columnIndex] ?? null);
    });

    return {rows, columns, values};
}

export function createDefaultMatrixPayload(): MatrixPayload {
    return serializeMatrixPayload({
        rows: Array.from({length: DEFAULT_MATRIX_SIZE}, (_, i) => `Row ${i + 1}`),
        columns: Array.from({length: DEFAULT_MATRIX_SIZE}, (_, i) => `Column ${i + 1}`),
        values: Array.from({length: DEFAULT_MATRIX_SIZE}, () => Array.from({length: DEFAULT_MATRIX_SIZE}, () => 0)),
        rowFrequencies: Array.from({length: DEFAULT_MATRIX_SIZE}, () => 0.5),
        columnFrequencies: Array.from({length: DEFAULT_MATRIX_SIZE}, () => 0.5),
        expectedValue: 0,
    });
}

export function serializeMatrixPayload(input: MatrixSerializationInput): MatrixPayload {
    const normalized = normalizeMatrixShape(input);

    const cells = normalized.values.map((row) => row.map((value) => toCellPayload(value, "value")));

    const rowAxis = normalized.rows.map((_, index) =>
        toCellPayload(input.rowFrequencies?.[index], "summary")
    );

    const columnAxis = normalized.columns.map((_, index) =>
        toCellPayload(input.columnFrequencies?.[index], "summary")
    );

    return {
        kind: MATRIX_PAYLOAD_KIND,
        schemaVersion: MATRIX_PAYLOAD_SCHEMA_VERSION,
        axes: {
            rows: normalized.rows,
            columns: normalized.columns,
        },
        cells,
        summary: {
            rowAxis,
            columnAxis,
            expectedValue: toCellPayload(input.expectedValue, "summary"),
        },
        metadata: sanitizeMetadata(input.metadata),
        extensions: input.extensions,
    };
}
