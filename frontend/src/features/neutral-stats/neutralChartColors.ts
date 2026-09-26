import type {Theme} from "@/src/components/ui/AppThemeUtils";
import type {NeutralDistributionSeries} from "@/src/types/neutralStats";

/** Colors follow the series' move family; shades step through the family in stack order. */
export function distributionColors(series: NeutralDistributionSeries[], theme: Theme): Record<string, string> {
    const families = theme.fgc.chart.families;
    const used: Record<string, number> = {};
    const colors: Record<string, string> = {};

    for (const entry of series) {
        if (entry.family === "other") {
            colors[entry.key] = theme.fgc.chart.other;
            continue;
        }
        const tones = entry.family === "special" && entry.isOd
            ? families.specialOd
            : entry.family === "drive_rush" ? families.driveRush : families[entry.family];
        const toneKey = entry.family === "special" && entry.isOd ? "specialOd" : entry.family;
        const index = used[toneKey] ?? 0;
        used[toneKey] = index + 1;
        colors[entry.key] = tones[index % tones.length];
    }

    return colors;
}
