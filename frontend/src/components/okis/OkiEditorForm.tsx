import React from "react";
import {useRouter} from "next/router";
import {useCharacters} from "@/hooks/useCharacters";
import useMoves from "@/hooks/useMoves";
import useOkis from "@/hooks/useOkis";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppCheckbox} from "@/src/components/ui/AppCheckbox";
import {AppFormControl} from "@/src/components/ui/AppFormControl";
import {AppFormControlLabel} from "@/src/components/ui/AppFormControlLabel";
import {AppInputLabel} from "@/src/components/ui/AppInputLabel";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {AppSelect} from "@/src/components/ui/AppSelect";
import {AppStack} from "@/src/components/ui/AppStack";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {formatOkiLabel, OKI_INTERACTION_RESULTS, OKI_NODE_PROPERTIES, OKI_OPTION_TYPES, OKI_STEP_TYPES} from "@/src/types/oki";
import type {OkiInteractionResult, OkiNodeProperty, OkiOptionType, OkiProfileDetail, OkiStepType} from "@/src/types/oki";
import {OkiMovePicker, type OkiMoveOption} from "./OkiMovePicker";
import {PressureGraphEditor} from "@/src/features/pressure-graph/PressureGraphEditor";
import {PressureEdgeFields, PressureNodeActions, PressureNodeFields} from "@/src/features/pressure-graph/PressureGraphInspectorFields";
import {connectTargets, draftToGraphData, hasEdge, nextClientId, removeNodeAndEdges} from "@/src/features/pressure-graph/pressureGraphDraft";
import type {PressureSelection} from "@/src/features/pressure-graph/pressureGraphDraft";
import type {OkiInteractionDraft, OkiLinkDraft, OkiNodeDraft, OkiProfileDraft, OkiSetupDraft} from "./okiEditorTypes";
import {buildOkiPayload, createEmptyLink, createEmptyNode, createEmptySetup, mapDetailToDraft, OKI_ENDER_NODE_ID, withEnderRoot} from "./okiEditorTypes";

interface OkiEditorFormProps {
    mode: "create" | "edit";
    initialProfile?: OkiProfileDetail | null;
}

type MoveDetailResponse = {summary_frame_data?: {on_hit?: number | null}};

