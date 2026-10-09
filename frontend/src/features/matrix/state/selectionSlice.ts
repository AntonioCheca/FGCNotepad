import {MatrixEditorState, MatrixSelectionTarget} from "../model/stateTypes";

export function createSelectionSlice(target: MatrixSelectionTarget | null): MatrixEditorState["selection"] {
    return {
        activeTarget: target,
        anchorTarget: target,
        selectedKeys: target ? [target.key] : [],
    };
}
