import React from "react";
import {useCharacters} from "@/hooks/useCharacters";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppCheckbox} from "@/src/components/ui/AppCheckbox";
import {AppFormControl} from "@/src/components/ui/AppFormControl";
import {AppFormControlLabel} from "@/src/components/ui/AppFormControlLabel";
import {AppInputLabel} from "@/src/components/ui/AppInputLabel";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {AppSelect} from "@/src/components/ui/AppSelect";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {OkiMovePicker, type OkiMoveOption} from "@/src/components/okis/OkiMovePicker";
import type {BlockstringDetail, BlockstringPayload} from "@/src/types/blockstring";
import {BLOCKSTRING_CLASSIFICATIONS, formatBlockstringLabel} from "@/src/types/blockstring";

interface StepDraft {
    move: OkiMoveOption | null;
    gapBefore: boolean;
    gapFrames: string;
    canConfirmOnHit: boolean;
    note: string;
}

interface BlockstringFormProps {
    initialValue?: BlockstringDetail | null;
    submitLabel: string;
    saving?: boolean;
    onSubmit: (payload: BlockstringPayload) => Promise<void> | void;
}

function numberOrNull(value: string): number | null {
    const trimmed = value.trim();
    return /^-?\d+$/.test(trimmed) ? Number.parseInt(trimmed, 10) : null;
}

function stepFromDetail(detail: BlockstringDetail | null | undefined): StepDraft[] {
    if (!detail) {
        return [{move: null, gapBefore: false, gapFrames: "", canConfirmOnHit: false, note: ""}];
    }

    return detail.steps.map((step) => ({
        move: step.move ? {id: step.move.id, summary: `${step.move.character?.name ?? ""} ${step.move.numpadNotation}`.trim(), characterId: step.move.character?.id} : null,
        gapBefore: step.gapBefore,
        gapFrames: step.gapFrames === null ? "" : String(step.gapFrames),
        canConfirmOnHit: step.canConfirmOnHit,
        note: step.note ?? "",
    }));
}

