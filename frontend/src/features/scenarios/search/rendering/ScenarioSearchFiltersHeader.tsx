import {AppBox} from "@/src/components/ui/AppBox";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppStack} from "@/src/components/ui/AppStack";
import {AppTypography} from "@/src/components/ui/AppTypography";

interface ScenarioSearchFiltersHeaderProps {
    activeFilterCount: number;
}

export function ScenarioSearchFiltersHeader({activeFilterCount}: ScenarioSearchFiltersHeaderProps) {
    return (
        <AppStack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{gap: 1, flexWrap: "wrap"}}>
            <AppBox sx={{display: "grid", gap: 0.15}}>
                <AppTypography variant="h6">Search Filters</AppTypography>
                <AppTypography variant="body2" color="text.secondary">Attacker and trigger move are prioritized for practical matchup lookup speed.</AppTypography>
            </AppBox>
            <AppStack direction="row" spacing={0.75} sx={{flexWrap: "wrap", pt: 0.2}}>
                <AppChip size="small" color="info" label="Auto search on" />
                <AppChip size="small" label={activeFilterCount === 0 ? "No active filters" : `${activeFilterCount} active`} />
            </AppStack>
        </AppStack>
    );
}
