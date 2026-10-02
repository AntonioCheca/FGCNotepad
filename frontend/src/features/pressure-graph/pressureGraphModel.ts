import dagre from "@dagrejs/dagre";
import type {PressureGraphData, PressureGraphEdge, PressureGraphNode, PressureLayerFilter} from "./pressureGraphTypes";

export type PressureGraphDirection = "LR" | "TB";

export interface PressureNodeSize {
    width: number;
    height: number;
}

export interface PressurePoint {
    x: number;
    y: number;
}

// Route dagre computed for an edge: a polyline that avoids other nodes, plus room reserved for its label.
export interface PressureEdgeRoute {
    points: PressurePoint[];
    label: PressurePoint | null;
}

export interface PressureGraphLayout {
    positions: Map<string, PressurePoint>;
    routes: Map<string, PressureEdgeRoute>;
    width: number;
    height: number;
}

// Self-loops are not routed by dagre; they arc beside their node and need this much extra room.
export const SELF_LOOP_ROOM = 64;

export const DAMAGE_SEGMENT = 1000;

// Layers are cumulative: "Layer 2" shows everything up to layer 2.
export function filterGraphByLayer(graph: PressureGraphData, filter: PressureLayerFilter): PressureGraphData {
    if (filter === "all") {
        return graph;
    }

    const nodes = graph.nodes.filter((node) => node.layer <= filter);
    const visible = new Set(nodes.map((node) => node.id));
    const edges = graph.edges.filter((edge) => edge.layer <= filter && visible.has(edge.from) && visible.has(edge.to));

    return {nodes, edges};
}

export function highestLayer(graph: PressureGraphData): number {
    return Math.max(1, ...graph.nodes.map((node) => node.layer), ...graph.edges.map((edge) => edge.layer));
}

export function nodeHasOutcome(node: PressureGraphNode): boolean {
    return node.damageDealt !== null || node.damageReceived !== null;
}

// One entry per started 1000-damage segment, keyed by the damage it starts at: 2400 -> fills [1, 1, 0.4].
export function damageSegments(damage: number): Array<{start: number; fill: number}> {
    const segments = [];
    for (let start = 0; start < damage; start += DAMAGE_SEGMENT) {
        segments.push({start, fill: Math.min(1, (damage - start) / DAMAGE_SEGMENT)});
    }

    return segments;
}

export function layoutPressureGraph(
    graph: PressureGraphData,
    sizeOf: (node: PressureGraphNode) => PressureNodeSize,
    direction: PressureGraphDirection,
    labelSizeOf: (edge: PressureGraphEdge) => PressureNodeSize | null = () => null,
): PressureGraphLayout {
    const layout = new dagre.graphlib.Graph({multigraph: true});
    layout.setGraph({rankdir: direction, nodesep: direction === "LR" ? 28 : 22, ranksep: direction === "LR" ? 72 : 48, marginx: 8, marginy: 8});
    layout.setDefaultEdgeLabel(() => ({}));

    for (const node of graph.nodes) {
        layout.setNode(node.id, sizeOf(node));
    }
    for (const edge of graph.edges) {
        if (edge.from !== edge.to && layout.hasNode(edge.from) && layout.hasNode(edge.to)) {
            const label = labelSizeOf(edge);
            layout.setEdge(edge.from, edge.to, label ? {...label, labelpos: "c"} : {}, edge.id);
        }
    }

    dagre.layout(layout);

    const positions = new Map<string, PressurePoint>();
    const routes = new Map<string, PressureEdgeRoute>();
    let width = 0;
    let height = 0;
    let hasSelfLoop = false;
    for (const node of graph.nodes) {
        const placed = layout.node(node.id);
        const size = sizeOf(node);
        // dagre reports centres; React Flow positions are top-left.
        const x = placed.x - size.width / 2;
        const y = placed.y - size.height / 2;
        positions.set(node.id, {x, y});
        width = Math.max(width, x + size.width);
        height = Math.max(height, y + size.height);
    }
    for (const edge of graph.edges) {
        if (edge.from === edge.to) {
            hasSelfLoop = true;
            continue;
        }
        const routed = layout.edge({v: edge.from, w: edge.to, name: edge.id});
        if (!routed?.points) {
            continue;
        }
        const points = routed.points.map((point: PressurePoint) => ({x: point.x, y: point.y}));
        routes.set(edge.id, {points, label: routed.x === undefined || routed.y === undefined || labelSizeOf(edge) === null ? null : {x: routed.x, y: routed.y}});
        for (const point of points) {
            width = Math.max(width, point.x);
            height = Math.max(height, point.y);
        }
    }
    if (hasSelfLoop) {
        width += direction === "TB" ? SELF_LOOP_ROOM : 0;
        height += direction === "LR" ? SELF_LOOP_ROOM : 0;
    }

    return {positions, routes, width, height};
}
