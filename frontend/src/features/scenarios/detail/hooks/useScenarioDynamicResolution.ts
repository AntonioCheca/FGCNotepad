import React from "react";

import type {ScenarioDetail, ScenarioLayerSolveSnapshot, ScenarioLinkedExpectedValueResponse, ScenarioResourceContextPayload} from "@/hooks/useScenarios";
import type {MatrixLinkedCellResolution} from "@/src/features/matrix/model";
import type {MatrixPayload} from "@/src/types/matrixPayload";
import type {ScenarioExecutionSelection} from "@/src/types/scenarioExecution";
import {buildLinkedCellResolutionMap} from "../scenarioDetailUtils";

interface ResolveDynamicCellsResponse {
    scenario: ScenarioDetail;
}

interface UseScenarioDynamicResolutionOptions {
    scenarioId: string | null;
    scenario: ScenarioDetail | null;
    loading: boolean;
    error: string | null;
    executionSelection: ScenarioExecutionSelection;
    scenarioResources: ScenarioResourceContextPayload;
    includeCornerSpecific: boolean;
    // null while the session is still loading; false shows the solution saved with the scenario instead of solving live.
    liveSolving: boolean | null;
    setScenario: (scenario: ScenarioDetail) => void;
    resolveDynamicCells: (scenarioId: string, executionSelection: ScenarioExecutionSelection, scenarioResources: ScenarioResourceContextPayload, comboContext: {includeCornerSpecific: boolean}) => Promise<ResolveDynamicCellsResponse>;
    solveScenarioLayers: (scenarioId: string, executionSelection: ScenarioExecutionSelection) => Promise<{maxLayer: number; layers: Record<string, ScenarioLayerSolveSnapshot>}>;
    solveScenarioLinkedExpectedValue: (scenarioId: string, executionSelection: ScenarioExecutionSelection, scenarioResources: ScenarioResourceContextPayload, comboContext: {includeCornerSpecific: boolean}) => Promise<ScenarioLinkedExpectedValueResponse>;
}

function toLayerSnapshots(layers: Record<string, ScenarioLayerSolveSnapshot>): Record<number, ScenarioLayerSolveSnapshot> {
    return Object.entries(layers).reduce<Record<number, ScenarioLayerSolveSnapshot>>((acc, [layer, snapshot]) => {
        const numericLayer = Number.parseInt(layer, 10);
        if (Number.isFinite(numericLayer)) {
            acc[numericLayer] = snapshot;
        }
        return acc;
    }, {});
}

export function useScenarioDynamicResolution({
    scenarioId,
    scenario,
    loading,
    error,
    executionSelection,
    scenarioResources,
    includeCornerSpecific,
    liveSolving,
    setScenario,
    resolveDynamicCells,
    solveScenarioLayers,
    solveScenarioLinkedExpectedValue,
}: UseScenarioDynamicResolutionOptions) {
    const [refreshingDynamicCombos, setRefreshingDynamicCombos] = React.useState(false);
    const [dynamicRefreshQueued, setDynamicRefreshQueued] = React.useState(false);
    const [layerSolveSnapshots, setLayerSolveSnapshots] = React.useState<Record<number, ScenarioLayerSolveSnapshot>>({});
    const [linkedCellResolutions, setLinkedCellResolutions] = React.useState<Record<string, MatrixLinkedCellResolution>>({});

    React.useEffect(() => {
        if (null === liveSolving) {
            return;
        }

        if (!liveSolving) {
            setLayerSolveSnapshots(toLayerSnapshots(scenario?.savedSolution?.layers ?? {}));
            setLinkedCellResolutions({});
            return;
        }

        if (!scenarioId || !scenario || executionSelection.mode === "my_knowledge") {
            setLayerSolveSnapshots({});
            setLinkedCellResolutions({});
            return;
        }

        let canceled = false;
        solveScenarioLayers(scenarioId, executionSelection)
            .then(async (response) => {
                if (canceled) {
                    return;
                }

                const mapped = toLayerSnapshots(response.layers);

                try {
                    const linked = await solveScenarioLinkedExpectedValue(scenarioId, executionSelection, scenarioResources, {includeCornerSpecific});
                    if (canceled) {
                        return;
                    }

                    setLinkedCellResolutions(buildLinkedCellResolutionMap(linked.resolvedCells));
                    mapped[response.maxLayer] = {
                        rowAxis: linked.rowAxis,
                        columnAxis: linked.columnAxis,
                        expectedValue: linked.expectedValue,
                    };
                } catch {
                    if (!canceled) {
                        setLinkedCellResolutions({});
                    }
                }

                setLayerSolveSnapshots(mapped);
            })
            .catch(() => {
                if (!canceled) {
                    setLayerSolveSnapshots({});
                    setLinkedCellResolutions({});
                }
            });

        return () => {
            canceled = true;
        };
    }, [executionSelection, includeCornerSpecific, liveSolving, scenario, scenarioId, scenarioResources, solveScenarioLayers, solveScenarioLinkedExpectedValue]);

    const refreshDynamicCombos = React.useCallback(async (): Promise<MatrixPayload> => {
        if (!scenarioId) {
            throw new Error("Scenario is not ready for dynamic refresh.");
        }

        setDynamicRefreshQueued(false);
        const response = await resolveDynamicCells(scenarioId, executionSelection, scenarioResources, {includeCornerSpecific});
        setScenario(response.scenario);
        return response.scenario.matrix;
    }, [executionSelection, includeCornerSpecific, resolveDynamicCells, scenarioId, scenarioResources, setScenario]);

    const refreshDynamicCombosWithLoading = React.useCallback(async () => {
        setDynamicRefreshQueued(false);
        setRefreshingDynamicCombos(true);
        try {
            await refreshDynamicCombos();
        } catch {
        } finally {
            setRefreshingDynamicCombos(false);
        }
    }, [refreshDynamicCombos]);

    React.useEffect(() => {
        if (!scenarioId || loading || error || !liveSolving) {
            return;
        }

        let canceled = false;
        setDynamicRefreshQueued(true);

        const timeoutId = window.setTimeout(() => {
            if (canceled) {
                return;
            }

            setRefreshingDynamicCombos(true);
            refreshDynamicCombos()
                .catch(() => {
                })
                .finally(() => {
                    if (!canceled) {
                        setRefreshingDynamicCombos(false);
                    }
                });
        }, 1000);

        return () => {
            canceled = true;
            window.clearTimeout(timeoutId);
        };
    }, [error, liveSolving, loading, refreshDynamicCombos, scenarioId]);

    return {
        refreshingDynamicCombos,
        dynamicRefreshQueued,
        layerSolveSnapshots,
        linkedCellResolutions,
        refreshDynamicCombos,
        refreshDynamicCombosWithLoading,
    };
}
