import React from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {PressureGraphCanvas} from "./PressureGraphCanvas";
import {PressureGraphControls} from "./PressureGraphControls";
import {filterGraphByLayer, highestLayer, nodeHasOutcome} from "./pressureGraphModel";
import type {PressureSelection} from "./pressureGraphDraft";
import type {PressureGraphData, PressureLayerFilter} from "./pressureGraphTypes";

interface PressureGraphViewProps {
    graph: PressureGraphData;
    ariaLabel: string;
    selection?: PressureSelection;
    onSelect?: (selection: PressureSelection) => void;
    onConnect?: (from: string, to: string) => void;
}

export function PressureGraphView({graph, ariaLabel, selection, onSelect, onConnect}: PressureGraphViewProps) {
    const [layer, setLayer] = React.useState<PressureLayerFilter>("all");
    const [showRisk, setShowRisk] = React.useState(false);
    const visibleGraph = React.useMemo(() => filterGraphByLayer(graph, layer), [graph, layer]);

    return (
        <AppBox sx={{display: "grid", gap: 1, minWidth: 0}}>
            <PressureGraphControls
                layer={layer}
                maxLayer={highestLayer(graph)}
                showRisk={showRisk}
                hasOutcomes={graph.nodes.some(nodeHasOutcome)}
                onLayerChange={setLayer}
                onShowRiskChange={setShowRisk}
            />
            <PressureGraphCanvas graph={visibleGraph} showRisk={showRisk} ariaLabel={ariaLabel} selection={selection} onSelect={onSelect} onConnect={onConnect} />
        </AppBox>
    );
}
