import React from "react";

import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppTooltip} from "@/src/components/ui/AppTooltip";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppCheckbox} from "@/src/components/ui/AppCheckbox";
import {HelpOutlineOutlinedIcon} from "@/src/components/ui/AppIcons";
import {useExecutionProfile} from "@/hooks/useExecutionProfile";
import {ComboKnowledgeItem, ScenarioExecutionSelection} from "@/src/types/scenarioExecution";
import AuthContext from "@/services/AuthContext";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";

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
        <SectionCard title="Default Scenario Mode" variant="input" tone="raised">
            <AppBox sx={{display: "flex", gap: {xs: 1, md: 2}, alignItems: {xs: "flex-start", md: "center"}, flexDirection: {xs: "column", sm: "row"}, flexWrap: "wrap"}}>
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
            </AppBox>

            <AppBox sx={(theme) => ({
                display: "grid",
                gridTemplateColumns: {xs: "1fr", sm: "repeat(2, minmax(0, 220px))", md: "repeat(3, minmax(0, 220px))"},
                gap: 1.5,
                alignItems: "center",
                "& .profile-control": {
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
                    className="profile-control"
                    aria-label="Default scenario mode"
                    value={executionSelection.mode}
                    onChange={(event) => {
                        const nextMode = event.target.value as ScenarioExecutionSelection["mode"];
                        onSelectionChange((current) => ({mode: nextMode, difficultyCap: nextMode === "difficulty_cap" ? current.difficultyCap ?? 3 : null}));
                    }}
                >
                    <option value="my_knowledge">My Current Knowledge</option>
                    <option value="standard">Standard Assumption</option>
                    <option value="difficulty_cap">Difficulty Cap</option>
                </select>

                {executionSelection.mode === "difficulty_cap" ? (
                    <select
                        className="profile-control"
                        aria-label="Default difficulty cap"
                        value={executionSelection.difficultyCap ?? 3}
                        onChange={(event) => {
                            const cap = Number.parseInt(event.target.value, 10);
                            onSelectionChange((current) => ({...current, difficultyCap: Number.isFinite(cap) ? cap : 3}));
                        }}
                    >
                        {Array.from({length: 7}).map((_, index) => {
                            const level = index + 1;
                            return <option key={level} value={level}>Difficulty {level}</option>;
                        })}
                    </select>
                ) : null}

                <AppButton type="button" disabled={savingPreference} onClick={() => void onSave()} sx={{width: {xs: "100%", sm: "auto"}}}>{savingPreference ? "Saving..." : "Save Mode"}</AppButton>
            </AppBox>
        </SectionCard>
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
        <SectionCard title="Combo Knowledge" variant="review">
            <AppBox sx={(theme) => ({
                display: "grid",
                gridTemplateColumns: {xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "minmax(180px, 240px) auto auto minmax(190px, 240px) minmax(150px, 200px) auto"},
                gap: 1.5,
                alignItems: "center",
                "& .profile-control": {
                    height: 38,
                    width: "100%",
                    borderRadius: 1,
                    border: `1px solid ${theme.fgc.border.default}`,
                    padding: "0 10px",
                    backgroundColor: theme.fgc.control.default,
                    color: theme.fgc.text.primary,
                },
            })}>
                <select className="profile-control" aria-label="Combo knowledge character" value={selectedCharacterId} onChange={(event) => void onCharacterChange(event.target.value)}>
                    {characters.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}
                </select>

                <AppButton type="button" variant="outlined" onClick={() => onCombosChange((current) => current.map((combo) => ({...combo, known: true})))} sx={{width: {xs: "100%", lg: "auto"}}}>Mark All Known</AppButton>
                <AppButton type="button" variant="outlined" onClick={() => onCombosChange((current) => current.map((combo) => ({...combo, known: false})))} sx={{width: {xs: "100%", lg: "auto"}}}>Clear All</AppButton>

                <select
                    className="profile-control"
                    aria-label="Mark known combos by difficulty"
                    defaultValue=""
                    onChange={(event) => {
                        const cap = Number.parseInt(event.target.value, 10);
                        if (Number.isFinite(cap)) {
                            onCombosChange((current) => current.map((combo) => ({...combo, known: combo.difficultyLevel !== null && combo.difficultyLevel <= cap})));
                        }
                    }}
                >
                    <option value="">Mark known up to difficulty...</option>
                    {Array.from({length: 7}).map((_, index) => {
                        const level = index + 1;
                        return <option key={level} value={level}>Up to {level}</option>;
                    })}
                </select>

                <select
                    className="profile-control"
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
                >
                    <option value="">All difficulties</option>
                    {Array.from({length: 7}).map((_, index) => {
                        const level = index + 1;
                        return <option key={level} value={level}>Up to {level}</option>;
                    })}
                </select>

                <AppButton type="button" disabled={savingKnowledge || !selectedCharacterId} onClick={() => void onSave()} sx={{width: {xs: "100%", lg: "auto"}}}>{savingKnowledge ? "Saving..." : "Save Knowledge"}</AppButton>
            </AppBox>

            <AppBox sx={{display: "grid", gap: 0.75}}>
                {combos.length === 0 ? <AppTypography>No combos found for this character.</AppTypography> : null}
                {visibleCombos(combos, difficultyFilter).map((combo) => (
                    <AppBox component="label" key={combo.id} sx={(theme) => ({display: "grid", gridTemplateColumns: {xs: "1fr", md: "minmax(220px, 1fr) 110px 120px"}, alignItems: {xs: "flex-start", md: "center"}, gap: {xs: 0.75, md: 1.5}, border: `1px solid ${theme.fgc.border.subtle}`, borderRadius: 1, px: {xs: 1, md: 1.25}, py: 1, backgroundColor: theme.fgc.surface.subtle})}>
                        <AppTypography variant="body2">{combo.name}</AppTypography>
                        <AppTypography variant="body2">Difficulty: {combo.difficultyLevel ?? "-"}</AppTypography>
                        <span style={{display: "flex", alignItems: "center", gap: 8}}>
                            <AppCheckbox size="small" checked={combo.known} onChange={(event) => {
                                const checked = event.target.checked;
                                onCombosChange((current) => current.map((row) => row.id === combo.id ? {...row, known: checked} : row));
                            }} />
                            <AppTypography variant="body2">Known</AppTypography>
                        </span>
                    </AppBox>
                ))}
            </AppBox>
        </SectionCard>
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
            </PageShell>
        </AppContainer>
    );
}
