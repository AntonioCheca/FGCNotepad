import {createBodyCellKey, createColumnSummaryKey, createExpectedValueKey, createRowSummaryKey} from "../model/keys";
import {CreateMatrixStateOptions, MatrixAxisItem, MatrixEditorState} from "../model/stateTypes";

const DEFAULT_ROW_COUNT = 2;
const DEFAULT_COLUMN_COUNT = 2;

function createAxis(prefix: "row" | "column", count: number): MatrixAxisItem[] {
    return Array.from({length: Math.max(1, count)}, (_, index) => ({
        id: `${prefix}_${index + 1}`,
        label: `${prefix === "row" ? "Row" : "Column"} ${index + 1}`,
    }));
}

function createMatrixId(): string {
    return `matrix_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createInitialMatrixEditorState(options: CreateMatrixStateOptions = {}): MatrixEditorState {
    const rows = createAxis("row", options.rowCount ?? DEFAULT_ROW_COUNT);
    const columns = createAxis("column", options.columnCount ?? DEFAULT_COLUMN_COUNT);
    const defaultCellValue = options.defaultCellValue ?? null;

    const bodyCells = Object.fromEntries(
        rows.flatMap((row) =>
            columns.map((column) => {
                const key = createBodyCellKey(row.id, column.id);
                return [
                    key,
                    {
                        key,
                        rowId: row.id,
                        columnId: column.id,
                        kind: "value" as const,
                        value: defaultCellValue,
                        reference: null,
                    },
                ];
            })
        )
    );

    const rowSummaryCells = Object.fromEntries(
        rows.map((row) => {
            const key = createRowSummaryKey(row.id);
            return [key, {key, value: null}];
        })
    );

    const columnSummaryCells = Object.fromEntries(
        columns.map((column) => {
            const key = createColumnSummaryKey(column.id);
            return [key, {key, value: null}];
        })
    );

    return {
        grid: {
            rows,
            columns,
            bodyCells,
            rowSummaryCells,
            columnSummaryCells,
            expectedValueCell: {
                key: createExpectedValueKey(),
                value: null,
            },
            metadata: {
                matrixId: options.matrixId ?? createMatrixId(),
                title: options.title ?? null,
            },
        },
        selection: {
            activeTarget: null,
            anchorTarget: null,
            selectedKeys: [],
        },
        editing: {
            mode: "view",
            activeKey: null,
            draft: null,
        },
        validation: {
            byKey: {},
            globalIssues: [],
        },
        derived: {
            computedExpectedValue: null,
            rowComputed: {},
            columnComputed: {},
            isDirty: false,
            lastComputedAt: null,
        },
        viewport: {
            scrollTop: 0,
            scrollLeft: 0,
            density: "standard",
            showValidation: true,
            focusedRegion: "none",
        },
    };
}
