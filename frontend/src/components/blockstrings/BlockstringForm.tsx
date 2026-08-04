import React from "react";
import {useCharacters} from "@/hooks/useCharacters";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppFormControl} from "@/src/components/ui/AppFormControl";
import {AppInputLabel} from "@/src/components/ui/AppInputLabel";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {AppSelect} from "@/src/components/ui/AppSelect";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {OkiMovePicker, type OkiMoveOption} from "@/src/components/okis/OkiMovePicker";
import type {BlockstringConnectionType, BlockstringDetail, BlockstringGapClassification, BlockstringPayload} from "@/src/types/blockstring";
import {BLOCKSTRING_CLASSIFICATIONS, BLOCKSTRING_CONNECTION_TYPES, formatBlockstringLabel} from "@/src/types/blockstring";

interface RouteStepDraft {
    clientId: string;
    move: OkiMoveOption | null;
    note: string;
}

interface RouteConnectionDraft {
    clientId: string;
    gapClientId: string;
    sourceStepClientId: string | null;
    destinationStepClientId: string;
    type: BlockstringConnectionType;
    gapFrames: string;
    frameAdvantage: string;
    classification: BlockstringGapClassification;
}

interface RouteDraft {
    clientId: string;
    name: string;
    isMain: boolean;
    tacticalReasonText: string;
    branchAnchorConnectionClientId: string;
    steps: RouteStepDraft[];
    connections: RouteConnectionDraft[];
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

function moveToOption(move: {id: string; numpadNotation: string; character?: {id: string; name: string} | null} | null | undefined): OkiMoveOption | null {
    return move ? {id: move.id, summary: `${move.character?.name ?? ""} ${move.numpadNotation}`.trim(), characterId: move.character?.id} : null;
}

function createStep(clientId: string): RouteStepDraft {
    return {clientId, move: null, note: ""};
}

function createConnection(clientId: string, sourceStepClientId: string | null, destinationStepClientId: string): RouteConnectionDraft {
    return {clientId, gapClientId: `gap-${clientId}`, sourceStepClientId, destinationStepClientId, type: "guaranteed", gapFrames: "", frameAdvantage: "0", classification: "safe"};
}

function routesFromDetail(detail: BlockstringDetail | null | undefined): RouteDraft[] {
    if (!detail) {
        const firstStep = createStep("main-step-1");
        return [{clientId: "main", name: "Main route", isMain: true, tacticalReasonText: "", branchAnchorConnectionClientId: "", steps: [firstStep], connections: []}];
    }

    if (detail.routes.length === 0) {
        const steps = detail.steps.map((step) => ({clientId: `step-${step.id ?? step.ordinal}`, move: moveToOption(step.move), note: step.note ?? ""}));
        return [{clientId: "main", name: "Main route", isMain: true, tacticalReasonText: "", branchAnchorConnectionClientId: "", steps, connections: buildSequentialConnections("main", steps)}];
    }

    const connectionIdMap = new Map<number, string>();
    for (const route of detail.routes) {
        for (const connection of route.connections) {
            if (connection.id) {
                connectionIdMap.set(connection.id, `connection-${connection.id}`);
            }
        }
    }

    return detail.routes.map((route) => {
        const steps = route.steps.map((step) => ({clientId: `step-${step.id ?? `${route.id}-${step.ordinal}`}`, move: moveToOption(step.move), note: step.note ?? ""}));
        const stepClientByOrdinal = new Map(steps.map((step, index) => [index + 1, step.clientId]));
        const connections = route.connections.map((connection) => ({
            clientId: `connection-${connection.id ?? `${route.id}-${connection.ordinal}`}`,
            gapClientId: connection.gap?.id ? `gap-${connection.gap.id}` : `gap-connection-${connection.id ?? `${route.id}-${connection.ordinal}`}`,
            sourceStepClientId: connection.sourceStepOrdinal ? stepClientByOrdinal.get(connection.sourceStepOrdinal) ?? null : null,
            destinationStepClientId: connection.destinationStepOrdinal ? stepClientByOrdinal.get(connection.destinationStepOrdinal) ?? steps[0]?.clientId ?? "" : steps[0]?.clientId ?? "",
            type: connection.type,
            gapFrames: connection.gap ? String(connection.gap.frames) : "",
            frameAdvantage: connection.gap ? String(connection.gap.frameAdvantage ?? 0) : "0",
            classification: connection.gap?.classification ?? "safe",
        }));
        return {clientId: `route-${route.id ?? route.displayOrder}`, name: route.name, isMain: route.isMain, tacticalReasonText: route.tacticalReasonText ?? "", branchAnchorConnectionClientId: route.branchAnchor.connectionId ? connectionIdMap.get(route.branchAnchor.connectionId) ?? "" : "", steps, connections};
    });
}

function buildSequentialConnections(routeClientId: string, steps: RouteStepDraft[]): RouteConnectionDraft[] {
    return steps.slice(1).map((step, index) => createConnection(`${routeClientId}-connection-${index + 1}`, steps[index]?.clientId ?? null, step.clientId));
}

export function BlockstringForm({initialValue = null, submitLabel, saving = false, onSubmit}: BlockstringFormProps) {
    const {characters} = useCharacters();
    const [title, setTitle] = React.useState(initialValue?.title ?? "");
    const [summary, setSummary] = React.useState(initialValue?.summary ?? "");
    const [attackerCharacterId, setAttackerCharacterId] = React.useState(initialValue?.attackerCharacter?.id ?? "");
    const [classification, setClassification] = React.useState<string>(initialValue?.classification ?? "fake");
    const [routes, setRoutes] = React.useState<RouteDraft[]>(() => routesFromDetail(initialValue));
    const draftIdRef = React.useRef(1);
    const nextDraftId = () => {
        const id = draftIdRef.current;
        draftIdRef.current += 1;
        return id;
    };

    const updateRoute = (clientId: string, patch: Partial<RouteDraft>) => setRoutes((current) => current.map((route) => route.clientId === clientId ? {...route, ...patch} : route));
    const updateRouteStep = (routeClientId: string, stepClientId: string, patch: Partial<RouteStepDraft>) => setRoutes((current) => current.map((route) => route.clientId === routeClientId ? {...route, steps: route.steps.map((step) => step.clientId === stepClientId ? {...step, ...patch} : step)} : route));
    const updateConnection = (routeClientId: string, connectionClientId: string, patch: Partial<RouteConnectionDraft>) => setRoutes((current) => current.map((route) => route.clientId === routeClientId ? {...route, connections: route.connections.map((connection) => connection.clientId === connectionClientId ? {...connection, ...patch} : connection)} : route));

    const addRoute = () => {
        const clientId = `route-new-${nextDraftId()}`;
        const firstStep = createStep(`${clientId}-step-1`);
        setRoutes((current) => [...current, {clientId, name: "New route", isMain: false, tacticalReasonText: "", branchAnchorConnectionClientId: allConnections(current)[0]?.clientId ?? "", steps: [firstStep], connections: []}]);
    };

    const duplicateRoute = (route: RouteDraft) => {
        const clientId = `route-copy-${nextDraftId()}`;
        const stepIds = new Map<string, string>();
        const steps = route.steps.map((step, index) => {
            const nextId = `${clientId}-step-${index + 1}`;
            stepIds.set(step.clientId, nextId);
            return {...step, clientId: nextId};
        });
        const connections = route.connections.map((connection, index) => ({...connection, clientId: `${clientId}-connection-${index + 1}`, sourceStepClientId: connection.sourceStepClientId ? stepIds.get(connection.sourceStepClientId) ?? null : null, destinationStepClientId: stepIds.get(connection.destinationStepClientId) ?? steps[0]?.clientId ?? ""}));
        setRoutes((current) => [...current, {...route, clientId, name: `${route.name} copy`, isMain: false, steps, connections}]);
    };

    const moveRoute = (routeClientId: string, direction: -1 | 1) => {
        setRoutes((current) => {
            const alternatives = current.filter((route) => !route.isMain);
            const main = current.find((route) => route.isMain) ?? current[0];
            const index = alternatives.findIndex((route) => route.clientId === routeClientId);
            const nextIndex = index + direction;
            if (index < 0 || nextIndex < 0 || nextIndex >= alternatives.length) {
                return current;
            }
            const next = [...alternatives];
            [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
            return main ? [main, ...next] : next;
        });
    };

    const addStep = (routeClientId: string) => {
        setRoutes((current) => current.map((route) => {
            if (route.clientId !== routeClientId) {
                return route;
            }
            const step = createStep(`${route.clientId}-step-${nextDraftId()}`);
            const previous = route.steps[route.steps.length - 1];
            return {...route, steps: [...route.steps, step], connections: previous ? [...route.connections, createConnection(`${route.clientId}-connection-${nextDraftId()}`, previous.clientId, step.clientId)] : route.connections};
        }));
    };

    const removeStep = (routeClientId: string, stepClientId: string) => {
        setRoutes((current) => current.map((route) => route.clientId === routeClientId && route.steps.length > 1 ? {...route, steps: route.steps.filter((step) => step.clientId !== stepClientId), connections: route.connections.filter((connection) => connection.sourceStepClientId !== stepClientId && connection.destinationStepClientId !== stepClientId)} : route));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const orderedRoutes = orderRoutes(routes);
        const payload: BlockstringPayload = {
            title,
            summary: summary || null,
            attackerCharacterId,
            classification,
            steps: orderedRoutes[0]?.steps.filter((step) => step.move).map((step, index) => ({moveId: step.move?.id ?? "", ordinal: index + 1, note: step.note || null})) ?? [],
            routes: orderedRoutes.map((route, routeIndex) => ({
                clientId: route.clientId,
                name: route.name || (route.isMain ? "Main route" : "Alternative route"),
                displayOrder: routeIndex + 1,
                isMain: routeIndex === 0,
                tacticalReasonText: route.tacticalReasonText || null,
                branchAnchor: route.branchAnchorConnectionClientId ? {connectionClientId: route.branchAnchorConnectionClientId} : null,
                steps: route.steps.filter((step) => step.move).map((step, index) => ({clientId: step.clientId, moveId: step.move?.id ?? "", ordinal: index + 1, note: step.note || null})),
                connections: route.connections.filter((connection) => route.steps.some((step) => step.clientId === connection.destinationStepClientId && step.move)).map((connection, index) => ({
                    clientId: connection.clientId,
                    sourceStepClientId: connection.sourceStepClientId,
                    destinationStepClientId: connection.destinationStepClientId,
                    ordinal: index + 1,
                    type: connection.type,
                    gapClientId: connection.gapClientId,
                    gapFrames: connection.type === "gap" || connection.type === "manual_delay" ? numberOrNull(connection.gapFrames) : null,
                    gapTiming: "before_step",
                    frameAdvantage: numberOrNull(connection.frameAdvantage),
                    classification: connection.classification,
                })),
            })),
            defenseEntries: preserveDefenseEntries(initialValue),
            adaptations: preserveAdaptations(initialValue),
        };
        await onSubmit(payload);
    };

    const orderedRoutes = orderRoutes(routes);
    const branchOptions = allConnections(orderedRoutes);

    return (
        <AppBox component="form" onSubmit={handleSubmit} sx={{display: "grid", gap: 1.25}}>
            <AppPaper variant="outlined" sx={{p: 1.5, borderRadius: 2.5, display: "grid", gap: 1, backgroundColor: "fgc.surface.base"}}>
                <AppTypography variant="h6">Core</AppTypography>
                <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "1fr 220px 180px"}, gap: 1}}>
                    <AppTextField size="small" label="Title" value={title} onChange={(event) => setTitle(event.target.value)} required />
                    <AppFormControl size="small" required><AppInputLabel id="blockstring-attacker-label">Attacker</AppInputLabel><AppSelect<string> labelId="blockstring-attacker-label" label="Attacker" value={attackerCharacterId} onChange={(event) => setAttackerCharacterId(String(event.target.value))}>{(characters as Array<{id: string; name: string}>).map((character) => <AppMenuItem key={character.id} value={character.id}>{character.name}</AppMenuItem>)}</AppSelect></AppFormControl>
                    <AppFormControl size="small"><AppInputLabel id="blockstring-classification-label">Status</AppInputLabel><AppSelect<string> labelId="blockstring-classification-label" label="Status" value={classification} onChange={(event) => setClassification(String(event.target.value))}>{BLOCKSTRING_CLASSIFICATIONS.map((option) => <AppMenuItem key={option} value={option}>{formatBlockstringLabel(option)}</AppMenuItem>)}</AppSelect></AppFormControl>
                </AppBox>
                <AppTextField size="small" label="Explanation" value={summary} onChange={(event) => setSummary(event.target.value)} multiline minRows={2} />
            </AppPaper>