export function OkiEditorForm({mode, initialProfile}: OkiEditorFormProps) {
    const router = useRouter();
    const {createOki, updateOki} = useOkis();
    const {getSpecificMove} = useMoves();
    const {characters} = useCharacters();
    const [draft, setDraft] = React.useState<OkiProfileDraft>(() => initialProfile ? mapDetailToDraft(initialProfile) : {move: null, frameAdvantage: null, setups: [createEmptySetup()]});
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (initialProfile) {
            setDraft(mapDetailToDraft(initialProfile));
        }
    }, [initialProfile]);

    React.useEffect(() => {
        if (!draft.move?.id) {
            return;
        }

        let cancelled = false;
        getSpecificMove(draft.move.id)
            .then((move: MoveDetailResponse) => {
                if (!cancelled) {
                    setDraft((current) => ({...current, frameAdvantage: move.summary_frame_data?.on_hit ?? null}));
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setDraft((current) => ({...current, frameAdvantage: null}));
                }
            });

        return () => {
            cancelled = true;
        };
    }, [draft.move?.id, getSpecificMove]);

    const enderCharacterId = draft.move?.characterId ?? initialProfile?.move.character.id;

    const updateSetup = (setupIndex: number, updater: (setup: OkiSetupDraft) => OkiSetupDraft) => {
        setDraft((current) => ({...current, setups: current.setups.map((setup, index) => index === setupIndex ? updater(setup) : setup)}));
    };

    const handleEnderChange = (move: OkiMoveOption | null) => {
        setDraft((current) => ({...current, move, frameAdvantage: null, setups: current.setups.map(() => createEmptySetup())}));
    };

    const save = async () => {
        setSaving(true);
        setError(null);
        try {
            const payload = buildOkiPayload(draft);
            const saved = mode === "edit" && initialProfile ? await updateOki(initialProfile.id, payload) : await createOki(payload);
            await router.push(`/okis/${saved.id}`);
        } catch (exception) {
            setError(exception instanceof Error ? exception.message : "Could not save oki profile.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <AppBox sx={{display: "grid", gap: 1.5}}>
            {error ? <InlineNotice severity="error">{error}</InlineNotice> : null}

            <SectionCard title="Ender" variant="input">
                <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "minmax(280px, 560px) minmax(160px, 220px)"}, gap: 1.1, alignItems: "center"}}>
                    <OkiMovePicker label="Ender move" value={draft.move} disabled={mode === "edit"} onChange={handleEnderChange} />
                    <AppPaper variant="outlined" sx={{px: 1.15, py: 0.95, borderRadius: 1.5, backgroundColor: "fgc.surface.sunken"}}>
                        <AppTypography variant="caption" sx={{display: "block", color: "text.secondary", fontWeight: 800, letterSpacing: 0.4}}>FRAME ADVANTAGE</AppTypography>
                        <AppTypography variant="h6" sx={{fontWeight: 850, lineHeight: 1.2}}>{formatFrameAdvantage(draft.frameAdvantage)}</AppTypography>
                    </AppPaper>
                </AppBox>
            </SectionCard>

            {!enderCharacterId ? <InlineNotice severity="info">Select an ender first. Setup move fields unlock after the ender fixes the character.</InlineNotice> : null}

            {draft.setups.map((setup, setupIndex) => (
                <SetupEditor
                    key={setupIndex}
                    setup={setup}
                    setupIndex={setupIndex}
                    ender={draft.move}
                    characterId={enderCharacterId}
                    characters={characters as Array<{id: string; name: string}>}
                    onChange={(nextSetup) => updateSetup(setupIndex, () => nextSetup)}
                    onRemove={() => setDraft((current) => ({...current, setups: current.setups.filter((_, index) => index !== setupIndex)}))}
                />
            ))}

            <AppStack direction={{xs: "column", sm: "row"}} spacing={1} justifyContent="space-between">
                <AppButton type="button" variant="outlined" color="secondary" size="small" sx={{width: {xs: "100%", sm: "fit-content"}}} onClick={() => setDraft((current) => ({...current, setups: [...current.setups, createEmptySetup()]}))}>Add setup</AppButton>
                <AppButton type="button" variant="contained" color="primary" disabled={saving} onClick={save}>{saving ? "Saving..." : mode === "edit" ? "Save oki" : "Create oki"}</AppButton>
            </AppStack>
        </AppBox>
    );
}

