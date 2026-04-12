import {MatrixDensityMode} from "@/src/features/matrix/model";

export interface MatrixDensityProfile {
    rowLabelWidth: number;
    columnLabelWidth: number;
    valueCellWidth: number;
    cellHeight: number;
    cellPadding: number;
    labelFontSize: number;
    valueFontSize: number;
    chromePadding: number;
    toolbarGap: number;
}

const STANDARD_PROFILE: MatrixDensityProfile = {
    rowLabelWidth: 126,
    columnLabelWidth: 126,
    valueCellWidth: 86,
    cellHeight: 30,
    cellPadding: 4,
    labelFontSize: 12,
    valueFontSize: 12,
    chromePadding: 10,
    toolbarGap: 8,
};

const COMPACT_PROFILE: MatrixDensityProfile = {
    rowLabelWidth: 108,
    columnLabelWidth: 108,
    valueCellWidth: 74,
    cellHeight: 26,
    cellPadding: 3,
    labelFontSize: 11,
    valueFontSize: 11,
    chromePadding: 8,
    toolbarGap: 6,
};

export function resolveDensityProfile(mode: MatrixDensityMode, rowCount: number, columnCount: number): MatrixDensityProfile {
    const base = mode === "compact" ? COMPACT_PROFILE : STANDARD_PROFILE;
    const largestAxis = Math.max(rowCount, columnCount);

    if (largestAxis < 9) {
        return base;
    }

    return {
        ...base,
        rowLabelWidth: Math.max(96, base.rowLabelWidth - 8),
        columnLabelWidth: Math.max(96, base.columnLabelWidth - 8),
        valueCellWidth: Math.max(68, base.valueCellWidth - 6),
        cellHeight: Math.max(24, base.cellHeight - 2),
        chromePadding: Math.max(6, base.chromePadding - 1),
    };
}
