import {
    MATRIX_PAYLOAD_KIND,
    MATRIX_PAYLOAD_SCHEMA_VERSION,
    MatrixCellPayload,
    MatrixDynamicComboPayload,
    MatrixMetadataPayload,
    MatrixPayload,
    MatrixResourceRequirementPayload,
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

function normalizeLayerValue(value: unknown): number {
    if (typeof value === "number" && Number.isFinite(value)) {
        return Math.trunc(value);
    }

    if (typeof value === "string") {
        const parsed = Number(value.trim());
        if (Number.isFinite(parsed)) {
            return Math.trunc(parsed);
        }
    }

    return 1;
}

function normalizeRequirement(value: unknown): MatrixResourceRequirementPayload | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    const requirement = value as Partial<MatrixResourceRequirementPayload>;
    const resource = requirement.resource === "drive" || requirement.resource === "super" ? requirement.resource : requirement.resource === "health" ? "health" : null;
    const threshold = typeof requirement.threshold === "number" && Number.isFinite(requirement.threshold) ? requirement.threshold : null;
    if (!resource || threshold === null || threshold < 0) {
        return null;
    }

    return {
        owner: requirement.owner === "defender" ? "defender" : "attacker",
        resource,
        operator: ">=",
        threshold: resource === "drive" ? threshold : Math.trunc(threshold),
    };
}

function normalizeRequirements(
    source: Array<Array<MatrixResourceRequirementPayload | null | undefined> | null | undefined> | undefined,
    count: number
): MatrixResourceRequirementPayload[][] {
    return Array.from({length: count}, (_, index) => {
        const requirements = source?.[index];
        if (!Array.isArray(requirements)) {
            return [];
        }

        return requirements.map(normalizeRequirement).filter((requirement): requirement is MatrixResourceRequirementPayload => requirement !== null);
    });
}

function toCellPayload(
    value: number | string | null | undefined,
    cellType: MatrixCellPayload["cellType"],
    dynamicCombo?: MatrixDynamicComboPayload,
    metadata?: Record<string, unknown>
): MatrixCellPayload {
    if (cellType === "dynamic_combo") {
        const numericValue = typeof value === "number" && Number.isFinite(value) ? value : null;

        return {
            cellType,
            dataType: numericValue === null ? "empty" : "number",
            value: numericValue,
            dynamicCombo,
            metadata,
        };
    }

    if (typeof value === "number" && Number.isFinite(value)) {
        return {
            cellType,
            dataType: "number",
            value,
            metadata,
        };
    }

    if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed === "") {
            return {
                cellType,
                dataType: "empty",
                value: null,
                metadata,
            };
        }

        const numeric = Number(trimmed);
        if (Number.isFinite(numeric)) {
            return {
                cellType,
                dataType: "number",
                value: numeric,
                metadata,
            };
        }

        return {
            cellType,
            dataType: "text",
            value: trimmed,
            metadata,
        };
    }

    return {
        cellType,
        dataType: "empty",
        value: null,
        metadata,
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
    rowLayers: number[];
    columnLayers: number[];
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
    const rowLayers = Array.from({length: rowCount}, (_, index) => normalizeLayerValue(input.rowLayers?.[index]));
    const columnLayers = Array.from({length: columnCount}, (_, index) => normalizeLayerValue(input.columnLayers?.[index]));

    const values = Array.from({length: rowCount}, (_, rowIndex) => {
        const sourceRow = input.values[rowIndex] ?? [];
        return Array.from({length: columnCount}, (_, columnIndex) => sourceRow[columnIndex] ?? null);
    });

    return {rows, columns, rowLayers, columnLayers, values};
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

    const cells = normalized.values.map((row, rowIndex) =>
        row.map((value, columnIndex) => {
            const requestedCellType = input.bodyCellTypes?.[rowIndex]?.[columnIndex];
            const safeCellType =
                requestedCellType === "reference" ||
                requestedCellType === "computed" ||
                requestedCellType === "dynamic_combo"
                    ? requestedCellType
                    : "value";
            return toCellPayload(
                value,
                safeCellType,
                input.bodyCellDynamicCombos?.[rowIndex]?.[columnIndex],
                input.bodyCellMetadata?.[rowIndex]?.[columnIndex]
            );
        })
    );

    const rowAxis = normalized.rows.map((_, index) =>
        toCellPayload(input.rowFrequencies?.[index], "summary")
    );

    const columnAxis = normalized.columns.map((_, index) =>
        toCellPayload(input.columnFrequencies?.[index], "summary")
    );
    const rowRequirements = normalizeRequirements(input.rowRequirements, normalized.rows.length);
    const columnRequirements = normalizeRequirements(input.columnRequirements, normalized.columns.length);

    return {
        kind: MATRIX_PAYLOAD_KIND,
        schemaVersion: MATRIX_PAYLOAD_SCHEMA_VERSION,
        axes: {
            rows: normalized.rows,
            columns: normalized.columns,
            rowLayers: normalized.rowLayers,
            columnLayers: normalized.columnLayers,
            rowRequirements,
            columnRequirements,
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