function SetupEditor({setup, setupIndex, ender, characterId, characters, onChange, onRemove}: {setup: OkiSetupDraft; setupIndex: number; ender: OkiMoveOption | null; characterId?: string; characters: Array<{id: string; name: string}>; onChange: (setup: OkiSetupDraft) => void; onRemove: () => void}) {
    const [selection, setSelection] = React.useState<PressureSelection>(null);
    const patch = (partial: Partial<OkiSetupDraft>) => onChange({...setup, ...partial});
    const graph = React.useMemo(
        () => withEnderRoot(draftToGraphData(setup.nodes, setup.links), {notation: ender?.numpadNotation ?? ender?.summary ?? "Ender", name: ender?.moveName ?? null}),
        [ender, setup.links, setup.nodes],
    );
    const notationOf = (clientId: string) => graph.nodes.find((node) => node.id === clientId)?.notation ?? "?";

    const patchNode = (clientId: string, partial: Partial<OkiNodeDraft>) => patch({nodes: setup.nodes.map((node) => node.clientId === clientId ? {...node, ...partial} : node)});
    const patchLink = (clientId: string, partial: Partial<OkiLinkDraft>) => patch({links: setup.links.map((link) => link.clientId === clientId ? {...link, ...partial} : link)});
    const addNextMove = (from: string) => {
        const nodeId = nextClientId("n", setup.nodes.map((node) => node.clientId));
        // Moves added from the ender become roots; the ender link itself is implicit.
        const links = from === OKI_ENDER_NODE_ID ? setup.links : [...setup.links, createEmptyLink(nextClientId("l", setup.links.map((link) => link.clientId)), from, nodeId)];
        patch({nodes: [...setup.nodes, createEmptyNode(nodeId)], links});
        setSelection({type: "node", id: nodeId});
    };
    const connect = (from: string, to: string) => {
        if (from === OKI_ENDER_NODE_ID || to === OKI_ENDER_NODE_ID || hasEdge(setup.links, from, to)) {
            return;
        }
        const linkId = nextClientId("l", setup.links.map((link) => link.clientId));
        patch({links: [...setup.links, createEmptyLink(linkId, from, to)]});
        setSelection({type: "edge", id: linkId});
    };
    const select = (next: PressureSelection) => setSelection(next?.type === "edge" && next.id.startsWith(`${OKI_ENDER_NODE_ID}-`) ? null : next);

    const selectedNode = selection?.type === "node" ? setup.nodes.find((node) => node.clientId === selection.id) ?? null : null;
    const selectedLink = selection?.type === "edge" ? setup.links.find((link) => link.clientId === selection.id) ?? null : null;
    let inspectorTitle = "";
    let inspector: React.ReactNode = null;
    if (selection?.type === "node" && selection.id === OKI_ENDER_NODE_ID) {
        inspectorTitle = notationOf(OKI_ENDER_NODE_ID);
        inspector = <AppButton type="button" variant="outlined" color="secondary" size="small" sx={{justifySelf: "start"}} onClick={() => addNextMove(OKI_ENDER_NODE_ID)}>Add next move</AppButton>;
    } else if (selectedNode) {
        const updateInteraction = (interactionIndex: number, updater: (interaction: OkiInteractionDraft) => OkiInteractionDraft) => patchNode(selectedNode.clientId, {interactions: selectedNode.interactions.map((interaction, index) => index === interactionIndex ? updater(interaction) : interaction)});
        inspectorTitle = notationOf(selectedNode.clientId);
        inspector = (
            <>
                <PressureNodeFields node={selectedNode} characterId={characterId} onChange={(partial) => patchNode(selectedNode.clientId, partial)} />
                <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "200px minmax(0, 420px)"}, gap: 1}}>
                    <SimpleSelect label="Option type" value={selectedNode.optionType} options={["", ...OKI_OPTION_TYPES]} onChange={(value) => patchNode(selectedNode.clientId, {optionType: value as OkiOptionType | ""})} />
                    <AppTextField size="small" margin="none" label="Route explanation" value={selectedNode.routeExplanation} onChange={(event) => patchNode(selectedNode.clientId, {routeExplanation: event.target.value})} />
                </AppBox>
                <AppFormControlLabel control={<AppCheckbox checked={selectedNode.isDefaultRoute} onChange={(event) => patchNode(selectedNode.clientId, {isDefaultRoute: event.target.checked})} />} label="Default route" />
                <PropertyChecklist selected={selectedNode.properties} onChange={(properties) => patchNode(selectedNode.clientId, {properties})} />
                {selectedNode.optionType ? <InteractionsEditor node={selectedNode} characters={characters} characterId={characterId} onUpdateInteraction={updateInteraction} onPatchNode={(partial) => patchNode(selectedNode.clientId, partial)} /> : null}
                <PressureNodeActions
                    nodeId={selectedNode.clientId}
                    connectTargets={connectTargets(graph, setup.links, selectedNode.clientId, [OKI_ENDER_NODE_ID])}
                    canRemove={setup.nodes.length > 1}
                    onAddNext={() => addNextMove(selectedNode.clientId)}
                    onConnect={(target) => connect(selectedNode.clientId, target)}
                    onRemove={() => {
                        const next = removeNodeAndEdges(setup.nodes, setup.links, selectedNode.clientId);
                        patch({nodes: next.nodes, links: next.edges});
                        setSelection(null);
                    }}
                />
            </>
        );
    } else if (selectedLink) {
        inspectorTitle = `${notationOf(selectedLink.from)} → ${notationOf(selectedLink.to)}`;
        inspector = (
            <>
                <LinkTimingEditor link={selectedLink} onChange={(partial) => patchLink(selectedLink.clientId, partial)} />
                <PressureEdgeFields
                    edge={selectedLink}
                    onChange={(partial) => patchLink(selectedLink.clientId, partial)}
                    onRemove={() => {
                        patch({links: setup.links.filter((link) => link.clientId !== selectedLink.clientId)});
                        setSelection(null);
                    }}
                />
            </>
        );
    }

    return (
        <SectionCard title={`Setup ${setupIndex + 1}`} tone="raised" variant="review">
            <ChecklistGrid
                items={[
                    ["usesDriveRush", "Uses Drive Rush"],
                    ["autoTimed", "Auto-timed"],
                    ["cornerOnly", "Corner only"],
                    ["worksNoBackroll", "Works without backroll"],
                    ["worksBackroll", "Works with backroll"],
                    ["fakeNoBackroll", "Fake without backroll"],
                    ["fakeBackroll", "Fake with backroll"],
                ]}
                values={setup as unknown as Record<string, unknown>}
                onToggle={(key) => patch({[key]: !setup[key as keyof OkiSetupDraft]} as Partial<OkiSetupDraft>)}
            />

            <PressureGraphEditor
                graph={graph}
                ariaLabel={`Setup ${setupIndex + 1} graph editor`}
                selection={selection}
                inspectorTitle={inspectorTitle}
                inspector={inspector}
                onSelect={select}
                onConnect={connect}
            />

            <AppButton type="button" variant="text" color="secondary" size="small" sx={{width: {xs: "100%", sm: "fit-content"}}} onClick={onRemove}>Remove setup</AppButton>
        </SectionCard>
    );
}

