import React from "react";
import Link from "next/link";
import {useRouter} from "next/router";

import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppTooltip} from "@/src/components/ui/AppTooltip";
import {AppSlider} from "@/src/components/ui/AppSlider";
import {HelpOutlineOutlinedIcon} from "@/src/components/ui/AppIcons";
import {MatrixEditorShell} from "@/src/features/matrix/editor";
import {MatrixLinkedCellResolution} from "@/src/features/matrix/model";
import {useScenarios, ScenarioDetail, ScenarioLayerSolveSnapshot, ScenarioResolvedLinkedCell} from "@/hooks/useScenarios";
import {hasJwtToken, useExecutionProfile} from "@/hooks/useExecutionProfile";
import {ContentFlagButton} from "@/src/components/flags/ContentFlagButton";
import {ScenarioExecutionSelection} from "@/src/types/scenarioExecution";
import {useCharacters} from "@/hooks/useCharacters";
import {useMode} from "@/src/context/ThemeContext";

const DEFAULT_EXECUTION_SELECTION: ScenarioExecutionSelection = {
    mode: "standard",
    difficultyCap: null,
};

interface PlayerResourceState {
    health: number;
    drive: number;
    super: number;
}

interface ScenarioResourceState {
    attacker: PlayerResourceState;
    defender: PlayerResourceState;
}

const DEFAULT_SCENARIO_RESOURCES: ScenarioResourceState = {
    attacker: {
        health: 10000,
        drive: 6,
        super: 0,
    },
    defender: {
        health: 10000,
        drive: 6,
        super: 0,
    },
};

const DEFAULT_CHARACTER_LIFE = 10000;

