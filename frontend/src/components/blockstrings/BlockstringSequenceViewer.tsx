import React from "react";
import Link from "next/link";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AltRouteIcon, ChatBubbleOutlineIcon} from "@/src/components/ui/AppIcons";
import type {BlockstringAdaptation, BlockstringDefenseEntry, BlockstringDetail, BlockstringGap, BlockstringGapClassification, BlockstringRoute, BlockstringRouteConnection, BlockstringStep} from "@/src/types/blockstring";
import {formatBlockstringLabel} from "@/src/types/blockstring";

type ViewerMode = "offense" | "defense";
type SelectedElement = {type: "connection"; routeId: string; key: string} | null;
type MarkerTheme = {
    typography: {fontFamily?: string; button: {fontSize?: string | number; fontWeight?: string | number; letterSpacing?: string | number; textTransform?: string}};
    fgc: {chip: {errorBg: string; errorText: string; warningBg: string; warningText: string; infoBg: string; infoText: string}; feedback: {error: string; warning: string; success: string; info: string}; focus: {outline: string}; accent: {success: string}};
    shadows: string[];
};
type MarkerPalette = {backgroundColor: (theme: MarkerTheme) => string; borderColor: (theme: MarkerTheme) => string; color: (theme: MarkerTheme) => string};

interface BlockstringSequenceViewerProps {
    item: BlockstringDetail;
}

export function BlockstringSequenceViewer({item}: BlockstringSequenceViewerProps) {
    const routes = React.useMemo(() => normalizeRoutes(item), [item]);
    const defenseEntries = React.useMemo(() => toArray(item.defenseEntries), [item.defenseEntries]);
    const adaptations = React.useMemo(() => toArray(item.adaptations), [item.adaptations]);
    const [mode, setMode] = React.useState<ViewerMode>("offense");
    const [selectedElement, setSelectedElement] = React.useState<SelectedElement>(() => firstSelectableConnection(routes));
    const defenseByGapKey = React.useMemo(() => groupDefenseByGapKey(defenseEntries), [defenseEntries]);
    const adaptationsByGapKey = React.useMemo(() => groupAdaptationsByGapKey(adaptations), [adaptations]);
    const selectedConnection = selectedElement ? findConnection(routes, selectedElement.routeId, selectedElement.key) : null;

    React.useEffect(() => {
        setSelectedElement(firstSelectableConnection(routes));
    }, [routes]);

    return (
        <AppBox sx={{display: "grid", gap: 1.15}}>
            <AppBox sx={{display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap", alignItems: "center"}}>
                <AppBox sx={{display: "inline-flex", p: 0.45, gap: 0.4, border: "1px solid", borderColor: "fgc.border.default", borderRadius: 2.5, backgroundColor: "fgc.surface.sunken", boxSizing: "border-box"}}>
                    <ModeButton active={mode === "offense"} onClick={() => setMode("offense")}>Offense</ModeButton>
                    <ModeButton active={mode === "defense"} onClick={() => setMode("defense")}>Defense</ModeButton>
                </AppBox>
            </AppBox>

            <AppBox sx={{display: "grid", gap: 1}}>
                {routes.map((route) => <Swimlane key={routeKey(route)} route={route} mode={mode} selectedElement={selectedElement} defenseByGapKey={defenseByGapKey} adaptationsByGapKey={adaptationsByGapKey} onSelectConnection={(connection) => setSelectedElement({type: "connection", routeId: routeKey(route), key: connectionKey(connection)})} />)}
            </AppBox>

            <ContextPanel mode={mode} connection={selectedConnection} defenseEntries={selectedConnection?.gap ? defenseByGapKey.get(gapKey(selectedConnection.gap)) ?? [] : []} adaptations={selectedConnection?.gap ? adaptationsByGapKey.get(gapKey(selectedConnection.gap)) ?? [] : []} />
        </AppBox>
    );
}

function Swimlane({route, mode, selectedElement, defenseByGapKey, adaptationsByGapKey, onSelectConnection}: {route: BlockstringRoute; mode: ViewerMode; selectedElement: SelectedElement; defenseByGapKey: Map<string, BlockstringDefenseEntry[]>; adaptationsByGapKey: Map<string, BlockstringAdaptation[]>; onSelectConnection: (connection: BlockstringRouteConnection) => void}) {
    const routeId = routeKey(route);
    const connectionsByDestination = React.useMemo(() => groupConnectionsByDestination(route.connections), [route.connections]);

    return (
        <AppPaper variant="outlined" sx={{p: {xs: 1, md: 1.25}, borderRadius: 2.5, backgroundColor: route.isMain ? "fgc.surface.raised" : "fgc.surface.base", borderColor: route.isMain ? "fgc.border.strong" : "fgc.border.default", display: "grid", gap: 0.85, overflow: "hidden"}}>
            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "190px 1fr"}, gap: 1, alignItems: "start"}}>
                <AppBox sx={{display: "grid", gap: 0.55, alignContent: "start"}}>
                    <AppBox sx={{display: "flex", gap: 0.55, flexWrap: "wrap", alignItems: "center"}}>
                        <AppTypography variant="subtitle1" sx={{fontWeight: 950, lineHeight: 1.1}}>{route.name}</AppTypography>
                        {route.isMain ? <AppChip size="small" label="Main" /> : <AppChip size="small" variant="outlined" label="Layer" />}
                    </AppBox>
                    <ReasonText route={route} />
                    {!route.isMain && (route.branchAnchor.stepOrdinal || route.branchAnchor.connectionId) ? <AppTypography variant="caption" color="text.secondary">Branches at {route.branchAnchor.stepOrdinal ? `move ${route.branchAnchor.stepOrdinal}` : "documented link"}</AppTypography> : null}
                </AppBox>

                <AppBox sx={{display: "flex", alignItems: "stretch", gap: 0.65, overflowX: "auto", pb: 0.4, scrollSnapType: "x proximity"}}>
                    {route.steps.map((step, index) => {
                        const connection = connectionsByDestination.get(step.ordinal) ?? null;
                        return (
                            <React.Fragment key={step.id ?? `${routeId}-${step.ordinal}`}>
                                {index > 0 && connection ? <ConnectionSegment connection={connection} mode={mode} selected={selectedElement?.routeId === routeId && selectedElement.key === connectionKey(connection)} defenseByGapKey={defenseByGapKey} adaptationsByGapKey={adaptationsByGapKey} onSelect={() => onSelectConnection(connection)} /> : null}
                                {index > 0 && !connection ? <ConnectionFallback /> : null}
                                <MoveCard step={step} />
                            </React.Fragment>
                        );
                    })}
                </AppBox>
            </AppBox>
        </AppPaper>
    );
}

