import {MatrixCellPayload, MatrixPayload} from "@/src/types/matrixPayload";
import {serializeMatrixPayload} from "@/src/features/matrix/serialization/serializeMatrixPayload";

export interface AggregatedDefenseColumn {
    key: string;
    label: string;
}

export const AGGREGATED_DEFENSE_COLUMNS: AggregatedDefenseColumn[] = [
    {key: "block", label: "Block"},
    {key: "mash_4f", label: "Mash 4f"},
    {key: "invincible_reversal_fast", label: "Invincible Reversal Fast"},
    {key: "invincible_reversal_slow", label: "Invincible Reversal Slow"},
    {key: "invincible_super", label: "Invincible Super"},
    {key: "backdash", label: "Backdash"},
    {key: "delay_tech", label: "Delay Tech"},
    {key: "perfect_parry", label: "Perfect Parry"},
    {key: "no_invincible_option", label: "No Invincible Option"},
];

export function aggregatedDefenseLabels(): string[] {
    return AGGREGATED_DEFENSE_COLUMNS.map((entry) => entry.label);
}

function emptyCell(): MatrixCellPayload {
    return {cellType: "value", dataType: "empty", value: null};
}

export function enforceAggregatedDefenseColumns(matrix: MatrixPayload): MatrixPayload {
    const targetLabels = aggregatedDefenseLabels();
    const sourceColumns = Array.isArray(matrix.axes.columns) ? matrix.axes.columns : [];
    const sourceColumnIndex = new Map<string, number>();
    sourceColumns.forEach((label, index) => {
        sourceColumnIndex.set(label, index);
    });

    const rows = Array.isArray(matrix.axes.rows) && matrix.axes.rows.length > 0 ? matrix.axes.rows : ["Row 1"];
    const rowLayers = rows.map((_, index) => {
        const value = matrix.axes.rowLayers?.[index];
        return typeof value === "number" && Number.isFinite(value) ? Math.max(1, Math.trunc(value)) : 1;
    });

    const values = rows.map((_, rowIndex) =>
        targetLabels.map((label) => {
            const sourceIndex = sourceColumnIndex.get(label);
            const cell = typeof sourceIndex === "number" ? matrix.cells[rowIndex]?.[sourceIndex] : undefined;
            return typeof cell?.value === "number" && Number.isFinite(cell.value) ? cell.value : null;
        })
    );

    const bodyCellTypes = rows.map((_, rowIndex) =>
        targetLabels.map((label) => {
            const sourceIndex = sourceColumnIndex.get(label);
            const cell = typeof sourceIndex === "number" ? matrix.cells[rowIndex]?.[sourceIndex] : undefined;
            return cell?.cellType === "reference" || cell?.cellType === "computed" || cell?.cellType === "dynamic_combo"
                ? cell.cellType
                : "value";
        })
    );

    const bodyCellMetadata = rows.map((_, rowIndex) =>
        targetLabels.map((label) => {
            const sourceIndex = sourceColumnIndex.get(label);
            const cell = typeof sourceIndex === "number" ? matrix.cells[rowIndex]?.[sourceIndex] : undefined;
            return cell?.metadata;
        })
    );

    const bodyCellDynamicCombos = rows.map((_, rowIndex) =>
        targetLabels.map((label) => {
            const sourceIndex = sourceColumnIndex.get(label);
            const cell = typeof sourceIndex === "number" ? matrix.cells[rowIndex]?.[sourceIndex] : undefined;
            return cell?.dynamicCombo;
        })
    );

    const rowFrequencies = rows.map((_, rowIndex) => matrix.summary.rowAxis?.[rowIndex]?.value ?? null);
    const columnFrequencies = targetLabels.map((label) => {
        const sourceIndex = sourceColumnIndex.get(label);
        return typeof sourceIndex === "number" ? matrix.summary.columnAxis?.[sourceIndex]?.value ?? null : null;
    });

    const normalized = serializeMatrixPayload({
        rows,
        columns: targetLabels,
        rowLayers,
        columnLayers: targetLabels.map(() => 1),
        values,
        bodyCellTypes,
        bodyCellMetadata,
        bodyCellDynamicCombos,
        rowFrequencies,
        columnFrequencies,
        expectedValue: matrix.summary.expectedValue?.value ?? null,
        metadata: matrix.metadata,
        extensions: matrix.extensions,
    });

    if (!Array.isArray(normalized.cells) || normalized.cells.length === 0) {
        return {
            ...normalized,
            cells: rows.map(() => targetLabels.map(() => emptyCell())),
        };
    }

    return normalized;
}
