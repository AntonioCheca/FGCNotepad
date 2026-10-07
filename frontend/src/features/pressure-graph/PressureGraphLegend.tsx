import React from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppCheckbox} from "@/src/components/ui/AppCheckbox";
import {AppFormControlLabel} from "@/src/components/ui/AppFormControlLabel";
import {useAppTheme} from "@/src/components/ui/AppThemeHooks";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {pressureEdgeColor} from "./pressureGraphGeometry";
import {PressureMarkerIcon} from "./PressureMarkerIcon";
import {PRESSURE_MARKER_LABELS, PRESSURE_MARKERS} from "./pressureMarkers";
import {PRESSURE_EDGE_KINDS} from "./pressureGraphTypes";
import type {PressureEdgeKind, PressureGraphData} from "./pressureGraphTypes";

const EDGE_KIND_MEANINGS: Record<PressureEdgeKind, string> = {normal: "Autopilot", confirm: "Confirm on hit", read: "Hard read", fake: "Fake, interruptible"};

interface PressureGraphLegendProps {
    graph: PressureGraphData;
    showFrameDetails: boolean;
    // Offered only on read-only graphs that carry frame details; editors always show them.
    onShowFrameDetailsChange?: (show: boolean) => void;
}

// Explains only what the graph on screen actually uses.
export function PressureGraphLegend({graph, showFrameDetails, onShowFrameDetailsChange}: PressureGraphLegendProps) {
    const kinds = PRESSURE_EDGE_KINDS.filter((kind) => graph.edges.some((edge) => edge.kind === kind));
    const used = new Set([...graph.nodes.flatMap((node) => node.markers ?? []), ...graph.edges.flatMap((edge) => edge.markers ?? [])]);
    const markers = PRESSURE_MARKERS.filter((marker) => used.has(marker));

    if (kinds.length === 0 && markers.length === 0 && !showFrameDetails && !onShowFrameDetailsChange) {
        return null;
    }

    return (
        <AppBox sx={{display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 2, rowGap: 0.5, minWidth: 0}}>
            {kinds.map((kind) => (
                <LegendItem key={kind} label={EDGE_KIND_MEANINGS[kind]}><LegendArrow kind={kind} /></LegendItem>
            ))}
            {markers.map((marker) => (
                <LegendItem key={marker} label={PRESSURE_MARKER_LABELS[marker]}><PressureMarkerIcon marker={marker} size={18} /></LegendItem>
            ))}
            {showFrameDetails ? (
                <>
                    <LegendItem label="Frame advantage"><LegendSample text="+4" /></LegendItem>
                    <LegendItem label="Gap frames, or True for a true blockstring"><LegendSample text="2" /></LegendItem>
                </>
            ) : null}
            {onShowFrameDetailsChange ? (
                <AppFormControlLabel sx={{ml: "auto", mr: 0}} control={<AppCheckbox size="small" checked={showFrameDetails} onChange={(event) => onShowFrameDetailsChange(event.target.checked)} />} label="Show frame details" />
            ) : null}
        </AppBox>
    );
}

function LegendItem({label, children}: {label: string; children: React.ReactNode}) {
    return (
        <AppBox sx={{display: "flex", alignItems: "center", gap: 0.75, minWidth: 0}}>
            {children}
            <AppTypography variant="body2" sx={{fontWeight: 650, lineHeight: 1.2}}>{label}</AppTypography>
        </AppBox>
    );
}

function LegendArrow({kind}: {kind: PressureEdgeKind}) {
    const color = pressureEdgeColor(useAppTheme(), kind);

    return (
        <svg width="34" height="12" viewBox="0 0 34 12" aria-hidden focusable="false">
            <line x1="1" y1="6" x2="25" y2="6" stroke={color} strokeWidth="2.5" strokeDasharray={kind === "fake" ? "5 3" : undefined} />
            <path d="M24 1 L33 6 L24 11 Z" fill={color} />
        </svg>
    );
}

function LegendSample({text}: {text: string}) {
    return <AppTypography component="span" sx={{fontSize: "0.75rem", fontWeight: 800, fontVariantNumeric: "tabular-nums", minWidth: 22, textAlign: "center"}}>{text}</AppTypography>;
}
