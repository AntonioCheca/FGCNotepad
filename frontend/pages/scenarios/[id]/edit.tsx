import React from "react";
import {useRouter} from "next/router";

import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {ScenarioEditorForm} from "@/src/components/scenarios/ScenarioEditorForm";
import {useScenarios, ScenarioDetail} from "@/hooks/useScenarios";

export default function EditScenarioPage() {
    const router = useRouter();
    const {id} = router.query;
    const scenarioId = typeof id === "string" ? id : null;

    const {getScenario, updateScenario, resolveDynamicCells, resolveDynamicCellPreview} = useScenarios();
    const [scenario, setScenario] = React.useState<ScenarioDetail | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

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
                    matrix: scenario.matrix,
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
            />
        </AppContainer>
    );
}
