import React from "react";

import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppTooltip} from "@/src/components/ui/AppTooltip";
import {HelpOutlineOutlinedIcon} from "@/src/components/ui/AppIcons";
import {useExecutionProfile} from "@/hooks/useExecutionProfile";
import {ComboKnowledgeItem, ScenarioExecutionSelection} from "@/src/types/scenarioExecution";
import AuthContext from "@/services/AuthContext";

function knownComboIds(combos: ComboKnowledgeItem[]): number[] {
    const ids: number[] = [];
    for (const combo of combos) {
        if (combo.known) {
            ids.push(combo.id);
        }
    }

    return ids;
}

function visibleCombos(combos: ComboKnowledgeItem[], difficultyFilter: number | null): ComboKnowledgeItem[] {
    if (difficultyFilter === null) {
        return combos;
    }

    const visible: ComboKnowledgeItem[] = [];
    for (const combo of combos) {
        if (combo.difficultyLevel !== null && combo.difficultyLevel <= difficultyFilter) {
            visible.push(combo);
        }
    }

    return visible;
}

interface DefaultScenarioModeSectionProps {
    executionSelection: ScenarioExecutionSelection;
    savingPreference: boolean;
    onSelectionChange: React.Dispatch<React.SetStateAction<ScenarioExecutionSelection>>;
    onSave: () => Promise<void>;
}

