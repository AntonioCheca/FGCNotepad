import {MatrixAxisItem, MatrixEditorState, MatrixResourceRequirement} from "@/src/features/matrix/model";

export interface MatrixPlayerResourceState {
    health: number;
    drive: number;
    super: number;
}

export interface MatrixResourceContext {
    attacker: MatrixPlayerResourceState;
    defender: MatrixPlayerResourceState;
}

export interface MatrixResourceGatingResult {
    unavailableRowIds: Set<string>;
    unavailableColumnIds: Set<string>;
    reasonByRowId: Record<string, string>;
    reasonByColumnId: Record<string, string>;
}

function formatRequirement(requirement: MatrixResourceRequirement): string {
    const owner = requirement.owner === "attacker" ? "Attacker" : "Defender";
    const resource = requirement.resource === "health" ? "Health" : requirement.resource === "drive" ? "Drive" : "Super";

    return `${owner} ${resource} >= ${requirement.threshold}`;
}

function getAvailableResource(context: MatrixResourceContext, requirement: MatrixResourceRequirement): number {
    return context[requirement.owner][requirement.resource];
}

function getUnmetRequirements(axis: MatrixAxisItem, context: MatrixResourceContext): MatrixResourceRequirement[] {
    return axis.requirements.filter((requirement) => getAvailableResource(context, requirement) < requirement.threshold);
}

function evaluateAxis(axis: MatrixAxisItem, context: MatrixResourceContext): string | null {
    const unmet = getUnmetRequirements(axis, context);
    if (unmet.length === 0) {
        return null;
    }

    return `Needs ${unmet.map(formatRequirement).join(", ")}`;
}

export function buildMatrixResourceGating(
    state: MatrixEditorState,
    resourceContext?: MatrixResourceContext | null
): MatrixResourceGatingResult {
    const result: MatrixResourceGatingResult = {
        unavailableRowIds: new Set<string>(),
        unavailableColumnIds: new Set<string>(),
        reasonByRowId: {},
        reasonByColumnId: {},
    };

    if (!resourceContext) {
        return result;
    }

    state.grid.rows.forEach((row) => {
        const reason = evaluateAxis(row, resourceContext);
        if (reason) {
            result.unavailableRowIds.add(row.id);
            result.reasonByRowId[row.id] = reason;
        }
    });

    state.grid.columns.forEach((column) => {
        const reason = evaluateAxis(column, resourceContext);
        if (reason) {
            result.unavailableColumnIds.add(column.id);
            result.reasonByColumnId[column.id] = reason;
        }
    });

    return result;
}
