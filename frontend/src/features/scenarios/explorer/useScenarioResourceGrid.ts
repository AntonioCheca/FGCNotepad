import React from "react";

import {useScenarios} from "@/hooks/useScenarios";
import type {ScenarioDetail, ScenarioResourceContextPayload, ScenarioResourceGrid, ScenarioResourceGridObjectAxis} from "@/hooks/useScenarios";
import {DEFAULT_SCENARIO_RESOURCES} from "@/src/features/scenarios/detail/scenarioDetailUtils";

// The stock the scenario's combos assume (for example 1 Fuha after 214MK), so the first view matches the scenario.
function initialObjectStatuses(axis: ScenarioResourceGridObjectAxis | null, scenario: ScenarioDetail): Record<string, number> {
    if (!axis) {
        return {};
    }

    const status = scenario.comboContext.characterStatuses.find((entry) => entry.object_name === axis.name);
    const value = Number(status?.status_required ?? 0);
    const stock = Number.isFinite(value) ? Math.min(axis.max, Math.max(0, value)) : 0;
    return stock > 0 ? {[axis.key]: stock} : {};
}

export function initialGridResources(grid: ScenarioResourceGrid, scenario: ScenarioDetail): ScenarioResourceContextPayload {
    return {
        attacker: {...DEFAULT_SCENARIO_RESOURCES.attacker, objectStatuses: initialObjectStatuses(grid.axes.attackerObject, scenario)},
        defender: {...DEFAULT_SCENARIO_RESOURCES.defender, objectStatuses: initialObjectStatuses(grid.axes.defenderObject, scenario)},
    };
}

// The scenario's precomputed resource grid; null while loading or when there is no up-to-date grid.
export function useScenarioResourceGrid(scenarioId: string | null, enabled = true) {
    const {getScenarioResourceGrid} = useScenarios();
    const [grid, setGrid] = React.useState<ScenarioResourceGrid | null>(null);
    const [failed, setFailed] = React.useState(false);

    React.useEffect(() => {
        setGrid(null);
        setFailed(false);
        if (!scenarioId || !enabled) {
            return;
        }

        let canceled = false;
        getScenarioResourceGrid(scenarioId)
            .then((loaded) => {
                if (!canceled) {
                    setGrid(loaded);
                }
            })
            .catch(() => {
                if (!canceled) {
                    setFailed(true);
                }
            });

        return () => {
            canceled = true;
        };
    }, [enabled, getScenarioResourceGrid, scenarioId]);

    return {grid, failed};
}
