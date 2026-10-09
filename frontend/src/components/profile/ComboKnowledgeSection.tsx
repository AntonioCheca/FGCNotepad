import React from "react";

import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppCheckbox} from "@/src/components/ui/AppCheckbox";
import {ComboKnowledgeItem} from "@/src/types/scenarioExecution";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {visibleCombos} from "@/src/components/profile/comboKnowledge";

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

export function ComboKnowledgeSection({characters, selectedCharacterId, combos, difficultyFilter, savingKnowledge, onCharacterChange, onCombosChange, onDifficultyFilterChange, onSave}: ComboKnowledgeSectionProps) {
    return (
        <SectionCard title="Combo Knowledge">
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
