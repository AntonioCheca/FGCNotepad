import React from "react";

import {useFrameDataModeration} from "@/hooks/useFrameDataModeration";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppCheckbox} from "@/src/components/ui/AppCheckbox";
import {AppTable} from "@/src/components/ui/AppTable";
import {AppTableBody} from "@/src/components/ui/AppTableBody";
import {AppTableCell} from "@/src/components/ui/AppTableCell";
import {AppTableContainer} from "@/src/components/ui/AppTableContainer";
import {AppTableHead} from "@/src/components/ui/AppTableHead";
import {AppTableRow} from "@/src/components/ui/AppTableRow";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import type {FrameDataModerationMove, ModernAutoComboStrength, ModernAutoCombos, MoveModernData} from "@/src/types/frameDataModeration";

const AUTO_COMBO_STRENGTHS: ReadonlyArray<{value: ModernAutoComboStrength; label: string}> = [
    {value: "light", label: "Light auto combo"},
    {value: "medium", label: "Medium auto combo"},
    {value: "heavy", label: "Heavy auto combo"},
];

const MAX_LABEL = "Max damage notation";
const SIMPLE_LABEL = "Simple notation";
const PERCENT_LABEL = "Simple damage %";

interface ModernDraft {
    modernMaxNotation: string;
    modernSimpleNotation: string;
    modernSimpleDamagePercent: string;
}

interface ModernControlsSectionProps {
    characterId: string;
    moves: FrameDataModerationMove[];
    onMoveSaved: (moveId: string, modern: MoveModernData) => void;
    onFeedback: (severity: "success" | "error", message: string) => void;
}

function draftFor(modern: MoveModernData): ModernDraft {
    return {
        modernMaxNotation: modern.modernMaxNotation ?? "",
        modernSimpleNotation: modern.modernSimpleNotation ?? "",
        modernSimpleDamagePercent: modern.modernSimpleDamagePercent === null ? "" : String(modern.modernSimpleDamagePercent),
    };
}

function errorMessage(error: unknown, fallback: string): string {
    const response = (error as {response?: {data?: {error?: string}}} | null)?.response;

    return response?.data?.error ?? fallback;
}

