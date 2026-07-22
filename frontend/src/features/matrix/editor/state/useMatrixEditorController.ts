import React from "react";

import {MatrixEditorState} from "@/src/features/matrix/model";
import {MatrixPayload} from "@/src/types/matrixPayload";
import {matrixActions, matrixEditorReducer} from "@/src/features/matrix/state";
import {matrixEditorStateToPayload, matrixPayloadToEditorState} from "../modules/payloadAdapter";

interface UseMatrixEditorControllerOptions {
    matrix: MatrixPayload;
    onMatrixChange: (next: MatrixPayload) => void;
    persistChanges?: boolean;
}

export function useMatrixEditorController({matrix, onMatrixChange, persistChanges = true}: UseMatrixEditorControllerOptions) {
    const [state, setState] = React.useState<MatrixEditorState>(() => matrixPayloadToEditorState(matrix));
    const stateRef = React.useRef(state);
    const previousPayloadRef = React.useRef<MatrixPayload>(matrix);

    const dispatch = React.useCallback((action: Parameters<typeof matrixEditorReducer>[1]) => {
        const nextState = matrixEditorReducer(stateRef.current, action);
        stateRef.current = nextState;
        setState(nextState);

        if (!persistChanges || nextState.editing.mode === "edit") {
            return;
        }

        const nextPayload = matrixEditorStateToPayload(nextState, previousPayloadRef.current);
        previousPayloadRef.current = nextPayload;
        onMatrixChange(nextPayload);
    }, [onMatrixChange, persistChanges]);

    React.useEffect(() => {
        if (matrix === previousPayloadRef.current) {
            return;
        }

        const nextState = matrixPayloadToEditorState(matrix);
        previousPayloadRef.current = matrix;
        stateRef.current = nextState;
        setState(nextState);
    }, [matrix]);

    return {
        state,
        dispatch,
        actions: matrixActions,
    };
}
