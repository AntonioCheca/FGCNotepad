import {AppBox} from "@/src/components/ui/AppBox";
import {AppTooltip} from "@/src/components/ui/AppTooltip";
import {AppTypography} from "@/src/components/ui/AppTypography";
import type {Theme} from "@/src/components/ui/AppThemeUtils";
import {RISK_SEGMENT_GAP, RISK_SEGMENT_WIDTH} from "./pressureGraphGeometry";
import {damageSegments} from "./pressureGraphModel";

interface PressureRiskBarProps {
    damage: number;
    tone: "dealt" | "received";
}

// SF6-style slanted health bar: one segment per 1000 damage, green for damage dealt and red for damage taken.
export function PressureRiskBar({damage, tone}: PressureRiskBarProps) {
    const color = (theme: Theme) => tone === "dealt" ? theme.fgc.pressureGraph.damageDealt : theme.fgc.pressureGraph.damageReceived;
    const label = `${tone === "dealt" ? "Deals" : "Takes"} ${damage} damage`;

    return (
        <AppTooltip title={label} enterTouchDelay={0}>
            <AppBox role="img" aria-label={label} sx={{display: "flex", alignItems: "center", gap: 0.75, minWidth: 0}}>
                <AppBox sx={{display: "flex", gap: `${RISK_SEGMENT_GAP}px`, transform: "skewX(-20deg)", pl: 0.5}}>
                    {damageSegments(damage).map(({start, fill}) => (
                        <AppBox key={start} sx={{width: RISK_SEGMENT_WIDTH, height: 8, backgroundColor: (theme: Theme) => theme.fgc.pressureGraph.damageTrack, outline: "1px solid", outlineColor: color}}>
                            <AppBox sx={{width: `${fill * 100}%`, height: "100%", backgroundColor: color}} />
                        </AppBox>
                    ))}
                </AppBox>
                <AppTypography component="span" sx={{fontSize: "0.7rem", fontWeight: 800, lineHeight: 1, color, fontVariantNumeric: "tabular-nums"}}>
                    {tone === "dealt" ? "+" : "−"}{damage}
                </AppTypography>
            </AppBox>
        </AppTooltip>
    );
}
