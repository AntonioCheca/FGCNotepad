import {AppBox} from "@/src/components/ui/AppBox";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {AppTypography} from "@/src/components/ui/AppTypography";
import type {ScenarioListItem} from "@/hooks/useScenarios";
import {ScenarioResultCard} from "./ScenarioResultCard";

interface ScenarioResultsPanelProps {
    items: ScenarioListItem[];
    loading: boolean;
    hasLoadedAtLeastOnce: boolean;
}

export function ScenarioResultsPanel({items, loading, hasLoadedAtLeastOnce}: ScenarioResultsPanelProps) {
    return (
        <>
            {loading && hasLoadedAtLeastOnce ? (
                <AppBox sx={{display: "flex", justifyContent: "flex-end", pb: 0.5}}>
                    <AppChip icon={<AppCircularProgress size={14} />} label="Updating results..." size="small" color="info" variant="outlined" />
                </AppBox>
            ) : null}

            {loading && !hasLoadedAtLeastOnce ? (
                <AppBox sx={{display: "grid", placeItems: "center", gap: 1, py: 4}}>
                    <AppCircularProgress />
                    <AppTypography variant="body2" color="text.secondary">Loading scenarios...</AppTypography>
                </AppBox>
            ) : (
                <AppBox sx={{display: "grid", gap: 1}}>
                    {items.length === 0 ? (
                        <AppPaper variant="outlined" sx={{p: {xs: 2, md: 2.25}, borderRadius: 2.5, display: "grid", gap: 0.45, backgroundColor: "fgc.surface.sunken"}}>
                            <AppTypography variant="h6">No scenarios found</AppTypography>
                            <AppTypography variant="body2" color="text.secondary">Try broadening the matchup scope or clearing one advanced filter.</AppTypography>
                        </AppPaper>
                    ) : null}

                    {items.map((item) => <ScenarioResultCard key={item.id} item={item} />)}
                </AppBox>
            )}
        </>
    );
}
