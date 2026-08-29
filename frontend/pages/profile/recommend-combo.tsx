import React from "react";
import Link from "next/link";

import {AppButton} from "@/src/components/ui/AppButton";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {useExecutionProfile} from "@/hooks/useExecutionProfile";
import {ComboKnowledgeItem, ComboRecommendationItem} from "@/src/types/scenarioExecution";
import AuthContext from "@/services/AuthContext";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";

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
    const authContext = React.useContext(AuthContext);
    const authLoading = authContext?.loading ?? true;
    const isAuthenticated = authContext?.isAuthenticated ?? false;

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
        if (authLoading) {
            return;
        }

        if (!isAuthenticated) {
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
    }, [authLoading, getComboKnowledge, isAuthenticated]);

    if (!authContext) {
        throw new Error("AuthContext must be used within an AuthProvider");
    }

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
            <AppContainer maxWidth={false} sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3, xl: 4}}}>
                <PageShell title="Recommend Combo">
                    <InlineNotice severity="info">Please sign in to access personalized combo recommendations.</InlineNotice>
                </PageShell>
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
        <AppContainer maxWidth={false} sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3, xl: 4}}}>
            <PageShell title="Recommend Combo" badgeLabel={didSearch ? `${recommendations.length} matches` : "Ready"}>
                {error ? <InlineNotice severity="error">{error}</InlineNotice> : null}

                <SectionCard title="Recommendation Filters" variant="input" tone="raised">
                    <AppBox sx={(theme) => ({
                        display: "grid",
                        gridTemplateColumns: {xs: "1fr", sm: "repeat(2, minmax(0, 220px))", md: "repeat(3, minmax(0, 220px))"},
                        gap: 1.5,
                        alignItems: "center",
                        "& .recommend-control": {
                            height: 38,
                            width: "100%",
                            borderRadius: 1,
                            border: `1px solid ${theme.fgc.border.default}`,
                            padding: "0 10px",
                            backgroundColor: theme.fgc.control.default,
                            color: theme.fgc.text.primary,
                        },
                    })}>
                        <select
                            className="recommend-control"
                            aria-label="Recommendation character"
                            value={selectedCharacterId}
                            onChange={async (event) => {
                                const characterId = event.target.value;
                                setDidSearch(false);
                                setRecommendations([]);
                                setEssentialScenarioCount(0);
                                setSelectedCharacterId(characterId);
                                await loadForCharacter(characterId);
                            }}
                        >
                            {characters.map((character) => (
                                <option key={character.id} value={character.id}>{character.name}</option>
                            ))}
                        </select>

                        <select
                            className="recommend-control"
                            aria-label="Recommendation difficulty cap"
                            value={selectedDifficultyCap ?? ""}
                            onChange={(event) => {
                                const parsed = Number.parseInt(event.target.value, 10);
                                setSelectedDifficultyCap(Number.isFinite(parsed) ? parsed : null);
                            }}
                            disabled={difficultyOptions.length === 0}
                        >
                            {difficultyOptions.length === 0 ? <option value="">No difficulty data</option> : null}
                            {difficultyOptions.map((difficulty) => (
                                <option key={difficulty} value={difficulty}>Difficulty {difficulty}</option>
                            ))}
                        </select>

                        <AppButton
                            type="button"
                            sx={{width: {xs: "100%", sm: "auto"}}}
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
                    </AppBox>
                </SectionCard>

            {didSearch ? (
                <SectionCard title="Recommendations" variant="review">
                    <AppTypography variant="body2" color="text.secondary">Essential scenarios analyzed: {essentialScenarioCount}</AppTypography>
                    {recommendations.length === 0 ? (
                        <InlineNotice severity="info">No remaining essential combos match your selected character and difficulty cap.</InlineNotice>
                    ) : null}

                    <AppBox sx={{display: "grid", gap: 1}}>
                        {recommendations.map((recommendation, index) => (
                            <AppBox key={recommendation.comboId} sx={{border: "1px solid", borderColor: "fgc.border.default", borderRadius: 1.25, p: {xs: 1.25, md: 1.5}, display: "grid", gap: 0.75, backgroundColor: "fgc.surface.subtle"}}>
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
                            </AppBox>
                        ))}
                    </AppBox>
                </SectionCard>
            ) : null}
            </PageShell>
        </AppContainer>
    );
}
