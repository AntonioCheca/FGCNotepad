import type {OkiMoveOption} from "@/src/components/okis/OkiMovePicker";
import {formatFrameAdvantage, moveLabel, moveSubtitle} from "@/src/features/pressure-graph/pressureGraphTypes";
import type {PressureEdgeKind, PressureGraphData} from "@/src/features/pressure-graph/pressureGraphTypes";
import type {BlockstringBlock, BlockstringDetail, BlockstringMove, BlockstringPayload, BlockstringSummary} from "@/src/types/blockstring";

export interface BlockstringNodeDraft {
    clientId: string;
    move: OkiMoveOption | null;
    frameAdvantage: string;
}

export interface BlockstringEdgeDraft {
    clientId: string;
    from: string;
    to: string;
    kind: PressureEdgeKind;
    readLabel: string;
    trueBlockstring: boolean;
    gapFrames: string;
}

export interface BlockstringBlockDraft {
    key: string;
    description: string;
    nodes: BlockstringNodeDraft[];
    edges: BlockstringEdgeDraft[];
}

export interface BlockstringDraft {
    title: string;
    attackerCharacterId: string;
    startingMove: OkiMoveOption | null;
    blocks: BlockstringBlockDraft[];
}

export function blockstringTitle(item: BlockstringSummary): string {
    return item.attackerCharacter ? `${item.attackerCharacter.name} — ${item.title}` : item.title;
}

export function createBlockstringDraft(attackerCharacterId = ""): BlockstringDraft {
    return {title: "", attackerCharacterId, startingMove: null, blocks: [createBlock("b1", "n1")]};
}

// Node client IDs are unique across the whole blockstring, so a new block's first node takes the next free one.
export function createBlock(key: string, firstNodeId: string): BlockstringBlockDraft {
    return {key, description: "", nodes: [createBlockstringNode(firstNodeId)], edges: []};
}

export function createBlockstringNode(clientId: string, move: OkiMoveOption | null = null): BlockstringNodeDraft {
    return {clientId, move, frameAdvantage: ""};
}

export function createBlockstringEdge(clientId: string, from: string, to: string): BlockstringEdgeDraft {
    return {clientId, from, to, kind: "normal", readLabel: "", trueBlockstring: false, gapFrames: ""};
}

export function allNodeIds(draft: BlockstringDraft): string[] {
    return draft.blocks.flatMap((block) => block.nodes.map((node) => node.clientId));
}

export function toBlockstringMoveOption(move: BlockstringMove): OkiMoveOption {
    return {id: move.id, summary: move.numpadNotation, numpadNotation: move.numpadNotation, commonName: move.commonName, moveName: move.moveName, characterId: move.character?.id};
}

export function blockstringDetailToDraft(detail: BlockstringDetail): BlockstringDraft {
    return {
        title: detail.title,
        attackerCharacterId: detail.attackerCharacter?.id ?? "",
        startingMove: detail.startingMove ? toBlockstringMoveOption(detail.startingMove) : null,
        blocks: detail.blocks.map((block) => ({
            key: `b${block.id}`,
            description: block.description ?? "",
            nodes: block.nodes.map((node) => ({clientId: `n${node.id}`, move: node.move ? toBlockstringMoveOption(node.move) : null, frameAdvantage: node.frameAdvantage === null ? "" : formatFrameAdvantage(node.frameAdvantage)})),
            edges: block.edges.map((edge) => ({
                clientId: `e${edge.id}`,
                from: `n${edge.from}`,
                to: `n${edge.to}`,
                kind: edge.kind,
                readLabel: edge.readLabel ?? "",
                trueBlockstring: edge.trueBlockstring,
                gapFrames: edge.gapFrames === null ? "" : String(edge.gapFrames),
            })),
        })),
    };
}

export function buildBlockstringPayload(draft: BlockstringDraft): BlockstringPayload {
    if (!draft.title.trim()) {
        throw new Error("Title is required.");
    }
    if (!draft.attackerCharacterId) {
        throw new Error("Pick the character.");
    }
    if (!draft.startingMove) {
        throw new Error("Pick the starting move.");
    }

    return {
        title: draft.title.trim(),
        attackerCharacterId: draft.attackerCharacterId,
        startingMoveId: draft.startingMove.id,
        blocks: draft.blocks.map((block) => ({
            description: block.description.trim() || null,
            nodes: block.nodes.map((node) => {
                if (!node.move) {
                    throw new Error("Every move in the graph needs a move picked.");
                }
                return {clientId: node.clientId, moveId: node.move.id, frameAdvantage: parseFrames(node.frameAdvantage)};
            }),
            edges: block.edges.map((edge) => ({
                from: edge.from,
                to: edge.to,
                kind: edge.kind,
                readLabel: edge.kind === "read" ? edge.readLabel.trim() || null : null,
                trueBlockstring: edge.trueBlockstring,
                gapFrames: edge.trueBlockstring ? null : parseFrames(edge.gapFrames),
            })),
        })),
    };
}

export function blockDraftToGraph(block: BlockstringBlockDraft): PressureGraphData {
    return {
        nodes: block.nodes.map((node) => ({id: node.clientId, label: node.move ? moveLabel(node.move) : "Pick a move", subtitle: node.move ? moveSubtitle(node.move) : null, frameAdvantage: parseFrames(node.frameAdvantage)})),
        edges: block.edges.map((edge) => ({
            id: edge.clientId,
            from: edge.from,
            to: edge.to,
            kind: edge.kind,
            readLabel: edge.kind === "read" ? edge.readLabel.trim() || null : null,
            trueBlockstring: edge.trueBlockstring,
            gapFrames: edge.trueBlockstring ? null : parseFrames(edge.gapFrames),
        })),
    };
}

export function blockToGraph(block: BlockstringBlock): PressureGraphData {
    return {
        nodes: block.nodes.map((node) => ({id: node.id, label: node.move ? moveLabel(node.move) : "?", subtitle: node.move ? moveSubtitle(node.move) : null, frameAdvantage: node.frameAdvantage})),
        edges: block.edges.map((edge) => ({id: edge.id, from: edge.from, to: edge.to, kind: edge.kind, readLabel: edge.readLabel, trueBlockstring: edge.trueBlockstring, gapFrames: edge.gapFrames})),
    };
}

// Accepts "+4", "-2" and "3"; anything else is treated as not entered.
export function parseFrames(value: string): number | null {
    const trimmed = value.trim();

    return /^[+-]?\d{1,2}$/.test(trimmed) ? Number.parseInt(trimmed, 10) : null;
}
