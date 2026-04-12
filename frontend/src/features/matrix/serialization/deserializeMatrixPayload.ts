import {
    MATRIX_PAYLOAD_KIND,
    MATRIX_PAYLOAD_SCHEMA_VERSION,
    MatrixCellPayload,
    MatrixDeserializationResult,
    MatrixEditorState,
    MatrixPayload,
} from "@/src/types/matrixPayload";
import {createDefaultMatrixPayload, serializeMatrixPayload} from "@/src/features/matrix/serialization/serializeMatrixPayload";

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asNumberOrFallback(value: unknown, fallback: number): number {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === "string") {
        const parsed = Number(value.trim());
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }

    return fallback;
}

function coerceCell(cell: unknown, issues: string[], context: string): MatrixCellPayload {
    if (!isRecord(cell)) {
        issues.push(`${context}: cell is not an object; defaulted to empty.`);
        return {cellType: "value", dataType: "empty", value: null};
    }

    const cellType = cell.cellType;
    const dataType = cell.dataType;
    const value = cell.value;

    const safeCellType =
        cellType === "value" || cellType === "reference" || cellType === "computed" || cellType === "summary"
            ? cellType
            : "value";

    const safeDataType = dataType === "number" || dataType === "text" || dataType === "empty" ? dataType : "empty";

    if (safeDataType === "number") {
        return {
            cellType: safeCellType,
            dataType: "number",
            value: asNumberOrFallback(value, 0),
            metadata: isRecord(cell.metadata) ? cell.metadata : undefined,
            extensions: isRecord(cell.extensions) ? cell.extensions : undefined,
        };
    }

    if (safeDataType === "text") {
        return {
            cellType: safeCellType,
            dataType: "text",
            value: typeof value === "string" ? value : "",
            metadata: isRecord(cell.metadata) ? cell.metadata : undefined,
            extensions: isRecord(cell.extensions) ? cell.extensions : undefined,
        };
    }

    return {
        cellType: safeCellType,
        dataType: "empty",
        value: null,
        metadata: isRecord(cell.metadata) ? cell.metadata : undefined,
        extensions: isRecord(cell.extensions) ? cell.extensions : undefined,
    };
}

export function deserializeMatrixPayload(raw: unknown): MatrixDeserializationResult {
    const issues: string[] = [];

    if (!isRecord(raw)) {
        issues.push("Payload is not an object; fallback matrix created.");
        return {
            payload: createDefaultMatrixPayload(),
            issues,
            isValid: false,
        };
    }

    if (raw.kind !== MATRIX_PAYLOAD_KIND) {
        issues.push("Unsupported matrix kind; fallback matrix created.");
        return {
            payload: createDefaultMatrixPayload(),
            issues,
            isValid: false,
        };
    }

    if (raw.schemaVersion !== MATRIX_PAYLOAD_SCHEMA_VERSION) {
        issues.push(`Unsupported schemaVersion: ${String(raw.schemaVersion)}; fallback matrix created.`);
        return {
            payload: createDefaultMatrixPayload(),
            issues,
            isValid: false,
        };
    }

    const axes = isRecord(raw.axes) ? raw.axes : {};
    const rows = Array.isArray(axes.rows) ? axes.rows : [];
    const columns = Array.isArray(axes.columns) ? axes.columns : [];

    if (rows.length === 0 || columns.length === 0) {
        issues.push("Axes are missing or empty; fallback matrix created.");
        return {
            payload: createDefaultMatrixPayload(),
            issues,
            isValid: false,
        };
    }

    const normalizedRows = rows.map((value, index) => (typeof value === "string" && value.trim() !== "" ? value : `Row ${index + 1}`));
    const normalizedColumns = columns.map((value, index) =>
        typeof value === "string" && value.trim() !== "" ? value : `Column ${index + 1}`
    );

    const rawCells = Array.isArray(raw.cells) ? raw.cells : [];
    const normalizedValues = normalizedRows.map((_, rowIndex) => {
        const rawRow = Array.isArray(rawCells[rowIndex]) ? rawCells[rowIndex] : [];
        return normalizedColumns.map((_, columnIndex) => {
            const cell = coerceCell(rawRow[columnIndex], issues, `cells[${rowIndex}][${columnIndex}]`);
            if (cell.dataType === "number") {
                return asNumberOrFallback(cell.value, 0);
            }
            return cell.value;
        });
    });

    const summary = isRecord(raw.summary) ? raw.summary : {};
    const rawRowAxis = Array.isArray(summary.rowAxis) ? summary.rowAxis : [];
    const rawColumnAxis = Array.isArray(summary.columnAxis) ? summary.columnAxis : [];

    const rowFrequencies = normalizedRows.map((_, index) => coerceCell(rawRowAxis[index], issues, `summary.rowAxis[${index}]`).value);
    const columnFrequencies = normalizedColumns.map((_, index) =>
        coerceCell(rawColumnAxis[index], issues, `summary.columnAxis[${index}]`).value
    );
    const expectedValue = coerceCell(summary.expectedValue, issues, "summary.expectedValue").value;

    const metadata = isRecord(raw.metadata) ? raw.metadata : {};

    const payload = serializeMatrixPayload({
        rows: normalizedRows,
        columns: normalizedColumns,
        values: normalizedValues,
        rowFrequencies,
        columnFrequencies,
        expectedValue,
        metadata: {
            matrixId: typeof metadata.matrixId === "string" ? metadata.matrixId : undefined,
            title: typeof metadata.title === "string" ? metadata.title : null,
            notes: typeof metadata.notes === "string" ? metadata.notes : null,
            source: metadata.source === "editor" || metadata.source === "import" || metadata.source === "unknown" ? metadata.source : "unknown",
            createdAt: typeof metadata.createdAt === "string" ? metadata.createdAt : undefined,
        },
        extensions: isRecord(raw.extensions) ? raw.extensions : undefined,
    });

    return {
        payload,
        issues,
        isValid: issues.length === 0,
    };
}

export function toEditorState(payload: MatrixPayload): MatrixEditorState {
    const rows = payload.axes.rows;
    const columns = payload.axes.columns;

    const values = rows.map((_, rowIndex) => {
        const row = payload.cells[rowIndex] ?? [];
        return columns.map((_, columnIndex) => {
            const cell = row[columnIndex];
            return asNumberOrFallback(cell?.value, 0);
        });
    });

    const rowFrequencies = rows.map((_, index) => {
        const cell = payload.summary.rowAxis[index];
        if (cell?.dataType === "empty") {
            return "";
        }
        if (typeof cell?.value === "string") {
            return cell.value;
        }
        return asNumberOrFallback(cell?.value, 0);
    });

    const columnFrequencies = columns.map((_, index) => {
        const cell = payload.summary.columnAxis[index];
        if (cell?.dataType === "empty") {
            return "";
        }
        if (typeof cell?.value === "string") {
            return cell.value;
        }
        return asNumberOrFallback(cell?.value, 0);
    });

    return {
        rows,
        columns,
        values,
        rowFrequencies,
        columnFrequencies,
        expectedValue: asNumberOrFallback(payload.summary.expectedValue.value, 0),
    };
}
