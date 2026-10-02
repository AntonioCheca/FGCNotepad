import type {OkiMoveOption} from "@/src/components/okis/OkiMovePicker";
import {PRESSURE_MAX_DAMAGE} from "./pressureGraphTypes";
import type {PressureEdgeKind, PressureGraphData, PressureLayer} from "./pressureGraphTypes";

// Editable graph shape shared by the oki and blockstring editors; feature drafts extend these.
export interface PressureNodeDraft {
    clientId: string;
    move: OkiMoveOption | null;
    layer: PressureLayer;
    damageDealt: string;
    damageReceived: string;
}

export interface PressureEdgeDraft {
    clientId: string;
    from: string;
    to: string;
    kind: PressureEdgeKind;
    readLabel: string;
    layer: PressureLayer;
}

export type PressureSelection = {type: "node" | "edge"; id: string} | null;

export function nextClientId(prefix: string, taken: Iterable<string>): string {
    const used = new Set(taken);
    let index = 1;
    while (used.has(`${prefix}${index}`)) {
        index += 1;
    }

    return `${prefix}${index}`;
}

export function parseDamage(value: string): number | null {
    const trimmed = value.trim();
    if (!/^\d+$/.test(trimmed)) {
        return null;
    }
    const damage = Number.parseInt(trimmed, 10);

    return damage > 0 && damage <= PRESSURE_MAX_DAMAGE ? damage : null;
}

export function formatDamage(value: number | null): string {
    return value === null ? "" : String(value);
}

export function hasEdge(edges: PressureEdgeDraft[], from: string, to: string): boolean {
    return edges.some((edge) => edge.from === from && edge.to === to);
}

// Nodes the given node can still get a new arrow to (self-loops allowed, duplicates not).
export function connectTargets(graph: PressureGraphData, edges: PressureEdgeDraft[], from: string, exclude: string[] = []): Array<{id: string; label: string}> {
    const excluded = new Set(exclude);
    const targets: Array<{id: string; label: string}> = [];
    for (const node of graph.nodes) {
        if (!excluded.has(node.id) && !hasEdge(edges, from, node.id)) {
            targets.push({id: node.id, label: node.notation});
        }
    }

    return targets;
}

export function removeNodeAndEdges<N extends PressureNodeDraft, E extends PressureEdgeDraft>(nodes: N[], edges: E[], clientId: string): {nodes: N[]; edges: E[]} {
    return {
        nodes: nodes.filter((node) => node.clientId !== clientId),
        edges: edges.filter((edge) => edge.from !== clientId && edge.to !== clientId),
    };
}

export function draftToGraphData(nodes: PressureNodeDraft[], edges: PressureEdgeDraft[]): PressureGraphData {
    return {
        nodes: nodes.map((node) => ({
            id: node.clientId,
            notation: node.move?.numpadNotation ?? node.move?.summary ?? "Pick a move",
            name: node.move?.moveName ?? null,
            layer: node.layer,
            damageDealt: parseDamage(node.damageDealt),
            damageReceived: parseDamage(node.damageReceived),
        })),
        edges: edges.map((edge) => ({
            id: edge.clientId,
            from: edge.from,
            to: edge.to,
            kind: edge.kind,
            readLabel: edge.kind === "read" ? edge.readLabel.trim() || null : null,
            layer: edge.layer,
        })),
    };
}
