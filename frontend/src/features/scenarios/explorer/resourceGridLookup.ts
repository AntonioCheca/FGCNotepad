import type {ScenarioLayerSolveSnapshot, ScenarioResourceContextPayload, ScenarioResourceGrid, ScenarioResourceGridObjectAxis} from "@/hooks/useScenarios";

function clampStep(value: number, step: number, max: number): number {
    const steps = Math.round(max / step);
    return Math.min(steps, Math.max(0, Math.round(value / step)));
}

function objectStep(axis: ScenarioResourceGridObjectAxis | null, statuses: Record<string, string | number | boolean> | undefined): number {
    if (!axis) {
        return 0;
    }

    const raw = statuses?.[axis.key];
    const numeric = raw === true || raw === "true" ? 1 : Number(raw ?? 0);
    return Number.isFinite(numeric) ? Math.min(axis.max, Math.max(0, Math.round(numeric))) : 0;
}

// Index order matches the backend's ScenarioResourceGridAxes: corner combos (only with cornerToggle), defender Drive,
// defender Super, attacker object, attacker Super, attacker Drive, defender object.
export function resourceGridIndex(grid: ScenarioResourceGrid, resources: ScenarioResourceContextPayload, includeCornerSpecific = false): number {
    const {driveStep, driveMax, superMax, attackerObject, defenderObject} = grid.axes;
    const driveCount = Math.round(driveMax / driveStep) + 1;
    const superCount = superMax + 1;
    const attackerObjectCount = (attackerObject?.max ?? 0) + 1;
    const defenderObjectCount = (defenderObject?.max ?? 0) + 1;

    let index = grid.axes.cornerToggle && includeCornerSpecific ? 1 : 0;
    index = index * driveCount + clampStep(resources.defender.drive, driveStep, driveMax);
    index = index * superCount + clampStep(resources.defender.super, 1, superMax);
    index = index * attackerObjectCount + objectStep(attackerObject, resources.attacker.objectStatuses);
    index = index * superCount + clampStep(resources.attacker.super, 1, superMax);
    index = index * driveCount + clampStep(resources.attacker.drive, driveStep, driveMax);
    return index * defenderObjectCount + objectStep(defenderObject, resources.defender.objectStatuses);
}

export function findResourceGridSolution(grid: ScenarioResourceGrid, resources: ScenarioResourceContextPayload, includeCornerSpecific = false): ScenarioLayerSolveSnapshot | null {
    const index = resourceGridIndex(grid, resources, includeCornerSpecific);
    let low = 0;
    let high = grid.runs.length - 1;
    let found = -1;
    while (low <= high) {
        const middle = (low + high) >> 1;
        if (grid.runs[middle][0] <= index) {
            found = middle;
            low = middle + 1;
        } else {
            high = middle - 1;
        }
    }

    return found === -1 ? null : grid.solutions[grid.runs[found][1]] ?? null;
}
