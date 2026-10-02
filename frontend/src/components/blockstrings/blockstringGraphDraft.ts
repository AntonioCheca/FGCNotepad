import {formatDamage, parseDamage} from "@/src/features/pressure-graph/pressureGraphDraft";
import type {PressureEdgeDraft, PressureNodeDraft} from "@/src/features/pressure-graph/pressureGraphDraft";
import {toPressureLayer} from "@/src/features/pressure-graph/pressureGraphTypes";
import type {PressureGraphData} from "@/src/features/pressure-graph/pressureGraphTypes";
import type {BlockstringDefenseEntryPayload, BlockstringDetail, BlockstringPayload} from "@/src/types/blockstring";

export interface BlockstringEdgeDraft extends PressureEdgeDraft {
    frameAdvantage: string;
    gapFrames: string;
}

export interface BlockstringDraft {
    title: string;
    summary: string;
    attackerCharacterId: string;
    classification: string;
    nodes: PressureNodeDraft[];
    edges: BlockstringEdgeDraft[];
    conditions: NonNullable<BlockstringPayload["conditions"]>;
    defenseEntries: BlockstringDefenseEntryPayload[];
}

export function createBlockstringDraft(): BlockstringDraft {
    return {
        title: "",
        summary: "",
        attackerCharacterId: "",
        classification: "frametrap",
        nodes: [createBlockstringNode("n1")],
        edges: [],
        conditions: [],
        defenseEntries: [],
    };
}

export function createBlockstringNode(clientId: string): PressureNodeDraft {
    return {clientId, move: null, layer: 1, damageDealt: "", damageReceived: ""};
}

export function createBlockstringEdge(clientId: string, from: string, to: string): BlockstringEdgeDraft {
    return {clientId, from, to, kind: "normal", readLabel: "", layer: 1, frameAdvantage: "", gapFrames: ""};
}

export function blockstringDetailToDraft(detail: BlockstringDetail): BlockstringDraft {
    const nodeClientId = (id: string) => `n${id}`;
    const edgeClientId = (id: string) => `e${id}`;

    return {
        title: detail.title,
        summary: detail.summary ?? "",
        attackerCharacterId: detail.attackerCharacter?.id ?? "",
        classification: detail.classification,
        nodes: detail.nodes.map((node) => ({
            clientId: nodeClientId(node.id),
            move: node.move ? {id: node.move.id, summary: node.move.numpadNotation, numpadNotation: node.move.numpadNotation, moveName: node.move.moveName, characterId: node.move.character?.id} : null,
            layer: toPressureLayer(node.layer),
            damageDealt: formatDamage(node.damageDealt),
            damageReceived: formatDamage(node.damageReceived),
        })),
        edges: detail.edges.map((edge) => ({
            clientId: edgeClientId(edge.id),
            from: nodeClientId(edge.from),
            to: nodeClientId(edge.to),
            kind: edge.kind,
            readLabel: edge.readLabel ?? "",
            layer: toPressureLayer(edge.layer),
            frameAdvantage: edge.frameAdvantage === null ? "" : String(edge.frameAdvantage),
            gapFrames: edge.gapFrames === null ? "" : String(edge.gapFrames),
        })),
        conditions: detail.conditions.map((condition) => ({kind: condition.kind, value: condition.value, note: condition.note})),
        defenseEntries: detail.defenseEntries.map((entry) => ({
            edgeClientId: edgeClientId(entry.edgeId),
            instruction: entry.instruction,
            exceptionNotes: entry.exceptionNotes,
            defenderCharacterId: entry.defenderCharacter?.id ?? null,
            moveId: entry.move?.id ?? null,
            responseType: entry.responseType,
            outcome: entry.outcome,
            conversion: entry.conversion,
        })),
    };
}

// The editor exposes one "how to beat it" note per fake arrow; extra entries authored elsewhere are kept as-is.
export function defenseInstructionFor(entries: BlockstringDefenseEntryPayload[], edgeClientId: string): string {
    return entries.find((entry) => entry.edgeClientId === edgeClientId)?.instruction ?? "";
}

export function withDefenseInstruction(entries: BlockstringDefenseEntryPayload[], edgeClientId: string, instruction: string): BlockstringDefenseEntryPayload[] {
    const index = entries.findIndex((entry) => entry.edgeClientId === edgeClientId);
    if (index === -1) {
        return [...entries, {edgeClientId, instruction, responseType: "button", outcome: "counter_hit"}];
    }

    return entries.map((entry, entryIndex) => entryIndex === index ? {...entry, instruction} : entry);
}

export function buildBlockstringPayload(draft: BlockstringDraft): BlockstringPayload {
    if (!draft.title.trim()) {
        throw new Error("Title is required.");
    }
    if (!draft.attackerCharacterId) {
        throw new Error("Pick the attacking character.");
    }

    const edgeIds = new Set(draft.edges.map((edge) => edge.clientId));

    return {
        title: draft.title.trim(),
        summary: draft.summary.trim() || null,
        attackerCharacterId: draft.attackerCharacterId,
        classification: draft.classification,
        nodes: draft.nodes.map((node) => {
            if (!node.move) {
                throw new Error("Every move in the graph needs a move picked.");
            }
            return {clientId: node.clientId, moveId: node.move.id, layer: node.layer, damageDealt: parseDamage(node.damageDealt), damageReceived: parseDamage(node.damageReceived)};
        }),
        edges: draft.edges.map((edge) => ({
            clientId: edge.clientId,
            from: edge.from,
            to: edge.to,
            kind: edge.kind,
            readLabel: edge.kind === "read" ? edge.readLabel.trim() || null : null,
            layer: edge.layer,
            frameAdvantage: parseSignedInt(edge.frameAdvantage),
            gapFrames: parseSignedInt(edge.gapFrames),
        })),
        conditions: draft.conditions,
        defenseEntries: draft.defenseEntries.filter((entry) => edgeIds.has(entry.edgeClientId) && (entry.instruction ?? "").trim() !== ""),
    };
}

export function blockstringDetailToGraph(detail: BlockstringDetail): PressureGraphData {
    return {
        nodes: detail.nodes.map((node) => ({
            id: node.id,
            notation: node.move?.numpadNotation ?? "?",
            name: node.move?.moveName ?? null,
            layer: toPressureLayer(node.layer),
            damageDealt: node.damageDealt,
            damageReceived: node.damageReceived,
        })),
        edges: detail.edges.map((edge) => ({id: edge.id, from: edge.from, to: edge.to, kind: edge.kind, readLabel: edge.readLabel, layer: toPressureLayer(edge.layer)})),
    };
}

function parseSignedInt(value: string): number | null {
    const trimmed = value.trim();

    return /^-?\d+$/.test(trimmed) ? Number.parseInt(trimmed, 10) : null;
}
