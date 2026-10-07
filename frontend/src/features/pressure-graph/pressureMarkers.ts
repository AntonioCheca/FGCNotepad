import type {Theme} from "@/src/components/ui/AppThemeUtils";
import type {PressureMarker} from "./pressureGraphTypes";

export const PRESSURE_MARKERS: PressureMarker[] = ["overhead", "low", "sideSwitch", "safeJump", "backroll", "riseInPlace"];

export const PRESSURE_MARKER_LABELS: Record<PressureMarker, string> = {
    overhead: "Overhead",
    low: "Low",
    sideSwitch: "Side switch",
    safeJump: "Safe jump",
    backroll: "Backroll",
    riseInPlace: "Rise in place",
};

export function pressureMarkerColor(theme: Theme, marker: PressureMarker): string {
    return marker === "safeJump" ? theme.fgc.accent.success : theme.palette.text.secondary;
}
