import React from "react";
import {useRouter} from "next/router";
import useOkis from "@/hooks/useOkis";
import {CharacterSelect} from "@/src/components/characters/CharacterSelect";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppCheckbox} from "@/src/components/ui/AppCheckbox";
import {AppFormControlLabel} from "@/src/components/ui/AppFormControlLabel";
import {AppStack} from "@/src/components/ui/AppStack";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import type {OkiProfileDetail} from "@/src/types/oki";
import {PressureGraphEditor} from "@/src/features/pressure-graph/PressureGraphEditor";
import {PressureAddNodeDialog} from "@/src/features/pressure-graph/PressureGraphInspectorFields";
import {hasEdge, nextClientId, removeNodeAndEdges} from "@/src/features/pressure-graph/pressureGraphDraft";
import type {PressureSelection} from "@/src/features/pressure-graph/pressureGraphDraft";
import {OkiActionPicker} from "./OkiActionPicker";
import {OkiLinkInspector, OkiNodeInspector} from "./OkiGraphInspector";
import {OkiMovePicker, type OkiMoveOption} from "./OkiMovePicker";
import type {OkiLinkDraft, OkiNodeChoice, OkiNodeDraft, OkiProfileDraft, OkiSetupDraft} from "./okiEditorTypes";
import {allowsSafeJump, buildOkiPayload, createEmptySetup, createLink, enderText, mapDetailToDraft, OKI_ENDER_NODE_ID, okiDraftToGraph} from "./okiEditorTypes";
import {hitLevelFromAttackLevel} from "./okiVocabulary";

interface OkiEditorFormProps {
    mode: "create" | "edit";
    initialProfile?: OkiProfileDetail | null;
    initialCharacterId?: string;
}

const SETUP_NAME_MAX_LENGTH = 80;

export function OkiEditorForm({mode, initialProfile, initialCharacterId = ""}: OkiEditorFormProps) {
    const router = useRouter();
    const {createOki, updateOki, searchEnders} = useOkis();
    const [draft, setDraft] = React.useState<OkiProfileDraft>(() => initialProfile ? mapDetailToDraft(initialProfile) : {characterId: initialCharacterId, move: null, setups: [createEmptySetup("Main line")]});
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (initialProfile) {
            setDraft(mapDetailToDraft(initialProfile));
        }
    }, [initialProfile]);

    const ender = React.useMemo(() => enderText(draft.move ?? {}), [draft.move]);

    const updateSetup = (setupIndex: number, nextSetup: OkiSetupDraft) => {
        setDraft((current) => ({...current, setups: current.setups.map((setup, index) => index === setupIndex ? nextSetup : setup)}));
    };

    const handleCharacterChange = (characterId: string) => {
        setDraft((current) => ({...current, characterId, move: null, setups: current.setups.map((setup) => createEmptySetup(setup.name))}));
    };

    const handleEnderChange = (move: OkiMoveOption | null) => {
        setDraft((current) => ({...current, move, setups: current.setups.map((setup) => createEmptySetup(setup.name))}));
    };

    const save = async () => {
        setSaving(true);
        setError(null);
        try {
            const payload = buildOkiPayload(draft);
            const saved = mode === "edit" && initialProfile ? await updateOki(initialProfile.id, payload) : await createOki(payload);
            await router.push(`/okis/${saved.id}`);
        } catch (exception) {
            setError(exception instanceof Error ? exception.message : "Could not save oki.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <AppBox sx={{display: "grid", gap: 1.5}}>
            {error ? <InlineNotice severity="error">{error}</InlineNotice> : null}

            {mode === "create" ? (
                <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "220px minmax(240px, 420px)"}, gap: 1, alignItems: "center"}}>
                    <CharacterSelect value={draft.characterId} required onChange={handleCharacterChange} />
                    <OkiMovePicker key={draft.characterId} label="Ender" value={draft.move} characterId={draft.characterId || undefined} disabled={!draft.characterId} search={searchEnders} onChange={handleEnderChange} />
                </AppBox>
            ) : null}

            {draft.move ? draft.setups.map((setup, setupIndex) => (
                <SetupEditor
                    key={setup.id ?? `new-${setupIndex}`}
                    setup={setup}
                    setupIndex={setupIndex}
                    ender={ender}
                    characterId={draft.characterId}
                    onChange={(nextSetup) => updateSetup(setupIndex, nextSetup)}
                    onRemove={() => setDraft((current) => ({...current, setups: current.setups.filter((_, index) => index !== setupIndex)}))}
                />
            )) : null}

            <AppStack direction={{xs: "column", sm: "row"}} spacing={1} justifyContent="space-between">
                {draft.move ? <AppButton type="button" variant="outlined" color="secondary" size="small" sx={{width: {xs: "100%", sm: "fit-content"}}} onClick={() => setDraft((current) => ({...current, setups: [...current.setups, createEmptySetup()]}))}>Add setup</AppButton> : <span />}
                <AppButton type="button" variant="contained" color="primary" disabled={saving || !draft.move} onClick={save}>{saving ? "Saving..." : mode === "edit" ? "Save oki" : "Create oki"}</AppButton>
            </AppStack>
        </AppBox>
    );
}

interface SetupEditorProps {
    setup: OkiSetupDraft;
    setupIndex: number;
    ender: ReturnType<typeof enderText>;
    characterId: string;
    onChange: (setup: OkiSetupDraft) => void;
    onRemove: () => void;
}

