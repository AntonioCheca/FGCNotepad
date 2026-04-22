import React from "react";
import Link from "next/link";

import {AppButton} from "@/src/components/ui/AppButton";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {hasJwtToken, useExecutionProfile} from "@/hooks/useExecutionProfile";
import {ComboKnowledgeItem, ComboRecommendationItem} from "@/src/types/scenarioExecution";

function buildDifficultyOptions(combos: ComboKnowledgeItem[]): number[] {
    const values = new Set<number>();

    combos.forEach((combo) => {
        if (typeof combo.difficultyLevel === "number") {
            values.add(combo.difficultyLevel);
        }
    });

    return Array.from(values).sort((left, right) => left - right);
}

export default function RecommendComboPage() {
    const {getComboKnowledge, getComboRecommendations} = useExecutionProfile();

    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const [characters, setCharacters] = React.useState<Array<{id: string; name: string}>>([]);
    const [selectedCharacterId, setSelectedCharacterId] = React.useState<string>("");
    const [combos, setCombos] = React.useState<ComboKnowledgeItem[]>([]);
    const [selectedDifficultyCap, setSelectedDifficultyCap] = React.useState<number | null>(null);

    const [essentialScenarioCount, setEssentialScenarioCount] = React.useState<number>(0);
    const [recommendations, setRecommendations] = React.useState<ComboRecommendationItem[]>([]);
    const [didSearch, setDidSearch] = React.useState(false);

    const loadForCharacter = React.useCallback(async (characterId: string) => {
        const knowledge = await getComboKnowledge(characterId);
        setCharacters(knowledge.characters);
        setSelectedCharacterId(knowledge.selectedCharacterId ?? "");
        setCombos(knowledge.combos);
    }, [getComboKnowledge]);

    React.useEffect(() => {
        const authenticated = hasJwtToken();
        setIsAuthenticated(authenticated);

        if (!authenticated) {
            setIsLoading(false);
            return;
        }

        let canceled = false;
        setIsLoading(true);
        setError(null);

        getComboKnowledge()
            .then((knowledge) => {
                if (canceled) {
                    return;
                }

                setCharacters(knowledge.characters);
                setSelectedCharacterId(knowledge.selectedCharacterId ?? "");
                setCombos(knowledge.combos);
            })
            .catch(() => {
                if (!canceled) {
                    setError("Unable to load character combo data.");
                }
            })
            .finally(() => {
                if (!canceled) {
                    setIsLoading(false);
                }
            });

        return () => {
            canceled = true;
        };
    }, [getComboKnowledge]);

    const difficultyOptions = React.useMemo(() => buildDifficultyOptions(combos), [combos]);

    React.useEffect(() => {
        if (difficultyOptions.length === 0) {
            setSelectedDifficultyCap(null);
            return;
        }

        setSelectedDifficultyCap((current) => {
            if (current !== null && difficultyOptions.includes(current)) {
                return current;
            }

            return difficultyOptions[0];
        });
    }, [difficultyOptions]);

    if (!isAuthenticated) {
        return (
            <AppContainer maxWidth={false}>
                <AppTypography variant="h4" gutterBottom>Recommend me a new combo</AppTypography>
                <AppTypography>Please sign in to access personalized combo recommendations.</AppTypography>
            </AppContainer>
        );
    }

    if (isLoading) {
        return (
            <AppContainer maxWidth={false}>
                <AppCircularProgress/>
            </AppContainer>
        );
    }

    return (
        <AppContainer maxWidth={false}>
            <AppTypography variant="h4" gutterBottom>Recommend me a new combo</AppTypography>
            <AppTypography variant="body2" sx={{mb: 2}}>
                Pick a character and difficulty cap to find the highest-impact essential combo you have not learned yet.
            </AppTypography>

            {error ? <AppTypography color="error" sx={{mb: 2}}>{error}</AppTypography> : null}

            <div style={{display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 16}}>
                <select
                    value={selectedCharacterId}
                    onChange={async (event) => {
                        const characterId = event.target.value;
                        setDidSearch(false);
                        setRecommendations([]);
                        setEssentialScenarioCount(0);
                        setSelectedCharacterId(characterId);
                        await loadForCharacter(characterId);
                    }}
                    style={{height: 38, borderRadius: 6, border: "1px solid #d9d9d9", padding: "0 10px"}}
                >
                    {characters.map((character) => (
                        <option key={character.id} value={character.id}>{character.name}</option>
                    ))}
                </select>

                <select
                    value={selectedDifficultyCap ?? ""}
                    onChange={(event) => {
                        const parsed = Number.parseInt(event.target.value, 10);
                        setSelectedDifficultyCap(Number.isFinite(parsed) ? parsed : null);
                    }}
                    style={{height: 38, borderRadius: 6, border: "1px solid #d9d9d9", padding: "0 10px"}}
                    disabled={difficultyOptions.length === 0}
                >
                    {difficultyOptions.length === 0 ? <option value="">No difficulty data</option> : null}
                    {difficultyOptions.map((difficulty) => (
                        <option key={difficulty} value={difficulty}>Difficulty {difficulty}</option>
                    ))}
                </select>

                <AppButton
                    type="button"
                    disabled={
                        isSubmitting
                        || !selectedCharacterId
                        || selectedDifficultyCap === null
                    }
                    onClick={async () => {
                        if (!selectedCharacterId || selectedDifficultyCap === null) {
                            return;
                        }

                        setIsSubmitting(true);
                        setError(null);

                        try {
                            const response = await getComboRecommendations(selectedCharacterId, selectedDifficultyCap);
                            setEssentialScenarioCount(response.essentialScenarioCount);
                            setRecommendations(response.recommendations);
                            setDidSearch(true);
                        } catch {
                            setError("Unable to calculate recommendations for the selected filters.");
                            setRecommendations([]);
                            setEssentialScenarioCount(0);
                            setDidSearch(true);
                        } finally {
                            setIsSubmitting(false);
                        }
                    }}
                >
                    {isSubmitting ? "Calculating..." : "Recommend Combo"}
                </AppButton>
            </div>

            {didSearch ? (
                <div style={{display: "grid", gap: 10}}>
                    <AppTypography variant="body2">
                        Essential scenarios analyzed: {essentialScenarioCount}
                    </AppTypography>

                    {recommendations.length === 0 ? (
                        <AppTypography>
                            No remaining essential combos match your selected character and difficulty cap.
                        </AppTypography>
                    ) : null}

                    {recommendations.map((recommendation, index) => (
                        <div
                            key={recommendation.comboId}
                            style={{
                                border: "1px solid #ececec",
                                borderRadius: 8,
                                padding: "10px 12px",
                                display: "grid",
                                gap: 6,
                            }}
                        >
                            <AppTypography variant="h6">
                                #{index + 1} {recommendation.comboName}
                            </AppTypography>
                            <AppTypography variant="body2">Combo ID: {recommendation.comboId}</AppTypography>
                            <AppTypography variant="body2">
                                Average EV gain per essential scenario: {recommendation.averageEvGainPerScenario.toFixed(2)}
                            </AppTypography>
                            <Link href={recommendation.comboLink} style={{textDecoration: "none", width: "fit-content"}}>
                                <AppButton type="button" variant="outlined">Open combo list</AppButton>
                            </Link>
                        </div>
                    ))}
                </div>
            ) : null}
        </AppContainer>
    );
}
