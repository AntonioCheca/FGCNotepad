import React from "react";

import {AppBox} from "@/src/components/ui/AppBox";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {useMode} from "@/src/context/ThemeContext";
import {useScenarios} from "@/hooks/useScenarios";
import type {ScenarioDetail, ScenarioResourceContextPayload, ScenarioResourceGrid} from "@/hooks/useScenarios";
import {matrixPayloadToEditorState} from "@/src/features/matrix/editor/modules/payloadAdapter";
import {MatrixInsightsDashboard} from "@/src/features/matrix/editor/rendering/MatrixInsightsDashboard";
import {buildMix, type MatrixInsights} from "@/src/features/matrix/editor/services/matrixInsightService";
import {ScenarioComboEnvironmentCard} from "@/src/features/scenarios/detail/rendering/ScenarioComboEnvironmentCard";
import {ScenarioResourcesPanel} from "@/src/features/scenarios/detail/rendering/ScenarioResourcesPanel";
import {DEFAULT_SCENARIO_RESOURCES} from "@/src/features/scenarios/detail/scenarioDetailUtils";
import {findResourceGridSolution} from "./resourceGridLookup";
import {initialGridResources, useScenarioResourceGrid} from "./useScenarioResourceGrid";

const PUBLIC_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

interface ScenarioResourceExplorerProps {
    // The scenario's alias, or its public id.
    scenarioRef: string;
}

export function gridObjectDefinitions(grid: ScenarioResourceGrid, scenario: ScenarioDetail) {
    return [
        {axis: grid.axes.attackerObject, characterName: scenario.attackerCharacterName},
        {axis: grid.axes.defenderObject, characterName: scenario.defenderCharacterName},
    ].flatMap(({axis, characterName}) => axis && characterName
        ? [{object_key: axis.key, name: axis.name, character_name: characterName, status_type: "integer" as const, max_status: axis.max}]
        : []);
}

// Equilibrium mixes of an oki for any Drive, Super, stock and corner combo choice, read from the precomputed grid.
export function ScenarioResourceExplorer({scenarioRef}: ScenarioResourceExplorerProps) {
    const {getScenario, getScenarioByAlias} = useScenarios();
    const {theme} = useMode();
    const [scenario, setScenario] = React.useState<ScenarioDetail | null>(null);
    const [scenarioFailed, setScenarioFailed] = React.useState(false);
    const [resources, setResources] = React.useState<ScenarioResourceContextPayload>(DEFAULT_SCENARIO_RESOURCES);
    const [includeCornerSpecific, setIncludeCornerSpecific] = React.useState(false);
    const {grid, failed: gridFailed} = useScenarioResourceGrid(scenario?.id ?? null);

    React.useEffect(() => {
        let canceled = false;
        (PUBLIC_ID_PATTERN.test(scenarioRef) ? getScenario(scenarioRef) : getScenarioByAlias(scenarioRef))
            .then((loaded) => {
                if (!canceled) {
                    setScenario(loaded);
                }
            })
            .catch(() => {
                if (!canceled) {
                    setScenarioFailed(true);
                }
            });

        return () => {
            canceled = true;
        };
    }, [getScenario, getScenarioByAlias, scenarioRef]);

    React.useEffect(() => {
        if (grid && scenario) {
            setResources(initialGridResources(grid, scenario));
        }
    }, [grid, scenario]);

    const axes = React.useMemo(() => scenario ? matrixPayloadToEditorState(scenario.matrix).grid : null, [scenario]);

    const insights = React.useMemo<MatrixInsights | null>(() => {
        if (!grid || !axes) {
            return null;
        }

        const solution = findResourceGridSolution(grid, resources, includeCornerSpecific);
        return {
            attackerMix: buildMix(axes.rows, (row) => solution?.rowAxis[axes.rows.indexOf(row)]),
            defenderMix: buildMix(axes.columns, (column) => solution?.columnAxis[axes.columns.indexOf(column)]),
            expectedValue: solution?.expectedValue ?? null,
            expectedValueHpPercent: null,
            payoffMin: null,
            payoffMax: null,
            weightedOutcomes: [],
            heatmapToneByCellKey: {},
        };
    }, [axes, grid, includeCornerSpecific, resources]);

    if (scenarioFailed || gridFailed) {
        return <InlineNotice severity="info">This oki&apos;s interactive solution isn&apos;t available right now.</InlineNotice>;
    }

    if (!scenario || !grid || !insights) {
        return <AppCircularProgress/>;
    }

    return (
        <AppBox sx={{display: "grid", gap: 1, minWidth: 0}}>
            <AppTypography variant="h6">{scenario.name}</AppTypography>
            {grid.axes.cornerToggle ? (
                <ScenarioComboEnvironmentCard
                    scenario={scenario}
                    includeCornerSpecific={includeCornerSpecific}
                    onIncludeCornerSpecificChange={setIncludeCornerSpecific}
                    theme={theme}
                />
            ) : null}
            <ScenarioResourcesPanel
                scenarioResources={resources}
                attackerLifeMax={DEFAULT_SCENARIO_RESOURCES.attacker.health}
                defenderLifeMax={DEFAULT_SCENARIO_RESOURCES.defender.health}
                scenario={scenario}
                objectDefinitions={gridObjectDefinitions(grid, scenario)}
                dynamicRefreshQueued={false}
                refreshingDynamicCombos={false}
                showHealth={false}
                showRefreshNote={false}
                theme={theme}
                onScenarioResourcesChange={setResources}
            />
            <MatrixInsightsDashboard insights={insights}/>
        </AppBox>
    );
}
