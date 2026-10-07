import type {Theme} from "@/src/components/ui/AppThemeUtils";
import {LARGE_MARKERS} from "./pressureGraphTypes";
import type {PressureEdgeKind, PressureGraphEdge} from "./pressureGraphTypes";

const MARKER_SIZE = 16;
const LARGE_MARKER_SIZE = 20;
// A target handle that covers the whole card so a dragged connection can be dropped anywhere on it.
export const DROP_TARGET_STYLE = {opacity: 0, width: "100%", height: "100%", top: 0, left: 0, transform: "none", borderRadius: 0, border: 0, minWidth: 0, minHeight: 0};

export function pressureEdgeGapText(edge: PressureGraphEdge): string | null {
    if (edge.trueBlockstring) {
        return "True";
    }

    return edge.gapFrames == null ? null : String(edge.gapFrames);
}

export function pressureEdgeLabelText(edge: PressureGraphEdge, showFrameDetails: boolean): string {
    const parts = [edge.caption, edge.kind === "read" ? edge.readLabel : null, showFrameDetails ? pressureEdgeGapText(edge) : null];

    return parts.filter((part): part is string => Boolean(part)).join(" · ");
}

export function pressureMarkerSize(large: boolean): number {
    return large ? LARGE_MARKER_SIZE : MARKER_SIZE;
}

// Room dagre reserves for an edge's label pill so it never sits on a node; approximates the 0.75rem bold text.
export function pressureEdgeLabelSize(edge: PressureGraphEdge, showFrameDetails: boolean): {width: number; height: number} | null {
    const text = pressureEdgeLabelText(edge, showFrameDetails);
    const markers = edge.markers ?? [];
    if (!text && markers.length === 0) {
        return null;
    }
    const markerWidth = markers.reduce((total, marker) => total + pressureMarkerSize(LARGE_MARKERS.includes(marker)) + 3, 0);
    const hasLarge = markers.some((marker) => LARGE_MARKERS.includes(marker));

    return {width: markerWidth + text.length * 6.9 + 18, height: hasLarge ? 28 : 22};
}

export function pressureEdgeColor(theme: Theme, kind: PressureEdgeKind): string {
    return theme.fgc.pressureGraph[kind];
}
