import {AppBox} from "@/src/components/ui/AppBox";
import type {Theme} from "@/src/components/ui/AppThemeUtils";
import {driveGaugeSegments, superGaugeParts} from "./resourceGauge";

const DRIVE_SEGMENT_WIDTH = 26;
const GAUGE_HEIGHT = 10;
const GAUGE_SLANT = "skewX(-20deg)";

function formatBars(value: number): string {
    return String(Math.round(value * 1000) / 1000);
}

function GaugeValue({value}: {value: number}) {
    return (
        <AppBox component="span" aria-hidden sx={{typography: "body2", fontWeight: 700, fontVariantNumeric: "tabular-nums"}}>
            {formatBars(value)}
        </AppBox>
    );
}

export function DriveGainGauge({value}: {value: number}) {
    const segments = driveGaugeSegments(value);

    return (
        <AppBox role="img" aria-label={`Drive gain ${formatBars(value)} bars`} sx={{display: "inline-flex", alignItems: "center", gap: 1}}>
            <AppBox sx={{display: "inline-flex", gap: "4px", px: "3px"}}>
                {segments.map(({bar, fill}) => (
                    <AppBox
                        key={bar}
                        sx={{
                            width: DRIVE_SEGMENT_WIDTH * fill,
                            height: GAUGE_HEIGHT,
                            transform: GAUGE_SLANT,
                            backgroundColor: (theme: Theme) => theme.fgc.resourceGauge.driveFill,
                        }}
                    />
                ))}
            </AppBox>
            <GaugeValue value={value} />
        </AppBox>
    );
}

export function SuperGainGauge({value}: {value: number}) {
    const {completedBars, fraction} = superGaugeParts(value);

    return (
        <AppBox role="img" aria-label={`Super gain ${formatBars(value)} bars`} sx={{display: "inline-flex", alignItems: "center", gap: 1}}>
            <AppBox
                component="span"
                aria-hidden
                sx={{
                    fontSize: "1.35rem",
                    fontWeight: 900,
                    lineHeight: 1,
                    fontStyle: "italic",
                    color: (theme: Theme) => theme.fgc.resourceGauge.superNumeral,
                    textShadow: (theme: Theme) => {
                        const edge = theme.fgc.resourceGauge.superEdge;
                        return `1px 0 ${edge}, -1px 0 ${edge}, 0 1px ${edge}, 0 -1px ${edge}`;
                    },
                }}
            >
                {completedBars}
            </AppBox>
            <AppBox
                sx={{
                    position: "relative",
                    width: DRIVE_SEGMENT_WIDTH * 5,
                    height: GAUGE_HEIGHT,
                    transform: GAUGE_SLANT,
                    border: "1px solid",
                    borderColor: (theme: Theme) => theme.fgc.resourceGauge.superEdge,
                    backgroundColor: (theme: Theme) => theme.fgc.resourceGauge.superTrack,
                    overflow: "hidden",
                }}
            >
                <AppBox sx={{width: `${fraction * 100}%`, height: "100%", backgroundColor: (theme: Theme) => theme.fgc.resourceGauge.superFill}} />
            </AppBox>
            <GaugeValue value={value} />
        </AppBox>
    );
}
