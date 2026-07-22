import {MatrixAxisItem, MatrixResourceRequirement} from "@/src/features/matrix/model";
import {FloatingAxisRequirementEditor} from "../AxisRequirementEditor";
import type {RequirementEditorTarget} from "./matrixGridTypes";

interface MatrixGridRequirementOverlayProps {
    target: RequirementEditorTarget | null;
    activeAxis: MatrixAxisItem | null;
    readOnly: boolean;
    onAddRowRequirement: (rowId: string, requirement: MatrixResourceRequirement) => void;
    onUpdateRowRequirement: (rowId: string, index: number, requirement: MatrixResourceRequirement) => void;
    onRemoveRowRequirement: (rowId: string, index: number) => void;
    onAddColumnRequirement: (columnId: string, requirement: MatrixResourceRequirement) => void;
    onUpdateColumnRequirement: (columnId: string, index: number, requirement: MatrixResourceRequirement) => void;
    onRemoveColumnRequirement: (columnId: string, index: number) => void;
    onClose: () => void;
}

export function MatrixGridRequirementOverlay({
    target,
    activeAxis,
    readOnly,
    onAddRowRequirement,
    onUpdateRowRequirement,
    onRemoveRowRequirement,
    onAddColumnRequirement,
    onUpdateColumnRequirement,
    onRemoveColumnRequirement,
    onClose,
}: MatrixGridRequirementOverlayProps) {
    if (!target || !activeAxis) {
        return null;
    }

    const axisLabel = activeAxis.label || (target.axis === "rows" ? "Row" : "Column");

    return (
        <FloatingAxisRequirementEditor
            axisLabel={axisLabel}
            requirements={activeAxis.requirements}
            readOnly={readOnly}
            anchorRect={target.anchorRect}
            onAdd={(requirement) => {
                if (target.axis === "rows") {
                    onAddRowRequirement(target.axisId, requirement);
                    return;
                }
                onAddColumnRequirement(target.axisId, requirement);
            }}
            onUpdate={(index, requirement) => {
                if (target.axis === "rows") {
                    onUpdateRowRequirement(target.axisId, index, requirement);
                    return;
                }
                onUpdateColumnRequirement(target.axisId, index, requirement);
            }}
            onRemove={(index) => {
                if (target.axis === "rows") {
                    onRemoveRowRequirement(target.axisId, index);
                    return;
                }
                onRemoveColumnRequirement(target.axisId, index);
            }}
            onClose={onClose}
        />
    );
}
