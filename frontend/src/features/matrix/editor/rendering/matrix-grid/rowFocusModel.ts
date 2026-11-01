import {createBodyCellKey, createColumnSummaryKey, createRowSummaryKey} from "../../../model/keys";
import type {MatrixGridDataSlice, MatrixLinkedCellResolution} from "../../../model/stateTypes";
import {formatCellNumber, formatLinkedBreakdown, formatReferenceWeight} from "../cellValueFormat";

export interface RowFocusOutcome {
    columnId: string;
    columnLabel: string;
    columnFrequency: string | null;
    value: number | null;
    display: string;
    breakdown: string | null;
    unavailable: boolean;
}

export interface RowFocusRow {
    id: string;
    label: string;
    frequency: string | null;
    unavailable: boolean;
    outcomes: RowFocusOutcome[];
}

interface RowFocusInput {
    grid: Pick<MatrixGridDataSlice, "rows" | "columns" | "bodyCells" | "rowSummaryCells" | "columnSummaryCells">;
    displayedBodyValues: Record<string, number | null>;
    linkedResolutionsByKey: Record<string, MatrixLinkedCellResolution>;
    unavailableRowIds: Set<string>;
    unavailableColumnIds: Set<string>;
    formatFrequency?: (value: number | null) => string;
}

// Same value rules as the grid cells: display label first, then the solved value, then the stored value.
function unresolvedReferenceShare(cell: RowFocusInput["grid"]["bodyCells"][string] | undefined): string | null {
    const share = cell?.kind === "reference" ? formatReferenceWeight(cell.reference?.weight) : null;
    return share ? `Linked · ${share}` : null;
}

export function buildRowFocusRows({grid, displayedBodyValues, linkedResolutionsByKey, unavailableRowIds, unavailableColumnIds, formatFrequency}: RowFocusInput): RowFocusRow[] {
    const frequency = (value: number | null | undefined): string | null => (value === null || value === undefined ? null : formatFrequency ? formatFrequency(value) : String(value));

    return grid.rows.map((row) => ({
        id: row.id,
        label: row.label || row.id,
        frequency: frequency(grid.rowSummaryCells[createRowSummaryKey(row.id)]?.value),
        unavailable: unavailableRowIds.has(row.id),
        outcomes: grid.columns.map((column) => {
            const key = createBodyCellKey(row.id, column.id);
            const value = displayedBodyValues[key] ?? grid.bodyCells[key]?.value ?? null;
            return {
                columnId: column.id,
                columnLabel: column.label || column.id,
                columnFrequency: frequency(grid.columnSummaryCells[createColumnSummaryKey(column.id)]?.value),
                value,
                display: value === null ? "–" : formatCellNumber(value, grid.bodyCells[key]?.kind),
                breakdown: linkedResolutionsByKey[key] ? formatLinkedBreakdown(linkedResolutionsByKey[key]) : unresolvedReferenceShare(grid.bodyCells[key]),
                unavailable: unavailableRowIds.has(row.id) || unavailableColumnIds.has(column.id),
            };
        }),
    }));
}

// Default focus: the row the solution plays most, so the first view is the most relevant one.
export function pickDefaultRowId(rows: RowFocusRow[], rawRowFrequencies: Record<string, number | null>): string | null {
    let best: {id: string; value: number} | null = null;
    for (const row of rows) {
        const value = rawRowFrequencies[row.id];
        if (!row.unavailable && typeof value === "number" && (best === null || value > best.value)) {
            best = {id: row.id, value};
        }
    }
    return best?.id ?? rows.find((row) => !row.unavailable)?.id ?? rows[0]?.id ?? null;
}
