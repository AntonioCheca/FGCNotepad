import React from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppDrawer} from "@/src/components/ui/AppDrawer";
import {AppIconButton} from "@/src/components/ui/AppIconButton";
import {CloseIcon} from "@/src/components/ui/AppIcons";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {useIsBelowBreakpoint} from "@/src/components/ui/AppThemeHooks";
import type {Theme} from "@/src/components/ui/AppThemeUtils";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {PressureGraphView} from "./PressureGraphView";
import type {PressureSelection} from "./pressureGraphDraft";
import type {PressureGraphData} from "./pressureGraphTypes";

interface PressureGraphEditorProps {
    graph: PressureGraphData;
    ariaLabel: string;
    selection: PressureSelection;
    inspectorTitle: string;
    inspector: React.ReactNode;
    onSelect: (selection: PressureSelection) => void;
    onConnect: (from: string, to: string) => void;
    onAddFrom: (nodeId: string) => void;
    frameDetails?: boolean;
}

// Graph editing happens on the rendered graph: "+" adds the next node, dragging a node's dot onto another connects
// them, and tapping a node or arrow edits it in the inspector. The inspector sits under the graph on desktop and
// opens as a bottom sheet on phones so the graph stays visible.
export function PressureGraphEditor({graph, ariaLabel, selection, inspectorTitle, inspector, onSelect, onConnect, onAddFrom, frameDetails}: PressureGraphEditorProps) {
    const compact = useIsBelowBreakpoint("md");
    const header = (
        <AppBox sx={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1}}>
            <AppTypography variant="subtitle1" sx={{fontWeight: 820}}>{inspectorTitle}</AppTypography>
            <AppIconButton aria-label="Close inspector" size="small" onClick={() => onSelect(null)}><CloseIcon fontSize="small" /></AppIconButton>
        </AppBox>
    );

    return (
        <AppBox sx={{display: "grid", gap: 1, minWidth: 0}}>
            <AppPaper variant="outlined" sx={{p: {xs: 0.75, md: 1}, borderRadius: 2, backgroundColor: (theme: Theme) => theme.fgc.surface.sunken, minWidth: 0}}>
                <PressureGraphView graph={graph} ariaLabel={ariaLabel} frameDetails={frameDetails} selection={selection} onSelect={onSelect} onConnect={onConnect} onAddFrom={onAddFrom} />
            </AppPaper>

            {compact ? (
                <AppDrawer
                    anchor="bottom"
                    open={selection !== null}
                    onClose={() => onSelect(null)}
                    slotProps={{paper: {sx: {maxHeight: "80dvh", px: 2, pt: 1.5, pb: "calc(16px + env(safe-area-inset-bottom, 0px))", borderTopLeftRadius: 16, borderTopRightRadius: 16, display: "grid", gap: 1.25, alignContent: "start"}}}}
                >
                    {header}
                    {inspector}
                </AppDrawer>
            ) : selection !== null ? (
                <AppPaper variant="outlined" sx={{p: 1.25, borderRadius: 2, display: "grid", gap: 1.25, borderColor: (theme: Theme) => theme.fgc.accent.selected}}>
                    {header}
                    {inspector}
                </AppPaper>
            ) : null}
        </AppBox>
    );
}
