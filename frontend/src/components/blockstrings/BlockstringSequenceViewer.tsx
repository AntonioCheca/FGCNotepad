import React from "react";
import Link from "next/link";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AltRouteIcon, ChatBubbleOutlineIcon} from "@/src/components/ui/AppIcons";
import type {BlockstringAdaptation, BlockstringDefenseEntry, BlockstringDetail, BlockstringGap, BlockstringGapClassification, BlockstringStep} from "@/src/types/blockstring";
import {formatBlockstringLabel} from "@/src/types/blockstring";

type ViewerMode = "offense" | "defense";
type SelectedElement = {type: "gap"; key: string} | null;
type MarkerTheme = {
    typography: {
        fontFamily?: string;
        button: {
            fontSize?: string | number;
            fontWeight?: string | number;
            letterSpacing?: string | number;
            textTransform?: string;
        };
    };
    fgc: {
        chip: {
            errorBg: string;
            errorText: string;
            warningBg: string;
            warningText: string;
            infoBg: string;
            infoText: string;
        };
        text: {
            primary: string;
        };
        feedback: {
            error: string;
            warning: string;
            success: string;
            info: string;
        };
        focus: {
            outline: string;
        };
        accent: {
            success: string;
        };
    };
    shadows: string[];
};
type MarkerPalette = {backgroundColor: (theme: MarkerTheme) => string; borderColor: (theme: MarkerTheme) => string; color: (theme: MarkerTheme) => string};

interface BlockstringSequenceViewerProps {
    item: BlockstringDetail;
}

