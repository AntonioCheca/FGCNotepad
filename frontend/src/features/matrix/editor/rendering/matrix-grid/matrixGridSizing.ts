import {MatrixEditorState, MatrixLinkedCellResolution} from "@/src/features/matrix/model";
import {formatLinkedBreakdown} from "../cellValueFormat";
import type {MatrixDensityProfile} from "../gridDensity";

// Widths grow with their text up to these caps; longer text wraps instead of clipping.
const ROW_LABEL_MAX_WIDTH = 220;
const COLUMN_MAX_WIDTH = 200;
// Label field: 6px side padding plus a 1px border on each side.
const LABEL_FIELD_CHROME = 14;
// Dynamic chip: 6px side padding and a 1px border; the value button adds 6px padding and a 1px border.
const CHIP_CHROME = 14;
const VALUE_BUTTON_CHROME = 14;
const CELL_DETAIL_FONT_SIZE = 12;
const NARROW_CHARACTERS = new Set("ilIjtf.,:;|!'()[]/ ");
const WIDE_CHARACTERS = new Set("mwMW@%");

export interface MatrixGridSizing {
    rowLabelWidth: number;
    columnWidthById: Record<string, number>;
    // Shared by every body cell, so one-line cells match the two-line combo and linked cells.
    bodyCellMinHeight: number;
}

/**
 * A deliberately generous estimate of rendered text width, so server and client render the same width
 * and the text still fits in proportional sans-serif fonts.
 */
export function estimateTextWidth(text: string, fontSize: number): number {
    let ems = 0;
    for (const character of text) {
        if (NARROW_CHARACTERS.has(character)) {
            ems += 0.34;
        } else if (WIDE_CHARACTERS.has(character)) {
            ems += 0.9;
        } else if (character >= "A" && character <= "Z") {
            ems += 0.7;
        } else {
            ems += 0.6;
        }
    }

    return Math.ceil(ems * fontSize);
}

export function estimateLabelLines(text: string, fontSize: number, width: number): number {
    const available = Math.max(1, width - LABEL_FIELD_CHROME);
    return Math.max(1, Math.ceil(estimateTextWidth(text, fontSize) / available));
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

export function buildMatrixGridSizing(
    state: MatrixEditorState,
    profile: MatrixDensityProfile,
    moveLabelById: Record<string, string>,
    linkedResolutionsByKey: Record<string, MatrixLinkedCellResolution> = {}
): MatrixGridSizing {
    const labelWidth = (text: string) => estimateTextWidth(text, profile.labelFontSize) + LABEL_FIELD_CHROME;
    const chipFontSize = Math.max(12, profile.valueFontSize);
    const rowLabelMin = profile.rowLabelWidth;
    const columnMin = profile.columnLabelWidth;

    const rowLabelWidth = clamp(Math.max(rowLabelMin, ...state.grid.rows.map((row) => labelWidth(row.label))), rowLabelMin, ROW_LABEL_MAX_WIDTH);

    // Every column takes the widest column's width so the grid reads as a uniform table.
    let columnWidth = columnMin;
    let hasTwoLineCells = false;
    state.grid.columns.forEach((column) => {
        let width = labelWidth(column.label);
        state.grid.rows.forEach((row) => {
            const key = `body::${row.id}::${column.id}`;
            const cell = state.grid.bodyCells[key];
            const linkedResolution = linkedResolutionsByKey[key];
            hasTwoLineCells ||= cell?.kind === "dynamic_combo" || cell?.kind === "reference";
            if (linkedResolution) {
                width = Math.max(width, estimateTextWidth(formatLinkedBreakdown(linkedResolution), CELL_DETAIL_FONT_SIZE) + VALUE_BUTTON_CHROME);
            }
            cell?.dynamicCombo?.starterMoveIds.forEach((moveId) => {
                const label = moveLabelById[moveId] ?? `Move #${moveId}`;
                width = Math.max(width, estimateTextWidth(label, chipFontSize) + CHIP_CHROME + VALUE_BUTTON_CHROME);
            });
        });
        columnWidth = Math.max(columnWidth, clamp(width, columnMin, COLUMN_MAX_WIDTH));
    });

    const columnWidthById = Object.fromEntries(state.grid.columns.map((column) => [column.id, columnWidth]));
    // Total line, a 3px gap, then a chip or detail line, plus the button's padding and active border.
    const twoLineHeight = Math.ceil((profile.valueFontSize + 1) * 1.25) + 3 + Math.ceil(chipFontSize * 1.3) + 4 + 12;

    return {rowLabelWidth, columnWidthById, bodyCellMinHeight: hasTwoLineCells ? twoLineHeight : profile.cellHeight};
}