function formatLinkedFormula(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function linkedResolutionKey(cell: Pick<ScenarioResolvedLinkedCell, "row" | "column">): string {
    return `body::row_${cell.row + 1}::column_${cell.column + 1}`;
}

function buildLinkedCellResolutionMap(cells: ScenarioResolvedLinkedCell[]): Record<string, MatrixLinkedCellResolution> {
    return cells.reduce<Record<string, MatrixLinkedCellResolution>>((acc, cell) => {
        acc[linkedResolutionKey(cell)] = {
            basePreValue: cell.basePreValue,
            linkedExpectedValue: cell.linkedExpectedValue,
            finalValue: cell.finalValue,
            displayFormula: `${formatLinkedFormula(cell.basePreValue)}+${formatLinkedFormula(cell.linkedExpectedValue)}`,
        };

        return acc;
    }, {});
}

function getExecutionModeBadgeLabel(selection: ScenarioExecutionSelection): string {
    if (selection.mode === "my_knowledge") {
        return "Execution: My Knowledge";
    }

    if (selection.mode === "difficulty_cap") {
        return `Execution: Difficulty <= ${selection.difficultyCap ?? 3}`;
    }

    return "Execution: Standard";
}

export default function ScenarioDetailPage() {
    const router = useRouter();
    const {id} = router.query;
    const scenarioId = typeof id === "string" ? id : null;

    const {getScenario, resolveDynamicCells, getAggregatedDefenseCapabilities, solveScenarioLayers, solveScenarioLinkedExpectedValue} = useScenarios();
    const {getExecutionPreference} = useExecutionProfile();
    const {characters} = useCharacters();
    const [scenario, setScenario] = React.useState<ScenarioDetail | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [refreshingDynamicCombos, setRefreshingDynamicCombos] = React.useState(false);
    const [dynamicRefreshQueued, setDynamicRefreshQueued] = React.useState(false);
    const [executionSelection, setExecutionSelection] = React.useState<ScenarioExecutionSelection>(DEFAULT_EXECUTION_SELECTION);
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [personalizedDefenderId, setPersonalizedDefenderId] = React.useState("");
    const [columnVisibilityByLabel, setColumnVisibilityByLabel] = React.useState<Record<string, boolean> | null>(null);
    const [layerSolveSnapshots, setLayerSolveSnapshots] = React.useState<Record<number, ScenarioLayerSolveSnapshot>>({});
    const [linkedCellResolutions, setLinkedCellResolutions] = React.useState<Record<string, MatrixLinkedCellResolution>>({});
    const [scenarioResources, setScenarioResources] = React.useState<ScenarioResourceState>(DEFAULT_SCENARIO_RESOURCES);
    const [includeCornerSpecific, setIncludeCornerSpecific] = React.useState(false);
    const {theme} = useMode();

    const characterById = React.useMemo(() => {
        const map = new Map<string, {id: string; name: string; life?: number}>();
        characters.forEach((character) => {
            map.set(character.id, character);
        });
        return map;
    }, [characters]);

    const characterByName = React.useMemo(() => {
        const map = new Map<string, {id: string; name: string; life?: number}>();
        characters.forEach((character) => {
            map.set(character.name.trim().toLowerCase(), character);
        });
        return map;
    }, [characters]);

    const attackerLifeMax = React.useMemo(() => {
        if (typeof scenario?.attackerCharacterLife === "number") {
            return scenario.attackerCharacterLife;
        }

        if (!scenario?.attackerCharacterId) {
            return scenario?.attackerCharacterName
                ? characterByName.get(scenario.attackerCharacterName.trim().toLowerCase())?.life ?? DEFAULT_CHARACTER_LIFE
                : DEFAULT_CHARACTER_LIFE;
        }

        return characterById.get(scenario.attackerCharacterId)?.life
            ?? (scenario.attackerCharacterName ? characterByName.get(scenario.attackerCharacterName.trim().toLowerCase())?.life : undefined)
            ?? DEFAULT_CHARACTER_LIFE;
    }, [characterById, characterByName, scenario?.attackerCharacterId, scenario?.attackerCharacterLife, scenario?.attackerCharacterName]);

    const defenderLifeMax = React.useMemo(() => {
        if (typeof scenario?.defenderCharacterLife === "number") {
            return scenario.defenderCharacterLife;
        }

        if (!scenario?.defenderCharacterId) {
            return scenario?.defenderCharacterName
                ? characterByName.get(scenario.defenderCharacterName.trim().toLowerCase())?.life ?? DEFAULT_CHARACTER_LIFE
                : DEFAULT_CHARACTER_LIFE;
        }

        return characterById.get(scenario.defenderCharacterId)?.life
            ?? (scenario.defenderCharacterName ? characterByName.get(scenario.defenderCharacterName.trim().toLowerCase())?.life : undefined)
            ?? DEFAULT_CHARACTER_LIFE;
    }, [characterById, characterByName, scenario?.defenderCharacterId, scenario?.defenderCharacterLife, scenario?.defenderCharacterName]);

    React.useEffect(() => {
        setScenarioResources((current) => ({
            attacker: {
                ...current.attacker,
                health: attackerLifeMax,
            },
            defender: {
                ...current.defender,
                health: defenderLifeMax,
            },
        }));
    }, [scenarioId, attackerLifeMax, defenderLifeMax]);

    React.useEffect(() => {
        const authenticated = hasJwtToken();
        setIsAuthenticated(authenticated);

        if (!authenticated) {
            return;
        }

        let canceled = false;
        getExecutionPreference()
            .then((preference) => {
                if (canceled) {
                    return;
                }

                setExecutionSelection({
                    mode: preference.defaultMode,
                    difficultyCap: preference.difficultyCap,
                });
            })
            .catch(() => {
                if (!canceled) {
                    setExecutionSelection(DEFAULT_EXECUTION_SELECTION);
                }
            });

        return () => {
            canceled = true;
        };
    }, [getExecutionPreference]);

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
                    setIncludeCornerSpecific(false);
                    setLayerSolveSnapshots({});
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

                const mapped = Object.entries(response.layers).reduce<Record<number, ScenarioLayerSolveSnapshot>>((acc, [layer, snapshot]) => {
                    const numericLayer = Number.parseInt(layer, 10);
                    if (Number.isFinite(numericLayer)) {
                        acc[numericLayer] = snapshot;
                    }
                    return acc;
                }, {});

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
    }, [executionSelection, includeCornerSpecific, scenario, scenarioId, scenarioResources, solveScenarioLayers, solveScenarioLinkedExpectedValue]);

    React.useEffect(() => {
        if (!scenarioId || loading || error) {
            return;
        }

        let canceled = false;
        setDynamicRefreshQueued(true);

        const timeoutId = window.setTimeout(() => {
            if (canceled) {
                return;
            }

            setDynamicRefreshQueued(false);
            setRefreshingDynamicCombos(true);

            resolveDynamicCells(scenarioId, executionSelection, scenarioResources, {includeCornerSpecific})
                .then((response) => {
                    if (!canceled) {
                        setScenario(response.scenario);
                    }
                })
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
    }, [executionSelection, includeCornerSpecific, resolveDynamicCells, scenarioId, loading, error, scenarioResources]);

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
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12}}>
                <AppTypography variant="h4">View Scenario</AppTypography>
                <div style={{display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end"}}>
                    <ContentFlagButton targetType="scenario" targetId={scenarioId}/>
                    <AppButton
                        type="button"
                        disabled={refreshingDynamicCombos}
                        onClick={async () => {
                            setDynamicRefreshQueued(false);
                            setRefreshingDynamicCombos(true);
                            try {
                                const response = await resolveDynamicCells(scenarioId, executionSelection, scenarioResources, {includeCornerSpecific});
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

            <div
                style={{
                    display: "grid",
                    gap: 8,
                    marginBottom: 16,
                    border: `1px solid ${theme.fgc.border.default}`,
                    borderRadius: 8,
                    padding: 12,
                    background: theme.fgc.surface.base,
                }}
            >
                <AppTypography variant="h6">Combo Environment</AppTypography>
                {scenario.comboContext.positionLock === "corner" ? (
                    <AppChip size="small" label="Position locked: Corner" />
                ) : scenario.comboContext.positionLock === "midscreen" ? (
                    <AppChip size="small" label="Position locked: Midscreen" />
                ) : (
                    <label style={{display: "flex", alignItems: "center", gap: 8, color: theme.fgc.text.primary}}>
                        <input
                            type="checkbox"
                            checked={includeCornerSpecific}
                            onChange={(event) => setIncludeCornerSpecific(event.target.checked)}
                        />
                        <span>Include corner-specific combos</span>
                    </label>
                )}
                {scenario.comboContext.characterStatuses.length > 0 ? (
                    <div style={{display: "flex", gap: 6, flexWrap: "wrap"}}>
                        {scenario.comboContext.characterStatuses.map((status) => (
                            <AppChip key={status.object_name} size="small" variant="outlined" label={`${status.object_name}: ${String(status.status_required)}`} />
                        ))}
                    </div>
                ) : (
                    <AppTypography variant="body2" color="text.secondary">No character status locks.</AppTypography>
                )}
            </div>

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                    marginBottom: 16,
                    border: `1px solid ${theme.fgc.border.default}`,
                    borderRadius: 8,
                    padding: 10,
                    background: theme.fgc.surface.base,
                }}
            >
                <AppTypography variant="body2">Execution Mode</AppTypography>
                <AppTooltip title="Switch how dynamic combo values are calculated for this scenario view.">
                    <span style={{display: "inline-flex", cursor: "help"}}>
                        <HelpOutlineOutlinedIcon fontSize="small"/>
                    </span>
                </AppTooltip>
                <select
                    value={executionSelection.mode}
                    onChange={(event) => {
                        const nextMode = event.target.value as ScenarioExecutionSelection["mode"];
                        if (nextMode === "my_knowledge" && !isAuthenticated) {
                            return;
                        }

                        setExecutionSelection((current) => ({
                            mode: nextMode,
                            difficultyCap: nextMode === "difficulty_cap" ? current.difficultyCap ?? 3 : null,
                        }));
                    }}
                    style={{height: 36, borderRadius: 6, border: `1px solid ${theme.fgc.border.default}`, background: theme.fgc.control.default, color: theme.fgc.text.primary, padding: "0 10px"}}
                >
                    <option value="standard">Standard</option>
                    <option value="difficulty_cap">Difficulty Cap</option>
                    <option value="my_knowledge" disabled={!isAuthenticated}>My Knowledge</option>
                </select>

                {executionSelection.mode === "difficulty_cap" ? (
                    <>
                        <AppTypography variant="body2">Max Difficulty</AppTypography>
                        <select
                            value={executionSelection.difficultyCap ?? 3}
                            onChange={(event) => {
                                const nextCap = Number.parseInt(event.target.value, 10);
                                setExecutionSelection((current) => ({
                                    ...current,
                                    difficultyCap: Number.isFinite(nextCap) ? nextCap : 3,
                                }));
                            }}
                            style={{height: 36, borderRadius: 6, border: `1px solid ${theme.fgc.border.default}`, background: theme.fgc.control.default, color: theme.fgc.text.primary, padding: "0 10px"}}
                        >
                            {Array.from({length: 7}).map((_, index) => {
                                const level = index + 1;
                                return <option key={level} value={level}>{level}</option>;
                            })}
                        </select>
                    </>
                ) : null}

                {!isAuthenticated ? <AppTypography variant="body2">Sign in to use My Knowledge mode.</AppTypography> : null}
                <AppChip
                    size="small"
                    color="primary"
                    variant="outlined"
                    label={getExecutionModeBadgeLabel(executionSelection)}
                />
            </div>

            <div style={{display: "grid", gap: 6, marginBottom: 16}}>
                <AppTypography variant="h6">{scenario.name}</AppTypography>
                <AppTypography variant="body2">Type: {scenario.typeLabel}</AppTypography>
                <AppTypography variant="body2">Defender: {scenario.defenderCharacterName ?? "Unknown"}</AppTypography>
                <AppTypography variant="body2">Attacker: {scenario.attackerCharacterName ?? "Unknown"}</AppTypography>
                <AppTypography variant="body2">Trigger Move: {scenario.triggerMoveLabel ?? "Unknown"}</AppTypography>
            </div>

            <div
                style={{
                    display: "grid",
                    gap: 12,
                    marginBottom: 16,
                    border: `1px solid ${theme.fgc.border.default}`,
                    borderRadius: 8,
                    padding: 12,
                    background: theme.fgc.surface.base,
                }}
            >
                <AppTypography variant="h6">Resources</AppTypography>
                <AppTypography variant="body2" color="text.secondary">
                    Resource changes update option availability immediately. Dynamic combos refresh automatically after 1 second of no slider input.
                    {dynamicRefreshQueued ? " Refresh queued..." : refreshingDynamicCombos ? " Refreshing dynamic combos..." : ""}
                </AppTypography>
                <div
                    style={{
                        display: "grid",
                        gap: 12,
                        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    }}
                >
                    {([
                        {key: "attacker", label: "Attacker Resources", lifeMax: attackerLifeMax},
                        {key: "defender", label: "Defender Resources", lifeMax: defenderLifeMax},
                    ] as const).map((player) => {
                        const values = scenarioResources[player.key];
                        return (
                            <div
                                key={player.key}
                                style={{
                                    border: `1px solid ${theme.fgc.border.default}`,
                                    borderRadius: 8,
                                    padding: 12,
                                    display: "grid",
                                    gap: 10,
                                    background: theme.fgc.surface.subtle,
                                    minWidth: 0,
                                }}
                            >
                                <AppTypography variant="body1" sx={{fontWeight: 700}}>{player.label}</AppTypography>

                                <div style={{display: "grid", gap: 4}}>
                                    <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8}}>
                                        <AppTypography variant="body2">Health</AppTypography>
                                        <AppTypography variant="body2">{values.health} / {player.lifeMax}</AppTypography>
                                    </div>
                                    <AppSlider
                                        value={values.health}
                                        min={0}
                                        max={player.lifeMax}
                                        step={100}
                                        onChange={(_, nextValue) => {
                                            const normalized = typeof nextValue === "number" ? nextValue : values.health;
                                            setScenarioResources((current) => ({
                                                ...current,
                                                [player.key]: {
                                                    ...current[player.key],
                                                    health: Math.min(normalized, player.lifeMax),
                                                },
                                            }));
                                        }}
                                        sx={{
                                            color: theme.fgc.action.primary,
                                            "& .MuiSlider-rail": {opacity: 1, backgroundColor: theme.fgc.surface.sunken},
                                            "& .MuiSlider-track": {border: "none"},
                                        }}
                                        aria-label={`${player.label} health`}
                                    />
                                </div>

                                <div style={{display: "grid", gap: 4}}>
                                    <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8}}>
                                        <AppTypography variant="body2">Drive</AppTypography>
                                        <AppTypography variant="body2">{values.drive.toFixed(1)}</AppTypography>
                                    </div>
                                    <AppSlider
                                        value={values.drive}
                                        min={0}
                                        max={6}
                                        step={0.5}
                                        onChange={(_, nextValue) => {
                                            const normalized = typeof nextValue === "number" ? nextValue : values.drive;
                                            setScenarioResources((current) => ({
                                                ...current,
                                                [player.key]: {
                                                    ...current[player.key],
                                                    drive: normalized,
                                                },
                                            }));
                                        }}
                                        sx={{
                                            color: theme.fgc.action.secondary,
                                            "& .MuiSlider-rail": {opacity: 1, backgroundColor: theme.fgc.surface.sunken},
                                            "& .MuiSlider-track": {border: "none"},
                                        }}
                                        aria-label={`${player.label} drive`}
                                    />
                                </div>

                                <div style={{display: "grid", gap: 4}}>
                                    <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8}}>
                                        <AppTypography variant="body2">Super</AppTypography>
                                        <AppTypography variant="body2">{values.super}</AppTypography>
                                    </div>
                                    <AppSlider
                                        value={values.super}
                                        min={0}
                                        max={3}
                                        step={1}
                                        marks
                                        onChange={(_, nextValue) => {
                                            const normalized = typeof nextValue === "number" ? nextValue : values.super;
                                            setScenarioResources((current) => ({
                                                ...current,
                                                [player.key]: {
                                                    ...current[player.key],
                                                    super: normalized,
                                                },
                                            }));
                                        }}
                                        sx={{
                                            color: theme.fgc.action.primaryHover,
                                            "& .MuiSlider-rail": {opacity: 1, backgroundColor: theme.fgc.surface.sunken},
                                            "& .MuiSlider-track": {border: "none"},
                                        }}
                                        aria-label={`${player.label} super`}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {scenario.scenarioType === "aggregated_oki" ? (
                <div style={{display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap"}}>
                    <AppTypography variant="body2">Personalize Defender</AppTypography>
                    <select
                        value={personalizedDefenderId}
                        onChange={(event) => setPersonalizedDefenderId(event.target.value)}
                        style={{height: 36, borderRadius: 6, border: `1px solid ${theme.fgc.border.default}`, background: theme.fgc.control.default, color: theme.fgc.text.primary, padding: "0 10px"}}
                    >
                        <option value="">Generic (All defensive options)</option>
                        {(characters as Array<{id: string; name: string}>).map((character) => (
                            <option key={character.id} value={character.id}>{character.name}</option>
                        ))}
                    </select>
                </div>
            ) : null}

            <MatrixEditorShell
                matrix={scenario.matrix}
                attackerCharacterName={scenario.attackerCharacterName}
                defenderCharacterName={scenario.defenderCharacterName}
                editable={false}
                displayFrequenciesAsPercent
                columnVisibilityByLabel={columnVisibilityByLabel}
                onMatrixChange={() => {
                }}
                onRefreshDynamicCells={async () => {
                    setDynamicRefreshQueued(false);
                    const response = await resolveDynamicCells(scenarioId, executionSelection, scenarioResources, {includeCornerSpecific});
                    setScenario(response.scenario);
                    return response.scenario.matrix;
                }}
                layerSolveSnapshots={layerSolveSnapshots}
                currentScenarioId={scenarioId}
                linkedCellResolutions={linkedCellResolutions}
                resourceContext={scenarioResources}
            />
        </AppContainer>
    );
}
