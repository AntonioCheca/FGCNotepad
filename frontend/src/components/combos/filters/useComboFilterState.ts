import React from "react";

import {DEFAULT_COMBO_FILTER_STATE} from "./comboFilterConstants";
import type {
    ComboFilterState,
    ComboDriveWindowMetric,
    ComboMoveSearchOption,
    ComboRequirementFilterKey,
    ComboSortDirection,
    ComboSortField,
} from "./comboFilterTypes";

type ComboFilterAction =
    | {type: "setQuery"; value: string}
    | {type: "selectCharacter"; characterId: string}
    | {type: "setFirstMove"; value: ComboMoveSearchOption | null}
    | {type: "setFirstMoveQuery"; value: string}
    | {type: "setEnderMove"; value: ComboMoveSearchOption | null}
    | {type: "setEnderMoveQuery"; value: string}
    | {type: "setDifficultyRange"; minDifficulty?: string; maxDifficulty?: string}
    | {type: "setDamageRange"; minDamage?: string; maxDamage?: string}
    | {type: "addDriveWindow"; metric: ComboDriveWindowMetric}
    | {type: "removeDriveWindow"; metric: ComboDriveWindowMetric}
    | {type: "setDriveWindowRange"; metric: ComboDriveWindowMetric; min?: string; max?: string}
    | {type: "setRequirementToggle"; key: ComboRequirementFilterKey; checked: boolean}
    | {type: "setRequirementObject"; objectName: string; status: string}
    | {type: "setSort"; field: ComboSortField; direction?: ComboSortDirection}
    | {type: "toggleAdvancedFilters"}
    | {type: "clearFilters"};

function comboFilterReducer(state: ComboFilterState, action: ComboFilterAction): ComboFilterState {
    switch (action.type) {
        case "setQuery":
            return {...state, query: action.value};
        case "selectCharacter":
            return {...state, characterId: action.characterId, firstMove: null, firstMoveQuery: "", enderMove: null, enderMoveQuery: ""};
        case "setFirstMove":
            return {...state, firstMove: action.value};
        case "setFirstMoveQuery":
            return {...state, firstMoveQuery: action.value};
        case "setEnderMove":
            return {...state, enderMove: action.value};
        case "setEnderMoveQuery":
            return {...state, enderMoveQuery: action.value};
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
        case "addDriveWindow":
            return {
                ...state,
                driveWindows: {
                    ...state.driveWindows,
                    [action.metric]: {enabled: true, min: "0", max: "6"},
                },
            };
        case "removeDriveWindow":
            return {
                ...state,
                driveWindows: {
                    ...state.driveWindows,
                    [action.metric]: {enabled: false, min: "", max: ""},
                },
            };
        case "setDriveWindowRange":
            return {
                ...state,
                driveWindows: {
                    ...state.driveWindows,
                    [action.metric]: {
                        ...state.driveWindows[action.metric],
                        min: action.min ?? state.driveWindows[action.metric].min,
                        max: action.max ?? state.driveWindows[action.metric].max,
                    },
                },
            };
        case "setRequirementToggle":
            return {...state, requirements: {...state.requirements, [action.key]: action.checked}};
        case "setRequirementObject":
            return {...state, requirements: {...state.requirements, requirementObjectName: action.objectName, requirementObjectStatus: action.status}};
        case "setSort":
            return {...state, sort: action.field, sortDirection: action.direction ?? state.sortDirection};
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
        setEnderMove: (value: ComboMoveSearchOption | null) => dispatch({type: "setEnderMove", value}),
        setEnderMoveQuery: (value: string) => dispatch({type: "setEnderMoveQuery", value}),
        setMinDifficulty: (value: string) => dispatch({type: "setDifficultyRange", minDifficulty: value}),
        setMaxDifficulty: (value: string) => dispatch({type: "setDifficultyRange", maxDifficulty: value}),
        setMinDamage: (value: string) => dispatch({type: "setDamageRange", minDamage: value}),
        setMaxDamage: (value: string) => dispatch({type: "setDamageRange", maxDamage: value}),
        addDriveWindow: (metric: ComboDriveWindowMetric) => dispatch({type: "addDriveWindow", metric}),
        removeDriveWindow: (metric: ComboDriveWindowMetric) => dispatch({type: "removeDriveWindow", metric}),
        setDriveWindowRange: (metric: ComboDriveWindowMetric, min?: string, max?: string) => dispatch({type: "setDriveWindowRange", metric, min, max}),
        setRequirementToggle: (key: ComboRequirementFilterKey, checked: boolean) => dispatch({type: "setRequirementToggle", key, checked}),
        setRequirementObject: (objectName: string, status: string) => dispatch({type: "setRequirementObject", objectName, status}),
        setSort: (field: ComboSortField, direction?: ComboSortDirection) => dispatch({type: "setSort", field, direction}),
        toggleAdvancedFilters: () => dispatch({type: "toggleAdvancedFilters"}),
        clearFilters: () => dispatch({type: "clearFilters"}),
    }), []);

    return {state, ...actions};
}
