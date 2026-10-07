import {
    AccessibilityNewOutlinedIcon,
    FastRewindOutlinedIcon,
    KeyboardDoubleArrowDownOutlinedIcon,
    KeyboardDoubleArrowUpOutlinedIcon,
    SwapHorizOutlinedIcon,
    VerifiedUserOutlinedIcon,
} from "@/src/components/ui/AppIcons";
import {AppTooltip} from "@/src/components/ui/AppTooltip";
import {PRESSURE_MARKER_LABELS, pressureMarkerColor} from "./pressureMarkers";
import type {PressureMarker} from "./pressureGraphTypes";

type IconComponent = typeof SwapHorizOutlinedIcon;

const MARKER_ICONS: Record<PressureMarker, IconComponent> = {
    overhead: KeyboardDoubleArrowUpOutlinedIcon,
    low: KeyboardDoubleArrowDownOutlinedIcon,
    sideSwitch: SwapHorizOutlinedIcon,
    safeJump: VerifiedUserOutlinedIcon,
    backroll: FastRewindOutlinedIcon,
    riseInPlace: AccessibilityNewOutlinedIcon,
};

export function PressureMarkerIcon({marker, size = 16}: {marker: PressureMarker; size?: number}) {
    const Icon = MARKER_ICONS[marker];
    const label = PRESSURE_MARKER_LABELS[marker];

    return (
        <AppTooltip title={label} enterTouchDelay={0}>
            <Icon role="img" aria-label={label} sx={{fontSize: size, color: (theme) => pressureMarkerColor(theme, marker), display: "block"}} />
        </AppTooltip>
    );
}
