import React from "react";

import {ScenarioType} from "@/hooks/useScenarios";
import {DEFAULT_SCENARIO_SEARCH_FILTER_STATE} from "./scenarioSearchConstants";
import type {ScenarioSearchFilterState, ScenarioTriggerMoveOption} from "./scenarioSearchTypes";

type ScenarioSearchFilterAction =
    | {type: "setQuery"; value: string}
    | {type: "setScenarioType"; value: ScenarioType | ""}
    | {type: "setDefenderCharacterId"; value: string}
    | {type: "selectAttacker"; value: string}
    | {type: "setTriggerMoveSelection"; value: ScenarioTriggerMoveOption | null}
    | {type: "setTriggerMoveInput"; value: string}
    | {type: "toggleAdvancedFilters"}
    | {type: "resetFilters"};

function scenarioSearchFilterReducer(state: ScenarioSearchFilterState, action: ScenarioSearchFilterAction): ScenarioSearchFilterState {
    switch (action.type) {
        case "setQuery":
            return {...state, query: action.value};
        case "setScenarioType":
            return {...state, scenarioType: action.value};
        case "setDefenderCharacterId":
            return {...state, defenderCharacterId: action.value};
        case "selectAttacker":
            return {...state, attackerCharacterId: action.value, triggerMoveSelection: null, triggerMoveInput: ""};
        case "setTriggerMoveSelection":
            return {...state, triggerMoveSelection: action.value};
        case "setTriggerMoveInput":
            return {...state, triggerMoveInput: action.value};
        case "toggleAdvancedFilters":
            return {...state, showAdvancedFilters: !state.showAdvancedFilters};
        case "resetFilters":
            return DEFAULT_SCENARIO_SEARCH_FILTER_STATE;
        default:
            return state;
    }
}

export function useScenarioSearchFilters() {
    const [state, dispatch] = React.useReducer(scenarioSearchFilterReducer, DEFAULT_SCENARIO_SEARCH_FILTER_STATE);

    const actions = React.useMemo(() => ({
        setQuery: (value: string) => dispatch({type: "setQuery", value}),
        setScenarioType: (value: ScenarioType | "") => dispatch({type: "setScenarioType", value}),
        setDefenderCharacterId: (value: string) => dispatch({type: "setDefenderCharacterId", value}),
        selectAttacker: (value: string) => dispatch({type: "selectAttacker", value}),
        setTriggerMoveSelection: (value: ScenarioTriggerMoveOption | null) => dispatch({type: "setTriggerMoveSelection", value}),
        setTriggerMoveInput: (value: string) => dispatch({type: "setTriggerMoveInput", value}),
        toggleAdvancedFilters: () => dispatch({type: "toggleAdvancedFilters"}),
        resetFilters: () => dispatch({type: "resetFilters"}),
    }), []);

    return {state, ...actions};
}
