export type PressureEdgeKind = "normal" | "confirm" | "read" | "fake";
export type PressureLayer = 1 | 2 | 3;
export type PressureLayerFilter = "all" | PressureLayer;

export const PRESSURE_EDGE_KINDS: PressureEdgeKind[] = ["normal", "confirm", "read", "fake"];
export const PRESSURE_LAYERS: PressureLayer[] = [1, 2, 3];
export const PRESSURE_READ_LABEL_MAX_LENGTH = 48;
export const PRESSURE_MAX_DAMAGE = 10000;

export const PRESSURE_EDGE_KIND_LABELS: Record<PressureEdgeKind, string> = {
    normal: "Autopilot",
    confirm: "Confirm",
    read: "Hard read",
    fake: "Fake",
};

export interface PressureGraphNode {
    id: string;
    notation: string;
    name: string | null;
    layer: PressureLayer;
    damageDealt: number | null;
    damageReceived: number | null;
}

export interface PressureGraphEdge {
    id: string;
    from: string;
    to: string;
    kind: PressureEdgeKind;
    readLabel: string | null;
    layer: PressureLayer;
}

export interface PressureGraphData {
    nodes: PressureGraphNode[];
    edges: PressureGraphEdge[];
}

export function toPressureLayer(value: unknown): PressureLayer {
    return value === 2 || value === 3 ? value : 1;
}

export function toPressureEdgeKind(value: unknown): PressureEdgeKind {
    return PRESSURE_EDGE_KINDS.includes(value as PressureEdgeKind) ? value as PressureEdgeKind : "normal";
}