            <AppBox sx={{display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap", alignItems: "center"}}>
                <AppTypography variant="h6">Routes</AppTypography>
                <AppButton type="button" variant="outlined" color="secondary" onClick={addRoute}>Add Route</AppButton>
            </AppBox>

            {orderedRoutes.map((route, routeIndex) => <RouteEditor key={route.clientId} route={route} routeIndex={routeIndex} branchOptions={branchOptions.filter((option) => option.routeClientId !== route.clientId)} attackerCharacterId={attackerCharacterId} onUpdateRoute={updateRoute} onUpdateStep={updateRouteStep} onUpdateConnection={updateConnection} onAddStep={addStep} onRemoveStep={removeStep} onDuplicate={() => duplicateRoute(route)} onRemove={() => setRoutes((current) => current.filter((item) => item.clientId !== route.clientId))} onMoveUp={() => moveRoute(route.clientId, -1)} onMoveDown={() => moveRoute(route.clientId, 1)} />)}

            <AppBox sx={{display: "flex", justifyContent: "flex-end"}}>
                <AppButton type="submit" variant="contained" color="primary" disabled={saving || orderedRoutes[0]?.steps.every((step) => !step.move)}>{saving ? "Saving..." : submitLabel}</AppButton>
            </AppBox>
        </AppBox>
    );
}

function RouteEditor({route, routeIndex, branchOptions, attackerCharacterId, onUpdateRoute, onUpdateStep, onUpdateConnection, onAddStep, onRemoveStep, onDuplicate, onRemove, onMoveUp, onMoveDown}: {route: RouteDraft; routeIndex: number; branchOptions: Array<{clientId: string; label: string; routeClientId: string}>; attackerCharacterId: string; onUpdateRoute: (clientId: string, patch: Partial<RouteDraft>) => void; onUpdateStep: (routeClientId: string, stepClientId: string, patch: Partial<RouteStepDraft>) => void; onUpdateConnection: (routeClientId: string, connectionClientId: string, patch: Partial<RouteConnectionDraft>) => void; onAddStep: (routeClientId: string) => void; onRemoveStep: (routeClientId: string, stepClientId: string) => void; onDuplicate: () => void; onRemove: () => void; onMoveUp: () => void; onMoveDown: () => void}) {
    return <AppPaper variant="outlined" sx={{p: 1.5, borderRadius: 2.5, display: "grid", gap: 1, backgroundColor: route.isMain ? "fgc.surface.raised" : "fgc.surface.base", borderColor: route.isMain ? "fgc.border.strong" : "fgc.border.default"}}>
        <AppBox sx={{display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap", alignItems: "center"}}>
            <AppTypography variant="subtitle1" sx={{fontWeight: 900}}>{route.isMain ? "Main Route" : `Route ${routeIndex + 1}`}</AppTypography>
            <AppBox sx={{display: "flex", gap: 0.5, flexWrap: "wrap"}}>
                {!route.isMain ? <AppButton type="button" size="small" variant="outlined" color="secondary" onClick={onMoveUp}>Move Up</AppButton> : null}
                {!route.isMain ? <AppButton type="button" size="small" variant="outlined" color="secondary" onClick={onMoveDown}>Move Down</AppButton> : null}
                <AppButton type="button" size="small" variant="outlined" color="secondary" onClick={onDuplicate}>Duplicate</AppButton>
                {!route.isMain ? <AppButton type="button" size="small" variant="outlined" color="secondary" onClick={onRemove}>Remove</AppButton> : null}
            </AppBox>
        </AppBox>
        <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "220px 1fr"}, gap: 1}}>
            <AppTextField size="small" label="Route name" value={route.name} onChange={(event) => onUpdateRoute(route.clientId, {name: event.target.value})} required />
            <AppTextField size="small" label={route.isMain ? "Reason" : "Use this route when..."} value={route.tacticalReasonText} onChange={(event) => onUpdateRoute(route.clientId, {tacticalReasonText: event.target.value})} required={!route.isMain} />
        </AppBox>
        {!route.isMain ? <AppFormControl size="small"><AppInputLabel id={`${route.clientId}-branch-label`}>Branches from</AppInputLabel><AppSelect<string> labelId={`${route.clientId}-branch-label`} label="Branches from" value={route.branchAnchorConnectionClientId} onChange={(event) => onUpdateRoute(route.clientId, {branchAnchorConnectionClientId: String(event.target.value)})}><AppMenuItem value="">No exact anchor</AppMenuItem>{branchOptions.map((option) => <AppMenuItem key={option.clientId} value={option.clientId}>{option.label}</AppMenuItem>)}</AppSelect></AppFormControl> : null}
        <AppBox sx={{display: "grid", gap: 0.85}}>
            {route.steps.map((step, index) => <AppBox key={step.clientId} sx={{display: "grid", gap: 0.75, borderTop: index === 0 ? "none" : "1px solid", borderColor: "fgc.border.default", pt: index === 0 ? 0 : 1}}>
                {index > 0 ? <ConnectionEditor route={route} connection={route.connections.find((item) => item.destinationStepClientId === step.clientId)} onUpdateConnection={onUpdateConnection} /> : null}
                <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "1fr auto"}, gap: 1, alignItems: "center"}}>
                    <OkiMovePicker label={`Move ${index + 1}`} value={step.move} characterId={attackerCharacterId || undefined} onChange={(move) => onUpdateStep(route.clientId, step.clientId, {move})} />
                    {route.steps.length > 1 ? <AppButton type="button" variant="outlined" color="secondary" onClick={() => onRemoveStep(route.clientId, step.clientId)}>Remove Move</AppButton> : null}
                </AppBox>
            </AppBox>)}
            <AppButton type="button" variant="outlined" color="secondary" onClick={() => onAddStep(route.clientId)}>Add Move</AppButton>
        </AppBox>
    </AppPaper>;
}

