import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppCollapse} from "@/src/components/ui/AppCollapse";
import type {ScenarioType} from "@/hooks/useScenarios";
import {ScenarioContextFiltersSection} from "./ScenarioContextFiltersSection";
import {ScenarioPrimaryFiltersSection} from "./ScenarioPrimaryFiltersSection";
import type {ScenarioCharacterOption, ScenarioSearchFilterState, ScenarioTriggerMoveOption} from "../scenarioSearchTypes";

interface ScenarioSearchFiltersPanelProps {
    filterState: ScenarioSearchFilterState;
    characterOptions: ScenarioCharacterOption[];
    selectedAttacker: ScenarioCharacterOption | null;
    selectedDefender: ScenarioCharacterOption | null;
    triggerMoveOptions: ScenarioTriggerMoveOption[];
    searchingMoves: boolean;
    compactFieldSx: object;
    onAttackerChange: (value: ScenarioCharacterOption | null) => void;
    onTriggerMoveChange: (value: ScenarioTriggerMoveOption | null) => void;
    onTriggerMoveInputChange: (value: string) => void;
    onDefenderChange: (value: ScenarioCharacterOption | null) => void;
    onScenarioTypeChange: (value: ScenarioType | "") => void;
    onQueryChange: (value: string) => void;
    onToggleAdvancedFilters: () => void;
    onResetFilters: () => void;
}

export function ScenarioSearchFiltersPanel({
    filterState,
    characterOptions,
    selectedAttacker,
    selectedDefender,
    triggerMoveOptions,
    searchingMoves,
    compactFieldSx,
    onAttackerChange,
    onTriggerMoveChange,
    onTriggerMoveInputChange,
    onDefenderChange,
    onScenarioTypeChange,
    onQueryChange,
    onToggleAdvancedFilters,
    onResetFilters,
}: ScenarioSearchFiltersPanelProps) {
    return (
        <AppBox sx={{display: "grid", gap: 1.25}}>
            <ScenarioPrimaryFiltersSection
                characterOptions={characterOptions}
                selectedAttacker={selectedAttacker}
                selectedDefender={selectedDefender}
                triggerMoveSelection={filterState.triggerMoveSelection}
                triggerMoveInput={filterState.triggerMoveInput}
                triggerMoveOptions={triggerMoveOptions}
                searchingMoves={searchingMoves}
                compactFieldSx={compactFieldSx}
                onAttackerChange={onAttackerChange}
                onTriggerMoveChange={onTriggerMoveChange}
                onTriggerMoveInputChange={onTriggerMoveInputChange}
                onDefenderChange={onDefenderChange}
            />

            <AppCollapse in={filterState.showAdvancedFilters} timeout={200} unmountOnExit>
                <ScenarioContextFiltersSection
                    scenarioType={filterState.scenarioType}
                    query={filterState.query}
                    compactFieldSx={compactFieldSx}
                    onScenarioTypeChange={onScenarioTypeChange}
                    onQueryChange={onQueryChange}
                />
            </AppCollapse>

            <AppBox sx={{display: "flex", gap: 1, flexWrap: "wrap", "& .MuiButton-root": {flex: {xs: "1 1 0", sm: "0 0 auto"}}}}>
                <AppButton type="button" variant="text" color="secondary" onClick={onToggleAdvancedFilters} aria-expanded={filterState.showAdvancedFilters}>
                    {filterState.showAdvancedFilters ? "Hide Advanced Filters" : "Show Advanced Filters"}
                </AppButton>
                <AppButton type="button" variant="text" color="secondary" onClick={onResetFilters}>Clear Filters</AppButton>
            </AppBox>
        </AppBox>
    );
}