function LinkTimingEditor({link, onChange}: {link: OkiLinkDraft; onChange: (patch: Partial<OkiLinkDraft>) => void}) {
    return (
        <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "minmax(0, 1fr) repeat(2, 76px)", sm: "170px 90px 90px"}, gap: 1}}>
            <SimpleSelect label="Step" value={link.stepType} options={OKI_STEP_TYPES} onChange={(value) => onChange({stepType: value as OkiStepType})} />
            <AppTextField size="small" margin="none" label="Min" value={link.minFrames} disabled={link.stepType === "IMMEDIATE"} onChange={(event) => onChange({minFrames: event.target.value})} />
            <AppTextField size="small" margin="none" label="Max" value={link.maxFrames} disabled={link.stepType === "IMMEDIATE"} onChange={(event) => onChange({maxFrames: event.target.value})} />
        </AppBox>
    );
}

function InteractionsEditor({node, characters, characterId, onUpdateInteraction, onPatchNode}: {node: OkiNodeDraft; characters: Array<{id: string; name: string}>; characterId?: string; onUpdateInteraction: (interactionIndex: number, updater: (interaction: OkiInteractionDraft) => OkiInteractionDraft) => void; onPatchNode: (partial: Partial<OkiNodeDraft>) => void}) {
    return (
        <AppBox sx={{display: "grid", gap: 0.75, pt: 0.25}}>
            <AppTypography variant="subtitle2" sx={{fontWeight: 820}}>Interactions</AppTypography>
            {node.interactions.map((interaction, interactionIndex) => (
                <AppPaper key={`${node.clientId}-interaction-${interactionIndex}`} variant="outlined" sx={{p: 0.85, borderRadius: 1.5, display: "grid", gridTemplateColumns: {xs: "1fr", md: "minmax(220px, 1fr) 150px 180px auto"}, gap: 0.85, alignItems: "center", backgroundColor: "fgc.surface.base"}}>
                    <OkiMovePicker label="Defensive move" value={interaction.defensiveMove} characterId={characterId} disabled={!characterId} onChange={(move) => onUpdateInteraction(interactionIndex, (current) => ({...current, defensiveMove: move}))} />
                    <SimpleSelect label="Result" value={interaction.result} options={OKI_INTERACTION_RESULTS} onChange={(value) => onUpdateInteraction(interactionIndex, (current) => ({...current, result: value as OkiInteractionResult}))} />
                    <SimpleSelect label="Specific character" value={interaction.characterId} options={["", ...characters.map((character) => character.id)]} getLabel={(value) => characters.find((character) => character.id === value)?.name ?? "General"} onChange={(value) => onUpdateInteraction(interactionIndex, (current) => ({...current, characterId: value}))} />
                    <AppButton type="button" variant="text" color="secondary" size="small" onClick={() => onPatchNode({interactions: node.interactions.filter((_, index) => index !== interactionIndex)})}>Remove</AppButton>
                </AppPaper>
            ))}
            <AppButton type="button" variant="outlined" color="secondary" size="small" sx={{width: {xs: "100%", sm: "fit-content"}}} onClick={() => onPatchNode({interactions: [...node.interactions, {defensiveMove: null, result: "WINS", characterId: ""}]})}>Add interaction</AppButton>
        </AppBox>
    );
}