function ReasonText({route}: {route: BlockstringRoute}) {
    const label = route.tacticalReasonText;
    if (!label) {
        return null;
    }
    return <AppTypography variant="body2" color="text.secondary" sx={{lineHeight: 1.35}}>{route.isMain ? "Reason: " : "Use when: "}{label}</AppTypography>;
}

function ModeButton({active, onClick, children}: {active: boolean; onClick: () => void; children: React.ReactNode}) {
    return <AppButton type="button" size="small" variant="text" color="secondary" onClick={onClick} sx={{minWidth: 96, fontWeight: 800, border: "1px solid", borderColor: active ? "fgc.accent.selected" : "transparent", borderRadius: 2, backgroundColor: active ? "fgc.surface.raised" : "transparent", color: active ? "fgc.accent.selected" : "text.secondary", boxShadow: active ? 1 : 0, '&:hover': {backgroundColor: active ? "fgc.surface.raised" : "fgc.selection.hover"}}}>{children}</AppButton>;
}

function MoveCard({step}: {step: BlockstringStep}) {
    return (
        <AppBox sx={{border: "1px solid", borderColor: "fgc.border.default", borderRadius: 2.25, backgroundColor: "fgc.surface.subtle", color: "text.primary", minWidth: {xs: 126, sm: 144}, maxWidth: 170, p: 1, display: "grid", gridTemplateRows: "20px 34px", gap: 0.55, textAlign: "center", justifyItems: "center", scrollSnapAlign: "start"}}>
            <AppTypography variant="caption" color="text.secondary">#{step.ordinal}</AppTypography>
            <AppTypography variant="subtitle1" sx={{fontWeight: 900, letterSpacing: "0.02em", lineHeight: 1.1, textAlign: "center"}}>{step.move?.numpadNotation ?? "Unknown"}</AppTypography>
        </AppBox>
    );
}

