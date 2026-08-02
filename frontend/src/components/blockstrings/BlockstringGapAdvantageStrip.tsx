import {AppBox} from "@/src/components/ui/AppBox";
import {AppTypography} from "@/src/components/ui/AppTypography";
import type {BlockstringGap} from "@/src/types/blockstring";

interface BlockstringGapAdvantageStripProps {
    gaps: BlockstringGap[];
}

export function BlockstringGapAdvantageStrip({gaps}: BlockstringGapAdvantageStripProps) {
    const betweenMoveGaps = gaps.filter((gap) => gap.timing === "before_step");

    if (betweenMoveGaps.length === 0) {
        return null;
    }

    return (
        <AppBox sx={{display: "flex", gap: 0.65, flexWrap: "wrap", alignItems: "center"}}>
            {betweenMoveGaps.map((gap) => (
                <AppTypography key={gap.id ?? `${gap.stepOrdinal}-${gap.timing}-${gap.frames}`} variant="caption" sx={{fontWeight: 900, lineHeight: 1, color: frameAdvantageColor(gap.frameAdvantage ?? 0)}}>
                    {formatFrameAdvantage(gap.frameAdvantage ?? 0)}
                </AppTypography>
            ))}
        </AppBox>
    );
}

function formatFrameAdvantage(value: number): string {
    return value > 0 ? `+${value}` : String(value);
}

function frameAdvantageColor(value: number): string {
    if (value > 0) {
        return "fgc.accent.success";
    }
    if (value < 0) {
        return "fgc.feedback.error";
    }

    return "fgc.feedback.info";
}
