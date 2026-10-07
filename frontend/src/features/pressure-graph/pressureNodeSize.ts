import type {PressureGraphNode} from "./pressureGraphTypes";

const MIN_WIDTH = 136;
const BASE_HEIGHT = 48;
const SUBTITLE_HEIGHT = 15;
// Horizontal padding plus border of the node card, and a little slack for font loading differences.
const NODE_CHROME_WIDTH = 30;
// Must match the label and subtitle typography in PressureGraphNodeView.
export const NODE_LABEL_FONT = {size: 15.2, weight: 850};
export const NODE_SUBTITLE_FONT = {size: 12, weight: 650};
const MARKER_ROW_HEIGHT = 18;

let measureContext: CanvasRenderingContext2D | null | undefined;

// Canvas text measurement; outside a browser (tests) it falls back to an average glyph width.
function textWidth(text: string, font: {size: number; weight: number}, fontFamily: string): number {
    if (typeof document !== "undefined" && measureContext === undefined) {
        measureContext = document.createElement("canvas").getContext("2d");
    }
    if (!measureContext) {
        return text.length * font.size * 0.62;
    }
    measureContext.font = `${font.weight} ${font.size}px ${fontFamily}`;

    return measureContext.measureText(text).width;
}

// Nodes grow to fit their full label instead of truncating it.
export function pressureNodeSize(node: PressureGraphNode, fontFamily = "sans-serif"): {width: number; height: number} {
    const contentWidth = Math.max(
        textWidth(node.label, NODE_LABEL_FONT, fontFamily),
        node.subtitle ? textWidth(node.subtitle, NODE_SUBTITLE_FONT, fontFamily) : 0,
    );

    return {
        width: Math.max(MIN_WIDTH, Math.ceil(contentWidth + NODE_CHROME_WIDTH)),
        height: BASE_HEIGHT + (node.subtitle ? SUBTITLE_HEIGHT : 0) + (node.markers?.length ? MARKER_ROW_HEIGHT : 0),
    };
}