function ConnectionSegment({connection, mode, selected, defenseByGapKey, adaptationsByGapKey, onSelect}: {connection: BlockstringRouteConnection; mode: ViewerMode; selected: boolean; defenseByGapKey: Map<string, BlockstringDefenseEntry[]>; adaptationsByGapKey: Map<string, BlockstringAdaptation[]>; onSelect: () => void}) {
    const gap = connection.gap;
    const hasDefense = gap ? (defenseByGapKey.get(gapKey(gap)) ?? []).length > 0 : false;
    const adaptationCount = gap ? (adaptationsByGapKey.get(gapKey(gap)) ?? []).length : 0;
    const interactive = Boolean(gap) || connection.type === "hit_confirm" || connection.type === "not_confirmable";
    return (
        <AppBox sx={{minWidth: 118, display: "grid", placeItems: "center", alignContent: "center", gap: 0.45}}>
            {gap?.timing === "before_step" ? <FrameAdvantageText value={gap.frameAdvantage ?? 0} /> : null}
            <ConnectionMarker connection={connection} mode={mode} selected={selected} hasDefense={hasDefense} adaptationCount={adaptationCount} interactive={interactive} onClick={onSelect} />
        </AppBox>
    );
}

function ConnectionFallback() {
    return <AppBox sx={{minWidth: 72, display: "grid", placeItems: "center", color: "text.secondary"}}><AppTypography variant="caption" sx={{fontWeight: 800}}>true</AppTypography></AppBox>;
}

function FrameAdvantageText({value}: {value: number}) {
    return <AppTypography variant="caption" sx={(theme: MarkerTheme) => ({fontWeight: 900, lineHeight: 1, mb: 0.15, color: frameAdvantageColor(value, theme)})}>{formatFrameAdvantage(value)}</AppTypography>;
}

function ConnectionMarker({connection, mode, selected, hasDefense, adaptationCount, interactive, onClick}: {connection: BlockstringRouteConnection; mode: ViewerMode; selected: boolean; hasDefense: boolean; adaptationCount: number; interactive: boolean; onClick: () => void}) {
    const label = connectionLabel(connection);
    const palette = connectionPalette(connection);
    const markerSx = (theme: MarkerTheme) => ({
        minWidth: 0,
        border: selected ? "2px solid" : "1px solid",
        borderColor: palette.borderColor(theme),
        borderRadius: 99,
        backgroundColor: palette.backgroundColor(theme),
        color: palette.color(theme),
        px: selected ? 0.95 : 0.85,
        py: selected ? 0.5 : 0.45,
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
        boxShadow: selected ? theme.shadows[3] : "none",
        outline: selected ? "1px solid" : "none",
        outlineColor: selected ? theme.fgc.focus.outline : "transparent",
        outlineOffset: 2,
        appearance: "none",
    });

    const suffix = mode === "offense" && adaptationCount > 0 ? ` · ${adaptationCount}` : "";
    const icon = mode === "defense" && hasDefense ? <ChatBubbleOutlineIcon sx={{fontSize: selected ? 16 : 14, color: "inherit"}} /> : mode === "offense" && adaptationCount > 0 ? <AltRouteIcon sx={{fontSize: selected ? 16 : 14, color: "inherit"}} /> : null;
    if (!interactive) {
        return <AppBox component="span" sx={markerSx}>{label}{suffix}</AppBox>;
    }

    return <AppBox component="button" onClick={onClick} sx={markerSx}>{label}{suffix}{icon}</AppBox>;
}

function ContextPanel({mode, connection, defenseEntries, adaptations}: {mode: ViewerMode; connection: BlockstringRouteConnection | null; defenseEntries: BlockstringDefenseEntry[]; adaptations: BlockstringAdaptation[]}) {
    return (
        <AppPaper variant="outlined" sx={{p: 1.35, borderRadius: 2.5, backgroundColor: "fgc.surface.base", display: "grid", gap: 0.85}}>
            {connection ? <AppBox sx={{display: "grid", gap: 1}}>
                <AppTypography variant="subtitle1" sx={{fontWeight: 900}}>{connectionLabel(connection)}</AppTypography>
                {mode === "offense" ? <OffenseSection connection={connection} adaptations={adaptations} /> : <DefenseSection connection={connection} entries={defenseEntries} />}
            </AppBox> : <AppTypography variant="body2" color="text.secondary">No route link selected.</AppTypography>}
        </AppPaper>
    );
}

