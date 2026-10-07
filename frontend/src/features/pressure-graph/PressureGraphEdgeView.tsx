import {BaseEdge, EdgeLabelRenderer} from "@xyflow/react";
import type {Edge, EdgeProps} from "@xyflow/react";
import {AppBox} from "@/src/components/ui/AppBox";
import {useAppTheme} from "@/src/components/ui/AppThemeHooks";
import type {Theme} from "@/src/components/ui/AppThemeUtils";
import {routedEdgePath, selfLoopPath} from "./pressureEdgePath";
import {pressureEdgeColor, pressureEdgeLabelText, pressureMarkerSize} from "./pressureGraphGeometry";
import {PressureMarkerIcon} from "./PressureMarkerIcon";
import type {PressureEdgeRoute, PressureGraphDirection} from "./pressureGraphModel";
import {LARGE_MARKERS} from "./pressureGraphTypes";
import type {PressureGraphEdge} from "./pressureGraphTypes";

export interface PressureEdgeData extends Record<string, unknown> {
    edge: PressureGraphEdge;
    direction: PressureGraphDirection;
    showFrameDetails: boolean;
    selected: boolean;
    route: PressureEdgeRoute | null;
}

export type PressureFlowEdge = Edge<PressureEdgeData, "pressure">;

export function PressureGraphEdgeView({id, source, target, sourceX, sourceY, targetX, targetY, markerEnd, data}: EdgeProps<PressureFlowEdge>) {
    const theme = useAppTheme();
    if (!data) {
        return null;
    }

    const {edge, direction, showFrameDetails, selected, route} = data;
    const color = pressureEdgeColor(theme, edge.kind);
    const labelText = pressureEdgeLabelText(edge, showFrameDetails);
    const markers = edge.markers ?? [];
    const sourcePoint = {x: sourceX, y: sourceY};
    const targetPoint = {x: targetX, y: targetY};
    const {path, labelX, labelY} = route
        ? routedEdgePath(route.points, route.label)
        : source === target ? selfLoopPath(sourcePoint, targetPoint, direction) : routedEdgePath([sourcePoint, targetPoint], null);

    return (
        <>
            {/* Fake edges are dashed so the red "interruptible" meaning does not rely on colour alone. */}
            <BaseEdge id={id} path={path} markerEnd={markerEnd} interactionWidth={18} style={{stroke: color, strokeWidth: selected ? 3.5 : 2, strokeDasharray: edge.kind === "fake" ? "6 4" : undefined}} />
            {labelText || markers.length > 0 ? (
                <EdgeLabelRenderer>
                    <AppBox
                        className="nodrag nopan"
                        sx={{
                            position: "absolute",
                            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                            display: "flex",
                            alignItems: "center",
                            gap: 0.4,
                            px: 0.75,
                            py: 0.15,
                            borderRadius: 1,
                            border: "1px solid",
                            borderColor: color,
                            backgroundColor: (appTheme: Theme) => appTheme.fgc.surface.base,
                            color: "text.primary",
                            fontSize: "0.75rem",
                            fontWeight: 750,
                            whiteSpace: "nowrap",
                            pointerEvents: "all",
                        }}
                    >
                        {markers.map((marker) => <PressureMarkerIcon key={marker} marker={marker} size={pressureMarkerSize(LARGE_MARKERS.includes(marker))} />)}
                        {labelText}
                    </AppBox>
                </EdgeLabelRenderer>
            ) : null}
        </>
    );
}
