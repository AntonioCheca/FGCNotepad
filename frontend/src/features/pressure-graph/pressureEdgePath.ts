import type {PressureGraphDirection, PressurePoint} from "./pressureGraphModel";

export interface PressureEdgePath {
    path: string;
    labelX: number;
    labelY: number;
}

// Smooth curve through dagre's routed points (Catmull-Rom converted to cubic Béziers), so edges keep dagre's
// node-avoiding route, including edges that loop back against the flow.
export function routedEdgePath(points: PressurePoint[], label: PressurePoint | null): PressureEdgePath {
    const [first] = points;
    let path = `M ${first.x},${first.y}`;
    for (let index = 0; index < points.length - 1; index += 1) {
        const previous = points[Math.max(0, index - 1)];
        const current = points[index];
        const next = points[index + 1];
        const after = points[Math.min(points.length - 1, index + 2)];
        const c1 = {x: current.x + (next.x - previous.x) / 6, y: current.y + (next.y - previous.y) / 6};
        const c2 = {x: next.x - (after.x - current.x) / 6, y: next.y - (after.y - current.y) / 6};
        path += ` C ${c1.x},${c1.y} ${c2.x},${c2.y} ${next.x},${next.y}`;
    }
    const middle = label ?? points[Math.floor(points.length / 2)];

    return {path, labelX: middle.x, labelY: middle.y};
}

// Self-loops arc out of the node's outgoing side and back into its incoming side, away from the flow.
export function selfLoopPath(source: PressurePoint, target: PressurePoint, direction: PressureGraphDirection): PressureEdgePath {
    const bulge = 56;
    const reach = 40;
    const [c1x, c1y, c2x, c2y] = direction === "LR"
        ? [source.x + reach, source.y + bulge, target.x - reach, target.y + bulge]
        : [source.x + bulge, source.y + reach, target.x + bulge, target.y - reach];

    return {
        path: `M ${source.x},${source.y} C ${c1x},${c1y} ${c2x},${c2y} ${target.x},${target.y}`,
        labelX: (source.x + 3 * c1x + 3 * c2x + target.x) / 8,
        labelY: (source.y + 3 * c1y + 3 * c2y + target.y) / 8,
    };
}
