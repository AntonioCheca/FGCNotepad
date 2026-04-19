import React from "react";
import Link from "next/link";
import {useRouter} from "next/router";

import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppButton} from "@/src/components/ui/AppButton";
import {MatrixEditorShell} from "@/src/features/matrix/editor";
import {useScenarios, ScenarioDetail} from "@/hooks/useScenarios";
import {ContentFlagButton} from "@/src/components/flags/ContentFlagButton";

export default function ScenarioDetailPage() {
    const router = useRouter();
    const {id} = router.query;
    const scenarioId = typeof id === "string" ? id : null;

    const {getScenario, resolveDynamicCells} = useScenarios();
    const [scenario, setScenario] = React.useState<ScenarioDetail | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [refreshingDynamicCombos, setRefreshingDynamicCombos] = React.useState(false);

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
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12}}>
                <AppTypography variant="h4">View Scenario</AppTypography>
                <div style={{display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end"}}>
                    <ContentFlagButton targetType="scenario" targetId={scenarioId}/>
                    <AppButton
                        type="button"
                        disabled={refreshingDynamicCombos}
                        onClick={async () => {
                            setRefreshingDynamicCombos(true);
                            try {
                                const response = await resolveDynamicCells(scenarioId);
                                setScenario(response.scenario);
                            } catch {
                            } finally {
                                setRefreshingDynamicCombos(false);
                            }
                        }}
                    >
                        {refreshingDynamicCombos ? "Refreshing..." : "Refresh Dynamic Combos"}
                    </AppButton>
                    <Link href={`/scenarios/${scenarioId}/edit`} style={{textDecoration: "none"}}>
                        <AppButton type="button">Edit Scenario</AppButton>
                    </Link>
                </div>
            </div>

            <div style={{display: "grid", gap: 6, marginBottom: 16}}>
                <AppTypography variant="h6">{scenario.name}</AppTypography>
                <AppTypography variant="body2">Type: {scenario.typeLabel}</AppTypography>
                <AppTypography variant="body2">Defender: {scenario.defenderCharacterName ?? "Unknown"}</AppTypography>
                <AppTypography variant="body2">Attacker: {scenario.attackerCharacterName ?? "Unknown"}</AppTypography>
                <AppTypography variant="body2">Trigger Move: {scenario.triggerMoveLabel ?? "Unknown"}</AppTypography>
            </div>

            <MatrixEditorShell
                matrix={scenario.matrix}
                editable={false}
                onMatrixChange={() => {
                }}
                onRefreshDynamicCells={async () => {
                    const response = await resolveDynamicCells(scenarioId);
                    setScenario(response.scenario);
                    return response.scenario.matrix;
                }}
            />
        </AppContainer>
    );
}
