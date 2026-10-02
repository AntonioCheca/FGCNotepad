import React from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppCheckbox} from "@/src/components/ui/AppCheckbox";
import {AppFormControl} from "@/src/components/ui/AppFormControl";
import {AppFormControlLabel} from "@/src/components/ui/AppFormControlLabel";
import {AppInputLabel} from "@/src/components/ui/AppInputLabel";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppSelect} from "@/src/components/ui/AppSelect";
import {HelpTip} from "@/src/components/ui/tactical/HelpTip";
import type {PressureLayerFilter} from "./pressureGraphTypes";
import {PRESSURE_LAYERS} from "./pressureGraphTypes";

const EDGE_LEGEND = "Green: autopilot. Yellow: confirm on hit. Blue: hard read. Red dashed: fake, can be interrupted.";

interface PressureGraphControlsProps {
    layer: PressureLayerFilter;
    maxLayer: number;
    showRisk: boolean;
    hasOutcomes: boolean;
    onLayerChange: (layer: PressureLayerFilter) => void;
    onShowRiskChange: (showRisk: boolean) => void;
}

// Controls hide themselves when the graph has nothing for them to change.
export function PressureGraphControls({layer, maxLayer, showRisk, hasOutcomes, onLayerChange, onShowRiskChange}: PressureGraphControlsProps) {
    const layers = PRESSURE_LAYERS.filter((value) => value <= maxLayer);
    const labelId = React.useId();

    return (
        <AppBox sx={{display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.25, minWidth: 0}}>
            {layers.length > 1 ? (
                <AppFormControl size="small" sx={{minWidth: 130}}>
                    <AppInputLabel id={labelId}>Layer</AppInputLabel>
                    <AppSelect<string> labelId={labelId} label="Layer" value={String(layer)} onChange={(event) => onLayerChange(parseLayerFilter(event.target.value))}>
                        <AppMenuItem value="all">All</AppMenuItem>
                        {layers.map((value) => <AppMenuItem key={value} value={String(value)}>Layer {value}</AppMenuItem>)}
                    </AppSelect>
                </AppFormControl>
            ) : null}
            {hasOutcomes ? (
                <AppFormControlLabel sx={{mr: 0}} control={<AppCheckbox checked={showRisk} onChange={(event) => onShowRiskChange(event.target.checked)} />} label="Show risk/reward" />
            ) : null}
            <AppBox sx={{ml: "auto", display: "inline-flex", color: "text.secondary"}}>
                <HelpTip text={EDGE_LEGEND} />
            </AppBox>
        </AppBox>
    );
}

function parseLayerFilter(value: string): PressureLayerFilter {
    return value === "1" || value === "2" || value === "3" ? Number(value) as PressureLayerFilter : "all";
}