function OffenseSection({connection, adaptations}: {connection: BlockstringRouteConnection; adaptations: BlockstringAdaptation[]}) {
    return <AppBox sx={{display: "grid", gap: 0.65}}>
        {connection.type === "hit_confirm" ? <AppTypography variant="body2" color="text.secondary">Hit confirm before committing to the next action.</AppTypography> : null}
        {connection.type === "not_confirmable" ? <AppTypography variant="body2" color="text.secondary">This link must be committed to in advance.</AppTypography> : null}
        <AdaptationSection adaptations={adaptations} />
    </AppBox>;
}

function DefenseSection({connection, entries}: {connection: BlockstringRouteConnection; entries: BlockstringDefenseEntry[]}) {
    return <AppBox sx={{display: "grid", gap: 0.65}}>
        {connection.type === "hit_confirm" ? <AppTypography variant="body2" color="text.secondary">The attacker can wait for the hit before committing to the next action.</AppTypography> : null}
        <DefenseAnswerList entries={entries} />
    </AppBox>;
}

function AdaptationSection({adaptations}: {adaptations: BlockstringAdaptation[]}) {
    if (adaptations.length === 0) {
        return null;
    }
    return <AppBox sx={{display: "grid", gap: 0.65}}><AppTypography variant="subtitle2" sx={{fontWeight: 900}}>Legacy Adaptations</AppTypography>{adaptations.map((adaptation) => <AdaptationCard key={adaptation.id ?? adaptation.explanation ?? adaptation.steps.map((step) => step.move?.id).join("-")} adaptation={adaptation} />)}</AppBox>;
}

function AdaptationCard({adaptation}: {adaptation: BlockstringAdaptation}) {
    const route = adaptation.steps.map((step) => step.move?.numpadNotation).filter(Boolean).join(" -> ");
    return <AppBox sx={{display: "grid", gap: 0.55, p: 1, border: "1px solid", borderColor: "fgc.border.default", borderRadius: 2, backgroundColor: "fgc.surface.subtle"}}>
        <AppTypography variant="body2" sx={{fontWeight: 900}}>{route || "Route not documented"}</AppTypography>
        {adaptation.explanation ? <AppTypography variant="body2" color="text.secondary">{adaptation.explanation}</AppTypography> : null}
        {adaptation.comboSearch?.url ? <Link href={adaptation.comboSearch.url} style={{textDecoration: "none", justifySelf: "start"}}><AppButton type="button" size="small" variant="outlined" color="secondary">Find Matching Combos</AppButton></Link> : null}
    </AppBox>;
}

function DefenseAnswerList({entries}: {entries: BlockstringDefenseEntry[]}) {
    if (entries.length === 0) {
        return <AppTypography variant="body2" color="text.secondary">No defensive answer documented for this link.</AppTypography>;
    }
    return <AppBox sx={{display: "grid", gap: 0.65}}>{entries.map((entry) => <AppBox key={entry.id ?? entry.instruction ?? entry.conversion} sx={{display: "grid", gap: 0.35}}><AppTypography variant="body2" sx={{fontWeight: 800}}>{buildDefenseSentence(entry)}</AppTypography>{entry.conversion ? <AppTypography variant="body2" color="text.secondary">Conversion: {entry.conversion}</AppTypography> : null}{entry.exceptionNotes ? <AppTypography variant="body2" color="text.secondary">{entry.exceptionNotes}</AppTypography> : null}</AppBox>)}</AppBox>;
}

function normalizeRoutes(item: BlockstringDetail): BlockstringRoute[] {
    const routes = toArray(item.routes);
    if (routes.length > 0) {
        return routes.map((route) => route.connections.length > 0 ? route : {...route, connections: synthesizeConnections(route.steps, item.gaps)});
    }
    return [{id: item.id, name: "Main route", displayOrder: 1, isMain: true, tacticalReasonText: null, branchAnchor: {stepId: null, stepOrdinal: null, connectionId: null}, steps: item.steps, connections: synthesizeConnections(item.steps, item.gaps)}];
}

function synthesizeConnections(steps: BlockstringStep[], gaps: BlockstringGap[]): BlockstringRouteConnection[] {
    return steps.slice(1).map((step, index) => {
        const gap = gaps.find((item) => item.stepOrdinal === step.ordinal && item.timing === "before_step") ?? null;
        return {id: undefined, ordinal: index + 1, type: gap ? "gap" : step.canConfirmOnHit ? "hit_confirm" : "guaranteed", sourceStepId: steps[index]?.id ?? null, sourceStepOrdinal: steps[index]?.ordinal ?? null, destinationStepId: step.id ?? null, destinationStepOrdinal: step.ordinal, gap};
    });
}

