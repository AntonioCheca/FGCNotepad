import type {Theme} from "@/src/components/ui/AppThemeUtils";
import {damageSegments, nodeHasOutcome} from "./pressureGraphModel";
import type {PressureEdgeKind, PressureGraphEdge, PressureGraphNode} from "./pressureGraphTypes";

export const RISK_SEGMENT_WIDTH = 13;
export const RISK_SEGMENT_GAP = 2;

const BASE_WIDTH = 136;
const BASE_HEIGHT = 58;
const RISK_ROW_HEIGHT = 16;
// A target handle that covers the whole card so a dragged connection can be dropped anywhere on it.
export const DROP_TARGET_STYLE = {opacity: 0, width: "100%", height: "100%", top: 0, left: 0, transform: "none", borderRadius: 0, border: 0, minWidth: 0, minHeight: 0};

export function pressureNodeSize(node: PressureGraphNode, showRisk: boolean): {width: number; height: number} {
    if (!showRisk || !nodeHasOutcome(node)) {
        return {width: BASE_WIDTH, height: BASE_HEIGHT};
    }

    const rows = [node.damageDealt, node.damageReceived].filter((damage): damage is number => damage !== null);
    const longest = Math.max(...rows.map((damage) => damageSegments(damage).length));

    return {
        width: Math.max(BASE_WIDTH, 28 + longest * (RISK_SEGMENT_WIDTH + RISK_SEGMENT_GAP) + 44),
        height: BASE_HEIGHT + rows.length * RISK_ROW_HEIGHT,
    };
}

// Room dagre reserves on read edges so the label never sits on a node; approximates the 0.72rem bold pill.
export function pressureEdgeLabelSize(edge: PressureGraphEdge): {width: number; height: number} | null {
    return edge.kind === "read" && edge.readLabel ? {width: edge.readLabel.length * 6.6 + 18, height: 22} : null;
}

export function pressureEdgeColor(theme: Theme, kind: PressureEdgeKind): string {
    return theme.fgc.pressureGraph[kind];
}