export function BlockstringSequenceViewer({item}: BlockstringSequenceViewerProps) {
    const steps = React.useMemo(() => toArray(item.steps), [item.steps]);
    const gaps = React.useMemo(() => toArray(item.gaps), [item.gaps]);
    const defenseEntries = React.useMemo(() => toArray(item.defenseEntries), [item.defenseEntries]);
    const adaptations = React.useMemo(() => toArray(item.adaptations), [item.adaptations]);
    const [mode, setMode] = React.useState<ViewerMode>("defense");
    const [selectedElement, setSelectedElement] = React.useState<SelectedElement>(() => getInitialSelection(mode, gaps, defenseEntries, adaptations));
    const gapsByStep = React.useMemo(() => groupGapsByStep(gaps), [gaps]);
    const defenseByGapKey = React.useMemo(() => groupDefenseByGapKey(defenseEntries), [defenseEntries]);
    const adaptationsByGapKey = React.useMemo(() => groupAdaptationsByGapKey(adaptations), [adaptations]);
    const selectedGap = selectedElement?.type === "gap" ? gaps.find((gap) => gapKey(gap) === selectedElement.key) ?? null : null;

    React.useEffect(() => {
        setSelectedElement(getInitialSelection(mode, gaps, defenseEntries, adaptations));
    }, [mode, gaps, defenseEntries, adaptations]);

    const selectGap = (gap: BlockstringGap) => setSelectedElement({type: "gap", key: gapKey(gap)});

    return (
        <AppBox sx={{display: "grid", gap: 1.15}}>
            <AppBox sx={{display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap", alignItems: "center"}}>
                <AppBox sx={{display: "inline-flex", p: 0.45, gap: 0.4, border: "1px solid", borderColor: "fgc.border.default", borderRadius: 2.5, backgroundColor: "fgc.surface.sunken", boxSizing: "border-box"}}>
                    <ModeButton active={mode === "offense"} onClick={() => setMode("offense")}>Offense</ModeButton>
                    <ModeButton active={mode === "defense"} onClick={() => setMode("defense")}>Defense</ModeButton>
                </AppBox>
                <AppTypography variant="caption" color="text.secondary">Select a move or opening for details.</AppTypography>
            </AppBox>

            <AppPaper variant="outlined" sx={{p: {xs: 1, md: 1.35}, borderRadius: 2.5, backgroundColor: "fgc.surface.base", overflow: "hidden"}}>
                <AppBox sx={{display: "flex", alignItems: "stretch", gap: 0.65, overflowX: "auto", pb: 0.4, scrollSnapType: "x proximity"}}>
                    {steps.map((step, index) => {
                        const beforeGaps = (gapsByStep.get(step.ordinal) ?? []).filter((gap) => gap.timing === "before_step");
                        const duringGaps = (gapsByStep.get(step.ordinal) ?? []).filter((gap) => gap.timing === "during_step");

                        return (
                            <React.Fragment key={step.id ?? step.ordinal}>
                                {index > 0 ? <ConnectionSegment gaps={beforeGaps} mode={mode} selectedElement={selectedElement} defenseByGapKey={defenseByGapKey} adaptationsByGapKey={adaptationsByGapKey} onSelectGap={selectGap} /> : null}
                                {index === 0 && beforeGaps.length > 0 ? <ConnectionSegment gaps={beforeGaps} mode={mode} selectedElement={selectedElement} defenseByGapKey={defenseByGapKey} adaptationsByGapKey={adaptationsByGapKey} onSelectGap={selectGap} compact /> : null}
                                <MoveCard step={step} gaps={duringGaps} mode={mode} selectedElement={selectedElement} defenseByGapKey={defenseByGapKey} adaptationsByGapKey={adaptationsByGapKey} onSelectGap={selectGap} />
                            </React.Fragment>
                        );
                    })}
                </AppBox>
            </AppPaper>

            <ContextPanel mode={mode} selectedGap={selectedGap} defenseEntries={selectedGap ? defenseByGapKey.get(gapKey(selectedGap)) ?? [] : []} adaptations={selectedGap ? adaptationsByGapKey.get(gapKey(selectedGap)) ?? [] : []} />
        </AppBox>
    );
}

function toArray<T>(value: T[] | Record<string, T> | null | undefined): T[] {
    return Array.isArray(value) ? value : Object.values(value ?? {});
}

function ModeButton({active, onClick, children}: {active: boolean; onClick: () => void; children: React.ReactNode}) {
    return <AppButton type="button" size="small" variant="text" color="secondary" onClick={onClick} sx={{minWidth: 96, fontWeight: 800, border: "1px solid", borderColor: active ? "fgc.accent.selected" : "transparent", borderRadius: 2, backgroundColor: active ? "fgc.surface.raised" : "transparent", color: active ? "fgc.accent.selected" : "text.secondary", boxShadow: active ? 1 : 0, '&:hover': {backgroundColor: active ? "fgc.surface.raised" : "fgc.selection.hover"}}}>{children}</AppButton>;
}

function MoveCard({step, gaps, mode, selectedElement, defenseByGapKey, adaptationsByGapKey, onSelectGap}: {step: BlockstringStep; gaps: BlockstringGap[]; mode: ViewerMode; selectedElement: SelectedElement; defenseByGapKey: Map<string, BlockstringDefenseEntry[]>; adaptationsByGapKey: Map<string, BlockstringAdaptation[]>; onSelectGap: (gap: BlockstringGap) => void}) {
    return (
        <AppBox sx={{border: "1px solid", borderColor: "fgc.border.default", borderRadius: 2.25, backgroundColor: "fgc.surface.subtle", color: "text.primary", minWidth: {xs: 128, sm: 148}, maxWidth: 170, p: 1, display: "grid", gridTemplateRows: "20px 34px auto", gap: 0.55, textAlign: "center", justifyItems: "center", scrollSnapAlign: "start"}}>
            <AppBox sx={{display: "inline-flex", justifyContent: "center", gap: 0.65, alignItems: "center", width: "100%"}}>
                <AppTypography variant="caption" color="text.secondary">#{step.ordinal}</AppTypography>
                {step.canConfirmOnHit ? <AppChip size="small" variant="outlined" label="Confirm" /> : null}
            </AppBox>
            <AppTypography variant="subtitle1" sx={{fontWeight: 900, letterSpacing: "0.02em", lineHeight: 1.1, textAlign: "center"}}>{step.move?.numpadNotation ?? "Unknown"}</AppTypography>
            <AppBox sx={{display: "flex", gap: 0.45, flexWrap: "wrap", alignItems: "start", justifyContent: "center", minHeight: 34, width: "100%"}}>
                    {gaps.map((gap) => <GapMarkerStack key={gapKey(gap)} gap={gap} mode={mode} selected={selectedElement?.type === "gap" && selectedElement.key === gapKey(gap)} hasDefense={(defenseByGapKey.get(gapKey(gap)) ?? []).length > 0} adaptationCount={(adaptationsByGapKey.get(gapKey(gap)) ?? []).length} onClick={(event) => { event.stopPropagation(); onSelectGap(gap); }} />)}
            </AppBox>
        </AppBox>
    );
}

function ConnectionSegment({gaps, mode, selectedElement, defenseByGapKey, adaptationsByGapKey, onSelectGap, compact = false}: {gaps: BlockstringGap[]; mode: ViewerMode; selectedElement: SelectedElement; defenseByGapKey: Map<string, BlockstringDefenseEntry[]>; adaptationsByGapKey: Map<string, BlockstringAdaptation[]>; onSelectGap: (gap: BlockstringGap) => void; compact?: boolean}) {
    if (gaps.length === 0) {
        return <AppBox sx={{minWidth: compact ? 56 : 72, display: "grid", placeItems: "center", color: "text.secondary"}}><AppTypography variant="caption" sx={{fontWeight: 800}}>true</AppTypography></AppBox>;
    }

    return (
        <AppBox sx={{minWidth: compact ? 92 : 118, display: "grid", placeItems: "center", alignContent: "center", gap: 0.45}}>
            {gaps.map((gap) => <GapMarkerStack key={gapKey(gap)} gap={gap} mode={mode} selected={selectedElement?.type === "gap" && selectedElement.key === gapKey(gap)} hasDefense={(defenseByGapKey.get(gapKey(gap)) ?? []).length > 0} adaptationCount={(adaptationsByGapKey.get(gapKey(gap)) ?? []).length} onClick={() => onSelectGap(gap)} />)}
        </AppBox>
    );
}

function GapMarkerStack({gap, mode, selected, hasDefense, adaptationCount, onClick}: {gap: BlockstringGap; mode: ViewerMode; selected: boolean; hasDefense: boolean; adaptationCount: number; onClick: (event: React.MouseEvent<HTMLElement>) => void}) {
    return <AppBox sx={{display: "grid", gap: 0.45, justifyItems: "center", alignItems: "center", pt: gap.timing === "before_step" ? 0.35 : 0}}>{gap.timing === "before_step" ? <FrameAdvantageText value={gap.frameAdvantage ?? 0} /> : null}<GapMarker gap={gap} mode={mode} selected={selected} hasDefense={hasDefense} adaptationCount={adaptationCount} onClick={onClick} /></AppBox>;
}

function FrameAdvantageText({value}: {value: number}) {
    return <AppTypography variant="caption" sx={(theme: MarkerTheme) => ({fontWeight: 900, lineHeight: 1, mb: 0.15, color: frameAdvantageColor(value, theme)})}>{formatFrameAdvantage(value)}</AppTypography>;
}

function GapMarker({gap, mode, selected, hasDefense, adaptationCount, onClick}: {gap: BlockstringGap; mode: ViewerMode; selected: boolean; hasDefense: boolean; adaptationCount: number; onClick: (event: React.MouseEvent<HTMLElement>) => void}) {
    const classification = classifyGapForDisplay(gap);
    const label = `${gap.frames}f ${formatBlockstringLabel(classification).toLowerCase()}`;
    const palette = gapClassificationPalette(classification);
    const interactive = mode === "defense" ? hasDefense : adaptationCount > 0;
    const markerSx = (theme: MarkerTheme) => ({
        minWidth: 0,
        border: selected && interactive ? "2px solid" : "1px solid",
        borderColor: palette.borderColor(theme),
        borderRadius: 99,
        backgroundColor: palette.backgroundColor(theme),
        color: palette.color(theme),
        px: selected && interactive ? 0.95 : 0.85,
        py: selected && interactive ? 0.5 : 0.45,
        fontFamily: theme.typography.fontFamily ?? "inherit",
        fontSize: theme.typography.button.fontSize ?? "0.8125rem",
        fontWeight: theme.typography.button.fontWeight ?? 650,
        letterSpacing: theme.typography.button.letterSpacing ?? "0.02em",
        lineHeight: 1,
        whiteSpace: "nowrap",
        textTransform: theme.typography.button.textTransform ?? "none",
        cursor: interactive ? "pointer" : "default",
        display: "inline-flex",
        gap: 0.45,
        alignItems: "center",
        boxShadow: selected && interactive ? theme.shadows[3] : "none",
        outline: selected && interactive ? "1px solid" : "none",
        outlineColor: selected && interactive ? theme.fgc.focus.outline : "transparent",
        outlineOffset: 2,
        appearance: "none",
        '&:hover': {
            backgroundColor: palette.backgroundColor(theme),
            color: palette.color(theme),
            borderColor: palette.borderColor(theme),
        },
    });

    if (!interactive) {
        return <AppBox component="span" sx={markerSx}>{label}{mode === "offense" && adaptationCount > 0 ? ` · ${adaptationCount}` : ""}</AppBox>;
    }

    return <AppBox component="button" onClick={onClick} sx={markerSx}>{label}{mode === "offense" && adaptationCount > 0 ? ` · ${adaptationCount}` : ""}{mode === "defense" && hasDefense ? <ChatBubbleOutlineIcon sx={{fontSize: selected ? 16 : 14, color: "inherit"}} /> : null}{mode === "offense" && adaptationCount > 0 ? <AltRouteIcon sx={{fontSize: selected ? 16 : 14, color: "inherit"}} /> : null}</AppBox>;
}

function ContextPanel({mode, selectedGap, defenseEntries, adaptations}: {mode: ViewerMode; selectedGap: BlockstringGap | null; defenseEntries: BlockstringDefenseEntry[]; adaptations: BlockstringAdaptation[]}) {
    return (
        <AppPaper variant="outlined" sx={{p: 1.35, borderRadius: 2.5, backgroundColor: "fgc.surface.base", display: "grid", gap: 0.85}}>
            {selectedGap ? <AppBox sx={{display: "grid", gap: 1}}>
                <AppTypography variant="subtitle1" sx={{fontWeight: 900}}>{selectedGap.frames}f {selectedGap.timing === "before_step" ? "before" : "during"} Move {selectedGap.stepOrdinal ?? "?"}</AppTypography>
                {mode === "offense" ? <AdaptationSection adaptations={adaptations} /> : <DefenseSection entries={defenseEntries} />}
            </AppBox> : <AppTypography variant="body2" color="text.secondary">No interaction point selected.</AppTypography>}
        </AppPaper>
    );
}

function DefenseSection({entries}: {entries: BlockstringDefenseEntry[]}) {
    return (
        <AppBox sx={{display: "grid", gap: 0.65}}>
            <AppTypography variant="subtitle2" sx={{fontWeight: 900}}>Defense</AppTypography>
            <DefenseAnswerList entries={entries} />
        </AppBox>
    );
}

function AdaptationSection({adaptations}: {adaptations: BlockstringAdaptation[]}) {
    return <AppBox sx={{display: "grid", gap: 0.65}}><AppTypography variant="subtitle2" sx={{fontWeight: 900}}>Attacker Adaptations</AppTypography>{adaptations.length > 0 ? adaptations.map((adaptation) => <AdaptationCard key={adaptation.id ?? adaptation.explanation ?? adaptation.steps.map((step) => step.move?.id).join("-")} adaptation={adaptation} />) : <AppTypography variant="body2" color="text.secondary">No attacker adaptation documented for this gap.</AppTypography>}</AppBox>;
}

function AdaptationCard({adaptation}: {adaptation: BlockstringAdaptation}) {
    const route = adaptation.steps.map((step) => step.move?.numpadNotation).filter(Boolean).join(" -> ");

    return <AppBox sx={{display: "grid", gap: 0.55, p: 1, border: "1px solid", borderColor: "fgc.border.default", borderRadius: 2, backgroundColor: "fgc.surface.subtle"}}>
        <AppTypography variant="body2" sx={{fontWeight: 900}}>{route || "Route not documented"}</AppTypography>
        {adaptation.explanation ? <AppTypography variant="body2" color="text.secondary">{adaptation.explanation}</AppTypography> : null}
        {adaptation.comboSearch?.url ? <Link href={adaptation.comboSearch.url} style={{textDecoration: "none", justifySelf: "start"}}><AppButton type="button" size="small" variant="outlined" color="secondary">Find Matching Combos</AppButton></Link> : null}
    </AppBox>;
}

function classifyGapForDisplay(gap: BlockstringGap): BlockstringGapClassification {
    if (gap.classification === "safe" || gap.classification === "trades" || gap.classification === "fake") {
        return gap.classification;
    }

    return gap.frames <= 2 ? "safe" : gap.frames === 3 ? "trades" : "fake";
}

function gapClassificationPalette(classification: BlockstringGapClassification): MarkerPalette {
    if (classification === "fake") {
        return {backgroundColor: (theme) => theme.fgc.chip.errorBg, borderColor: (theme) => theme.fgc.feedback.error, color: (theme) => theme.fgc.chip.errorText};
    }
    if (classification === "trades") {
        return {backgroundColor: (theme) => theme.fgc.chip.warningBg, borderColor: (theme) => theme.fgc.feedback.warning, color: (theme) => theme.fgc.chip.warningText};
    }

    return {backgroundColor: (theme) => theme.fgc.chip.infoBg, borderColor: (theme) => theme.fgc.feedback.info, color: (theme) => theme.fgc.chip.infoText};
}

function formatFrameAdvantage(value: number): string {
    return value > 0 ? `+${value}` : String(value);
}

function frameAdvantageColor(value: number, theme: MarkerTheme): string {
    if (value > 0) {
        return theme.fgc.accent.success;
    }
    if (value < 0) {
        return theme.fgc.feedback.error;
    }

    return theme.fgc.feedback.info;
}

function DefenseAnswerList({entries}: {entries: BlockstringDefenseEntry[]}) {
    if (entries.length === 0) {
        return <AppTypography variant="body2" color="text.secondary">No answer documented for this gap.</AppTypography>;
    }

    return (
        <AppBox sx={{display: "grid", gap: 0.65}}>
            {entries.map((entry) => (
                <AppBox key={entry.id ?? entry.instruction ?? entry.conversion} sx={{display: "grid", gap: 0.35}}>
                    <AppTypography variant="body2" sx={{fontWeight: 800}}>{buildDefenseSentence(entry)}</AppTypography>
                    {entry.conversion ? <AppTypography variant="body2" color="text.secondary">Conversion: {entry.conversion}</AppTypography> : null}
                    {entry.exceptionNotes ? <AppTypography variant="body2" color="text.secondary">{entry.exceptionNotes}</AppTypography> : null}
                </AppBox>
            ))}
        </AppBox>
    );
}

function buildDefenseSentence(entry: BlockstringDefenseEntry): string {
    if (entry.instruction) {
        return entry.instruction;
    }

    if (entry.move?.numpadNotation) {
        return `Use ${entry.move.numpadNotation}. ${formatOutcomeSentence(entry.outcome)}`;
    }

    return `Answer details have not been documented yet. ${formatOutcomeSentence(entry.outcome)}`;
}

function formatOutcomeSentence(outcome: BlockstringDefenseEntry["outcome"]): string {
    const label = formatBlockstringLabel(outcome).toLowerCase();
    if (outcome === "counter_hit") {
        return "It counter-hits the next move.";
    }
    if (outcome === "trade") {
        return "It trades with the next move.";
    }
    if (outcome === "escape") {
        return "It escapes the sequence.";
    }

    return `Expected result: ${label}.`;
}

function getInitialSelection(mode: ViewerMode, gaps: BlockstringGap[], defenseEntries: BlockstringDefenseEntry[], adaptations: BlockstringAdaptation[]): SelectedElement {
    const preferredGap = mode === "offense"
        ? gaps.find((gap) => adaptations.some((adaptation) => adaptation.gapId === gap.id))
        : gaps.find((gap) => defenseEntries.some((entry) => entry.gapId === gap.id));
    const firstGap = preferredGap ?? gaps[0];
    if (firstGap) {
        return {type: "gap", key: gapKey(firstGap)};
    }

    return null;
}

function groupGapsByStep(gaps: BlockstringGap[]): Map<number, BlockstringGap[]> {
    const map = new Map<number, BlockstringGap[]>();
    for (const gap of gaps) {
        if (gap.stepOrdinal === null) {
            continue;
        }
        map.set(gap.stepOrdinal, [...(map.get(gap.stepOrdinal) ?? []), gap]);
    }

    return map;
}

function groupDefenseByGapKey(entries: BlockstringDefenseEntry[]): Map<string, BlockstringDefenseEntry[]> {
    const map = new Map<string, BlockstringDefenseEntry[]>();
    for (const entry of entries) {
        if (entry.gapId === null) {
            continue;
        }
        const key = `gap-${entry.gapId}`;
        map.set(key, [...(map.get(key) ?? []), entry]);
    }

    return map;
}

function groupAdaptationsByGapKey(adaptations: BlockstringAdaptation[]): Map<string, BlockstringAdaptation[]> {
    const map = new Map<string, BlockstringAdaptation[]>();
    for (const adaptation of adaptations) {
        if (adaptation.gapId === null) {
            continue;
        }
        const key = `gap-${adaptation.gapId}`;
        map.set(key, [...(map.get(key) ?? []), adaptation]);
    }

    return map;
}

function gapKey(gap: BlockstringGap): string {
    return gap.id ? `gap-${gap.id}` : `gap-${gap.stepOrdinal}-${gap.timing}-${gap.frames}`;
}