function toArray<T>(value: T[] | Record<string, T> | null | undefined): T[] {
    return Array.isArray(value) ? value : Object.values(value ?? {});
}

function groupConnectionsByDestination(connections: BlockstringRouteConnection[]): Map<number, BlockstringRouteConnection> {
    const map = new Map<number, BlockstringRouteConnection>();
    for (const connection of connections) {
        if (connection.destinationStepOrdinal !== null) {
            map.set(connection.destinationStepOrdinal, connection);
        }
    }
    return map;
}

function groupDefenseByGapKey(entries: BlockstringDefenseEntry[]): Map<string, BlockstringDefenseEntry[]> {
    const map = new Map<string, BlockstringDefenseEntry[]>();
    for (const entry of entries) {
        if (entry.gapId !== null) {
            const key = `gap-${entry.gapId}`;
            map.set(key, [...(map.get(key) ?? []), entry]);
        }
    }
    return map;
}

function groupAdaptationsByGapKey(adaptations: BlockstringAdaptation[]): Map<string, BlockstringAdaptation[]> {
    const map = new Map<string, BlockstringAdaptation[]>();
    for (const adaptation of adaptations) {
        if (adaptation.gapId !== null) {
            const key = `gap-${adaptation.gapId}`;
            map.set(key, [...(map.get(key) ?? []), adaptation]);
        }
    }
    return map;
}

function firstSelectableConnection(routes: BlockstringRoute[]): SelectedElement {
    for (const route of routes) {
        const connection = route.connections[0];
        if (connection) {
            return {type: "connection", routeId: routeKey(route), key: connectionKey(connection)};
        }
    }
    return null;
}

function findConnection(routes: BlockstringRoute[], routeId: string, key: string): BlockstringRouteConnection | null {
    const route = routes.find((item) => routeKey(item) === routeId);
    return route?.connections.find((connection) => connectionKey(connection) === key) ?? null;
}

function connectionLabel(connection: BlockstringRouteConnection): string {
    if (connection.type === "hit_confirm") {
        return "Hit Confirm";
    }
    if (connection.type === "not_confirmable") {
        return "Commit";
    }
    if (connection.gap) {
        return `${connection.gap.frames}f ${formatBlockstringLabel(classifyGapForDisplay(connection.gap)).toLowerCase()}`;
    }
    return formatBlockstringLabel(connection.type);
}

function connectionPalette(connection: BlockstringRouteConnection): MarkerPalette {
    if (connection.type === "hit_confirm") {
        return {backgroundColor: (theme) => theme.fgc.chip.infoBg, borderColor: (theme) => theme.fgc.feedback.info, color: (theme) => theme.fgc.chip.infoText};
    }
    if (connection.type === "not_confirmable") {
        return {backgroundColor: (theme) => theme.fgc.chip.warningBg, borderColor: (theme) => theme.fgc.feedback.warning, color: (theme) => theme.fgc.chip.warningText};
    }
    if (connection.gap) {
        return gapClassificationPalette(classifyGapForDisplay(connection.gap));
    }
    return {backgroundColor: (theme) => theme.fgc.chip.infoBg, borderColor: (theme) => theme.fgc.feedback.success, color: (theme) => theme.fgc.chip.infoText};
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
    if (outcome === "counter_hit") {
        return "It counter-hits the next move.";
    }
    if (outcome === "trade") {
        return "It trades with the next move.";
    }
    if (outcome === "escape") {
        return "It escapes the sequence.";
    }
    return `Expected result: ${formatBlockstringLabel(outcome).toLowerCase()}.`;
}

function routeKey(route: BlockstringRoute): string {
    return route.id ? `route-${route.id}` : `${route.name}-${route.displayOrder}`;
}

function connectionKey(connection: BlockstringRouteConnection): string {
    return connection.id ? `connection-${connection.id}` : `${connection.sourceStepOrdinal}-${connection.destinationStepOrdinal}-${connection.type}`;
}

function gapKey(gap: BlockstringGap): string {
    return gap.id ? `gap-${gap.id}` : `gap-${gap.stepOrdinal}-${gap.timing}-${gap.frames}`;
}
