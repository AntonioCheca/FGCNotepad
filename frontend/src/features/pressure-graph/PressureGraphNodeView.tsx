import {Handle, Position} from "@xyflow/react";
import type {Node, NodeProps} from "@xyflow/react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppIconButton} from "@/src/components/ui/AppIconButton";
import {AddIcon} from "@/src/components/ui/AppIcons";
import {AppTypography} from "@/src/components/ui/AppTypography";
import type {Theme} from "@/src/components/ui/AppThemeUtils";
import {useAppTheme} from "@/src/components/ui/AppThemeHooks";
import type {PressureGraphDirection} from "./pressureGraphModel";
import {DROP_TARGET_STYLE} from "./pressureGraphGeometry";
import {NODE_LABEL_FONT, NODE_SUBTITLE_FONT} from "./pressureNodeSize";
import {PressureMarkerIcon} from "./PressureMarkerIcon";
import {formatFrameAdvantage} from "./pressureGraphTypes";
import type {PressureGraphNode} from "./pressureGraphTypes";

export interface PressureNodeData extends Record<string, unknown> {
    node: PressureGraphNode;
    showFrameDetails: boolean;
    direction: PressureGraphDirection;
    connectable: boolean;
    selected: boolean;
    onAdd?: () => void;
}

export type PressureFlowNode = Node<PressureNodeData, "pressure">;

export function PressureGraphNodeView({data}: NodeProps<PressureFlowNode>) {
    const {node, showFrameDetails, direction, connectable, selected, onAdd} = data;
    const theme = useAppTheme();
    const horizontal = direction === "LR";
    // Handles stay mounted (edges anchor to them) but are only visible where drag-to-connect is offered.
    const handleStyle = {opacity: connectable ? 1 : 0, width: connectable ? 10 : 1, height: connectable ? 10 : 1, minWidth: 0, minHeight: 0, border: 0, background: theme.fgc.accent.selected};
    const frameAdvantage = showFrameDetails && node.frameAdvantage != null ? formatFrameAdvantage(node.frameAdvantage) : null;

    return (
        <AppBox
            sx={{
                position: "relative",
                // Padding and border must stay inside the size the layout reserved, or arrows arriving from the
                // right end under the card and the right-most node's "+" leaves the canvas.
                boxSizing: "border-box",
                width: "100%",
                height: "100%",
                display: "grid",
                alignContent: "center",
                gap: 0.25,
                px: 1.1,
                borderRadius: 1.5,
                border: "1px solid",
                borderColor: (theme: Theme) => selected ? theme.fgc.accent.selected : theme.fgc.border.strong,
                boxShadow: (theme: Theme) => selected ? `0 0 0 2px ${theme.fgc.accent.selected}` : "none",
                backgroundColor: (theme: Theme) => theme.fgc.surface.base,
            }}
        >
            <Handle type="target" position={horizontal ? Position.Left : Position.Top} isConnectableStart={false} isConnectableEnd={connectable} style={connectable ? DROP_TARGET_STYLE : {...handleStyle, opacity: 0}} />
            <AppTypography noWrap title={node.label} sx={{fontWeight: NODE_LABEL_FONT.weight, fontSize: NODE_LABEL_FONT.size, lineHeight: 1.2}}>{node.label}</AppTypography>
            {node.subtitle ? <AppTypography noWrap sx={{fontWeight: NODE_SUBTITLE_FONT.weight, fontSize: NODE_SUBTITLE_FONT.size, lineHeight: 1.2, color: "text.secondary"}}>{node.subtitle}</AppTypography> : null}
            {node.markers?.length ? (
                <AppBox sx={{display: "flex", gap: 0.4, alignItems: "center"}}>
                    {node.markers.map((marker) => <PressureMarkerIcon key={marker} marker={marker} />)}
                </AppBox>
            ) : null}
            {frameAdvantage ? (
                <AppTypography
                    component="span"
                    aria-label={`${frameAdvantage} frame advantage`}
                    sx={{
                        position: "absolute",
                        top: -10,
                        right: onAdd ? 20 : 6,
                        px: 0.5,
                        borderRadius: 0.75,
                        border: "1px solid",
                        borderColor: (theme: Theme) => theme.fgc.border.strong,
                        backgroundColor: (theme: Theme) => theme.fgc.surface.raised,
                        fontSize: "0.75rem",
                        fontWeight: 850,
                        lineHeight: 1.45,
                        fontVariantNumeric: "tabular-nums",
                    }}
                >
                    {frameAdvantage}
                </AppTypography>
            ) : null}
            <Handle type="source" position={horizontal ? Position.Right : Position.Bottom} isConnectable={connectable} style={handleStyle} />
            {onAdd ? (
                <AppIconButton
                    className="nodrag nopan"
                    aria-label={`Add a step after ${node.label}`}
                    size="small"
                    onClick={(event) => {
                        event.stopPropagation();
                        onAdd();
                    }}
                    sx={{
                        position: "absolute",
                        top: -14,
                        right: -14,
                        width: 28,
                        height: 28,
                        border: "1px solid",
                        borderColor: (theme: Theme) => theme.fgc.accent.selected,
                        color: (theme: Theme) => theme.fgc.accent.selectedText,
                        backgroundColor: (theme: Theme) => theme.fgc.surface.raised,
                        "&:hover": {backgroundColor: (theme: Theme) => theme.fgc.surface.raised},
                    }}
                >
                    <AddIcon fontSize="small" />
                </AppIconButton>
            ) : null}
        </AppBox>
    );
}
