import {MatrixAction, matrixActions} from "@/src/features/matrix/state/actions";
import {createBodyCellKey, isEditableBodyCell, MatrixEditorState, MatrixValidationIssue} from "@/src/features/matrix/model";
import {parseClipboardData} from "./matrixClipboardParser";

export interface MatrixPasteSummary {
    parsedAs: "tsv" | "csv" | "single";
    sourceRows: number;
    sourceColumns: number;
    applied: number;
    clipped: number;
    skippedReadonly: number;
    skippedInvalidValue: number;
    issues: MatrixValidationIssue[];
}

export interface MatrixPasteResult {
    actions: MatrixAction[];
    summary: MatrixPasteSummary;
    handled: boolean;
}

function toNullableNumber(value: string): number | null | "invalid" {
    const trimmed = value.trim();
    if (trimmed === "") {
        return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : "invalid";
}

function createIssue(code: MatrixValidationIssue["code"], message: string): MatrixValidationIssue {
    return {code, message};
}

export function applyMatrixPaste(state: MatrixEditorState, rawText: string): MatrixPasteResult {
    const parsed = parseClipboardData(rawText);
    const active = state.selection.activeTarget;

    const summary: MatrixPasteSummary = {
        parsedAs: parsed.delimiter,
        sourceRows: parsed.rows.length,
        sourceColumns: Math.max(...parsed.rows.map((row) => row.length), 0),
        applied: 0,
        clipped: 0,
        skippedReadonly: 0,
        skippedInvalidValue: 0,
        issues: [],
    };

    if (!active || active.zone !== "body") {
        summary.issues.push(createIssue("unknown", "Select a body cell before pasting."));
        return {
            actions: [matrixActions.setGlobalValidation(summary.issues)],
            summary,
            handled: false,
        };
    }

    const originRowIndex = state.grid.rows.findIndex((row) => row.id === active.rowId);
    const originColumnIndex = state.grid.columns.findIndex((column) => column.id === active.columnId);

    if (originRowIndex < 0 || originColumnIndex < 0) {
        summary.issues.push(createIssue("unknown", "Selected origin cell is invalid."));
        return {
            actions: [matrixActions.setGlobalValidation(summary.issues)],
            summary,
            handled: false,
        };
    }

    const actions: MatrixAction[] = [];

    for (let rowOffset = 0; rowOffset < parsed.rows.length; rowOffset++) {
        const sourceRow = parsed.rows[rowOffset];

        for (let columnOffset = 0; columnOffset < sourceRow.length; columnOffset++) {
            const targetRowIndex = originRowIndex + rowOffset;
            const targetColumnIndex = originColumnIndex + columnOffset;

            if (targetRowIndex >= state.grid.rows.length || targetColumnIndex >= state.grid.columns.length) {
                summary.clipped++;
                continue;
            }

            const targetRow = state.grid.rows[targetRowIndex];
            const targetColumn = state.grid.columns[targetColumnIndex];
            const targetKey = createBodyCellKey(targetRow.id, targetColumn.id);
            const targetCell = state.grid.bodyCells[targetKey];

            if (!isEditableBodyCell(targetCell)) {
                summary.skippedReadonly++;
                actions.push(
                    matrixActions.setValidationForKey(targetKey, [
                        createIssue("readonly_cell", "Skipped read-only or reference cell."),
                    ])
                );
                continue;
            }

            const numeric = toNullableNumber(sourceRow[columnOffset]);
            if (numeric === "invalid") {
                summary.skippedInvalidValue++;
                actions.push(
                    matrixActions.setValidationForKey(targetKey, [
                        createIssue("invalid_number", "Pasted value is not numeric."),
                    ])
                );
                continue;
            }

            summary.applied++;
            actions.push(matrixActions.setCellValue(targetKey, numeric));
            actions.push(matrixActions.setValidationForKey(targetKey, []));
        }
    }

    if (summary.clipped > 0) {
        summary.issues.push(createIssue("unknown", `${summary.clipped} cell(s) were clipped at grid edge.`));
    }

    if (summary.skippedReadonly > 0) {
        summary.issues.push(createIssue("readonly_cell", `${summary.skippedReadonly} read-only/reference target(s) were skipped.`));
    }

    if (summary.skippedInvalidValue > 0) {
        summary.issues.push(createIssue("invalid_number", `${summary.skippedInvalidValue} invalid value(s) were skipped.`));
    }

    if (summary.issues.length === 0) {
        actions.push(matrixActions.setGlobalValidation([]));
    } else {
        actions.push(matrixActions.setGlobalValidation(summary.issues));
    }

    return {
        actions,
        summary,
        handled: true,
    };
}
