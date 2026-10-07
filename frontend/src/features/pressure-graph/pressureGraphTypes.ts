export type PressureEdgeKind = "normal" | "confirm" | "read" | "fake";

export const PRESSURE_EDGE_KINDS: PressureEdgeKind[] = ["normal", "confirm", "read", "fake"];
export const PRESSURE_READ_LABEL_MAX_LENGTH = 48;

export const PRESSURE_EDGE_KIND_LABELS: Record<PressureEdgeKind, string> = {
    normal: "Autopilot",
    confirm: "Confirm",
    read: "Hard read",
    fake: "Fake",
};

// Icon medals drawn on nodes and arrows; only properties that change how the situation is played get one.
export type PressureMarker = "overhead" | "low" | "sideSwitch" | "safeJump" | "backroll" | "riseInPlace";
// Safe jump medals are drawn larger: whether a setup is a real safe jump matters more than any other tag.
export const LARGE_MARKERS: PressureMarker[] = ["safeJump"];

export interface PressureGraphNode {
    id: string;
    label: string;
    // Smaller second line, the numpad notation of a named move.
    subtitle?: string | null;
    // Implicit root drawn for context (the oki ender): it never takes part in drag-to-connect.
    anchor?: boolean;
    markers?: PressureMarker[];
    frameAdvantage?: number | null;
}

export interface PressureGraphEdge {
    id: string;
    from: string;
    to: string;
    kind: PressureEdgeKind;
    readLabel: string | null;
    markers?: PressureMarker[];
    // Short step text drawn on the arrow, such as "Delay".
    caption?: string | null;
    // Frame detail of the transition: true blockstring or the gap in frames.
    trueBlockstring?: boolean;
    gapFrames?: number | null;
}

export interface PressureGraphData {
    nodes: PressureGraphNode[];
    edges: PressureGraphEdge[];
}

export function formatFrameAdvantage(value: number): string {
    return value > 0 ? `+${value}` : String(value);
}

export function hasFrameDetails(graph: PressureGraphData): boolean {
    return graph.nodes.some((node) => node.frameAdvantage != null) || graph.edges.some((edge) => edge.trueBlockstring || edge.gapFrames != null);
}

interface NamedMove {
    numpadNotation?: string | null;
    commonName?: string | null;
    moveName?: string | null;
    summary?: string;
}

// The name players use ("MK Tatsu"), then the full frame data name, then the numpad notation.
export function moveLabel(move: NamedMove): string {
    return move.commonName?.trim() || move.moveName?.trim() || move.numpadNotation || move.summary || "?";
}

// The notation under a named move; omitted when the label already is the notation.
export function moveSubtitle(move: NamedMove): string | null {
    const notation = move.numpadNotation?.trim();

    return notation && notation !== moveLabel(move) ? notation : null;
}
