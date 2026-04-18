import React from "react";

import {MatrixPayload} from "@/src/types/matrixPayload";
import {matrixActions, matrixEditorReducer} from "@/src/features/matrix/state";
import {matrixEditorStateToPayload, matrixPayloadToEditorState} from "../modules/payloadAdapter";

interface UseMatrixEditorControllerOptions {
    matrix: MatrixPayload;
    onMatrixChange: (next: MatrixPayload) => void;
    persistChanges?: boolean;
}

export function useMatrixEditorController({matrix, onMatrixChange, persistChanges = true}: UseMatrixEditorControllerOptions) {
    const [state, dispatch] = React.useReducer(matrixEditorReducer, matrix, matrixPayloadToEditorState);
    const isFirstSync = React.useRef(true);
    const previousPayloadRef = React.useRef<MatrixPayload>(matrix);

    React.useEffect(() => {
        if (matrix === previousPayloadRef.current) {
            return;
        }

        const nextState = matrixPayloadToEditorState(matrix);
        previousPayloadRef.current = matrix;
        dispatch(matrixActions.replaceState(nextState));
    }, [matrix]);

    React.useEffect(() => {
        if (isFirstSync.current) {
            isFirstSync.current = false;
            return;
        }

        if (state.editing.mode === "edit") {
            return;
        }

        if (!persistChanges) {
            return;
        }

        const nextPayload = matrixEditorStateToPayload(state, previousPayloadRef.current);
        previousPayloadRef.current = nextPayload;
        onMatrixChange(nextPayload);
    }, [state, onMatrixChange, persistChanges]);

    return {
        state,
        dispatch,
        actions: matrixActions,
    };
}
