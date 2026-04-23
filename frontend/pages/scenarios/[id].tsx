import React from "react";
import Link from "next/link";
import {useRouter} from "next/router";

import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppTooltip} from "@/src/components/ui/AppTooltip";
import {HelpOutlineOutlinedIcon} from "@/src/components/ui/AppIcons";
import {MatrixEditorShell} from "@/src/features/matrix/editor";
import {useScenarios, ScenarioDetail} from "@/hooks/useScenarios";
import {hasJwtToken, useExecutionProfile} from "@/hooks/useExecutionProfile";
import {ContentFlagButton} from "@/src/components/flags/ContentFlagButton";
import {ScenarioExecutionSelection} from "@/src/types/scenarioExecution";
import {useCharacters} from "@/hooks/useCharacters";

const DEFAULT_EXECUTION_SELECTION: ScenarioExecutionSelection = {
    mode: "standard",
    difficultyCap: null,
};

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

    const {getScenario, resolveDynamicCells, getAggregatedDefenseCapabilities} = useScenarios();
    const {getExecutionPreference} = useExecutionProfile();
    const {characters} = useCharacters();
    const [scenario, setScenario] = React.useState<ScenarioDetail | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [refreshingDynamicCombos, setRefreshingDynamicCombos] = React.useState(false);
    const [executionSelection, setExecutionSelection] = React.useState<ScenarioExecutionSelection>(DEFAULT_EXECUTION_SELECTION);
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [personalizedDefenderId, setPersonalizedDefenderId] = React.useState("");
    const [columnVisibilityByLabel, setColumnVisibilityByLabel] = React.useState<Record<string, boolean> | null>(null);

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
        if (!scenarioId || loading || error) {
            return;
        }

        let canceled = false;
        setRefreshingDynamicCombos(true);

        resolveDynamicCells(scenarioId, executionSelection)
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

        return () => {
            canceled = true;
        };
    }, [executionSelection, resolveDynamicCells, scenarioId, loading, error]);

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
                            setRefreshingDynamicCombos(true);
                            try {
                                const response = await resolveDynamicCells(scenarioId, executionSelection);
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
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                    marginBottom: 16,
                    border: "1px solid #e3e3e3",
                    borderRadius: 8,
                    padding: 10,
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
                    style={{height: 36, borderRadius: 6, border: "1px solid #d9d9d9", padding: "0 10px"}}
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
                            style={{height: 36, borderRadius: 6, border: "1px solid #d9d9d9", padding: "0 10px"}}
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

            {scenario.scenarioType === "aggregated_oki" ? (
                <div style={{display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap"}}>
                    <AppTypography variant="body2">Personalize Defender</AppTypography>
                    <select
                        value={personalizedDefenderId}
                        onChange={(event) => setPersonalizedDefenderId(event.target.value)}
                        style={{height: 36, borderRadius: 6, border: "1px solid #d9d9d9", padding: "0 10px"}}
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
                editable={false}
                columnVisibilityByLabel={columnVisibilityByLabel}
                onMatrixChange={() => {
                }}
                onRefreshDynamicCells={async () => {
                    const response = await resolveDynamicCells(scenarioId, executionSelection);
                    setScenario(response.scenario);
                    return response.scenario.matrix;
                }}
            />
        </AppContainer>
    );
}
