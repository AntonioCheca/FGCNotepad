import React from "react";

import {MatrixPayload} from "@/src/types/matrixPayload";
import {matrixActions, matrixEditorReducer} from "@/src/features/matrix/state";
import {matrixEditorStateToPayload, matrixPayloadToEditorState} from "../modules/payloadAdapter";

interface UseMatrixEditorControllerOptions {
    matrix: MatrixPayload;
    onMatrixChange: (next: MatrixPayload) => void;
}

export function useMatrixEditorController({matrix, onMatrixChange}: UseMatrixEditorControllerOptions) {
    const [state, dispatch] = React.useReducer(matrixEditorReducer, matrix, matrixPayloadToEditorState);
    const isFirstSync = React.useRef(true);
    const previousPayloadRef = React.useRef<MatrixPayload>(matrix);

    React.useEffect(() => {
        if (isFirstSync.current) {
            isFirstSync.current = false;
            return;
        }

        if (state.editing.mode === "edit") {
            return;
        }

        const nextPayload = matrixEditorStateToPayload(state, previousPayloadRef.current);
        previousPayloadRef.current = nextPayload;
        onMatrixChange(nextPayload);
    }, [state, onMatrixChange]);

    return {
        state,
        dispatch,
        actions: matrixActions,
    };
}
