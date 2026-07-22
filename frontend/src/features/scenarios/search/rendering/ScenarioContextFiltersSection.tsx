import {AppAutocomplete} from "@/src/components/ui/AppAutocomplete";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import type {ScenarioType} from "@/hooks/useScenarios";
import {SCENARIO_TYPE_OPTIONS} from "../scenarioSearchConstants";
import type {ScenarioTypeOption} from "../scenarioSearchTypes";

interface ScenarioContextFiltersSectionProps {
    scenarioType: ScenarioType | "";
    query: string;
    compactFieldSx: object;
    onScenarioTypeChange: (value: ScenarioType | "") => void;
    onQueryChange: (value: string) => void;
}

export function ScenarioContextFiltersSection({scenarioType, query, compactFieldSx, onScenarioTypeChange, onQueryChange}: ScenarioContextFiltersSectionProps) {
    return (
        <SectionCard title="Scenario Context" description="Lower-priority context filters for refining large result sets." tone="sunken" variant="review">
            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "minmax(220px, 320px) minmax(280px, 1fr)"}, gap: 1}}>
                <AppAutocomplete<ScenarioTypeOption, false, false, false>
                    options={SCENARIO_TYPE_OPTIONS}
                    value={SCENARIO_TYPE_OPTIONS.find((option) => option.value === scenarioType) ?? null}
                    onChange={(_, value) => onScenarioTypeChange(value?.value ?? "")}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, value) => option.value === value.value}
                    renderInput={(params) => <AppTextField {...params} label="Scenario type" size="small" InputLabelProps={{shrink: true}} sx={compactFieldSx} />}
                />
                <AppTextField label="Search by scenario name" value={query} onChange={(event) => onQueryChange(event.target.value)} size="small" InputLabelProps={{shrink: true}} sx={compactFieldSx} />
            </AppBox>
        </SectionCard>
    );
}
