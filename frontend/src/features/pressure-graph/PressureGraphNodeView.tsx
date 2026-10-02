import {Handle, Position} from "@xyflow/react";
import type {Node, NodeProps} from "@xyflow/react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppTypography} from "@/src/components/ui/AppTypography";
import type {Theme} from "@/src/components/ui/AppThemeUtils";
import {useAppTheme} from "@/src/components/ui/AppThemeHooks";
import type {PressureGraphDirection} from "./pressureGraphModel";
import {nodeHasOutcome} from "./pressureGraphModel";
import {DROP_TARGET_STYLE} from "./pressureGraphGeometry";
import {PressureRiskBar} from "./PressureRiskBar";
import type {PressureGraphNode} from "./pressureGraphTypes";

export interface PressureNodeData extends Record<string, unknown> {
    node: PressureGraphNode;
    showRisk: boolean;
    direction: PressureGraphDirection;
    connectable: boolean;
    selected: boolean;
}

export type PressureFlowNode = Node<PressureNodeData, "pressure">;

export function PressureGraphNodeView({data}: NodeProps<PressureFlowNode>) {
    const {node, showRisk, direction, connectable, selected} = data;
    const theme = useAppTheme();
    const horizontal = direction === "LR";
    // Handles stay mounted (edges anchor to them) but are only visible where drag-to-connect is offered.
    const handleStyle = {opacity: connectable ? 1 : 0, width: connectable ? 10 : 1, height: connectable ? 10 : 1, minWidth: 0, minHeight: 0, border: 0, background: theme.fgc.accent.selected};
    const showOutcome = showRisk && nodeHasOutcome(node);

    return (
        <AppBox
            sx={{
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
                cursor: connectable ? "pointer" : "default",
            }}
        >
            <Handle type="target" position={horizontal ? Position.Left : Position.Top} isConnectableStart={false} isConnectableEnd={connectable} style={connectable ? DROP_TARGET_STYLE : {...handleStyle, opacity: 0}} />
            <AppTypography noWrap sx={{fontWeight: 850, fontSize: "1rem", lineHeight: 1.15}}>{node.notation}</AppTypography>
            {node.name ? <AppTypography noWrap variant="caption" sx={{color: "text.secondary", lineHeight: 1.2}}>{node.name}</AppTypography> : null}
            {showOutcome && node.damageDealt !== null ? <PressureRiskBar damage={node.damageDealt} tone="dealt" /> : null}
            {showOutcome && node.damageReceived !== null ? <PressureRiskBar damage={node.damageReceived} tone="received" /> : null}
            <Handle type="source" position={horizontal ? Position.Right : Position.Bottom} isConnectable={connectable} style={handleStyle} />
        </AppBox>
    );
}
