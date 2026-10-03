import type React from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {
    AccessibilityNewOutlinedIcon,
    AutoAwesomeOutlinedIcon,
    BoltIcon,
    BorderStyleOutlinedIcon,
    CategoryOutlinedIcon,
    GpsFixedOutlinedIcon,
    KeyboardDoubleArrowUpOutlinedIcon,
    KeyboardTabOutlinedIcon,
    ShieldOutlinedIcon,
    SignalCellularAltOutlinedIcon,
    SwapHorizOutlinedIcon,
    TokenOutlinedIcon,
} from "@/src/components/ui/AppIcons";
import type {Theme} from "@/src/components/ui/AppThemeUtils";
import {AppTooltip} from "@/src/components/ui/AppTooltip";
import type {CharacterObjectKind} from "@/src/types/combo";
import type {RequirementBadge, RequirementBadgeKind} from "./comboRequirementBadges";

type IconComponent = React.ComponentType<{sx?: object}>;

// The border-style glyph's solid edges sit top-left; turned a quarter it reads as a stage corner (floor + wall).
function CornerIcon({sx}: {sx?: object}) {
    return <BorderStyleOutlinedIcon sx={{transform: "rotate(-90deg)", ...sx}} />;
}

const BADGE_ICONS: Record<Exclude<RequirementBadgeKind, "object">, IconComponent> = {
    counterHit: BoltIcon,
    punishCounter: GpsFixedOutlinedIcon,
    perfectParry: ShieldOutlinedIcon,
    wallsplat: KeyboardTabOutlinedIcon,
    corner: CornerIcon,
    airborne: KeyboardDoubleArrowUpOutlinedIcon,
    notCrouching: AccessibilityNewOutlinedIcon,
    sideSwitch: SwapHorizOutlinedIcon,
};

// Character objects are dynamic, so their icon follows the catalog kind: stocks are tokens, level scalers are bars,
// installs/states are a power-up sparkle.
const OBJECT_ICONS: Record<CharacterObjectKind, IconComponent> = {
    stock: TokenOutlinedIcon,
    scaler: SignalCellularAltOutlinedIcon,
    state: AutoAwesomeOutlinedIcon,
};

function badgeColor(theme: Theme, kind: RequirementBadgeKind): string {
    switch (kind) {
        case "counterHit":
        case "punishCounter":
        case "perfectParry":
        case "wallsplat":
        case "corner":
            return theme.fgc.comboRequirement[kind];
        case "object":
            return theme.fgc.icon.primary;
        default:
            return theme.fgc.icon.muted;
    }
}

// Bare coloured icon for a requirement, used beside the editor toggles so they match the view page badges.
export function RequirementKindIcon({kind}: {kind: Exclude<RequirementBadgeKind, "object">}) {
    const Icon = BADGE_ICONS[kind];

    return <Icon sx={{fontSize: 18, color: (theme: Theme) => badgeColor(theme, kind)}} />;
}

export function ComboRequirementIcons({badges}: {badges: RequirementBadge[]}) {
    if (badges.length === 0) {
        return null;
    }

    return (
        <AppBox component="ul" aria-label="Requirements" sx={{display: "flex", flexWrap: "wrap", gap: 0.6, m: 0, p: 0, listStyle: "none"}}>
            {badges.map((badge) => <RequirementIcon key={badge.id} badge={badge} />)}
        </AppBox>
    );
}

function RequirementIcon({badge}: {badge: RequirementBadge}) {
    const Icon = badge.kind === "object" ? (badge.objectKind ? OBJECT_ICONS[badge.objectKind] : CategoryOutlinedIcon) : BADGE_ICONS[badge.kind];
    const color = (theme: Theme) => badgeColor(theme, badge.kind);

    return (
        <AppBox component="li">
            <AppTooltip title={badge.label} enterTouchDelay={0} leaveTouchDelay={4000}>
                <AppBox
                    role="img"
                    aria-label={badge.label}
                    tabIndex={0}
                    sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 0.4,
                        height: 30,
                        minWidth: 30,
                        px: badge.tag ? 0.85 : 0,
                        borderRadius: 999,
                        border: "1px solid",
                        borderColor: color,
                        color,
                        backgroundColor: (theme: Theme) => theme.fgc.surface.sunken,
                        cursor: "help",
                        "&:focus-visible": {outline: "2px solid", outlineColor: (theme: Theme) => theme.fgc.focus.outline, outlineOffset: 2},
                    }}
                >
                    <Icon sx={{fontSize: 18}} />
                    {badge.tag ? (
                        <AppBox component="span" aria-hidden sx={{fontSize: "0.78rem", fontWeight: 850, letterSpacing: 0.3, lineHeight: 1, fontVariantNumeric: "tabular-nums"}}>
                            {badge.tag}
                        </AppBox>
                    ) : null}
                </AppBox>
            </AppTooltip>
        </AppBox>
    );
}
