import React from "react";
import {useRouter} from "next/router";

import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppBox} from "@/src/components/ui/AppBox";
import {useExecutionProfile} from "@/hooks/useExecutionProfile";
import {useCharacters} from "@/hooks/useCharacters";
import {useScenarios} from "@/hooks/useScenarios";
import type {ScenarioComboContextCatalog} from "@/hooks/useScenarios";
import {useMode} from "@/src/context/ThemeContext";
import {useScenarioDetailData} from "@/src/features/scenarios/detail/hooks/useScenarioDetailData";
import {useScenarioDynamicResolution} from "@/src/features/scenarios/detail/hooks/useScenarioDynamicResolution";
import {useScenarioExecutionSelection} from "@/src/features/scenarios/detail/hooks/useScenarioExecutionSelection";
import {useScenarioResourceState} from "@/src/features/scenarios/detail/hooks/useScenarioResourceState";
import {ScenarioAliasControl} from "@/src/features/scenarios/detail/rendering/ScenarioAliasControl";
import {ScenarioComboEnvironmentCard} from "@/src/features/scenarios/detail/rendering/ScenarioComboEnvironmentCard";
import {ScenarioDetailHeader} from "@/src/features/scenarios/detail/rendering/ScenarioDetailHeader";
import {ScenarioExecutionControls} from "@/src/features/scenarios/detail/rendering/ScenarioExecutionControls";
import {ScenarioMatrixViewer} from "@/src/features/scenarios/detail/rendering/ScenarioMatrixViewer";
import {ScenarioPersonalizedDefenderControl} from "@/src/features/scenarios/detail/rendering/ScenarioPersonalizedDefenderControl";
import {ScenarioResourcesPanel} from "@/src/features/scenarios/detail/rendering/ScenarioResourcesPanel";
import {ScenarioSummaryCard} from "@/src/features/scenarios/detail/rendering/ScenarioSummaryCard";
import {gridObjectDefinitions} from "@/src/features/scenarios/explorer/ScenarioResourceExplorer";
import {matrixPayloadToEditorState} from "@/src/features/matrix/editor/modules/payloadAdapter";
import {computeHighestLayer} from "@/src/features/matrix/editor/services/matrixLayerVisibility";
import {findResourceGridSolution} from "@/src/features/scenarios/explorer/resourceGridLookup";
import {initialGridResources, useScenarioResourceGrid} from "@/src/features/scenarios/explorer/useScenarioResourceGrid";
import {MobileCollapsible, MobileOrder} from "@/src/components/ui/tactical/MobileLayout";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import AuthContext from "@/services/AuthContext";

