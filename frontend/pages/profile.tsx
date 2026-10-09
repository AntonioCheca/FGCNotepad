import React from "react";

import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {useExecutionProfile} from "@/hooks/useExecutionProfile";
import {ComboKnowledgeItem, ScenarioExecutionSelection} from "@/src/types/scenarioExecution";
import AuthContext from "@/services/AuthContext";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import AccountDeletionSection from "@/src/components/profile/AccountDeletionSection";
import type {ComboExecutionMode} from "@/src/types/comboExecution";
import {DefaultScenarioModeSection} from "@/src/components/profile/DefaultScenarioModeSection";
import {ControlsSection} from "@/src/components/profile/ControlsSection";
import {knownComboIds} from "@/src/components/profile/comboKnowledge";
import {ComboKnowledgeSection} from "@/src/components/profile/ComboKnowledgeSection";

export default function ProfilePage() {
    const {
        getComboKnowledge,
        updateComboKnowledge,
        getExecutionPreference,
        updateExecutionPreference,
        getComboExecutionMode,
        updateComboExecutionMode,
    } = useExecutionProfile();
    const authContext = React.useContext(AuthContext);
    const authLoading = authContext?.loading ?? true;
    const isAuthenticated = authContext?.isAuthenticated ?? false;

    const [loading, setLoading] = React.useState(true);
    const [savingKnowledge, setSavingKnowledge] = React.useState(false);
    const [savingPreference, setSavingPreference] = React.useState(false);
    const [savingControls, setSavingControls] = React.useState(false);
    const [comboExecutionMode, setComboExecutionMode] = React.useState<ComboExecutionMode>("classic");
    const [error, setError] = React.useState<string | null>(null);
    const [saveMessage, setSaveMessage] = React.useState<string | null>(null);

    const [characters, setCharacters] = React.useState<Array<{id: string; name: string}>>([]);
    const [selectedCharacterId, setSelectedCharacterId] = React.useState<string>("");
    const [combos, setCombos] = React.useState<ComboKnowledgeItem[]>([]);
    const [difficultyFilter, setDifficultyFilter] = React.useState<number | null>(null);
    const [executionSelection, setExecutionSelection] = React.useState<ScenarioExecutionSelection>({
        mode: "standard",
        difficultyCap: null,
    });

    const loadForCharacter = React.useCallback(async (characterId?: string) => {
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
            setLoading(false);
            return;
        }

        let canceled = false;
        setLoading(true);
        setError(null);

        Promise.all([
            getExecutionPreference(),
            getComboKnowledge(),
            getComboExecutionMode(),
        ])
            .then(([preference, knowledge, controls]) => {
                if (canceled) {
                    return;
                }

                setComboExecutionMode(controls.comboExecutionMode);
                setExecutionSelection({
                    mode: preference.defaultMode,
                    difficultyCap: preference.difficultyCap,
                });
                setCharacters(knowledge.characters);
                setSelectedCharacterId(knowledge.selectedCharacterId ?? "");
                setCombos(knowledge.combos);
            })
            .catch(() => {
                if (!canceled) {
                    setError("Unable to load profile data.");
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
    }, [authLoading, getComboExecutionMode, getComboKnowledge, getExecutionPreference, isAuthenticated]);

    if (!authContext) {
        throw new Error("AuthContext must be used within an AuthProvider");
    }

    if (!isAuthenticated) {
        return (
            <AppContainer maxWidth={false} sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3, xl: 4}}}>
                <PageShell title="Profile">
                    <InlineNotice severity="info">Please sign in to manage your execution profile.</InlineNotice>
                </PageShell>
            </AppContainer>
        );
    }

    if (loading) {
        return (
            <AppContainer maxWidth={false}>
                <AppCircularProgress/>
            </AppContainer>
        );
    }

    return (
        <AppContainer maxWidth={false} sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3, xl: 4}}}>
            <PageShell title="Execution Profile" badgeLabel={selectedCharacterId ? `${combos.length} combos` : "No character"}>
                {error ? <InlineNotice severity="error">{error}</InlineNotice> : null}
                {saveMessage ? <InlineNotice severity="success">{saveMessage}</InlineNotice> : null}

                <ControlsSection
                    mode={comboExecutionMode}
                    saving={savingControls}
                    onModeChange={setComboExecutionMode}
                    onSave={async () => {
                        setSavingControls(true);
                        setSaveMessage(null);
                        try {
                            const updated = await updateComboExecutionMode(comboExecutionMode);
                            setComboExecutionMode(updated.comboExecutionMode);
                            setSaveMessage("Controls saved.");
                        } catch {
                            setError("Unable to save controls.");
                        } finally {
                            setSavingControls(false);
                        }
                    }}
                />

                <DefaultScenarioModeSection
                    executionSelection={executionSelection}
                    savingPreference={savingPreference}
                    onSelectionChange={setExecutionSelection}
                    onSave={async () => {
                        setSavingPreference(true);
                        setSaveMessage(null);
                        try {
                            const updated = await updateExecutionPreference(executionSelection);
                            setExecutionSelection({mode: updated.defaultMode, difficultyCap: updated.difficultyCap});
                            setSaveMessage("Scenario mode preference saved.");
                        } catch {
                            setError("Unable to save scenario preference.");
                        } finally {
                            setSavingPreference(false);
                        }
                    }}
                />

                <ComboKnowledgeSection
                    characters={characters}
                    selectedCharacterId={selectedCharacterId}
                    combos={combos}
                    difficultyFilter={difficultyFilter}
                    savingKnowledge={savingKnowledge}
                    onCharacterChange={async (characterId) => {
                        setSelectedCharacterId(characterId);
                        await loadForCharacter(characterId);
                    }}
                    onCombosChange={setCombos}
                    onDifficultyFilterChange={setDifficultyFilter}
                    onSave={async () => {
                        if (!selectedCharacterId) {
                            return;
                        }

                        setSavingKnowledge(true);
                        setSaveMessage(null);
                        try {
                            await updateComboKnowledge(selectedCharacterId, knownComboIds(combos));
                            setSaveMessage("Combo knowledge saved.");
                        } catch {
                            setError("Unable to save combo knowledge.");
                        } finally {
                            setSavingKnowledge(false);
                        }
                    }}
                />

                <AccountDeletionSection/>
            </PageShell>
        </AppContainer>
    );
}