function ChecklistGrid({items, values, onToggle}: {items: Array<[string, string]>; values: Record<string, unknown>; onToggle: (key: string) => void}) {
    return (
        <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, minmax(0, 1fr))"}, gap: 0.35, p: 0.8, border: "1px solid", borderColor: "fgc.border.default", borderRadius: 1.5, backgroundColor: "fgc.surface.sunken"}}>
            {items.map(([key, label]) => <AppFormControlLabel key={key} control={<AppCheckbox checked={Boolean(values[key])} onChange={() => onToggle(key)} />} label={label} />)}
        </AppBox>
    );
}

function PropertyChecklist({selected, onChange}: {selected: OkiNodeProperty[]; onChange: (next: OkiNodeProperty[]) => void}) {
    return (
        <AppBox sx={{display: "grid", gap: 0.45}}>
            <AppTypography variant="caption" sx={{fontWeight: 820, color: "text.secondary"}}>Option properties</AppTypography>
            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, minmax(0, 1fr))"}, gap: 0.25}}>
                {OKI_NODE_PROPERTIES.map((property) => (
                    <AppFormControlLabel key={property} control={<AppCheckbox checked={selected.includes(property)} onChange={() => onChange(toggleValue(selected, property))} />} label={formatOkiLabel(property)} />
                ))}
            </AppBox>
        </AppBox>
    );
}

function SimpleSelect({label, value, options, getLabel, onChange}: {label: string; value: string; options: string[]; getLabel?: (value: string) => string; onChange: (value: string) => void}) {
    const labelId = `${label.replace(/\s+/g, "-").toLowerCase()}-${options.join("-").length}`;
    return (
        <AppFormControl size="small">
            <AppInputLabel id={labelId}>{label}</AppInputLabel>
            <AppSelect<string> labelId={labelId} label={label} value={value} onChange={(event) => onChange(String(event.target.value))}>
                {options.map((option) => <AppMenuItem key={option || "empty"} value={option}>{getLabel ? getLabel(option) : option ? formatOkiLabel(option) : "None"}</AppMenuItem>)}
            </AppSelect>
        </AppFormControl>
    );
}

function toggleValue<T>(values: T[], value: T): T[] {
    return values.includes(value) ? values.filter((current) => current !== value) : [...values, value];
}

function formatFrameAdvantage(value: number | null): string {
    if (value === null) {
        return "Unavailable";
    }

    return value > 0 ? `+${value}` : String(value);
}
