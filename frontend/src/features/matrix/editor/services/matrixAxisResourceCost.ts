import {createBodyCellKey, MatrixAxisItem, MatrixEditorState, MatrixResourceRequirement} from "@/src/features/matrix/model";

// Same bar values as combo resource-adjusted damage (backend ComboValueEstimator).
const BAR_VALUE_BY_RESOURCE: Partial<Record<MatrixResourceRequirement["resource"], number>> = {
    drive: 200,
    super: 500,
};

// Payoffs are from the attacker's side: a requirement's threshold is what the option spends,
// so attacker spending lowers the payoff and defender spending raises it.
export function requirementPayoffAdjustment(requirement: MatrixResourceRequirement): number {
    const barValue = BAR_VALUE_BY_RESOURCE[requirement.resource];
    if (barValue === undefined || requirement.operator !== ">=") {
        return 0;
    }

    const cost = Math.max(0, requirement.threshold) * barValue;
    return requirement.owner === "attacker" ? -cost : cost;
}

export function axisPayoffAdjustment(axis: Pick<MatrixAxisItem, "requirements">): number {
    return axis.requirements.reduce((total, requirement) => total + requirementPayoffAdjustment(requirement), 0);
}

export function withAxisResourceCosts(state: MatrixEditorState, values: Record<string, number | null>): Record<string, number | null> {
    const adjusted = {...values};
    state.grid.rows.forEach((row) => {
        const rowAdjustment = axisPayoffAdjustment(row);
        state.grid.columns.forEach((column) => {
            const key = createBodyCellKey(row.id, column.id);
            const value = values[key] ?? state.grid.bodyCells[key]?.value ?? null;
            const adjustment = rowAdjustment + axisPayoffAdjustment(column);
            adjusted[key] = value === null || adjustment === 0 ? value : value + adjustment;
        });
    });

    return adjusted;
}
