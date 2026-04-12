import {MatrixSelectionTarget} from "@/src/features/matrix/model";

export interface ActiveAxisContext {
    activeRowId: string | null;
    activeColumnId: string | null;
}

export function deriveActiveAxisContext(target: MatrixSelectionTarget | null): ActiveAxisContext {
    if (!target) {
        return {activeRowId: null, activeColumnId: null};
    }

    if (target.zone === "body") {
        return {
            activeRowId: target.rowId,
            activeColumnId: target.columnId,
        };
    }

    if (target.zone === "rowSummary") {
        return {
            activeRowId: target.rowId,
            activeColumnId: null,
        };
    }

    if (target.zone === "columnSummary") {
        return {
            activeRowId: null,
            activeColumnId: target.columnId,
        };
    }

    return {activeRowId: null, activeColumnId: null};
}