function ConnectionEditor({route, connection, onUpdateConnection}: {route: RouteDraft; connection?: RouteConnectionDraft; onUpdateConnection: (routeClientId: string, connectionClientId: string, patch: Partial<RouteConnectionDraft>) => void}) {
    if (!connection) {
        return null;
    }
    return <AppBox sx={{display: "grid", gap: 0.75, p: 1, border: "1px solid", borderColor: "fgc.border.default", borderRadius: 2, backgroundColor: "fgc.surface.sunken"}}>
        <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "180px 100px 110px 140px"}, gap: 1}}>
            <AppFormControl size="small"><AppInputLabel id={`${connection.clientId}-type-label`}>Connection</AppInputLabel><AppSelect<BlockstringConnectionType> labelId={`${connection.clientId}-type-label`} label="Connection" value={connection.type} onChange={(event) => onUpdateConnection(route.clientId, connection.clientId, {type: event.target.value as BlockstringConnectionType})}>{BLOCKSTRING_CONNECTION_TYPES.map((option) => <AppMenuItem key={option} value={option}>{formatBlockstringLabel(option)}</AppMenuItem>)}</AppSelect></AppFormControl>
            {connection.type === "gap" || connection.type === "manual_delay" ? <AppTextField size="small" label="Frames" value={connection.gapFrames} onChange={(event) => onUpdateConnection(route.clientId, connection.clientId, {gapFrames: event.target.value})} /> : <AppBox />}
            {connection.type === "gap" || connection.type === "manual_delay" ? <AppTextField size="small" label="Frame adv." value={connection.frameAdvantage} onChange={(event) => onUpdateConnection(route.clientId, connection.clientId, {frameAdvantage: event.target.value})} /> : <AppBox />}
            {connection.type === "gap" || connection.type === "manual_delay" ? <AppFormControl size="small"><AppInputLabel id={`${connection.clientId}-class-label`}>Status</AppInputLabel><AppSelect<BlockstringGapClassification> labelId={`${connection.clientId}-class-label`} label="Status" value={connection.classification} onChange={(event) => onUpdateConnection(route.clientId, connection.clientId, {classification: event.target.value as BlockstringGapClassification})}><AppMenuItem value="safe">Safe</AppMenuItem><AppMenuItem value="trades">Trades</AppMenuItem><AppMenuItem value="fake">Fake</AppMenuItem></AppSelect></AppFormControl> : <AppBox />}
        </AppBox>
    </AppBox>;
}

