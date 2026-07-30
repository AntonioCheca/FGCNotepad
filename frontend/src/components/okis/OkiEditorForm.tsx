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
import type {OkiInteractionDraft, OkiLinkDraft, OkiNodeDraft, OkiProfileDraft, OkiSetupDraft, OkiTreeChildDraft, OkiTreeNodeDraft} from "./okiEditorTypes";
import {buildOkiPayload, createEmptyNode, createEmptySetup, mapDetailToDraft, setupToTree} from "./okiEditorTypes";

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
    const [draft, setDraft] = React.useState<OkiProfileDraft>(() => initialProfile ? mapDetailToDraft(initialProfile) : {move: null, frameAdvantage: null, setups: [createEmptySetup(1)]});
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
        setDraft((current) => ({...current, move, frameAdvantage: null, setups: current.setups.map((_, index) => createEmptySetup(index + 1))}));
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
                    <OkiMovePicker label="Ender move" value={draft.move} onChange={handleEnderChange} />
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
                    characterId={enderCharacterId}
                    characters={characters as Array<{id: string; name: string}>}
                    onChange={(nextSetup) => updateSetup(setupIndex, () => nextSetup)}
                    onRemove={() => setDraft((current) => ({...current, setups: current.setups.filter((_, index) => index !== setupIndex)}))}
                />
            ))}

            <AppStack direction={{xs: "column", sm: "row"}} spacing={1} justifyContent="space-between">
                <AppButton type="button" variant="outlined" color="secondary" size="small" sx={{width: "fit-content"}} onClick={() => setDraft((current) => ({...current, setups: [...current.setups, createEmptySetup(current.setups.length + 1)]}))}>Add setup</AppButton>
                <AppButton type="button" variant="contained" color="primary" disabled={saving} onClick={save}>{saving ? "Saving..." : mode === "edit" ? "Save oki" : "Create oki"}</AppButton>
            </AppStack>
        </AppBox>
    );
}

function SetupEditor({setup, setupIndex, characterId, characters, onChange, onRemove}: {setup: OkiSetupDraft; setupIndex: number; characterId?: string; characters: Array<{id: string; name: string}>; onChange: (setup: OkiSetupDraft) => void; onRemove: () => void}) {
    const patch = (partial: Partial<OkiSetupDraft>) => onChange({...setup, ...partial});
    const tree = setupToTree(setup);

    const updateNode = (clientId: string, updater: (node: OkiNodeDraft) => OkiNodeDraft) => patch({nodes: setup.nodes.map((node) => node.clientId === clientId ? updater(node) : node)});
    const updateLinkToChild = (childClientId: string, updater: (link: OkiLinkDraft) => OkiLinkDraft) => patch({links: setup.links.map((link) => link.toClientId === childClientId ? updater(link) : link)});
    const addChild = (parentClientId: string) => {
        const childId = `setup${setupIndex + 1}-node${setup.nodes.length + 1}-${Date.now()}`;
        patch({
            nodes: [...setup.nodes, createEmptyNode(childId)],
            links: [...setup.links, {fromClientId: parentClientId, toClientId: childId, stepType: "IMMEDIATE", minFrames: "", maxFrames: ""}],
        });
    };
    const removeNode = (clientId: string) => {
        const idsToRemove = collectSubtreeIds(clientId, setup.links);
        patch({
            nodes: setup.nodes.filter((node) => !idsToRemove.has(node.clientId)),
            links: setup.links.filter((link) => !idsToRemove.has(link.fromClientId) && !idsToRemove.has(link.toClientId)),
        });
    };

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

            <AppBox sx={{display: "grid", gap: 1}}>
                <AppBox sx={{display: "flex", justifyContent: "space-between", gap: 1, alignItems: "center", flexWrap: "wrap"}}>
                    <AppTypography variant="subtitle1" sx={{fontWeight: 820}}>Offensive tree</AppTypography>
                    {setup.nodes.length === 0 ? <AppButton type="button" variant="outlined" color="secondary" size="small" onClick={() => patch({nodes: [createEmptyNode(`setup${setupIndex + 1}-node1`, true)]})}>Add root</AppButton> : null}
                </AppBox>
                {tree.map((root, rootIndex) => (
                    <TreeNodeEditor
                        key={root.clientId}
                        node={root}
                        rootIndex={rootIndex}
                        depth={0}
                        characterId={characterId}
                        characters={characters}
                        link={null}
                        canRemove={setup.nodes.length > 1}
                        onNodeChange={updateNode}
                        onLinkChange={updateLinkToChild}
                        onAddChild={addChild}
                        onRemoveNode={removeNode}
                    />
                ))}
            </AppBox>

            <AppButton type="button" variant="text" color="secondary" size="small" sx={{width: "fit-content"}} onClick={onRemove}>Remove setup</AppButton>
        </SectionCard>
    );
}

