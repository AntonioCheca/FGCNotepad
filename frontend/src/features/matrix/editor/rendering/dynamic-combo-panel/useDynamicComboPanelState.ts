import React from "react";

import type {MatrixDynamicComboData} from "@/src/features/matrix/model";
import {createStarterSelections, presetFromContext} from "./dynamicComboPanelUtils";
import type {
    DynamicComboCharacterOption,
    DynamicComboMoveOption,
    DynamicComboPanelState,
    StarterContextPreset,
} from "./dynamicComboPanelTypes";

type DynamicComboPanelAction =
    | {type: "setSelectedCharacter"; value: DynamicComboCharacterOption | null}
    | {type: "setStarterQuery"; value: string}
    | {type: "addStarterSelection"; value: DynamicComboMoveOption}
    | {type: "removeStarterSelection"; id: string}
    | {type: "replaceStarterLabels"; labelsById: Record<string, string>}
    | {type: "setStarterPreset"; value: StarterContextPreset}
    | {type: "setError"; value: string | null};

function createInitialState(initialValue: MatrixDynamicComboData | null, moveLabelById: Record<string, string>): DynamicComboPanelState {
    return {
        selectedCharacter: null,
        starterQuery: "",
        starterSelections: createStarterSelections(initialValue, moveLabelById),
        starterPreset: presetFromContext(initialValue?.starterContext),
        error: null,
    };
}

function dynamicComboPanelReducer(state: DynamicComboPanelState, action: DynamicComboPanelAction): DynamicComboPanelState {
    switch (action.type) {
        case "setSelectedCharacter":
            return {...state, selectedCharacter: action.value, error: null};
        case "setStarterQuery":
            return {...state, starterQuery: action.value, error: null};
        case "addStarterSelection":
            if (state.starterSelections.some((item) => item.id === action.value.id)) {
                return {...state, starterQuery: "", error: null};
            }

            return {...state, starterSelections: [...state.starterSelections, action.value], starterQuery: "", error: null};
        case "removeStarterSelection":
            return {...state, starterSelections: state.starterSelections.filter((entry) => entry.id !== action.id)};
        case "replaceStarterLabels":
            return {
                ...state,
                starterSelections: state.starterSelections.map((selection) => ({
                    ...selection,
                    summary: action.labelsById[selection.id] ?? selection.summary,
                })),
            };
        case "setStarterPreset":
            return {...state, starterPreset: action.value};
        case "setError":
            return {...state, error: action.value};
        default:
            return state;
    }
}

export function useDynamicComboPanelState(initialValue: MatrixDynamicComboData | null, moveLabelById: Record<string, string>) {
    const [state, dispatch] = React.useReducer(dynamicComboPanelReducer, {initialValue, moveLabelById}, ({initialValue, moveLabelById}) => createInitialState(initialValue, moveLabelById));

    const actions = React.useMemo(() => ({
        setSelectedCharacter: (value: DynamicComboCharacterOption | null) => dispatch({type: "setSelectedCharacter", value}),
        setStarterQuery: (value: string) => dispatch({type: "setStarterQuery", value}),
        addStarterSelection: (value: DynamicComboMoveOption) => dispatch({type: "addStarterSelection", value}),
        removeStarterSelection: (id: string) => dispatch({type: "removeStarterSelection", id}),
        replaceStarterLabels: (labelsById: Record<string, string>) => dispatch({type: "replaceStarterLabels", labelsById}),
        setStarterPreset: (value: StarterContextPreset) => dispatch({type: "setStarterPreset", value}),
        setError: (value: string | null) => dispatch({type: "setError", value}),
        clearError: () => dispatch({type: "setError", value: null}),
    }), []);

    return {state, ...actions};
}
