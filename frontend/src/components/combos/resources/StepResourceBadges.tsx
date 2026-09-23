import {AppBox} from "@/src/components/ui/AppBox";
import {AppTypography} from "@/src/components/ui/AppTypography";
import type {StepResourceChange} from "@/src/components/combos/resources/resourceTimeline";

export function StepResourceBadges({changes}: {changes: StepResourceChange[]}) {
    if (changes.length === 0) {
        return null;
    }

    return (
        <AppBox sx={{display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: 0.3, minWidth: 0}}>
            {changes.map((change) => (
                <AppTypography
                    key={change.key}
                    variant="caption"
                    sx={{
                        px: 0.5,
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: change.delta > 0 ? "fgc.accent.success" : "fgc.accent.warning",
                        backgroundColor: "fgc.surface.sunken",
                        fontWeight: 800,
                        fontSize: "0.68rem",
                        lineHeight: 1.5,
                        whiteSpace: "nowrap",
                    }}
                >
                    {change.label}
                </AppTypography>
            ))}
        </AppBox>
    );
}
