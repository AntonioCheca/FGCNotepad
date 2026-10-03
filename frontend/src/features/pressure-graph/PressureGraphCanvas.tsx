import React from "react";
import {MarkerType, ReactFlow, ReactFlowProvider} from "@xyflow/react";
import type {EdgeChange, NodeChange} from "@xyflow/react";
import {AppBox} from "@/src/components/ui/AppBox";
import {useAppTheme, useIsBelowBreakpoint} from "@/src/components/ui/AppThemeHooks";
import {PressureGraphEdgeView} from "./PressureGraphEdgeView";
import type {PressureFlowEdge} from "./PressureGraphEdgeView";
import {PressureGraphNodeView} from "./PressureGraphNodeView";
import {pressureEdgeColor, pressureEdgeLabelSize, pressureNodeSize} from "./pressureGraphGeometry";
import type {PressureFlowNode} from "./PressureGraphNodeView";
import {layoutPressureGraph} from "./pressureGraphModel";
import type {PressureSelection} from "./pressureGraphDraft";
import type {PressureGraphData} from "./pressureGraphTypes";

const NODE_TYPES = {pressure: PressureGraphNodeView};
const EDGE_TYPES = {pressure: PressureGraphEdgeView};
const FRAME_PADDING = 24;

interface PressureGraphCanvasProps {
    graph: PressureGraphData;
    showRisk: boolean;
    ariaLabel: string;
    selection?: PressureSelection;
    onSelect?: (selection: PressureSelection) => void;
    onConnect?: (from: string, to: string) => void;
}

export function PressureGraphCanvas(props: PressureGraphCanvasProps) {
    return (
        <ReactFlowProvider>
            <PressureGraphFlow {...props} />
        </ReactFlowProvider>
    );
}

// Always auto-laid-out: phones stack the graph top-to-bottom, wider screens read left-to-right. The canvas is sized
// to the laid-out graph and never pans or zooms, so it scrolls with the page instead of trapping touch gestures.
function PressureGraphFlow({graph, showRisk, ariaLabel, selection = null, onSelect, onConnect}: PressureGraphCanvasProps) {
    const theme = useAppTheme();
    const compact = useIsBelowBreakpoint("md");
    const direction = compact ? "TB" : "LR";
    const editable = Boolean(onSelect);
    const connectable = Boolean(onConnect) && !compact;
    const [containerRef, containerWidth] = useElementWidth<HTMLDivElement>();

    const layout = React.useMemo(() => layoutPressureGraph(graph, (node) => pressureNodeSize(node, showRisk), direction, pressureEdgeLabelSize), [direction, graph, showRisk]);
    const contentWidth = layout.width;
    const contentHeight = layout.height;
    const zoom = containerWidth > 0 ? Math.min(1, (containerWidth - FRAME_PADDING) / Math.max(contentWidth, 1)) : 1;
    const height = Math.max(120, Math.round(contentHeight * zoom + FRAME_PADDING));
    // The viewport is computed rather than fitted: centred horizontally, top-aligned, scaled down only to fit the width.
    const viewport = {x: Math.max(FRAME_PADDING / 2, (containerWidth - contentWidth * zoom) / 2), y: FRAME_PADDING / 2, zoom};

    const nodes: PressureFlowNode[] = graph.nodes.map((node) => {
        const size = pressureNodeSize(node, showRisk);
        const isSelected = selection?.type === "node" && selection.id === node.id;
        return {
            id: node.id,
            type: "pressure",
            position: layout.positions.get(node.id) ?? {x: 0, y: 0},
            width: size.width,
            height: size.height,
            selected: isSelected,
            ariaLabel: node.name ? `${node.notation}, ${node.name}` : node.notation,
            data: {node, showRisk, direction, connectable: connectable && !node.anchor, selected: isSelected},
        };
    });
    const edges: PressureFlowEdge[] = graph.edges.map((edge) => {
        const isSelected = selection?.type === "edge" && selection.id === edge.id;
        return {
            id: edge.id,
            source: edge.from,
            target: edge.to,
            type: "pressure",
            selected: isSelected,
            markerEnd: {type: MarkerType.ArrowClosed, color: pressureEdgeColor(theme, edge.kind), width: 16, height: 16},
            data: {edge, direction, selected: isSelected, route: layout.routes.get(edge.id) ?? null},
        };
    });

    const handleNodesChange = (changes: NodeChange<PressureFlowNode>[]) => forwardSelection(changes, "node", onSelect);
    const handleEdgesChange = (changes: EdgeChange<PressureFlowEdge>[]) => forwardSelection(changes, "edge", onSelect);

    return (
        <AppBox ref={containerRef} role="group" aria-label={ariaLabel} data-chart sx={{width: "100%", minWidth: 0, height, "& .react-flow__pane": {cursor: editable ? "default" : "auto"}, "& .react-flow__node": {cursor: editable ? "pointer" : "default"}}}>
            {containerWidth > 0 ? (
                <ReactFlow<PressureFlowNode, PressureFlowEdge>
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={NODE_TYPES}
                    edgeTypes={EDGE_TYPES}
                    colorMode={theme.palette.mode}
                    style={{background: "transparent"}}
                    viewport={viewport}
                    onViewportChange={() => undefined}
                    minZoom={0.2}
                    maxZoom={1}
                    nodesDraggable={false}
                    nodesConnectable={connectable}
                    nodesFocusable={editable}
                    edgesFocusable={editable}
                    elementsSelectable={editable}
                    panOnDrag={false}
                    panOnScroll={false}
                    zoomOnScroll={false}
                    zoomOnPinch={false}
                    zoomOnDoubleClick={false}
                    preventScrolling={false}
                    selectionKeyCode={null}
                    multiSelectionKeyCode={null}
                    deleteKeyCode={null}
                    onNodesChange={handleNodesChange}
                    onEdgesChange={handleEdgesChange}
                    onPaneClick={editable ? () => onSelect?.(null) : undefined}
                    onConnect={({source, target}) => onConnect?.(source, target)}
                    proOptions={{hideAttribution: true}}
                />
            ) : null}
        </AppBox>
    );
}

function forwardSelection(changes: Array<{type: string; id?: string; selected?: boolean}>, type: "node" | "edge", onSelect?: (selection: PressureSelection) => void) {
    if (!onSelect) {
        return;
    }
    const picked = changes.find((change) => change.type === "select" && change.selected && change.id);
    if (picked?.id) {
        onSelect({type, id: picked.id});
    }
}

function useElementWidth<T extends HTMLElement>(): [React.RefCallback<T>, number] {
    const [width, setWidth] = React.useState(0);
    const observer = React.useRef<ResizeObserver | null>(null);
    const ref = React.useCallback((element: T | null) => {
        observer.current?.disconnect();
        if (!element) {
            return;
        }
        setWidth(element.clientWidth);
        observer.current = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
        observer.current.observe(element);
    }, []);

    return [ref, width];
}
