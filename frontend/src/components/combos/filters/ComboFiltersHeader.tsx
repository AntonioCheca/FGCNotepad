import {AppBox} from "@/src/components/ui/AppBox";
import {AppStack} from "@/src/components/ui/AppStack";
import {AppTypography} from "@/src/components/ui/AppTypography";

export function ComboFiltersHeader() {
    return (
        <AppStack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{gap: 1, flexWrap: "wrap"}}>
            <AppBox sx={{display: "grid", gap: 0.15}}>
                <AppTypography variant="h6">Search Filters</AppTypography>
            </AppBox>
        </AppStack>
    );
}
