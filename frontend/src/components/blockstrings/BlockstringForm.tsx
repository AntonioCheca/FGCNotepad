import React from "react";
import {CharacterSelect} from "@/src/components/characters/CharacterSelect";
import {OkiMovePicker} from "@/src/components/okis/OkiMovePicker";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppCheckbox} from "@/src/components/ui/AppCheckbox";
import {AppFormControlLabel} from "@/src/components/ui/AppFormControlLabel";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {PressureGraphEditor} from "@/src/features/pressure-graph/PressureGraphEditor";
import {PressureAddNodeDialog, PressureEdgeKindFields, PressureInspectorRow, PressureRemoveButton} from "@/src/features/pressure-graph/PressureGraphInspectorFields";
import {hasEdge, nextClientId, removeNodeAndEdges} from "@/src/features/pressure-graph/pressureGraphDraft";
import type {PressureSelection} from "@/src/features/pressure-graph/pressureGraphDraft";
import {PRESSURE_EDGE_KINDS} from "@/src/features/pressure-graph/pressureGraphTypes";
import type {BlockstringDetail, BlockstringPayload} from "@/src/types/blockstring";
import {allNodeIds, blockDraftToGraph, blockstringDetailToDraft, buildBlockstringPayload, createBlock, createBlockstringDraft, createBlockstringEdge, createBlockstringNode} from "./blockstringGraphDraft";
import type {BlockstringBlockDraft, BlockstringDraft, BlockstringEdgeDraft, BlockstringNodeDraft} from "./blockstringGraphDraft";

const DESCRIPTION_MAX_LENGTH = 500;

interface BlockstringFormProps {
    initialValue?: BlockstringDetail | null;
    initialCharacterId?: string;
    submitLabel: string;
    saving?: boolean;
    onSubmit: (payload: BlockstringPayload) => Promise<void> | void;
}

export function BlockstringForm({initialValue = null, initialCharacterId = "", submitLabel, saving = false, onSubmit}: BlockstringFormProps) {
    const [draft, setDraft] = React.useState<BlockstringDraft>(() => initialValue ? blockstringDetailToDraft(initialValue) : createBlockstringDraft(initialCharacterId));
    const [error, setError] = React.useState<string | null>(null);

    const patch = (partial: Partial<BlockstringDraft>) => setDraft((current) => ({...current, ...partial}));
    const patchBlock = (key: string, next: BlockstringBlockDraft) => setDraft((current) => ({...current, blocks: current.blocks.map((block) => block.key === key ? next : block)}));
    const changeCharacter = (attackerCharacterId: string) => {
        // Moves belong to the character, so a new character invalidates every picked move.
        setDraft((current) => ({
            ...current,
            attackerCharacterId,
            startingMove: null,
            blocks: current.blocks.map((block) => ({...block, nodes: block.nodes.map((node) => ({...node, move: null}))})),
        }));
    };
    const addBlock = () => setDraft((current) => ({
        ...current,
        blocks: [...current.blocks, createBlock(nextClientId("b", current.blocks.map((block) => block.key)), nextClientId("n", allNodeIds(current)))],
    }));

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

    const characterId = draft.attackerCharacterId || undefined;

    return (
        <AppBox component="form" onSubmit={submit} sx={{display: "grid", gap: 1.5}}>
            {error ? <InlineNotice severity="error">{error}</InlineNotice> : null}

            <SectionCard title="Details">
                <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "minmax(0, 360px) minmax(0, 220px) minmax(0, 320px)"}, gap: 1, alignItems: "center"}}>
                    <AppTextField size="small" margin="none" label="Title" value={draft.title} onChange={(event) => patch({title: event.target.value})} required />
                    <CharacterSelect value={draft.attackerCharacterId} required onChange={changeCharacter} />
                    <OkiMovePicker key={draft.attackerCharacterId} label="Starting move" value={draft.startingMove} characterId={characterId} disabled={!characterId} onChange={(startingMove) => patch({startingMove})} />
                </AppBox>
            </SectionCard>

            {draft.blocks.map((block, index) => (
                <BlockEditor
                    key={block.key}
                    block={block}
                    index={index}
                    characterId={characterId}
                    takenNodeIds={allNodeIds(draft)}
                    onChange={(next) => patchBlock(block.key, next)}
                    onRemove={draft.blocks.length > 1 ? () => patch({blocks: draft.blocks.filter((candidate) => candidate.key !== block.key)}) : undefined}
                />
            ))}

            <AppBox sx={{display: "flex", flexDirection: {xs: "column", sm: "row"}, justifyContent: "space-between", gap: 1}}>
                <AppButton type="button" variant="outlined" color="secondary" size="small" sx={{width: {xs: "100%", sm: "fit-content"}}} onClick={addBlock}>Add block</AppButton>
                <AppButton type="submit" variant="contained" color="primary" disabled={saving}>{saving ? "Saving..." : submitLabel}</AppButton>
            </AppBox>
        </AppBox>
    );
}

interface BlockEditorProps {
    block: BlockstringBlockDraft;
    index: number;
    characterId?: string;
    takenNodeIds: string[];
    onChange: (block: BlockstringBlockDraft) => void;
    onRemove?: () => void;
}

