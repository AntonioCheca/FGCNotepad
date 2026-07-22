import React from "react";

import {DEFAULT_COMBO_FILTER_STATE} from "./comboFilterConstants";
import type {
    ComboFilterState,
    ComboMoveSearchOption,
    ComboMoveType,
    ComboRequirementFilterKey,
    ComboSortMode,
} from "./comboFilterTypes";

type ComboFilterAction =
    | {type: "setQuery"; value: string}
    | {type: "selectCharacter"; characterId: string}
    | {type: "setFirstMove"; value: ComboMoveSearchOption | null}
    | {type: "setFirstMoveQuery"; value: string}
    | {type: "setDifficultyRange"; minDifficulty?: string; maxDifficulty?: string}
    | {type: "setDamageRange"; minDamage?: string; maxDamage?: string}
    | {type: "setRequirementToggle"; key: ComboRequirementFilterKey; checked: boolean}
    | {type: "setMoveTypes"; value: ComboMoveType[]}
    | {type: "setSort"; value: ComboSortMode}
    | {type: "toggleAdvancedFilters"}
    | {type: "clearFilters"};

function comboFilterReducer(state: ComboFilterState, action: ComboFilterAction): ComboFilterState {
    switch (action.type) {
        case "setQuery":
            return {...state, query: action.value};
        case "selectCharacter":
            return {...state, characterId: action.characterId, firstMove: null, firstMoveQuery: ""};
        case "setFirstMove":
            return {...state, firstMove: action.value};
        case "setFirstMoveQuery":
            return {...state, firstMoveQuery: action.value};
        case "setDifficultyRange":
            return {
                ...state,
                minDifficulty: action.minDifficulty ?? state.minDifficulty,
                maxDifficulty: action.maxDifficulty ?? state.maxDifficulty,
            };
        case "setDamageRange":
            return {
                ...state,
                minDamage: action.minDamage ?? state.minDamage,
                maxDamage: action.maxDamage ?? state.maxDamage,
            };
        case "setRequirementToggle":
            return {...state, requirements: {...state.requirements, [action.key]: action.checked}};
        case "setMoveTypes":
            return {...state, moveTypes: action.value};
        case "setSort":
            return {...state, sort: action.value};
        case "toggleAdvancedFilters":
            return {...state, showAdvancedFilters: !state.showAdvancedFilters};
        case "clearFilters":
            return DEFAULT_COMBO_FILTER_STATE;
        default:
            return state;
    }
}

export function useComboFilterState() {
    const [state, dispatch] = React.useReducer(comboFilterReducer, DEFAULT_COMBO_FILTER_STATE);

    const actions = React.useMemo(() => ({
        setQuery: (value: string) => dispatch({type: "setQuery", value}),
        selectCharacter: (characterId: string) => dispatch({type: "selectCharacter", characterId}),
        setFirstMove: (value: ComboMoveSearchOption | null) => dispatch({type: "setFirstMove", value}),
        setFirstMoveQuery: (value: string) => dispatch({type: "setFirstMoveQuery", value}),
        setMinDifficulty: (value: string) => dispatch({type: "setDifficultyRange", minDifficulty: value}),
        setMaxDifficulty: (value: string) => dispatch({type: "setDifficultyRange", maxDifficulty: value}),
        setMinDamage: (value: string) => dispatch({type: "setDamageRange", minDamage: value}),
        setMaxDamage: (value: string) => dispatch({type: "setDamageRange", maxDamage: value}),
        setRequirementToggle: (key: ComboRequirementFilterKey, checked: boolean) => dispatch({type: "setRequirementToggle", key, checked}),
        setMoveTypes: (value: ComboMoveType[]) => dispatch({type: "setMoveTypes", value}),
        setSort: (value: ComboSortMode) => dispatch({type: "setSort", value}),
        toggleAdvancedFilters: () => dispatch({type: "toggleAdvancedFilters"}),
        clearFilters: () => dispatch({type: "clearFilters"}),
    }), []);

    return {state, ...actions};
}
