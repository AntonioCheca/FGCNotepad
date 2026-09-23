import {AppBox} from "@/src/components/ui/AppBox";
import {AppTypography} from "@/src/components/ui/AppTypography";

export function StartingRequirements({labels}: {labels: string[]}) {
    if (labels.length === 0) {
        return null;
    }

    return (
        <AppBox
            sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "baseline",
                gap: 0.75,
                px: 1,
                py: 0.65,
                borderLeft: "3px solid",
                borderColor: "fgc.accent.selected",
                borderRadius: 1,
                backgroundColor: "fgc.surface.sunken",
            }}
        >
            <AppTypography variant="body2" sx={{fontWeight: 800}}>Starting requirements:</AppTypography>
            <AppTypography variant="body2" sx={{fontWeight: 700}}>{labels.join(" · ")}</AppTypography>
        </AppBox>
    );
}
