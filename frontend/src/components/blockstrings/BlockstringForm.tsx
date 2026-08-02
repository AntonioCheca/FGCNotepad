import React from "react";
import {useCharacters} from "@/hooks/useCharacters";
import useComboSpacings from "@/hooks/useComboSpacings";
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
import type {BlockstringDetail, BlockstringGapClassification, BlockstringGapTiming, BlockstringPayload} from "@/src/types/blockstring";
import {BLOCKSTRING_CLASSIFICATIONS, formatBlockstringLabel} from "@/src/types/blockstring";

interface StepDraft {
    move: OkiMoveOption | null;
    canConfirmOnHit: boolean;
    note: string;
}

interface GapDraft {
    clientId: string;
    stepOrdinal: number;
    timing: BlockstringGapTiming;
    frames: string;
    frameAdvantage: string;
    classification: BlockstringGapClassification;
    classificationTouched: boolean;
}

interface DefenseDraft {
    instruction: string;
    conversion: string;
}

interface AdaptationDraft {
    clientId: string;
    gapClientId: string;
    steps: Array<OkiMoveOption | null>;
    explanation: string;
    firstMove: OkiMoveOption | null;
    enderMove: OkiMoveOption | null;
    spacingCode: string;
    minDamage: string;
    maxDamage: string;
    minDriveCost: string;
    maxDriveCost: string;
    counterHitRequired: boolean;
    punishCounterRequired: boolean;
    cornerRequired: boolean;
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

function decimalOrNull(value: string): number | null {
    const trimmed = value.trim();
    if (trimmed === "" || !/^\d+(\.\d+)?$/.test(trimmed)) {
        return null;
    }

    return Number.parseFloat(trimmed);
}

function stepFromDetail(detail: BlockstringDetail | null | undefined): StepDraft[] {
    if (!detail) {
        return [{move: null, canConfirmOnHit: false, note: ""}];
    }

    return detail.steps.map((step) => ({
        move: step.move ? {id: step.move.id, summary: `${step.move.character?.name ?? ""} ${step.move.numpadNotation}`.trim(), characterId: step.move.character?.id} : null,
        canConfirmOnHit: step.canConfirmOnHit,
        note: step.note ?? "",
    }));
}

function gapsFromDetail(detail: BlockstringDetail | null | undefined): GapDraft[] {
    if (!detail) {
        return [];
    }

    return detail.gaps.map((gap) => ({
        clientId: `gap-${gap.id ?? `${gap.stepOrdinal}-${gap.timing}`}`,
        stepOrdinal: gap.stepOrdinal ?? 1,
        timing: gap.timing,
        frames: String(gap.frames),
        frameAdvantage: String(gap.frameAdvantage ?? 0),
        classification: gap.classification,
        classificationTouched: true,
    }));
}

function classifyGapFrames(value: string): BlockstringGapClassification {
    const frames = numberOrNull(value);
    if (frames === null || frames <= 2) {
        return "safe";
    }

    return frames === 3 ? "trades" : "fake";
}

function sortGapDrafts(first: GapDraft, second: GapDraft): number {
    return first.stepOrdinal - second.stepOrdinal
        || (first.timing === "before_step" ? 0 : 1) - (second.timing === "before_step" ? 0 : 1)
        || first.clientId.localeCompare(second.clientId);
}

function defenseFromDetail(detail: BlockstringDetail | null | undefined): Record<string, DefenseDraft> {
    const defenseByGap: Record<string, DefenseDraft> = {};
    if (!detail) {
        return defenseByGap;
    }

    for (const entry of detail.defenseEntries) {
        if (entry.gapId === null) {
            continue;
        }
        defenseByGap[`gap-${entry.gapId}`] = {
            instruction: entry.instruction ?? "",
            conversion: entry.conversion ?? "",
        };
    }

    return defenseByGap;
}

function moveToOption(move: {id: string; numpadNotation: string; character?: {id: string; name: string} | null} | null | undefined): OkiMoveOption | null {
    return move ? {id: move.id, summary: `${move.character?.name ?? ""} ${move.numpadNotation}`.trim(), characterId: move.character?.id} : null;
}

function adaptationsFromDetail(detail: BlockstringDetail | null | undefined): AdaptationDraft[] {
    if (!detail) {
        return [];
    }

    return detail.adaptations.map((adaptation) => ({
        clientId: `adaptation-${adaptation.id ?? adaptation.gapId ?? Date.now()}`,
        gapClientId: `gap-${adaptation.gapId ?? `${adaptation.gapStepOrdinal}-before_step`}`,
        steps: adaptation.steps.map((step) => moveToOption(step.move)),
        explanation: adaptation.explanation ?? "",
        firstMove: moveToOption(adaptation.comboSearch?.firstMove),
        enderMove: moveToOption(adaptation.comboSearch?.enderMove),
        spacingCode: adaptation.comboSearch?.spacing?.code ?? (Array.isArray(adaptation.comboSearch?.filters.spacingCodes) ? adaptation.comboSearch.filters.spacingCodes[0] ?? "" : ""),
        minDamage: adaptation.comboSearch?.filters.minDamage !== undefined ? String(adaptation.comboSearch.filters.minDamage) : "",
        maxDamage: adaptation.comboSearch?.filters.maxDamage !== undefined ? String(adaptation.comboSearch.filters.maxDamage) : "",
        minDriveCost: adaptation.comboSearch?.filters.minDriveCost !== undefined ? String(adaptation.comboSearch.filters.minDriveCost) : "",
        maxDriveCost: adaptation.comboSearch?.filters.maxDriveCost !== undefined ? String(adaptation.comboSearch.filters.maxDriveCost) : "",
        counterHitRequired: adaptation.comboSearch?.filters.counterHitRequired === true,
        punishCounterRequired: adaptation.comboSearch?.filters.punishCounterRequired === true,
        cornerRequired: adaptation.comboSearch?.filters.cornerRequired === true,
    }));
}

export function BlockstringForm({initialValue = null, submitLabel, saving = false, onSubmit}: BlockstringFormProps) {
    const {characters} = useCharacters();
    const {spacings, fetchComboSpacings} = useComboSpacings();
    const [title, setTitle] = React.useState(initialValue?.title ?? "");
    const [summary, setSummary] = React.useState(initialValue?.summary ?? "");
    const [attackerCharacterId, setAttackerCharacterId] = React.useState(initialValue?.attackerCharacter?.id ?? "");
    const [classification, setClassification] = React.useState<string>(initialValue?.classification ?? "fake");
    const [steps, setSteps] = React.useState<StepDraft[]>(() => stepFromDetail(initialValue));
    const [gaps, setGaps] = React.useState<GapDraft[]>(() => gapsFromDetail(initialValue));
    const [defenseByGap, setDefenseByGap] = React.useState<Record<string, DefenseDraft>>(() => defenseFromDetail(initialValue));
    const [adaptations, setAdaptations] = React.useState<AdaptationDraft[]>(() => adaptationsFromDetail(initialValue));

    React.useEffect(() => {
        fetchComboSpacings().catch(() => undefined);
    }, [fetchComboSpacings]);

    const updateStep = (index: number, patch: Partial<StepDraft>) => {
        setSteps((current) => current.map((step, stepIndex) => stepIndex === index ? {...step, ...patch} : step));
    };

    const updateGap = (clientId: string, patch: Partial<GapDraft>) => {
        setGaps((current) => current.map((gap) => gap.clientId === clientId ? {...gap, ...patch} : gap));
    };

    const updateGapFrames = (clientId: string, frames: string) => {
        setGaps((current) => current.map((gap) => gap.clientId === clientId ? {...gap, frames, classification: gap.classificationTouched ? gap.classification : classifyGapFrames(frames)} : gap));
    };

    const updateGapClassification = (clientId: string, classification: BlockstringGapClassification) => {
        updateGap(clientId, {classification, classificationTouched: true});
    };

    const addGap = (stepOrdinal: number) => {
        setGaps((current) => [...current, {clientId: `new-${Date.now()}-${current.length}`, stepOrdinal, timing: "before_step", frames: "", frameAdvantage: "0", classification: "safe", classificationTouched: false}]);
    };

    const removeGap = (clientId: string) => {
        setGaps((current) => current.filter((gap) => gap.clientId !== clientId));
        setAdaptations((current) => current.filter((adaptation) => adaptation.gapClientId !== clientId));
        setDefenseByGap((current) => {
            const next = {...current};
            delete next[clientId];
            return next;
        });
    };

    const updateDefense = (clientId: string, patch: Partial<DefenseDraft>) => {
        setDefenseByGap((current) => ({...current, [clientId]: {...(current[clientId] ?? {instruction: "", conversion: ""}), ...patch}}));
    };

    const addAdaptation = () => {
        const firstGap = [...gaps].sort(sortGapDrafts)[0];
        if (!firstGap) {
            return;
        }
        setAdaptations((current) => [...current, {clientId: `adaptation-${Date.now()}-${current.length}`, gapClientId: firstGap.clientId, steps: [null], explanation: "", firstMove: null, enderMove: null, spacingCode: "", minDamage: "", maxDamage: "", minDriveCost: "", maxDriveCost: "", counterHitRequired: false, punishCounterRequired: false, cornerRequired: false}]);
    };

    const updateAdaptation = (clientId: string, patch: Partial<AdaptationDraft>) => {
        setAdaptations((current) => current.map((adaptation) => adaptation.clientId === clientId ? {...adaptation, ...patch} : adaptation));
    };

    const updateAdaptationStep = (clientId: string, index: number, move: OkiMoveOption | null) => {
        setAdaptations((current) => current.map((adaptation) => adaptation.clientId === clientId ? {...adaptation, steps: adaptation.steps.map((step, stepIndex) => stepIndex === index ? move : step)} : adaptation));
    };

    const removeStep = (index: number) => {
        setSteps((current) => current.filter((_, stepIndex) => stepIndex !== index));
        const removedGapIds = gaps.filter((gap) => gap.stepOrdinal === index + 1).map((gap) => gap.clientId);
        setGaps((current) => current.filter((gap) => gap.stepOrdinal !== index + 1).map((gap) => ({...gap, stepOrdinal: gap.stepOrdinal > index + 1 ? gap.stepOrdinal - 1 : gap.stepOrdinal})));
        setAdaptations((current) => current.filter((adaptation) => !removedGapIds.includes(adaptation.gapClientId)));
        setDefenseByGap((current) => Object.fromEntries(Object.entries(current).filter(([clientId]) => !removedGapIds.includes(clientId))));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const payload: BlockstringPayload = {
            title,
            summary: summary || null,
            attackerCharacterId,
            classification,
            steps: steps.filter((step) => step.move).map((step, index) => ({
                moveId: step.move?.id ?? "",
                ordinal: index + 1,
                canConfirmOnHit: step.canConfirmOnHit,
                note: step.note || null,
            })),
            gaps: gaps.filter((gap) => steps[gap.stepOrdinal - 1]?.move).map((gap) => ({
                clientId: gap.clientId,
                stepOrdinal: gap.stepOrdinal,
                timing: gap.timing,
                frames: numberOrNull(gap.frames),
                frameAdvantage: gap.timing === "before_step" ? numberOrNull(gap.frameAdvantage) ?? 0 : 0,
                classification: gap.classification,
            })),
            defenseEntries: gaps.filter((gap) => steps[gap.stepOrdinal - 1]?.move).map((gap) => {
                const defense = defenseByGap[gap.clientId] ?? {instruction: "", conversion: ""};
                return {
                    gapClientId: gap.clientId,
                    instruction: defense.instruction || null,
                    responseType: "button",
                    outcome: "counter_hit",
                    conversion: defense.conversion || null,
                };
            }),
            adaptations: adaptations.filter((adaptation) => gaps.some((gap) => gap.clientId === adaptation.gapClientId) && adaptation.steps.some((step) => step?.id)).map((adaptation) => ({
                clientId: adaptation.clientId,
                gapClientId: adaptation.gapClientId,
                explanation: adaptation.explanation || null,
                steps: adaptation.steps.filter((step): step is OkiMoveOption => Boolean(step?.id)).map((step, index) => ({moveId: step.id, ordinal: index + 1})),
                comboSearch: {
                    firstMoveId: adaptation.firstMove?.id ?? null,
                    enderMoveId: adaptation.enderMove?.id ?? null,
                    spacingCode: adaptation.spacingCode || null,
                    minDamage: numberOrNull(adaptation.minDamage),
                    maxDamage: numberOrNull(adaptation.maxDamage),
                    minDriveCost: decimalOrNull(adaptation.minDriveCost),
                    maxDriveCost: decimalOrNull(adaptation.maxDriveCost),
                    counterHitRequired: adaptation.counterHitRequired ? true : null,
                    punishCounterRequired: adaptation.punishCounterRequired ? true : null,
                    cornerRequired: adaptation.cornerRequired ? true : null,
                },
            })),
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
                <AppTextField size="small" label="Explanation" value={summary} onChange={(event) => setSummary(event.target.value)} multiline minRows={2} />
            </AppPaper>

            <AppPaper variant="outlined" sx={{p: 1.5, borderRadius: 2.5, display: "grid", gap: 1, backgroundColor: "fgc.surface.base"}}>
                <AppTypography variant="h6">Sequence</AppTypography>
                {steps.map((step, index) => {
                    const stepOrdinal = index + 1;
                    return <AppBox key={index} sx={{display: "grid", gap: 0.75}}>
                        <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "1fr 150px auto auto"}, gap: 1, alignItems: "center"}}>
                            <OkiMovePicker label={`Move ${stepOrdinal}`} value={step.move} characterId={attackerCharacterId || undefined} onChange={(move) => updateStep(index, {move})} />
                            <AppFormControlLabel control={<AppCheckbox checked={step.canConfirmOnHit} onChange={(event) => updateStep(index, {canConfirmOnHit: event.target.checked})} />} label="Confirmable" />
                            <AppButton type="button" variant="outlined" color="secondary" onClick={() => addGap(stepOrdinal)} disabled={!step.move}>Add Gap</AppButton>
                            {steps.length > 1 ? <AppButton type="button" variant="outlined" color="secondary" onClick={() => removeStep(index)}>Remove</AppButton> : null}
                        </AppBox>
                        {gaps.filter((gap) => gap.stepOrdinal === stepOrdinal).map((gap) => (
                            <AppBox key={gap.clientId} sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "170px 100px 110px 130px auto"}, gap: 1, alignItems: "center", pl: {xs: 0, md: 2}}}>
                                <AppFormControl size="small">
                                    <AppInputLabel id={`${gap.clientId}-timing-label`}>Gap timing</AppInputLabel>
                                    <AppSelect<BlockstringGapTiming> labelId={`${gap.clientId}-timing-label`} label="Gap timing" value={gap.timing} onChange={(event) => updateGap(gap.clientId, {timing: event.target.value as BlockstringGapTiming})}>
                                        <AppMenuItem value="before_step">Before move</AppMenuItem>
                                        <AppMenuItem value="during_step">During move</AppMenuItem>
                                    </AppSelect>
                                </AppFormControl>
                                <AppTextField size="small" label="Frames" value={gap.frames} onChange={(event) => updateGapFrames(gap.clientId, event.target.value)} />
                                {gap.timing === "before_step" ? <AppTextField size="small" label="Frame adv." value={gap.frameAdvantage} onChange={(event) => updateGap(gap.clientId, {frameAdvantage: event.target.value})} /> : <AppBox />}
                                <AppFormControl size="small">
                                    <AppInputLabel id={`${gap.clientId}-classification-label`}>Status</AppInputLabel>
                                    <AppSelect<BlockstringGapClassification> labelId={`${gap.clientId}-classification-label`} label="Status" value={gap.classification} onChange={(event) => updateGapClassification(gap.clientId, event.target.value as BlockstringGapClassification)}>
                                        <AppMenuItem value="safe">Safe</AppMenuItem>
                                        <AppMenuItem value="trades">Trades</AppMenuItem>
                                        <AppMenuItem value="fake">Fake</AppMenuItem>
                                    </AppSelect>
                                </AppFormControl>
                                <AppButton type="button" variant="outlined" color="secondary" onClick={() => removeGap(gap.clientId)}>Remove Gap</AppButton>
                            </AppBox>
                        ))}
                    </AppBox>
                })}
                <AppButton type="button" variant="outlined" color="secondary" onClick={() => setSteps((current) => [...current, {move: null, canConfirmOnHit: false, note: ""}])}>Add Move</AppButton>
            </AppPaper>

            <AppPaper variant="outlined" sx={{p: 1.5, borderRadius: 2.5, display: "grid", gap: 1, backgroundColor: "fgc.surface.base"}}>
                <AppTypography variant="h6">Defense Answers</AppTypography>
                {gaps.length > 0 ? gaps.filter((gap) => steps[gap.stepOrdinal - 1]?.move).sort(sortGapDrafts).map((gap) => {
                    const defense = defenseByGap[gap.clientId] ?? {instruction: "", conversion: ""};
                    return (
                        <AppBox key={gap.clientId} sx={{display: "grid", gap: 1, borderTop: "1px solid", borderColor: "fgc.border.default", pt: 1}}>
                            <AppTypography variant="subtitle2" sx={{fontWeight: 800}}>{gap.timing === "before_step" ? "Before" : "During"} Move {gap.stepOrdinal}: {gap.frames.trim() === "" ? "?" : gap.frames}f</AppTypography>
                            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "1fr 1fr"}, gap: 1}}>
                                <AppTextField size="small" label="Answer" value={defense.instruction} onChange={(event) => updateDefense(gap.clientId, {instruction: event.target.value})} />
                                <AppTextField size="small" label="Conversion" value={defense.conversion} onChange={(event) => updateDefense(gap.clientId, {conversion: event.target.value})} />
                            </AppBox>
                        </AppBox>
                    );
                }) : <AppTypography variant="body2" color="text.secondary">Add a gap in the sequence to document its defense answer.</AppTypography>}
            </AppPaper>

            <AppPaper variant="outlined" sx={{p: 1.5, borderRadius: 2.5, display: "grid", gap: 1, backgroundColor: "fgc.surface.base"}}>
                <AppBox sx={{display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap", alignItems: "center"}}>
                    <AppTypography variant="h6">Attacker Adaptations</AppTypography>
                    <AppButton type="button" variant="outlined" color="secondary" onClick={addAdaptation} disabled={gaps.length === 0}>Add Adaptation</AppButton>
                </AppBox>
                {adaptations.length > 0 ? adaptations.map((adaptation) => (
                    <AppBox key={adaptation.clientId} sx={{display: "grid", gap: 1, borderTop: "1px solid", borderColor: "fgc.border.default", pt: 1}}>
                        <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "220px 1fr auto"}, gap: 1, alignItems: "center"}}>
                            <AppFormControl size="small">
                                <AppInputLabel id={`${adaptation.clientId}-gap-label`}>Gap</AppInputLabel>
                                <AppSelect<string> labelId={`${adaptation.clientId}-gap-label`} label="Gap" value={adaptation.gapClientId} onChange={(event) => updateAdaptation(adaptation.clientId, {gapClientId: String(event.target.value)})}>
                                    {gaps.filter((gap) => steps[gap.stepOrdinal - 1]?.move).sort(sortGapDrafts).map((gap) => <AppMenuItem key={gap.clientId} value={gap.clientId}>{gap.timing === "before_step" ? "Before" : "During"} Move {gap.stepOrdinal}: {gap.frames || "?"}f</AppMenuItem>)}
                                </AppSelect>
                            </AppFormControl>
                            <AppTextField size="small" label="Explanation" value={adaptation.explanation} onChange={(event) => updateAdaptation(adaptation.clientId, {explanation: event.target.value})} />
                            <AppButton type="button" variant="outlined" color="secondary" onClick={() => setAdaptations((current) => current.filter((item) => item.clientId !== adaptation.clientId))}>Remove</AppButton>
                        </AppBox>
                        <AppBox sx={{display: "grid", gap: 0.75, pl: {xs: 0, md: 2}}}>
                            <AppTypography variant="subtitle2" sx={{fontWeight: 800}}>Response route</AppTypography>
                            {adaptation.steps.map((move, index) => <OkiMovePicker key={`${adaptation.clientId}-step-${index}`} label={`Route move ${index + 1}`} value={move} characterId={attackerCharacterId || undefined} onChange={(nextMove) => updateAdaptationStep(adaptation.clientId, index, nextMove)} />)}
                            <AppButton type="button" variant="outlined" color="secondary" onClick={() => setAdaptations((current) => current.map((item) => item.clientId === adaptation.clientId ? {...item, steps: [...item.steps, null]} : item))}>Add Route Move</AppButton>
                        </AppBox>
                        <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "repeat(3, minmax(160px, 1fr))"}, gap: 1, pl: {xs: 0, md: 2}}}>
                            <OkiMovePicker label="Combo starter" value={adaptation.firstMove} characterId={attackerCharacterId || undefined} onChange={(move) => updateAdaptation(adaptation.clientId, {firstMove: move})} />
                            <OkiMovePicker label="Combo ender" value={adaptation.enderMove} characterId={attackerCharacterId || undefined} onChange={(move) => updateAdaptation(adaptation.clientId, {enderMove: move})} />
                            <AppFormControl size="small">
                                <AppInputLabel id={`${adaptation.clientId}-spacing-label`}>Spacing</AppInputLabel>
                                <AppSelect<string> labelId={`${adaptation.clientId}-spacing-label`} label="Spacing" value={adaptation.spacingCode} onChange={(event) => updateAdaptation(adaptation.clientId, {spacingCode: String(event.target.value)})}>
                                    <AppMenuItem value="">Any</AppMenuItem>
                                    {spacings.map((spacing) => <AppMenuItem key={spacing.code} value={spacing.code}>{spacing.name}</AppMenuItem>)}
                                </AppSelect>
                            </AppFormControl>
                            <AppTextField size="small" label="Min damage" value={adaptation.minDamage} onChange={(event) => updateAdaptation(adaptation.clientId, {minDamage: event.target.value})} />
                            <AppTextField size="small" label="Max damage" value={adaptation.maxDamage} onChange={(event) => updateAdaptation(adaptation.clientId, {maxDamage: event.target.value})} />
                            <AppTextField size="small" label="Max drive" value={adaptation.maxDriveCost} onChange={(event) => updateAdaptation(adaptation.clientId, {maxDriveCost: event.target.value})} />
                            <AppFormControlLabel control={<AppCheckbox checked={adaptation.counterHitRequired} onChange={(event) => updateAdaptation(adaptation.clientId, {counterHitRequired: event.target.checked})} />} label="Counter hit" />
                            <AppFormControlLabel control={<AppCheckbox checked={adaptation.punishCounterRequired} onChange={(event) => updateAdaptation(adaptation.clientId, {punishCounterRequired: event.target.checked})} />} label="Punish counter" />
                            <AppFormControlLabel control={<AppCheckbox checked={adaptation.cornerRequired} onChange={(event) => updateAdaptation(adaptation.clientId, {cornerRequired: event.target.checked})} />} label="Corner" />
                        </AppBox>
                    </AppBox>
                )) : <AppTypography variant="body2" color="text.secondary">Add a gap before documenting attacker adaptations.</AppTypography>}
            </AppPaper>

            <AppBox sx={{display: "flex", justifyContent: "flex-end"}}>
                <AppButton type="submit" variant="contained" color="primary" disabled={saving || steps.every((step) => !step.move)}>{saving ? "Saving..." : submitLabel}</AppButton>
            </AppBox>
        </AppBox>
    );
}