function DefaultScenarioModeSection({executionSelection, savingPreference, onSelectionChange, onSave}: DefaultScenarioModeSectionProps) {
    return (
        <div style={{display: "grid", gap: 12, marginBottom: 24, border: "1px solid #e5e5e5", borderRadius: 8, padding: 12}}>
            <AppTypography variant="h6">Default Scenario Mode</AppTypography>
            <AppTypography variant="body2">Set how scenario values are calculated when you open a scenario page.</AppTypography>

            <div style={{display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap"}}>
                <span style={{display: "inline-flex", alignItems: "center", gap: 6}}>
                    <AppTypography variant="body2">My Current Knowledge</AppTypography>
                    <AppTooltip title="Use only combos you marked as known in Combo Knowledge."><span style={{display: "inline-flex", cursor: "help"}}><HelpOutlineOutlinedIcon fontSize="small"/></span></AppTooltip>
                </span>
                <span style={{display: "inline-flex", alignItems: "center", gap: 6}}>
                    <AppTypography variant="body2">Standard Assumption</AppTypography>
                    <AppTooltip title="Use a practical default combo pool for quick browsing and guest mode."><span style={{display: "inline-flex", cursor: "help"}}><HelpOutlineOutlinedIcon fontSize="small"/></span></AppTooltip>
                </span>
                <span style={{display: "inline-flex", alignItems: "center", gap: 6}}>
                    <AppTypography variant="body2">Difficulty Cap</AppTypography>
                    <AppTooltip title="Include all combos with difficulty less than or equal to your selected cap."><span style={{display: "inline-flex", cursor: "help"}}><HelpOutlineOutlinedIcon fontSize="small"/></span></AppTooltip>
                </span>
            </div>

            <div style={{display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap"}}>
                <select
                    aria-label="Default scenario mode"
                    value={executionSelection.mode}
                    onChange={(event) => {
                        const nextMode = event.target.value as ScenarioExecutionSelection["mode"];
                        onSelectionChange((current) => ({mode: nextMode, difficultyCap: nextMode === "difficulty_cap" ? current.difficultyCap ?? 3 : null}));
                    }}
                    style={{height: 38, borderRadius: 6, border: "1px solid #d9d9d9", padding: "0 10px"}}
                >
                    <option value="my_knowledge">My Current Knowledge</option>
                    <option value="standard">Standard Assumption</option>
                    <option value="difficulty_cap">Difficulty Cap</option>
                </select>

                {executionSelection.mode === "difficulty_cap" ? (
                    <select
                        aria-label="Default difficulty cap"
                        value={executionSelection.difficultyCap ?? 3}
                        onChange={(event) => {
                            const cap = Number.parseInt(event.target.value, 10);
                            onSelectionChange((current) => ({...current, difficultyCap: Number.isFinite(cap) ? cap : 3}));
                        }}
                        style={{height: 38, borderRadius: 6, border: "1px solid #d9d9d9", padding: "0 10px"}}
                    >
                        {Array.from({length: 7}).map((_, index) => {
                            const level = index + 1;
                            return <option key={level} value={level}>Difficulty {level}</option>;
                        })}
                    </select>
                ) : null}

                <AppButton type="button" disabled={savingPreference} onClick={() => void onSave()}>{savingPreference ? "Saving..." : "Save Mode"}</AppButton>
            </div>
        </div>
    );
}

interface ComboKnowledgeSectionProps {
    characters: Array<{id: string; name: string}>;
    selectedCharacterId: string;
    combos: ComboKnowledgeItem[];
    difficultyFilter: number | null;
    savingKnowledge: boolean;
    onCharacterChange: (characterId: string) => Promise<void>;
    onCombosChange: React.Dispatch<React.SetStateAction<ComboKnowledgeItem[]>>;
    onDifficultyFilterChange: (value: number | null) => void;
    onSave: () => Promise<void>;
}

function ComboKnowledgeSection({characters, selectedCharacterId, combos, difficultyFilter, savingKnowledge, onCharacterChange, onCombosChange, onDifficultyFilterChange, onSave}: ComboKnowledgeSectionProps) {
    return (
        <div style={{display: "grid", gap: 12, border: "1px solid #e5e5e5", borderRadius: 8, padding: 12}}>
            <AppTypography variant="h6">Combo Knowledge</AppTypography>
            <AppTypography variant="body2">Mark combos you can execute today. This powers &quot;My Current Knowledge&quot; mode.</AppTypography>

            <div style={{display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap"}}>
                <select aria-label="Combo knowledge character" value={selectedCharacterId} onChange={(event) => void onCharacterChange(event.target.value)} style={{height: 38, borderRadius: 6, border: "1px solid #d9d9d9", padding: "0 10px"}}>
                    {characters.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}
                </select>

                <AppButton type="button" variant="outlined" onClick={() => onCombosChange((current) => current.map((combo) => ({...combo, known: true})))}>Mark All Known</AppButton>
                <AppButton type="button" variant="outlined" onClick={() => onCombosChange((current) => current.map((combo) => ({...combo, known: false})))}>Clear All</AppButton>

                <select
                    aria-label="Mark known combos by difficulty"
                    defaultValue=""
                    onChange={(event) => {
                        const cap = Number.parseInt(event.target.value, 10);
                        if (Number.isFinite(cap)) {
                            onCombosChange((current) => current.map((combo) => ({...combo, known: combo.difficultyLevel !== null && combo.difficultyLevel <= cap})));
                        }
                    }}
                    style={{height: 38, borderRadius: 6, border: "1px solid #d9d9d9", padding: "0 10px"}}
                >
                    <option value="">Mark known up to difficulty...</option>
                    {Array.from({length: 7}).map((_, index) => {
                        const level = index + 1;
                        return <option key={level} value={level}>Up to {level}</option>;
                    })}
                </select>

                <select
                    aria-label="Filter combos by difficulty"
                    value={difficultyFilter ?? ""}
                    onChange={(event) => {
                        const value = event.target.value;
                        if (value === "") {
                            onDifficultyFilterChange(null);
                            return;
                        }

                        const parsed = Number.parseInt(value, 10);
                        onDifficultyFilterChange(Number.isFinite(parsed) ? parsed : null);
                    }}
                    style={{height: 38, borderRadius: 6, border: "1px solid #d9d9d9", padding: "0 10px"}}
                >
                    <option value="">All difficulties</option>
                    {Array.from({length: 7}).map((_, index) => {
                        const level = index + 1;
                        return <option key={level} value={level}>Up to {level}</option>;
                    })}
                </select>

                <AppButton type="button" disabled={savingKnowledge || !selectedCharacterId} onClick={() => void onSave()}>{savingKnowledge ? "Saving..." : "Save Knowledge"}</AppButton>
            </div>

            <div style={{display: "grid", gap: 6}}>
                {combos.length === 0 ? <AppTypography>No combos found for this character.</AppTypography> : null}
                {visibleCombos(combos, difficultyFilter).map((combo) => (
                    <label key={combo.id} style={{display: "grid", gridTemplateColumns: "minmax(220px, 1fr) 110px 120px", alignItems: "center", gap: 12, border: "1px solid #efefef", borderRadius: 6, padding: "8px 10px"}}>
                        <AppTypography variant="body2">{combo.name}</AppTypography>
                        <AppTypography variant="body2">Difficulty: {combo.difficultyLevel ?? "-"}</AppTypography>
                        <span style={{display: "flex", alignItems: "center", gap: 8}}>
                            <input type="checkbox" checked={combo.known} onChange={(event) => {
                                const checked = event.target.checked;
                                onCombosChange((current) => current.map((row) => row.id === combo.id ? {...row, known: checked} : row));
                            }} />
                            <AppTypography variant="body2">Known</AppTypography>
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );
}

export default function ProfilePage() {
    const {
        getComboKnowledge,
        updateComboKnowledge,
        getExecutionPreference,
        updateExecutionPreference,
    } = useExecutionProfile();
    const authContext = React.useContext(AuthContext);
    const authLoading = authContext?.loading ?? true;
    const isAuthenticated = authContext?.isAuthenticated ?? false;

    const [loading, setLoading] = React.useState(true);
    const [savingKnowledge, setSavingKnowledge] = React.useState(false);
    const [savingPreference, setSavingPreference] = React.useState(false);
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
        ])
            .then(([preference, knowledge]) => {
                if (canceled) {
                    return;
                }

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
    }, [authLoading, getComboKnowledge, getExecutionPreference, isAuthenticated]);

    if (!authContext) {
        throw new Error("AuthContext must be used within an AuthProvider");
    }

    if (!isAuthenticated) {
        return (
            <AppContainer maxWidth={false}>
                <AppTypography variant="h4" gutterBottom>Profile</AppTypography>
                <AppTypography>Please sign in to manage your execution profile.</AppTypography>
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
        <AppContainer maxWidth={false}>
            <AppTypography variant="h4" gutterBottom>Execution Profile</AppTypography>
            {error ? <AppTypography color="error">{error}</AppTypography> : null}
            {saveMessage ? <AppTypography color="success.main">{saveMessage}</AppTypography> : null}

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
        </AppContainer>
    );
}