function TreeNodeEditor({node, link, depth, rootIndex, characterId, characters, canRemove, onNodeChange, onLinkChange, onAddChild, onRemoveNode}: {node: OkiTreeNodeDraft; link: OkiLinkDraft | null; depth: number; rootIndex: number; characterId?: string; characters: Array<{id: string; name: string}>; canRemove: boolean; onNodeChange: (clientId: string, updater: (node: OkiNodeDraft) => OkiNodeDraft) => void; onLinkChange: (childClientId: string, updater: (link: OkiLinkDraft) => OkiLinkDraft) => void; onAddChild: (parentClientId: string) => void; onRemoveNode: (clientId: string) => void}) {
    const patchNode = (partial: Partial<OkiNodeDraft>) => onNodeChange(node.clientId, (current) => ({...current, ...partial}));
    const updateInteraction = (interactionIndex: number, updater: (interaction: OkiInteractionDraft) => OkiInteractionDraft) => patchNode({interactions: node.interactions.map((interaction, index) => index === interactionIndex ? updater(interaction) : interaction)});

    return (
        <AppBox sx={{display: "grid", gridTemplateColumns: "22px minmax(0, 760px)", columnGap: 0.75, ml: {xs: Math.min(depth, 3) * 1.1, md: Math.min(depth, 4) * 2.2}}}>
            <AppBox sx={{position: "relative", display: {xs: depth === 0 ? "none" : "block", md: "block"}}}>
                <AppBox sx={{position: "absolute", top: 0, bottom: node.children.length > 0 ? -12 : "50%", left: 10, borderLeft: depth === 0 ? 0 : "1px solid", borderColor: "fgc.border.strong"}} />
                {depth > 0 ? <AppBox sx={{position: "absolute", top: 24, left: 10, width: 18, borderTop: "1px solid", borderColor: "fgc.border.strong"}} /> : null}
            </AppBox>
            <AppBox sx={{display: "grid", gap: 0.75, mb: 0.85}}>
                {link ? <LinkTimingEditor link={link} onChange={(updater) => onLinkChange(node.clientId, updater)} /> : null}
                <AppPaper variant="outlined" sx={{p: {xs: 1, md: 1.15}, borderRadius: 2, display: "grid", gap: 1, backgroundColor: depth === 0 ? "fgc.surface.base" : "fgc.surface.sunken", borderColor: node.optionType ? "fgc.accent.selected" : "fgc.border.default"}}>
                    <AppBox sx={{display: "flex", justifyContent: "space-between", gap: 1, alignItems: "center", flexWrap: "wrap"}}>
                        <AppTypography variant="subtitle2" sx={{fontWeight: 850}}>{depth === 0 ? `Root ${rootIndex + 1}` : `Child depth ${depth}`}</AppTypography>
                        <AppBox sx={{display: "flex", gap: 0.5, flexWrap: "wrap"}}>
                            <AppButton type="button" variant="outlined" color="secondary" size="small" onClick={() => onAddChild(node.clientId)}>Add child</AppButton>
                            {canRemove ? <AppButton type="button" variant="text" color="secondary" size="small" onClick={() => onRemoveNode(node.clientId)}>Remove</AppButton> : null}
                        </AppBox>
                    </AppBox>
                    <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "minmax(260px, 1fr) 180px"}, gap: 1}}>
                        <OkiMovePicker label="Move" value={node.move} characterId={characterId} disabled={!characterId} onChange={(move) => patchNode({move})} />
                        <SimpleSelect label="Option type" value={node.optionType} options={["", ...OKI_OPTION_TYPES]} onChange={(value) => patchNode({optionType: value as OkiOptionType | ""})} />
                    </AppBox>
                    <AppTextField size="small" label="Route explanation" value={node.routeExplanation} onChange={(event) => patchNode({routeExplanation: event.target.value})} />
                    <AppFormControlLabel control={<AppCheckbox checked={node.isDefaultRoute} onChange={(event) => patchNode({isDefaultRoute: event.target.checked})} />} label="Default route node" />
                    <PropertyChecklist selected={node.properties} onChange={(properties) => patchNode({properties})} />
                    {node.optionType ? <InteractionsEditor node={node} characters={characters} characterId={characterId} onUpdateInteraction={updateInteraction} onPatchNode={patchNode} /> : null}
                </AppPaper>
                {node.children.map((child: OkiTreeChildDraft) => (
                    <TreeNodeEditor key={child.node.clientId} node={child.node} link={child.link} depth={depth + 1} rootIndex={rootIndex} characterId={characterId} characters={characters} canRemove onNodeChange={onNodeChange} onLinkChange={onLinkChange} onAddChild={onAddChild} onRemoveNode={onRemoveNode} />
                ))}
            </AppBox>
        </AppBox>
    );
}

