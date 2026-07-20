import React from "react";
import {useRouter} from "next/router";

import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {useExecutionProfile} from "@/hooks/useExecutionProfile";
import {useCharacters} from "@/hooks/useCharacters";
import {useScenarios} from "@/hooks/useScenarios";
import {useMode} from "@/src/context/ThemeContext";
import {useScenarioDetailData} from "@/src/features/scenarios/detail/hooks/useScenarioDetailData";
import {useScenarioDynamicResolution} from "@/src/features/scenarios/detail/hooks/useScenarioDynamicResolution";
import {useScenarioExecutionSelection} from "@/src/features/scenarios/detail/hooks/useScenarioExecutionSelection";
import {useScenarioResourceState} from "@/src/features/scenarios/detail/hooks/useScenarioResourceState";
import {ScenarioComboEnvironmentCard} from "@/src/features/scenarios/detail/rendering/ScenarioComboEnvironmentCard";
import {ScenarioDetailHeader} from "@/src/features/scenarios/detail/rendering/ScenarioDetailHeader";
import {ScenarioExecutionControls} from "@/src/features/scenarios/detail/rendering/ScenarioExecutionControls";
import {ScenarioMatrixViewer} from "@/src/features/scenarios/detail/rendering/ScenarioMatrixViewer";
import {ScenarioPersonalizedDefenderControl} from "@/src/features/scenarios/detail/rendering/ScenarioPersonalizedDefenderControl";
import {ScenarioResourcesPanel} from "@/src/features/scenarios/detail/rendering/ScenarioResourcesPanel";
import {ScenarioSummaryCard} from "@/src/features/scenarios/detail/rendering/ScenarioSummaryCard";

export default function ScenarioDetailPage() {
    const router = useRouter();
    const {id} = router.query;
    const scenarioId = typeof id === "string" ? id : null;

    const {
        getScenario,
        resolveDynamicCells,
        getAggregatedDefenseCapabilities,
        solveScenarioLayers,
        solveScenarioLinkedExpectedValue,
    } = useScenarios();
    const {getExecutionPreference} = useExecutionProfile();
    const {characters} = useCharacters();
    const {theme} = useMode();
    const [includeCornerSpecific, setIncludeCornerSpecific] = React.useState(false);
    const [personalizedDefenderId, setPersonalizedDefenderId] = React.useState("");
    const [columnVisibilityByLabel, setColumnVisibilityByLabel] = React.useState<Record<string, boolean> | null>(null);

    const {scenario, setScenario, loading, error} = useScenarioDetailData({scenarioId, getScenario});
    const {executionSelection, setExecutionSelection, isAuthenticated} = useScenarioExecutionSelection({getExecutionPreference});
    const {scenarioResources, setScenarioResources, attackerLifeMax, defenderLifeMax} = useScenarioResourceState({
        scenarioId,
        scenario,
        characters,
    });
    const dynamicResolution = useScenarioDynamicResolution({
        scenarioId,
        scenario,
        loading,
        error,
        executionSelection,
        scenarioResources,
        includeCornerSpecific,
        setScenario,
        resolveDynamicCells,
        solveScenarioLayers,
        solveScenarioLinkedExpectedValue,
    });

    React.useEffect(() => {
        setIncludeCornerSpecific(false);
    }, [scenarioId]);

    React.useEffect(() => {
        if (!scenario || scenario.scenarioType !== "aggregated_oki") {
            setPersonalizedDefenderId("");
            setColumnVisibilityByLabel(null);
            return;
        }

        if (personalizedDefenderId.trim() === "") {
            setColumnVisibilityByLabel(null);
            return;
        }

        let canceled = false;
        getAggregatedDefenseCapabilities(personalizedDefenderId)
            .then((response) => {
                if (canceled) {
                    return;
                }

                const availabilityByLabel: Record<string, boolean> = {};
                response.catalog.forEach((item) => {
                    availabilityByLabel[item.label] = response.capabilities[item.key] !== false;
                });
                setColumnVisibilityByLabel(availabilityByLabel);
            })
            .catch(() => {
                if (!canceled) {
                    setColumnVisibilityByLabel(null);
                }
            });

        return () => {
            canceled = true;
        };
    }, [scenario, personalizedDefenderId, getAggregatedDefenseCapabilities]);

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
            <ScenarioDetailHeader
                scenarioId={scenarioId}
                refreshingDynamicCombos={dynamicResolution.refreshingDynamicCombos}
                onRefreshDynamicCombos={() => void dynamicResolution.refreshDynamicCombosWithLoading()}
            />
            <ScenarioComboEnvironmentCard
                scenario={scenario}
                includeCornerSpecific={includeCornerSpecific}
                onIncludeCornerSpecificChange={setIncludeCornerSpecific}
                theme={theme}
            />
            <ScenarioExecutionControls
                executionSelection={executionSelection}
                isAuthenticated={isAuthenticated}
                onExecutionSelectionChange={setExecutionSelection}
                theme={theme}
            />
            <ScenarioSummaryCard scenario={scenario} />
            <ScenarioResourcesPanel
                scenarioResources={scenarioResources}
                attackerLifeMax={attackerLifeMax}
                defenderLifeMax={defenderLifeMax}
                dynamicRefreshQueued={dynamicResolution.dynamicRefreshQueued}
                refreshingDynamicCombos={dynamicResolution.refreshingDynamicCombos}
                theme={theme}
                onScenarioResourcesChange={setScenarioResources}
            />
            {scenario.scenarioType === "aggregated_oki" ? (
                <ScenarioPersonalizedDefenderControl
                    personalizedDefenderId={personalizedDefenderId}
                    characters={characters}
                    theme={theme}
                    onPersonalizedDefenderIdChange={setPersonalizedDefenderId}
                />
            ) : null}
            <ScenarioMatrixViewer
                scenario={scenario}
                scenarioId={scenarioId}
                columnVisibilityByLabel={columnVisibilityByLabel}
                layerSolveSnapshots={dynamicResolution.layerSolveSnapshots}
                linkedCellResolutions={dynamicResolution.linkedCellResolutions}
                scenarioResources={scenarioResources}
                onRefreshDynamicCells={dynamicResolution.refreshDynamicCombos}
            />
        </AppContainer>
    );
}