function SetupEditor({setup, setupIndex, ender, characterId, onChange, onRemove}: SetupEditorProps) {
    const [selection, setSelection] = React.useState<PressureSelection>(null);
    const [addingFrom, setAddingFrom] = React.useState<string | null>(null);
    const patch = (partial: Partial<OkiSetupDraft>) => onChange({...setup, ...partial});
    const graph = React.useMemo(() => okiDraftToGraph(setup, ender), [ender, setup]);
    const labelOf = (clientId: string) => graph.nodes.find((node) => node.id === clientId)?.label ?? "?";

    const patchNode = (clientId: string, partial: Partial<OkiNodeDraft>) => patch({nodes: setup.nodes.map((node) => node.clientId === clientId ? {...node, ...partial} : node)});
    const patchLink = (clientId: string, partial: Partial<OkiLinkDraft>) => patch({links: setup.links.map((link) => link.clientId === clientId ? {...link, ...partial} : link)});
    const addStep = (from: string, choice: OkiNodeChoice) => {
        const nodeId = nextClientId("n", setup.nodes.map((node) => node.clientId));
        const linkId = nextClientId("l", setup.links.map((link) => link.clientId));
        patch({
            nodes: [...setup.nodes, {clientId: nodeId, choice, hitLevel: choiceHitLevel(choice), sideSwitch: false}],
            links: [...setup.links, createLink(linkId, from, nodeId)],
        });
        setAddingFrom(null);
    };
    const connect = (from: string, to: string) => {
        if (to === OKI_ENDER_NODE_ID || hasEdge(setup.links, from, to)) {
            return;
        }
        const linkId = nextClientId("l", setup.links.map((link) => link.clientId));
        patch({links: [...setup.links, createLink(linkId, from, to)]});
        setSelection({type: "edge", id: linkId});
    };
    const select = (next: PressureSelection) => setSelection(next?.type === "node" && next.id === OKI_ENDER_NODE_ID ? null : next);

    const selectedNode = selection?.type === "node" ? setup.nodes.find((node) => node.clientId === selection.id) ?? null : null;
    const selectedLink = selection?.type === "edge" ? setup.links.find((link) => link.clientId === selection.id) ?? null : null;
    let inspectorTitle = "";
    let inspector: React.ReactNode = null;
    if (selectedNode) {
        inspectorTitle = labelOf(selectedNode.clientId);
        inspector = (
            <OkiNodeInspector
                node={selectedNode}
                characterId={characterId}
                onChoiceChange={(choice) => patchNode(selectedNode.clientId, {choice, hitLevel: choiceHitLevel(choice)})}
                onChange={(partial) => patchNode(selectedNode.clientId, partial)}
                onRemove={() => {
                    const next = removeNodeAndEdges(setup.nodes, setup.links, selectedNode.clientId);
                    patch({nodes: next.nodes, links: next.edges});
                    setSelection(null);
                }}
            />
        );
    } else if (selectedLink) {
        inspectorTitle = `${labelOf(selectedLink.from)} → ${labelOf(selectedLink.to)}`;
        inspector = (
            <OkiLinkInspector
                link={selectedLink}
                backrollDependent={setup.backrollDependent}
                safeJumpAllowed={allowsSafeJump(setup.nodes.find((node) => node.clientId === selectedLink.to)?.choice)}
                onChange={(partial) => patchLink(selectedLink.clientId, partial)}
                onRemove={() => {
                    patch({links: setup.links.filter((link) => link.clientId !== selectedLink.clientId)});
                    setSelection(null);
                }}
            />
        );
    }

    return (
        <SectionCard title={setup.name.trim() || `Setup ${setupIndex + 1}`} tone="raised">
            <AppBox sx={{display: "flex", flexWrap: "wrap", alignItems: "center", gap: {xs: 0.5, sm: 2}}}>
                <AppTextField
                    size="small"
                    margin="none"
                    label="Setup name"
                    placeholder="Corner safe jump"
                    required
                    value={setup.name}
                    sx={{width: {xs: "100%", sm: 280}}}
                    slotProps={{htmlInput: {maxLength: SETUP_NAME_MAX_LENGTH}}}
                    onChange={(event) => patch({name: event.target.value})}
                />
                <AppFormControlLabel control={<AppCheckbox checked={setup.cornerOnly} onChange={(event) => patch({cornerOnly: event.target.checked})} />} label="Corner only" />
                <AppFormControlLabel control={<AppCheckbox checked={setup.backrollDependent} onChange={(event) => patch({backrollDependent: event.target.checked})} />} label="Backroll dependent" />
            </AppBox>

            <PressureGraphEditor
                graph={graph}
                ariaLabel={`${setup.name.trim() || `Setup ${setupIndex + 1}`} graph editor`}
                selection={selection}
                inspectorTitle={inspectorTitle}
                inspector={inspector}
                onSelect={select}
                onConnect={connect}
                onAddFrom={setAddingFrom}
            />

            <AppBox>
                <AppButton type="button" variant="text" color="error" size="small" onClick={onRemove}>Remove setup</AppButton>
            </AppBox>

            <PressureAddNodeDialog afterLabel={addingFrom ? labelOf(addingFrom) : null} onClose={() => setAddingFrom(null)}>
                {addingFrom ? <OkiActionPicker characterId={characterId} value={null} autoFocus onChange={(choice) => addStep(addingFrom, choice)} /> : null}
            </PressureAddNodeDialog>
        </SectionCard>
    );
}

function choiceHitLevel(choice: OkiNodeChoice) {
    return choice.kind === "move" ? hitLevelFromAttackLevel(choice.move.attackLevel) : null;
}