export default function ScenarioDetailPage() {
    const router = useRouter();
    const {id} = router.query;
    const scenarioId = typeof id === "string" ? id : null;
    const authContext = React.useContext(AuthContext);
    const liveSolving = authContext?.loading ?? true ? null : authContext?.isAuthenticated ?? false;

    const {
        getScenario,
        resolveDynamicCells,
        getComboContextCatalog,
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
    const [comboContextCatalog, setComboContextCatalog] = React.useState<ScenarioComboContextCatalog | null>(null);

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
        liveSolving,
        setScenario,
        resolveDynamicCells,
        solveScenarioLayers,
        solveScenarioLinkedExpectedValue,
    });

    React.useEffect(() => {
        setIncludeCornerSpecific(false);
    }, [scenarioId]);

    // Visitors who can't solve live read the precomputed grid instead, the same one research articles embed.
    const {grid} = useScenarioResourceGrid(scenarioId, liveSolving === false);
    const gridView = liveSolving === false && grid !== null && scenario !== null && grid.scenarioId === scenario.id;

    React.useEffect(() => {
        if (gridView && grid && scenario) {
            setScenarioResources(initialGridResources(grid, scenario));
        }
    }, [grid, gridView, scenario, setScenarioResources]);

    // The all-layers solution for the current resources, from the grid or from the backend's live linked solve, so
    // this page and research embeds agree. Lower layers keep their snapshots only when no option has a resource
    // requirement; otherwise they are solved in the browser.
    const {layerSolveSnapshots: solvedSnapshots, resourceAwareLayer} = dynamicResolution;
    const liveLinkedView = liveSolving === true && resourceAwareLayer !== null;
    const layerSolveSnapshots = React.useMemo(() => {
        if (!scenario || (!gridView && !liveLinkedView)) {
            return solvedSnapshots;
        }

        const editorState = matrixPayloadToEditorState(scenario.matrix);
        const highestLayer = computeHighestLayer(editorState);
        const solution = gridView && grid ? findResourceGridSolution(grid, scenarioResources, includeCornerSpecific) : solvedSnapshots[highestLayer];
        const hasRequirements = [...editorState.grid.rows, ...editorState.grid.columns].some((axis) => axis.requirements.length > 0);
        const lowerLayers = gridView || hasRequirements ? {} : solvedSnapshots;
        return solution ? {...lowerLayers, [highestLayer]: solution} : lowerLayers;
    }, [grid, gridView, includeCornerSpecific, liveLinkedView, scenario, scenarioResources, solvedSnapshots]);

    React.useEffect(() => {
        let canceled = false;
        getComboContextCatalog()
            .then((catalog) => {
                if (!canceled) {
                    setComboContextCatalog(catalog);
                }
            })
            .catch(() => {
                if (!canceled) {
                    setComboContextCatalog(null);
                }
            });

        return () => {
            canceled = true;
        };
    }, [getComboContextCatalog]);

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
        <AppContainer maxWidth={false} sx={{py: {xs: 2, md: 3.25}, px: {xs: 1.25, sm: 1.75, md: 3, xl: 4}}}>
            <AppBox sx={{display: "grid", gap: {xs: 1, md: 1.5}, minWidth: 0}}>
                <ScenarioDetailHeader
                    scenarioId={scenarioId}
                    showActions={liveSolving === true}
                    canExport={authContext?.canManageUsers ?? false}
                    refreshingDynamicCombos={dynamicResolution.refreshingDynamicCombos}
                    onRefreshDynamicCombos={() => void dynamicResolution.refreshDynamicCombosWithLoading()}
                />
                {liveSolving === false ? (
                    <InlineNotice severity="info">
                        {gridView ? "Log in to change execution." : "Showing the saved solution with every resource available. Log in to change execution and resources."}
                    </InlineNotice>
                ) : null}
                {liveSolving || (gridView && grid?.axes.cornerToggle) ? (
                    <MobileCollapsible title="Calculation settings" order={3}>
                        <ScenarioComboEnvironmentCard
                            scenario={scenario}
                            includeCornerSpecific={includeCornerSpecific}
                            onIncludeCornerSpecificChange={setIncludeCornerSpecific}
                            theme={theme}
                        />
                        {liveSolving ? (
                            <ScenarioExecutionControls
                                executionSelection={executionSelection}
                                isAuthenticated={isAuthenticated}
                                onExecutionSelectionChange={setExecutionSelection}
                                theme={theme}
                            />
                        ) : null}
                    </MobileCollapsible>
                ) : null}
                <MobileOrder order={1}>
                    <ScenarioSummaryCard scenario={scenario} />
                </MobileOrder>
                {authContext?.canModerate ? (
                    <MobileOrder order={5}>
                        <ScenarioAliasControl scenarioId={scenarioId} alias={scenario.alias}/>
                    </MobileOrder>
                ) : null}
                {liveSolving || gridView ? (
                    <MobileCollapsible title="Resources" order={4}>
                        <ScenarioResourcesPanel
                            scenarioResources={scenarioResources}
                            attackerLifeMax={attackerLifeMax}
                            defenderLifeMax={defenderLifeMax}
                            scenario={scenario}
                            objectDefinitions={gridView && grid ? gridObjectDefinitions(grid, scenario) : comboContextCatalog?.characterStatuses ?? []}
                            dynamicRefreshQueued={dynamicResolution.dynamicRefreshQueued}
                            refreshingDynamicCombos={dynamicResolution.refreshingDynamicCombos}
                            showHealth={!gridView}
                            showRefreshNote={!gridView}
                            theme={theme}
                            onScenarioResourcesChange={setScenarioResources}
                        />
                        {liveSolving && scenario.scenarioType === "aggregated_oki" ? (
                            <ScenarioPersonalizedDefenderControl
                                personalizedDefenderId={personalizedDefenderId}
                                characters={characters}
                                theme={theme}
                                onPersonalizedDefenderIdChange={setPersonalizedDefenderId}
                            />
                        ) : null}
                    </MobileCollapsible>
                ) : null}
                <MobileOrder order={2}>
                    <ScenarioMatrixViewer
                        scenario={scenario}
                        scenarioId={scenarioId}
                        columnVisibilityByLabel={columnVisibilityByLabel}
                        layerSolveSnapshots={layerSolveSnapshots}
                        linkedCellResolutions={dynamicResolution.linkedCellResolutions}
                        scenarioResources={scenarioResources}
                        onRefreshDynamicCells={dynamicResolution.refreshDynamicCombos}
                        canSolve={liveSolving === true}
                        snapshotsMatchResources={gridView || liveLinkedView}
                    />
                </MobileOrder>
            </AppBox>
        </AppContainer>
    );
}