function orderRoutes(routes: RouteDraft[]): RouteDraft[] {
    const main = routes.find((route) => route.isMain) ?? routes[0];
    return main ? [{...main, isMain: true}, ...routes.filter((route) => route.clientId !== main.clientId).map((route) => ({...route, isMain: false}))] : [];
}

function allConnections(routes: RouteDraft[]): Array<{clientId: string; label: string; routeClientId: string}> {
    return routes.flatMap((route) => route.connections.map((connection, index) => ({clientId: connection.clientId, routeClientId: route.clientId, label: `${route.name} link ${index + 1}`})));
}

function preserveDefenseEntries(initialValue: BlockstringDetail | null): BlockstringPayload["defenseEntries"] {
    return initialValue?.defenseEntries.map((entry) => ({gapClientId: entry.gapId ? `gap-${entry.gapId}` : null, instruction: entry.instruction, exceptionNotes: entry.exceptionNotes, defenderCharacterId: entry.defenderCharacter?.id ?? null, moveId: entry.move?.id ?? null, responseType: entry.responseType, outcome: entry.outcome, conversion: entry.conversion})) ?? [];
}

function preserveAdaptations(initialValue: BlockstringDetail | null): BlockstringPayload["adaptations"] {
    return initialValue?.adaptations.map((adaptation) => ({clientId: `adaptation-${adaptation.id ?? adaptation.gapId}`, gapClientId: adaptation.gapId ? `gap-${adaptation.gapId}` : "", explanation: adaptation.explanation, steps: adaptation.steps.filter((step) => step.move).map((step, index) => ({moveId: step.move?.id ?? "", ordinal: index + 1})), comboSearch: adaptation.comboSearch ? {firstMoveId: adaptation.comboSearch.firstMove?.id ?? null, enderMoveId: adaptation.comboSearch.enderMove?.id ?? null, spacingCode: adaptation.comboSearch.spacing?.code ?? null, minDamage: typeof adaptation.comboSearch.filters.minDamage === "number" ? adaptation.comboSearch.filters.minDamage : null, maxDamage: typeof adaptation.comboSearch.filters.maxDamage === "number" ? adaptation.comboSearch.filters.maxDamage : null, minDriveCost: typeof adaptation.comboSearch.filters.minDriveCost === "number" ? adaptation.comboSearch.filters.minDriveCost : null, maxDriveCost: typeof adaptation.comboSearch.filters.maxDriveCost === "number" ? adaptation.comboSearch.filters.maxDriveCost : null, counterHitRequired: adaptation.comboSearch.filters.counterHitRequired === true, punishCounterRequired: adaptation.comboSearch.filters.punishCounterRequired === true, cornerRequired: adaptation.comboSearch.filters.cornerRequired === true} : undefined})) ?? [];
}
