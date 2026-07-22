import React from "react";

import {ScenarioCharacterStatusPayload, ScenarioComboContextPayload, ScenarioPositionLock, ScenarioType} from "@/hooks/useScenarios";
import {enforceAggregatedDefenseColumns} from "@/src/features/matrix/aggregation/aggregatedDefenseCatalog";
import type {MatrixPayload} from "@/src/types/matrixPayload";
import {createInitialScenarioEditorState} from "./scenarioEditorDraft";
import type {MoveOption, ScenarioEditorState} from "./scenarioEditorTypes";

type ScenarioEditorAction =
    | {type: "loadDraft"; draft: ScenarioEditorState}
    | {type: "setName"; name: string}
    | {type: "setScenarioType"; scenarioType: ScenarioType}
    | {type: "setDefenderCharacterId"; defenderCharacterId: string}
    | {type: "setAttackerCharacterId"; attackerCharacterId: string}
    | {type: "setTriggerMove"; triggerMove: MoveOption | null; triggerMoveQuery?: string}
    | {type: "setTriggerMoveQuery"; triggerMoveQuery: string}
    | {type: "resetTriggerMove"}
    | {type: "setMatrix"; matrix: MatrixPayload}
    | {type: "setComboContext"; comboContext: ScenarioComboContextPayload}
    | {type: "setPositionLock"; positionLock: ScenarioPositionLock}
    | {type: "addCharacterStatusLock"; status: ScenarioCharacterStatusPayload}
    | {type: "removeCharacterStatusLock"; objectName: string}
    | {type: "enforceAggregatedOkiColumns"};

function scenarioEditorReducer(state: ScenarioEditorState, action: ScenarioEditorAction): ScenarioEditorState {
    switch (action.type) {
        case "loadDraft":
            return action.draft;
        case "setName":
            return {...state, name: action.name};
        case "setScenarioType":
            return {...state, scenarioType: action.scenarioType};
        case "setDefenderCharacterId":
            return {...state, defenderCharacterId: action.defenderCharacterId};
        case "setAttackerCharacterId":
            return {...state, attackerCharacterId: action.attackerCharacterId, triggerMove: null, triggerMoveQuery: ""};
        case "setTriggerMove":
            return {...state, triggerMove: action.triggerMove, triggerMoveQuery: action.triggerMoveQuery ?? state.triggerMoveQuery};
        case "setTriggerMoveQuery":
            return {...state, triggerMoveQuery: action.triggerMoveQuery};
        case "resetTriggerMove":
            return {...state, triggerMove: null, triggerMoveQuery: ""};
        case "setMatrix":
            return {...state, matrix: action.matrix};
        case "setComboContext":
            return {...state, comboContext: action.comboContext};
        case "setPositionLock":
            return {...state, comboContext: {...state.comboContext, positionLock: action.positionLock}};
        case "addCharacterStatusLock":
            return {...state, comboContext: {...state.comboContext, characterStatuses: [...state.comboContext.characterStatuses, action.status]}};
        case "removeCharacterStatusLock":
            return {
                ...state,
                comboContext: {
                    ...state.comboContext,
                    characterStatuses: state.comboContext.characterStatuses.filter((entry) => entry.object_name !== action.objectName),
                },
            };
        case "enforceAggregatedOkiColumns":
            return {...state, matrix: enforceAggregatedDefenseColumns(state.matrix)};
        default:
            return state;
    }
}

export function useScenarioEditorState(initialValue?: Partial<ScenarioEditorState>) {
    const [state, dispatch] = React.useReducer(scenarioEditorReducer, initialValue, createInitialScenarioEditorState);

    const actions = React.useMemo(() => ({
        loadDraft: (draft: ScenarioEditorState) => dispatch({type: "loadDraft", draft}),
        setName: (name: string) => dispatch({type: "setName", name}),
        setScenarioType: (scenarioType: ScenarioType) => dispatch({type: "setScenarioType", scenarioType}),
        setDefenderCharacterId: (defenderCharacterId: string) => dispatch({type: "setDefenderCharacterId", defenderCharacterId}),
        setAttackerCharacterId: (attackerCharacterId: string) => dispatch({type: "setAttackerCharacterId", attackerCharacterId}),
        setTriggerMove: (triggerMove: MoveOption | null, triggerMoveQuery?: string) => dispatch({type: "setTriggerMove", triggerMove, triggerMoveQuery}),
        setTriggerMoveQuery: (triggerMoveQuery: string) => dispatch({type: "setTriggerMoveQuery", triggerMoveQuery}),
        resetTriggerMove: () => dispatch({type: "resetTriggerMove"}),
        setMatrix: (matrix: MatrixPayload) => dispatch({type: "setMatrix", matrix}),
        setComboContext: (comboContext: ScenarioComboContextPayload) => dispatch({type: "setComboContext", comboContext}),
        setPositionLock: (positionLock: ScenarioPositionLock) => dispatch({type: "setPositionLock", positionLock}),
        addCharacterStatusLock: (status: ScenarioCharacterStatusPayload) => dispatch({type: "addCharacterStatusLock", status}),
        removeCharacterStatusLock: (objectName: string) => dispatch({type: "removeCharacterStatusLock", objectName}),
        enforceAggregatedOkiColumns: () => dispatch({type: "enforceAggregatedOkiColumns"}),
    }), []);

    return {
        state,
        ...actions,
    };
}