export function BlockstringForm({initialValue = null, submitLabel, saving = false, onSubmit}: BlockstringFormProps) {
    const {characters} = useCharacters();
    const [title, setTitle] = React.useState(initialValue?.title ?? "");
    const [summary, setSummary] = React.useState(initialValue?.summary ?? "");
    const [attackerCharacterId, setAttackerCharacterId] = React.useState(initialValue?.attackerCharacter?.id ?? "");
    const [classification, setClassification] = React.useState<string>(initialValue?.classification ?? "fake");
    const [gapAfterStep, setGapAfterStep] = React.useState(initialValue?.gapAfterStep === null || initialValue?.gapAfterStep === undefined ? "" : String(initialValue.gapAfterStep));
    const [maxInterruptStartup, setMaxInterruptStartup] = React.useState(initialValue?.maxInterruptStartup === null || initialValue?.maxInterruptStartup === undefined ? "" : String(initialValue.maxInterruptStartup));
    const [steps, setSteps] = React.useState<StepDraft[]>(() => stepFromDetail(initialValue));
    const [offenseLabel, setOffenseLabel] = React.useState(initialValue?.offensePlans[0]?.label ?? "Default pressure");
    const [targetBehavior, setTargetBehavior] = React.useState(initialValue?.offensePlans[0]?.targetBehavior ?? "");
    const [purpose, setPurpose] = React.useState(initialValue?.offensePlans[0]?.purpose ?? "");
    const [onHit, setOnHit] = React.useState(initialValue?.offensePlans[0]?.onHit ?? "");
    const [onBlock, setOnBlock] = React.useState(initialValue?.offensePlans[0]?.onBlock ?? "");
    const [losesTo, setLosesTo] = React.useState(initialValue?.offensePlans[0]?.losesTo ?? "");
    const [defenseInstruction, setDefenseInstruction] = React.useState(initialValue?.defenseEntries[0]?.instruction ?? "");
    const [conversion, setConversion] = React.useState(initialValue?.defenseEntries[0]?.answers[0]?.conversion ?? "");

    const updateStep = (index: number, patch: Partial<StepDraft>) => {
        setSteps((current) => current.map((step, stepIndex) => stepIndex === index ? {...step, ...patch} : step));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const payload: BlockstringPayload = {
            title,
            summary: summary || null,
            attackerCharacterId,
            classification,
            gapAfterStep: numberOrNull(gapAfterStep),
            maxInterruptStartup: numberOrNull(maxInterruptStartup),
            steps: steps.filter((step) => step.move).map((step, index) => ({
                moveId: step.move?.id ?? "",
                ordinal: index + 1,
                gapBefore: step.gapBefore,
                gapFrames: numberOrNull(step.gapFrames),
                canConfirmOnHit: step.canConfirmOnHit,
                note: step.note || null,
            })),
            offensePlans: offenseLabel ? [{
                label: offenseLabel,
                planRole: "default",
                targetBehavior: targetBehavior || null,
                purpose: purpose || null,
                onHit: onHit || null,
                onBlock: onBlock || null,
                losesTo: losesTo || null,
                authorExplanation: summary || null,
                sortOrder: 0,
            }] : [],
            defenseEntries: defenseInstruction ? [{
                actAfterStep: numberOrNull(gapAfterStep),
                instruction: defenseInstruction,
                answers: [{responseType: "button", outcome: "counter_hit", startupFrames: numberOrNull(maxInterruptStartup), conversion: conversion || null, recommended: true}],
            }] : [],
        };

        await onSubmit(payload);
    };

    return (
        <AppBox component="form" onSubmit={handleSubmit} sx={{display: "grid", gap: 1.25}}>
            <AppPaper variant="outlined" sx={{p: 1.5, borderRadius: 2.5, display: "grid", gap: 1, backgroundColor: "fgc.surface.base"}}>
                <AppTypography variant="h6">Core</AppTypography>
                <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "1fr 220px 180px"}, gap: 1}}>
                    <AppTextField size="small" label="Title" value={title} onChange={(event) => setTitle(event.target.value)} required />
                    <AppFormControl size="small" required>
                        <AppInputLabel id="blockstring-attacker-label">Attacker</AppInputLabel>
                        <AppSelect<string> labelId="blockstring-attacker-label" label="Attacker" value={attackerCharacterId} onChange={(event) => setAttackerCharacterId(String(event.target.value))}>
                            {(characters as Array<{id: string; name: string}>).map((character) => <AppMenuItem key={character.id} value={character.id}>{character.name}</AppMenuItem>)}
                        </AppSelect>
                    </AppFormControl>
                    <AppFormControl size="small">
                        <AppInputLabel id="blockstring-classification-label">Status</AppInputLabel>
                        <AppSelect<string> labelId="blockstring-classification-label" label="Status" value={classification} onChange={(event) => setClassification(String(event.target.value))}>
                            {BLOCKSTRING_CLASSIFICATIONS.map((option) => <AppMenuItem key={option} value={option}>{formatBlockstringLabel(option)}</AppMenuItem>)}
                        </AppSelect>
                    </AppFormControl>
                </AppBox>
                <AppTextField size="small" label="Human explanation" value={summary} onChange={(event) => setSummary(event.target.value)} multiline minRows={2} />
                <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", sm: "180px 220px"}, gap: 1}}>
                    <AppTextField size="small" label="Gap after step" value={gapAfterStep} onChange={(event) => setGapAfterStep(event.target.value)} />
                    <AppTextField size="small" label="Max interrupt startup" value={maxInterruptStartup} onChange={(event) => setMaxInterruptStartup(event.target.value)} />
                </AppBox>
            </AppPaper>

            <AppPaper variant="outlined" sx={{p: 1.5, borderRadius: 2.5, display: "grid", gap: 1, backgroundColor: "fgc.surface.base"}}>
                <AppTypography variant="h6">Sequence</AppTypography>
                {steps.map((step, index) => (
                    <AppBox key={index} sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "1fr 130px 140px 150px auto"}, gap: 1, alignItems: "center"}}>
                        <OkiMovePicker label={`Move ${index + 1}`} value={step.move} characterId={attackerCharacterId || undefined} onChange={(move) => updateStep(index, {move})} />
                        <AppFormControlLabel control={<AppCheckbox checked={step.gapBefore} onChange={(event) => updateStep(index, {gapBefore: event.target.checked})} />} label="Gap before" />
                        <AppTextField size="small" label="Gap frames" value={step.gapFrames} onChange={(event) => updateStep(index, {gapFrames: event.target.value})} />
                        <AppFormControlLabel control={<AppCheckbox checked={step.canConfirmOnHit} onChange={(event) => updateStep(index, {canConfirmOnHit: event.target.checked})} />} label="Confirmable" />
                        {steps.length > 1 ? <AppButton type="button" variant="outlined" color="secondary" onClick={() => setSteps((current) => current.filter((_, stepIndex) => stepIndex !== index))}>Remove</AppButton> : null}
                    </AppBox>
                ))}
                <AppButton type="button" variant="outlined" color="secondary" onClick={() => setSteps((current) => [...current, {move: null, gapBefore: false, gapFrames: "", canConfirmOnHit: false, note: ""}])}>Add Move</AppButton>
            </AppPaper>

            <AppPaper variant="outlined" sx={{p: 1.5, borderRadius: 2.5, display: "grid", gap: 1, backgroundColor: "fgc.surface.base"}}>
                <AppTypography variant="h6">Offense Plan</AppTypography>
                <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "220px 1fr"}, gap: 1}}>
                    <AppTextField size="small" label="Plan label" value={offenseLabel} onChange={(event) => setOffenseLabel(event.target.value)} />
                    <AppTextField size="small" label="Targets behavior" value={targetBehavior} onChange={(event) => setTargetBehavior(event.target.value)} />
                </AppBox>
                <AppTextField size="small" label="Why choose it" value={purpose} onChange={(event) => setPurpose(event.target.value)} multiline minRows={2} />
                <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "1fr 1fr 1fr"}, gap: 1}}>
                    <AppTextField size="small" label="On hit" value={onHit} onChange={(event) => setOnHit(event.target.value)} />
                    <AppTextField size="small" label="On block" value={onBlock} onChange={(event) => setOnBlock(event.target.value)} />
                    <AppTextField size="small" label="Loses to" value={losesTo} onChange={(event) => setLosesTo(event.target.value)} />
                </AppBox>
            </AppPaper>

            <AppPaper variant="outlined" sx={{p: 1.5, borderRadius: 2.5, display: "grid", gap: 1, backgroundColor: "fgc.surface.base"}}>
                <AppTypography variant="h6">Defense Answer</AppTypography>
                <AppTextField size="small" label="Interrupt instruction" value={defenseInstruction} onChange={(event) => setDefenseInstruction(event.target.value)} multiline minRows={2} />
                <AppTextField size="small" label="Recommended conversion" value={conversion} onChange={(event) => setConversion(event.target.value)} />
            </AppPaper>

            <AppBox sx={{display: "flex", justifyContent: "flex-end"}}>
                <AppButton type="submit" variant="contained" color="primary" disabled={saving || steps.every((step) => !step.move)}>{saving ? "Saving..." : submitLabel}</AppButton>
            </AppBox>
        </AppBox>
    );
}
