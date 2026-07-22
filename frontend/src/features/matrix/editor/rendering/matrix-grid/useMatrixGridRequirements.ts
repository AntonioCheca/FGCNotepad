import React from "react";

import type {MatrixEditorState, MatrixSelectionTarget} from "@/src/features/matrix/model";
import {getSelectedStructureIds, resolveStructureSelection} from "./matrixGridSelection";
import type {RequirementEditorTarget} from "./matrixGridTypes";

interface UseMatrixGridRequirementsProps {
    state: MatrixEditorState;
    activeTarget: MatrixSelectionTarget | null;
    canEditRowAxisLabels: boolean;
    canEditColumnAxisLabels: boolean;
    onSelectRowHeader: (rowId: string) => void;
    onSelectColumnHeader: (columnId: string) => void;
}

export function useMatrixGridRequirements({
    state,
    activeTarget,
    canEditRowAxisLabels,
    canEditColumnAxisLabels,
    onSelectRowHeader,
    onSelectColumnHeader,
}: UseMatrixGridRequirementsProps) {
    const [requirementTarget, setRequirementTarget] = React.useState<RequirementEditorTarget | null>(null);

    const structureSelection = React.useMemo(
        () => resolveStructureSelection(activeTarget, requirementTarget),
        [activeTarget, requirementTarget]
    );
    const {selectedColumnHeaderId, selectedRowHeaderId} = React.useMemo(
        () => getSelectedStructureIds(structureSelection),
        [structureSelection]
    );
    const activeRequirementAxis = requirementTarget
        ? state.grid[requirementTarget.axis].find((axis) => axis.id === requirementTarget.axisId) ?? null
        : null;
    const canEditActiveRequirementAxis = requirementTarget?.axis === "rows" ? canEditRowAxisLabels : canEditColumnAxisLabels;

    const openRowRequirements = React.useCallback((rowId: string, anchor: HTMLElement) => {
        onSelectRowHeader(rowId);
        setRequirementTarget({axis: "rows", axisId: rowId, anchorRect: anchor.getBoundingClientRect()});
    }, [onSelectRowHeader]);

    const openColumnRequirements = React.useCallback((columnId: string, anchor: HTMLElement) => {
        onSelectColumnHeader(columnId);
        setRequirementTarget({axis: "columns", axisId: columnId, anchorRect: anchor.getBoundingClientRect()});
    }, [onSelectColumnHeader]);

    return {
        requirementTarget,
        selectedColumnHeaderId,
        selectedRowHeaderId,
        activeRequirementAxis,
        canEditActiveRequirementAxis,
        openRowRequirements,
        openColumnRequirements,
        closeRequirements: () => setRequirementTarget(null),
    };
}