export function ModernControlsSection({characterId, moves, onMoveSaved, onFeedback}: ModernControlsSectionProps) {
    const {saveModernData, getModernAutoCombos, saveModernAutoCombo} = useFrameDataModeration();
    const [drafts, setDrafts] = React.useState<Record<string, ModernDraft>>({});
    const [pendingMoveId, setPendingMoveId] = React.useState<string | null>(null);
    const [autoCombos, setAutoCombos] = React.useState<ModernAutoCombos | null>(null);
    const [autoComboDrafts, setAutoComboDrafts] = React.useState<Record<ModernAutoComboStrength, string>>({light: "", medium: "", heavy: ""});

    React.useEffect(() => {
        setDrafts(Object.fromEntries(moves.map((move) => [move.moveId, draftFor(move.modern)])));
    }, [moves]);

    React.useEffect(() => {
        let canceled = false;
        getModernAutoCombos(characterId)
            .then((response) => {
                if (!canceled) {
                    setAutoCombos(response.autoCombos);
                    setAutoComboDrafts({
                        light: response.autoCombos.light ? String(response.autoCombos.light.comboId) : "",
                        medium: response.autoCombos.medium ? String(response.autoCombos.medium.comboId) : "",
                        heavy: response.autoCombos.heavy ? String(response.autoCombos.heavy.comboId) : "",
                    });
                }
            })
            .catch(() => !canceled && onFeedback("error", "Unable to load Modern auto combos."));

        return () => {
            canceled = true;
        };
    }, [characterId, getModernAutoCombos, onFeedback]);

    const save = async (move: FrameDataModerationMove, availableOnModern: boolean) => {
        const draft = drafts[move.moveId] ?? draftFor(move.modern);
        const percentText = draft.modernSimpleDamagePercent.trim();
        const percent = percentText === "" ? null : Number(percentText);
        if (percent !== null && (!Number.isInteger(percent) || percent < 0 || percent > 100)) {
            onFeedback("error", "Simple input damage must be a whole percentage from 0 to 100.");
            return;
        }

        setPendingMoveId(move.moveId);
        try {
            const response = await saveModernData(move.moveId, {
                availableOnModern,
                modernMaxNotation: draft.modernMaxNotation.trim() || null,
                modernSimpleNotation: draft.modernSimpleNotation.trim() || null,
                modernSimpleDamagePercent: percent,
            });
            onMoveSaved(move.moveId, response.modern);
            onFeedback("success", "Modern data saved; combos revalidated.");
        } catch (error: unknown) {
            onFeedback("error", errorMessage(error, "Unable to save Modern data."));
        } finally {
            setPendingMoveId(null);
        }
    };

    const saveAutoCombo = async (strength: ModernAutoComboStrength) => {
        const text = autoComboDrafts[strength].trim();
        const comboId = text === "" ? null : Number(text);
        if (comboId !== null && !Number.isInteger(comboId)) {
            onFeedback("error", "Combo ID must be a whole number.");
            return;
        }
        if (comboId === (autoCombos?.[strength]?.comboId ?? null)) {
            return;
        }

        try {
            const response = await saveModernAutoCombo(characterId, strength, comboId);
            setAutoCombos(response.autoCombos);
            onFeedback("success", "Auto combo saved; combos revalidated.");
        } catch (error: unknown) {
            onFeedback("error", errorMessage(error, "Unable to save auto combo."));
        }
    };

    const updateDraft = (moveId: string, patch: Partial<ModernDraft>) => {
        setDrafts((current) => ({...current, [moveId]: {...(current[moveId] ?? {modernMaxNotation: "", modernSimpleNotation: "", modernSimpleDamagePercent: ""}), ...patch}}));
    };

    const fieldsFor = (move: FrameDataModerationMove, withLabels: boolean) => {
        const draft = drafts[move.moveId] ?? draftFor(move.modern);
        const disabled = pendingMoveId === move.moveId;
        const commit = () => {
            const saved = draftFor(move.modern);
            if (saved.modernMaxNotation !== draft.modernMaxNotation.trim() || saved.modernSimpleNotation !== draft.modernSimpleNotation.trim() || saved.modernSimpleDamagePercent !== draft.modernSimpleDamagePercent.trim()) {
                void save(move, move.modern.availableOnModern);
            }
        };
        const textField = (field: keyof ModernDraft, label: string, numeric: boolean) => (
            <AppTextField
                size="small"
                label={withLabels ? label : undefined}
                value={draft[field]}
                disabled={disabled}
                onChange={(event) => updateDraft(move.moveId, {[field]: event.target.value})}
                onBlur={commit}
                inputProps={{"aria-label": `${move.numpadNotation} ${label}`, inputMode: numeric ? "numeric" : "text"}}
                sx={{minWidth: 100}}
            />
        );

        return {
            available: (
                <AppCheckbox
                    checked={move.modern.availableOnModern}
                    disabled={disabled}
                    onChange={(event) => void save(move, event.target.checked)}
                    inputProps={{"aria-label": `${move.numpadNotation} available on Modern`}}
                />
            ),
            max: textField("modernMaxNotation", MAX_LABEL, false),
            simple: textField("modernSimpleNotation", SIMPLE_LABEL, false),
            percent: textField("modernSimpleDamagePercent", PERCENT_LABEL, true),
        };
    };

    return (
        <SectionCard title="Modern Controls" variant="review">
            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", sm: "repeat(3, minmax(0, 220px))"}, gap: 1}}>
                {AUTO_COMBO_STRENGTHS.map((strength) => (
                    <AppTextField
                        key={strength.value}
                        size="small"
                        label={`${strength.label} ID`}
                        value={autoComboDrafts[strength.value]}
                        onChange={(event) => setAutoComboDrafts((current) => ({...current, [strength.value]: event.target.value}))}
                        onBlur={() => void saveAutoCombo(strength.value)}
                        inputProps={{inputMode: "numeric"}}
                        helperText={autoCombos?.[strength.value]?.name ?? " "}
                    />
                ))}
            </AppBox>

            <AppTableContainer sx={{display: {xs: "none", md: "block"}, maxHeight: "calc(100dvh - 330px)", backgroundColor: "fgc.surface.base"}}>
                <AppTable stickyHeader size="small">
                    <AppTableHead>
                        <AppTableRow>
                            {["Move", "Numpad", "On Modern", MAX_LABEL, SIMPLE_LABEL, PERCENT_LABEL].map((label) => (
                                <AppTableCell key={label} sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>{label}</AppTableCell>
                            ))}
                        </AppTableRow>
                    </AppTableHead>
                    <AppTableBody>
                        {moves.map((move) => {
                            const fields = fieldsFor(move, false);
                            return (
                                <AppTableRow key={move.moveId} hover>
                                    <AppTableCell>{move.name}</AppTableCell>
                                    <AppTableCell>{move.numpadNotation}</AppTableCell>
                                    <AppTableCell>{fields.available}</AppTableCell>
                                    <AppTableCell>{fields.max}</AppTableCell>
                                    <AppTableCell>{fields.simple}</AppTableCell>
                                    <AppTableCell>{fields.percent}</AppTableCell>
                                </AppTableRow>
                            );
                        })}
                    </AppTableBody>
                </AppTable>
            </AppTableContainer>

            <AppBox sx={{display: {xs: "grid", md: "none"}, gap: 1}}>
                {moves.map((move) => {
                    const fields = fieldsFor(move, true);
                    return (
                        <AppBox key={move.moveId} sx={{display: "grid", gap: 1, border: "1px solid", borderColor: "fgc.border.default", borderRadius: 1.25, p: 1.25, backgroundColor: "fgc.surface.subtle"}}>
                            <AppBox component="label" sx={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1}}>
                                <AppTypography variant="body2" sx={{fontWeight: 650}}>{move.numpadNotation}</AppTypography>
                                <AppBox sx={{display: "flex", alignItems: "center"}}>
                                    <AppTypography variant="body2">On Modern</AppTypography>
                                    {fields.available}
                                </AppBox>
                            </AppBox>
                            <AppBox sx={{display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 0.75}}>
                                {fields.max}
                                {fields.simple}
                                {fields.percent}
                            </AppBox>
                        </AppBox>
                    );
                })}
            </AppBox>
        </SectionCard>
    );
}
