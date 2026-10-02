import {AppBox} from "@/src/components/ui/AppBox";
import {AppTypography} from "@/src/components/ui/AppTypography";
import type {BlockstringGapSummary} from "@/src/types/blockstring";

interface BlockstringGapAdvantageStripProps {
    gaps: BlockstringGapSummary[];
}

export function BlockstringGapAdvantageStrip({gaps}: BlockstringGapAdvantageStripProps) {
    const withAdvantage = gaps.filter((gap) => gap.frameAdvantage !== null);

    if (withAdvantage.length === 0) {
        return null;
    }

    return (
        <AppBox sx={{display: "flex", gap: 0.65, flexWrap: "wrap", alignItems: "center"}}>
            {withAdvantage.map((gap) => (
                <AppTypography key={`${gap.from}-${gap.to}-${gap.gapFrames}`} variant="caption" sx={{fontWeight: 900, lineHeight: 1, color: frameAdvantageColor(gap.frameAdvantage ?? 0)}}>
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
        return "fgc.feedback.errorText";
    }

    return "fgc.feedback.info";
}