function BlockEditor({block, index, characterId, takenNodeIds, onChange, onRemove}: BlockEditorProps) {
    const firstUnpicked = block.nodes.find((node) => !node.move);
    const [selection, setSelection] = React.useState<PressureSelection>(firstUnpicked ? {type: "node", id: firstUnpicked.clientId} : null);
    const [addingFrom, setAddingFrom] = React.useState<string | null>(null);
    const graph = React.useMemo(() => blockDraftToGraph(block), [block]);
    const labelOf = (clientId: string) => graph.nodes.find((node) => node.id === clientId)?.label ?? "?";
    const ariaTitle = block.description.trim() || `Block ${index + 1}`;

    const patch = (partial: Partial<BlockstringBlockDraft>) => onChange({...block, ...partial});
    const patchNode = (clientId: string, partial: Partial<BlockstringNodeDraft>) => patch({nodes: block.nodes.map((node) => node.clientId === clientId ? {...node, ...partial} : node)});
    const patchEdge = (clientId: string, partial: Partial<BlockstringEdgeDraft>) => patch({edges: block.edges.map((edge) => edge.clientId === clientId ? {...edge, ...partial} : edge)});
    const connect = (from: string, to: string) => {
        if (hasEdge(block.edges, from, to)) {
            return;
        }
        const clientId = nextClientId("e", block.edges.map((edge) => edge.clientId));
        patch({edges: [...block.edges, createBlockstringEdge(clientId, from, to)]});
        setSelection({type: "edge", id: clientId});
    };
    const addNode = (from: string, move: BlockstringNodeDraft["move"]) => {
        const nodeId = nextClientId("n", takenNodeIds);
        const edgeId = nextClientId("e", block.edges.map((edge) => edge.clientId));
        patch({nodes: [...block.nodes, createBlockstringNode(nodeId, move)], edges: [...block.edges, createBlockstringEdge(edgeId, from, nodeId)]});
        setAddingFrom(null);
    };

    const selectedNode = selection?.type === "node" ? block.nodes.find((node) => node.clientId === selection.id) ?? null : null;
    const selectedEdge = selection?.type === "edge" ? block.edges.find((edge) => edge.clientId === selection.id) ?? null : null;
    let inspectorTitle = "";
    let inspector: React.ReactNode = null;
    if (selectedNode) {
        inspectorTitle = labelOf(selectedNode.clientId);
        inspector = (
            <>
                <PressureInspectorRow>
                    <AppBox sx={{width: {xs: "100%", md: 360}}}>
                        <OkiMovePicker label="Move" value={selectedNode.move} characterId={characterId} disabled={!characterId} onChange={(move) => patchNode(selectedNode.clientId, {move})} />
                    </AppBox>
                    <AppTextField size="small" margin="none" label="Frame advantage" placeholder="+2" value={selectedNode.frameAdvantage} sx={{width: 150}} slotProps={{htmlInput: {inputMode: "numeric", maxLength: 3}}} onChange={(event) => patchNode(selectedNode.clientId, {frameAdvantage: event.target.value})} />
                </PressureInspectorRow>
                {block.nodes.length > 1 ? (
                    <PressureRemoveButton
                        label="Remove move"
                        onClick={() => {
                            patch(removeNodeAndEdges(block.nodes, block.edges, selectedNode.clientId));
                            setSelection(null);
                        }}
                    />
                ) : null}
            </>
        );
    } else if (selectedEdge) {
        inspectorTitle = `${labelOf(selectedEdge.from)} → ${labelOf(selectedEdge.to)}`;
        inspector = (
            <>
                <PressureEdgeKindFields kinds={PRESSURE_EDGE_KINDS} kind={selectedEdge.kind} readLabel={selectedEdge.readLabel} onChange={(partial) => patchEdge(selectedEdge.clientId, partial)} />
                <PressureInspectorRow>
                    <AppFormControlLabel
                        sx={{mr: 0}}
                        control={<AppCheckbox checked={selectedEdge.trueBlockstring} onChange={(event) => patchEdge(selectedEdge.clientId, {trueBlockstring: event.target.checked, gapFrames: event.target.checked ? "" : selectedEdge.gapFrames})} />}
                        label="True blockstring"
                    />
                    <AppTextField size="small" margin="none" label="Gap frames" value={selectedEdge.gapFrames} disabled={selectedEdge.trueBlockstring} sx={{width: 130}} slotProps={{htmlInput: {inputMode: "numeric", maxLength: 2}}} onChange={(event) => patchEdge(selectedEdge.clientId, {gapFrames: event.target.value})} />
                </PressureInspectorRow>
                <PressureRemoveButton
                    label="Remove arrow"
                    onClick={() => {
                        patch({edges: block.edges.filter((edge) => edge.clientId !== selectedEdge.clientId)});
                        setSelection(null);
                    }}
                />
            </>
        );
    }

    return (
        <SectionCard tone="raised">
            <AppTextField
                size="small"
                margin="none"
                label="Block title"
                placeholder="If they start respecting the pressure..."
                value={block.description}
                multiline
                minRows={1}
                slotProps={{htmlInput: {maxLength: DESCRIPTION_MAX_LENGTH}}}
                onChange={(event) => patch({description: event.target.value})}
            />
            <PressureGraphEditor
                graph={graph}
                ariaLabel={`${ariaTitle} graph editor`}
                frameDetails
                selection={selection}
                inspectorTitle={inspectorTitle}
                inspector={inspector}
                onSelect={setSelection}
                onConnect={connect}
                onAddFrom={setAddingFrom}
            />
            {onRemove ? (
                <AppBox>
                    <AppButton type="button" variant="text" color="error" size="small" onClick={onRemove}>Remove block</AppButton>
                </AppBox>
            ) : null}

            <PressureAddNodeDialog afterLabel={addingFrom ? labelOf(addingFrom) : null} onClose={() => setAddingFrom(null)}>
                {addingFrom ? <OkiMovePicker label="Move" value={null} characterId={characterId} disabled={!characterId} autoFocus onChange={(move) => move && addNode(addingFrom, move)} /> : null}
            </PressureAddNodeDialog>
        </SectionCard>
    );
}
