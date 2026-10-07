import React from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {PressureGraphCanvas} from "./PressureGraphCanvas";
import {PressureGraphLegend} from "./PressureGraphLegend";
import type {PressureSelection} from "./pressureGraphDraft";
import {hasFrameDetails} from "./pressureGraphTypes";
import type {PressureGraphData} from "./pressureGraphTypes";

interface PressureGraphViewProps {
    graph: PressureGraphData;
    ariaLabel: string;
    // Graphs that document frame advantage and gaps (blockstrings).
    frameDetails?: boolean;
    selection?: PressureSelection;
    onSelect?: (selection: PressureSelection) => void;
    onConnect?: (from: string, to: string) => void;
    onAddFrom?: (nodeId: string) => void;
}

// Editors always show frame details so authors see what they type; readers opt in when the graph has any.
export function PressureGraphView({graph, ariaLabel, frameDetails = false, selection, onSelect, onConnect, onAddFrom}: PressureGraphViewProps) {
    const editable = Boolean(onSelect);
    const [showFrameDetails, setShowFrameDetails] = React.useState(false);
    const frameDetailsShown = frameDetails && (editable || showFrameDetails);
    const offerToggle = frameDetails && !editable && hasFrameDetails(graph);

    return (
        <AppBox sx={{display: "grid", gap: 1, minWidth: 0}}>
            <PressureGraphLegend graph={graph} showFrameDetails={frameDetailsShown} onShowFrameDetailsChange={offerToggle ? setShowFrameDetails : undefined} />
            <PressureGraphCanvas graph={graph} showFrameDetails={frameDetailsShown} ariaLabel={ariaLabel} selection={selection} onSelect={onSelect} onConnect={onConnect} onAddFrom={onAddFrom} />
        </AppBox>
    );
}
