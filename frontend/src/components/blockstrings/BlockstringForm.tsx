import React from "react";
import {useCharacters} from "@/hooks/useCharacters";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppFormControl} from "@/src/components/ui/AppFormControl";
import {AppInputLabel} from "@/src/components/ui/AppInputLabel";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppSelect} from "@/src/components/ui/AppSelect";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {PressureGraphEditor} from "@/src/features/pressure-graph/PressureGraphEditor";
import {PressureEdgeFields, PressureNodeActions, PressureNodeFields} from "@/src/features/pressure-graph/PressureGraphInspectorFields";
import {connectTargets, draftToGraphData, hasEdge, nextClientId, removeNodeAndEdges} from "@/src/features/pressure-graph/pressureGraphDraft";
import type {PressureNodeDraft, PressureSelection} from "@/src/features/pressure-graph/pressureGraphDraft";
import type {BlockstringDetail, BlockstringPayload} from "@/src/types/blockstring";
import {BLOCKSTRING_CLASSIFICATIONS, formatBlockstringLabel} from "@/src/types/blockstring";
import {blockstringDetailToDraft, buildBlockstringPayload, createBlockstringDraft, createBlockstringEdge, createBlockstringNode, defenseInstructionFor, withDefenseInstruction} from "./blockstringGraphDraft";
import type {BlockstringDraft, BlockstringEdgeDraft} from "./blockstringGraphDraft";

interface BlockstringFormProps {
    initialValue?: BlockstringDetail | null;
    submitLabel: string;
    saving?: boolean;
    onSubmit: (payload: BlockstringPayload) => Promise<void> | void;
}

