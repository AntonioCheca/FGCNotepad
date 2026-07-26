import type {ScenarioSearchFilterState, ScenarioTypeOption} from "./scenarioSearchTypes";

export const SCENARIO_TYPE_OPTIONS: ScenarioTypeOption[] = [
    {label: "Oki", value: "oki"},
    {label: "Aggregated Oki", value: "aggregated_oki"},
    {label: "Blockstring", value: "blockstring"},
];

export const DEFAULT_SCENARIO_SEARCH_FILTER_STATE: ScenarioSearchFilterState = {
    query: "",
    scenarioType: "",
    defenderCharacterId: "",
    attackerCharacterId: "",
    triggerMoveSelection: null,
    triggerMoveInput: "",
    showAdvancedFilters: false,
};