function LinkTimingEditor({link, onChange}: {link: OkiLinkDraft; onChange: (updater: (link: OkiLinkDraft) => OkiLinkDraft) => void}) {
    return (
        <AppPaper variant="outlined" sx={{px: 0.85, py: 0.65, borderRadius: 1.5, backgroundColor: "fgc.surface.base", display: "grid", gridTemplateColumns: {xs: "1fr", sm: "170px 90px 90px"}, gap: 0.75, width: "fit-content", maxWidth: "100%"}}>
            <SimpleSelect label="Step" value={link.stepType} options={OKI_STEP_TYPES} onChange={(value) => onChange((current) => ({...current, stepType: value as OkiStepType}))} />
            <AppTextField size="small" label="Min" value={link.minFrames} disabled={link.stepType === "IMMEDIATE"} onChange={(event) => onChange((current) => ({...current, minFrames: event.target.value}))} />
            <AppTextField size="small" label="Max" value={link.maxFrames} disabled={link.stepType === "IMMEDIATE"} onChange={(event) => onChange((current) => ({...current, maxFrames: event.target.value}))} />
        </AppPaper>
    );
}

function InteractionsEditor({node, characters, characterId, onUpdateInteraction, onPatchNode}: {node: OkiTreeNodeDraft; characters: Array<{id: string; name: string}>; characterId?: string; onUpdateInteraction: (interactionIndex: number, updater: (interaction: OkiInteractionDraft) => OkiInteractionDraft) => void; onPatchNode: (partial: Partial<OkiNodeDraft>) => void}) {
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
            <AppButton type="button" variant="outlined" color="secondary" size="small" sx={{width: "fit-content"}} onClick={() => onPatchNode({interactions: [...node.interactions, {defensiveMove: null, result: "WINS", characterId: ""}]})}>Add interaction</AppButton>
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

function collectSubtreeIds(rootId: string, links: OkiLinkDraft[]): Set<string> {
    const ids = new Set<string>([rootId]);
    let changed = true;
    while (changed) {
        changed = false;
        for (const link of links) {
            if (ids.has(link.fromClientId) && !ids.has(link.toClientId)) {
                ids.add(link.toClientId);
                changed = true;
            }
        }
    }

    return ids;
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
