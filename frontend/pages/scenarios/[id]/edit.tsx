import React from "react";
import {useRouter} from "next/router";

import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {ScenarioEditorForm} from "@/src/components/scenarios/ScenarioEditorForm";
import {MatrixLinkedCellResolution} from "@/src/features/matrix/model";
import {useScenarios, ScenarioDetail, ScenarioResolvedLinkedCell} from "@/hooks/useScenarios";

function formatLinkedFormula(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function buildLinkedCellResolutionMap(cells: ScenarioResolvedLinkedCell[]): Record<string, MatrixLinkedCellResolution> {
    return cells.reduce<Record<string, MatrixLinkedCellResolution>>((acc, cell) => {
        acc[`body::row_${cell.row + 1}::column_${cell.column + 1}`] = {
            basePreValue: cell.basePreValue,
            linkedExpectedValue: cell.linkedExpectedValue,
            finalValue: cell.finalValue,
            displayFormula: `${formatLinkedFormula(cell.basePreValue)}+${formatLinkedFormula(cell.linkedExpectedValue)}`,
        };

        return acc;
    }, {});
}

export default function EditScenarioPage() {
    const router = useRouter();
    const {id} = router.query;
    const scenarioId = typeof id === "string" ? id : null;

    const {getScenario, updateScenario, resolveDynamicCells, resolveDynamicCellPreview, solveScenarioLinkedExpectedValue} = useScenarios();
    const [scenario, setScenario] = React.useState<ScenarioDetail | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [linkedCellResolutions, setLinkedCellResolutions] = React.useState<Record<string, MatrixLinkedCellResolution>>({});

    React.useEffect(() => {
        if (!scenarioId) {
            return;
        }

        let canceled = false;
        setLoading(true);
        setError(null);

        getScenario(scenarioId)
            .then((data) => {
                if (!canceled) {
                    setScenario(data);
                    setLinkedCellResolutions({});
                }
            })
            .catch(() => {
                if (!canceled) {
                    setError("Unable to load scenario.");
                }
            })
            .finally(() => {
                if (!canceled) {
                    setLoading(false);
                }
            });

        return () => {
            canceled = true;
        };
    }, [scenarioId, getScenario]);

    React.useEffect(() => {
        if (!scenarioId || !scenario) {
            setLinkedCellResolutions({});
            return;
        }

        let canceled = false;
        solveScenarioLinkedExpectedValue(scenarioId)
            .then((response) => {
                if (!canceled) {
                    setLinkedCellResolutions(buildLinkedCellResolutionMap(response.resolvedCells));
                }
            })
            .catch(() => {
                if (!canceled) {
                    setLinkedCellResolutions({});
                }
            });

        return () => {
            canceled = true;
        };
    }, [scenario, scenarioId, solveScenarioLinkedExpectedValue]);

    if (loading) {
        return (
            <AppContainer maxWidth={false}>
                <AppCircularProgress/>
            </AppContainer>
        );
    }

    if (error || !scenario || !scenarioId) {
        return (
            <AppContainer maxWidth={false}>
                <AppTypography color="error">{error ?? "Scenario not found."}</AppTypography>
            </AppContainer>
        );
    }

    return (
        <AppContainer maxWidth={false}>
            <AppTypography variant="h4" sx={{mb: 2}}>Edit Scenario</AppTypography>
            <ScenarioEditorForm
                initialValue={{
                    name: scenario.name,
                    scenarioType: scenario.scenarioType,
                    defenderCharacterId: scenario.defenderCharacterId ?? "",
                    attackerCharacterId: scenario.attackerCharacterId ?? "",
                    triggerMoveId: scenario.triggerMoveId ?? "",
                    triggerMoveLabel: scenario.triggerMoveLabel,
                    matrix: scenario.matrix,
                    comboContext: scenario.comboContext,
                }}
                submitLabel="Save Scenario"
                onSubmit={async (payload) => {
                    const updated = await updateScenario(scenarioId, payload);
                    setScenario(updated);
                }}
                onResolveDynamicCells={async () => {
                    const response = await resolveDynamicCells(scenarioId);
                    setScenario(response.scenario);
                    return response.scenario.matrix;
                }}
                onResolveDynamicComboCell={async (dynamicCombo) => {
                    const resolved = await resolveDynamicCellPreview(dynamicCombo);
                    return resolved.resolvedDamage;
                }}
                currentScenarioId={scenarioId}
                linkedCellResolutions={linkedCellResolutions}
            />
        </AppContainer>
    );
}
