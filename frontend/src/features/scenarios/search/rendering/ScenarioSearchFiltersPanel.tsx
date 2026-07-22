import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppCollapse} from "@/src/components/ui/AppCollapse";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {ActionBar} from "@/src/components/ui/tactical/ActionBar";
import type {ScenarioType} from "@/hooks/useScenarios";
import {ScenarioContextFiltersSection} from "./ScenarioContextFiltersSection";
import {ScenarioPrimaryFiltersSection} from "./ScenarioPrimaryFiltersSection";
import {ScenarioSearchFiltersHeader} from "./ScenarioSearchFiltersHeader";
import type {ScenarioCharacterOption, ScenarioSearchFilterState, ScenarioTriggerMoveOption} from "../scenarioSearchTypes";

interface ScenarioSearchFiltersPanelProps {
    filterState: ScenarioSearchFilterState;
    activeFilterCount: number;
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
    activeFilterCount,
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
        <AppPaper variant="outlined" sx={{p: {xs: 1.25, md: 1.5}, borderRadius: 2.5, display: "grid", gap: 1}}>
            <ScenarioSearchFiltersHeader activeFilterCount={activeFilterCount} />

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

            <ActionBar>
                <AppButton type="button" variant="text" color="secondary" onClick={onToggleAdvancedFilters} sx={{color: "text.secondary"}}>
                    {filterState.showAdvancedFilters ? "Hide Advanced Filters" : "Show Advanced Filters"}
                </AppButton>
                <AppButton type="button" variant="outlined" color="secondary" onClick={onResetFilters}>Clear Filters</AppButton>
            </ActionBar>

            <AppCollapse in={filterState.showAdvancedFilters} timeout={200} unmountOnExit>
                <AppBox sx={{display: "grid", gap: 1, pt: 0.75}}>
                    <ScenarioContextFiltersSection
                        scenarioType={filterState.scenarioType}
                        query={filterState.query}
                        compactFieldSx={compactFieldSx}
                        onScenarioTypeChange={onScenarioTypeChange}
                        onQueryChange={onQueryChange}
                    />
                </AppBox>
            </AppCollapse>
        </AppPaper>
    );
}
