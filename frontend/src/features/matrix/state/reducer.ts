import {MatrixEditorState} from "../model/stateTypes";
import {MatrixAction} from "./actions";
import {reduceAxisAction} from "./axisReducer";
import {reduceCellAction} from "./cellReducer";
import {reduceInteractionAction} from "./interactionReducer";

export function matrixEditorReducer(state: MatrixEditorState, action: MatrixAction): MatrixEditorState {
    if (action.type === "grid/replaceState") {
        return action.payload.state;
    }

    return reduceCellAction(state, action) ?? reduceAxisAction(state, action) ?? reduceInteractionAction(state, action) ?? state;
}
