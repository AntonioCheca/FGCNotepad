import type {MatrixSelectionTarget} from "@/src/features/matrix/model";
import type {MatrixGridStructureSelection, RequirementEditorTarget} from "./matrixGridTypes";

export function resolveStructureSelection(activeTarget: MatrixSelectionTarget | null, requirementTarget: RequirementEditorTarget | null): MatrixGridStructureSelection {
    if (requirementTarget) {
        return {
            axis: requirementTarget.axis === "rows" ? "row" : "column",
            id: requirementTarget.axisId,
        };
    }

    if (activeTarget?.zone === "rowSummary") {
        return {axis: "row", id: activeTarget.rowId};
    }

    if (activeTarget?.zone === "columnSummary") {
        return {axis: "column", id: activeTarget.columnId};
    }

    return null;
}

export function getSelectedStructureIds(structureSelection: MatrixGridStructureSelection) {
    return {
        selectedColumnHeaderId: structureSelection?.axis === "column" ? structureSelection.id : null,
        selectedRowHeaderId: structureSelection?.axis === "row" ? structureSelection.id : null,
    };
}