export function BlockstringForm({initialValue = null, submitLabel, saving = false, onSubmit}: BlockstringFormProps) {
    const {characters} = useCharacters();
    const [draft, setDraft] = React.useState<BlockstringDraft>(() => initialValue ? blockstringDetailToDraft(initialValue) : createBlockstringDraft());
    const [selection, setSelection] = React.useState<PressureSelection>(initialValue ? null : {type: "node", id: "n1"});
    const [error, setError] = React.useState<string | null>(null);
    const graph = React.useMemo(() => draftToGraphData(draft.nodes, draft.edges), [draft.edges, draft.nodes]);
    const characterOptions = characters as Array<{id: string; name: string}>;

    const patch = (partial: Partial<BlockstringDraft>) => setDraft((current) => ({...current, ...partial}));
    const patchNode = (clientId: string, partial: Partial<PressureNodeDraft>) => setDraft((current) => ({...current, nodes: current.nodes.map((node) => node.clientId === clientId ? {...node, ...partial} : node)}));
    const patchEdge = (clientId: string, partial: Partial<BlockstringEdgeDraft>) => setDraft((current) => ({...current, edges: current.edges.map((edge) => edge.clientId === clientId ? {...edge, ...partial} : edge)}));

    const connect = (from: string, to: string) => {
        if (hasEdge(draft.edges, from, to)) {
            return;
        }
        const clientId = nextClientId("e", draft.edges.map((edge) => edge.clientId));
        patch({edges: [...draft.edges, createBlockstringEdge(clientId, from, to)]});
        setSelection({type: "edge", id: clientId});
    };
    const addNextMove = (from: string) => {
        const nodeId = nextClientId("n", draft.nodes.map((node) => node.clientId));
        const edgeId = nextClientId("e", draft.edges.map((edge) => edge.clientId));
        patch({nodes: [...draft.nodes, createBlockstringNode(nodeId)], edges: [...draft.edges, createBlockstringEdge(edgeId, from, nodeId)]});
        setSelection({type: "node", id: nodeId});
    };
    const changeAttacker = (attackerCharacterId: string) => {
        // Moves belong to the attacker, so a new attacker invalidates every picked move.
        patch({attackerCharacterId, nodes: draft.nodes.map((node) => ({...node, move: null}))});
    };

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            const payload = buildBlockstringPayload(draft);
            setError(null);
            await onSubmit(payload);
        } catch (exception) {
            setError(exception instanceof Error ? exception.message : "Could not save blockstring.");
        }
    };

    const selectedNode = selection?.type === "node" ? draft.nodes.find((node) => node.clientId === selection.id) ?? null : null;
    const selectedEdge = selection?.type === "edge" ? draft.edges.find((edge) => edge.clientId === selection.id) ?? null : null;
    const notationOf = (clientId: string) => graph.nodes.find((node) => node.id === clientId)?.notation ?? "?";

    let inspectorTitle = "";
    let inspector: React.ReactNode = null;
    if (selectedNode) {
        inspectorTitle = notationOf(selectedNode.clientId);
        inspector = (
            <>
                <PressureNodeFields node={selectedNode} characterId={draft.attackerCharacterId || undefined} onChange={(partial) => patchNode(selectedNode.clientId, partial)} />
                <PressureNodeActions
                    nodeId={selectedNode.clientId}
                    connectTargets={connectTargets(graph, draft.edges, selectedNode.clientId)}
                    canRemove={draft.nodes.length > 1}
                    onAddNext={() => addNextMove(selectedNode.clientId)}
                    onConnect={(target) => connect(selectedNode.clientId, target)}
                    onRemove={() => {
                        patch(removeNodeAndEdges(draft.nodes, draft.edges, selectedNode.clientId));
                        setSelection(null);
                    }}
                />
            </>
        );
    } else if (selectedEdge) {
        inspectorTitle = `${notationOf(selectedEdge.from)} → ${notationOf(selectedEdge.to)}`;
        inspector = (
            <>
                <PressureEdgeFields
                    edge={selectedEdge}
                    onChange={(partial) => patchEdge(selectedEdge.clientId, partial)}
                    onRemove={() => {
                        patch({edges: draft.edges.filter((edge) => edge.clientId !== selectedEdge.clientId)});
                        setSelection(null);
                    }}
                />
                <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr 1fr", sm: "repeat(3, minmax(0, 140px))"}, gap: 1}}>
                    <AppTextField size="small" margin="none" label="Frame adv." value={selectedEdge.frameAdvantage} onChange={(event) => patchEdge(selectedEdge.clientId, {frameAdvantage: event.target.value})} />
                    <AppTextField size="small" margin="none" label="Gap frames" value={selectedEdge.gapFrames} slotProps={{htmlInput: {inputMode: "numeric"}}} onChange={(event) => patchEdge(selectedEdge.clientId, {gapFrames: event.target.value})} />
                </AppBox>
                {selectedEdge.kind === "fake" ? (
                    <AppTextField
                        size="small"
                        margin="none"
                        label="How to beat it"
                        value={defenseInstructionFor(draft.defenseEntries, selectedEdge.clientId)}
                        onChange={(event) => patch({defenseEntries: withDefenseInstruction(draft.defenseEntries, selectedEdge.clientId, event.target.value)})}
                        multiline
                        minRows={2}
                    />
                ) : null}
            </>
        );
    }

    return (
        <AppBox component="form" onSubmit={submit} sx={{display: "grid", gap: 1.5}}>
            {error ? <InlineNotice severity="error">{error}</InlineNotice> : null}

            <SectionCard title="Details" variant="input">
                <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "minmax(0, 360px) minmax(0, 220px) minmax(0, 200px)"}, gap: 1}}>
                    <AppTextField size="small" margin="none" label="Title" value={draft.title} onChange={(event) => patch({title: event.target.value})} required />
                    <SimpleSelect label="Attacker" value={draft.attackerCharacterId} options={characterOptions.map((character) => ({value: character.id, label: character.name}))} onChange={changeAttacker} />
                    <SimpleSelect label="Status" value={draft.classification} options={BLOCKSTRING_CLASSIFICATIONS.map((value) => ({value, label: formatBlockstringLabel(value)}))} onChange={(classification) => patch({classification})} />
                </AppBox>
                <AppTextField size="small" margin="none" label="Explanation" value={draft.summary} onChange={(event) => patch({summary: event.target.value})} multiline minRows={2} />
            </SectionCard>

            <SectionCard title="Graph" variant="review">
                <PressureGraphEditor
                    graph={graph}
                    ariaLabel="Blockstring graph editor"
                    selection={selection}
                    inspectorTitle={inspectorTitle}
                    inspector={inspector}
                    onSelect={setSelection}
                    onConnect={connect}
                />
            </SectionCard>

            <AppButton type="submit" variant="contained" color="primary" disabled={saving} sx={{justifySelf: {xs: "stretch", sm: "end"}}}>{saving ? "Saving..." : submitLabel}</AppButton>
        </AppBox>
    );
}

function SimpleSelect({label, value, options, onChange}: {label: string; value: string; options: Array<{value: string; label: string}>; onChange: (value: string) => void}) {
    const labelId = React.useId();

    return (
        <AppFormControl size="small" required>
            <AppInputLabel id={labelId}>{label}</AppInputLabel>
            <AppSelect<string> labelId={labelId} label={label} value={value} onChange={(event) => onChange(String(event.target.value))}>
                {options.map((option) => <AppMenuItem key={option.value} value={option.value}>{option.label}</AppMenuItem>)}
            </AppSelect>
        </AppFormControl>
    );
}
