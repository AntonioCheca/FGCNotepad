import React from "react";

import {isTemporarilyValidNumericDraft, MatrixEditorState, selectCellValueByKey, selectIsCellEditableByKey} from "@/src/features/matrix/model";
import {MatrixAction, matrixActions} from "@/src/features/matrix/state/actions";
import {applyMatrixPaste} from "../services/matrixPasteEngine";
import {deriveActiveAxisContext} from "../services/matrixContextVisibility";
import {interpretMatrixKeyDown, toSelectionTarget} from "../services/matrixKeyboardEngine";

interface UseMatrixEditorInteractionsOptions {
    state: MatrixEditorState;
    stateRef: React.MutableRefObject<MatrixEditorState>;
    dispatch: React.Dispatch<MatrixAction>;
    actions: typeof matrixActions;
    containerRef: React.RefObject<HTMLDivElement | null>;
    focusContainer: () => void;
    canEditBodyValues: boolean;
    canEditSummaries: boolean;
    isAnyModalOpen: boolean;
}

export function useMatrixEditorInteractions({
    state,
    stateRef,
    dispatch,
    actions,
    containerRef,
    focusContainer,
    canEditBodyValues,
    canEditSummaries,
    isAnyModalOpen,
}: UseMatrixEditorInteractionsOptions) {
    const selectTarget = React.useCallback((target: ReturnType<typeof toSelectionTarget>, shouldFocus = true) => {
        dispatch(actions.setActiveSelection(target));
        if (shouldFocus) {
            focusContainer();
        }
    }, [actions, dispatch, focusContainer]);

    const startEditForKey = React.useCallback((key: string) => {
        const currentState = stateRef.current;
        const active = currentState.selection.activeTarget;

        if (!active || active.key !== key) {
            return;
        }

        if (active.zone === "body" && !canEditBodyValues) {
            dispatch(actions.setValidationForKey(key, [{code: "readonly_cell", message: "This cell is read-only."}]));
            return;
        }

        if ((active.zone === "rowSummary" || active.zone === "columnSummary") && !canEditSummaries) {
            dispatch(actions.setValidationForKey(key, [{code: "readonly_cell", message: "This cell is read-only."}]));
            return;
        }

        const currentValue = selectCellValueByKey(stateRef.current, key);
        const draft = currentValue === null ? "" : String(currentValue);
        dispatch(actions.startEditing(key, draft));
    }, [actions, canEditBodyValues, canEditSummaries, dispatch, stateRef]);

    const startOverwriteEditForKey = React.useCallback((key: string, firstCharacter: string) => {
        const currentState = stateRef.current;
        const active = currentState.selection.activeTarget;

        if (!active || active.key !== key) {
            return;
        }

        if (active.zone === "body" && !canEditBodyValues) {
            dispatch(actions.setValidationForKey(key, [{code: "readonly_cell", message: "This cell is read-only."}]));
            return;
        }

        if ((active.zone === "rowSummary" || active.zone === "columnSummary") && !canEditSummaries) {
            dispatch(actions.setValidationForKey(key, [{code: "readonly_cell", message: "This cell is read-only."}]));
            return;
        }

        if (!selectIsCellEditableByKey(currentState, key)) {
            dispatch(actions.setValidationForKey(key, [{code: "readonly_cell", message: "This cell is read-only."}]));
            return;
        }

        dispatch(actions.startEditing(key, firstCharacter));
    }, [actions, canEditBodyValues, canEditSummaries, dispatch, stateRef]);

    const commitEditAndRefocus = React.useCallback(() => {
        dispatch(actions.commitEditing());
        requestAnimationFrame(() => {
            focusContainer();
        });
    }, [actions, dispatch, focusContainer]);

    const cancelEditAndRefocus = React.useCallback(() => {
        dispatch(actions.cancelEditing());
        requestAnimationFrame(() => {
            focusContainer();
        });
    }, [actions, dispatch, focusContainer]);

    const draftHasFormatError = React.useMemo(() => {
        if (state.editing.mode !== "edit") {
            return false;
        }

        return !isTemporarilyValidNumericDraft(state.editing.draft ?? "");
    }, [state.editing.mode, state.editing.draft]);

    const axisContext = React.useMemo(
        () => deriveActiveAxisContext(state.selection.activeTarget),
        [state.selection.activeTarget]
    );

    const canMutateActiveSelection = React.useMemo(() => {
        const active = state.selection.activeTarget;
        if (!active) {
            return false;
        }

        if (active.zone === "body") {
            return canEditBodyValues;
        }

        if (active.zone === "rowSummary" || active.zone === "columnSummary") {
            return canEditSummaries;
        }

        return false;
    }, [canEditBodyValues, canEditSummaries, state.selection.activeTarget]);

    const shouldBypassMatrixKeyHandling = React.useCallback((eventTarget: EventTarget | null) => {
        if (!(eventTarget instanceof HTMLElement)) {
            return false;
        }

        if (eventTarget.isContentEditable) {
            return true;
        }

        const tagName = eventTarget.tagName;
        return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
    }, []);

    const handlePaste = React.useCallback((event: React.ClipboardEvent<HTMLDivElement>) => {
        if (isAnyModalOpen) {
            return;
        }

        if (!canEditBodyValues) {
            event.preventDefault();
            return;
        }

        if (state.editing.mode === "edit") {
            return;
        }

        const pastedText = event.clipboardData?.getData("text/plain") ?? "";
        const result = applyMatrixPaste(state, pastedText);

        result.actions.forEach((action) => dispatch(action));

        if (result.handled || result.actions.length > 0) {
            event.preventDefault();
        }
    }, [canEditBodyValues, dispatch, isAnyModalOpen, state]);

    const handleKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if (shouldBypassMatrixKeyHandling(event.target)) {
            return;
        }

        if (isAnyModalOpen) {
            return;
        }

        if (!canMutateActiveSelection && (event.key === "Enter" || event.key === "Backspace" || event.key === "Delete" || (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey))) {
            event.preventDefault();
            return;
        }

        const outcome = interpretMatrixKeyDown(state, {
            key: event.key,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            altKey: event.altKey,
        });

        if (outcome.handled) {
            event.preventDefault();
            outcome.actions.forEach((action) => dispatch(action));

            if (state.editing.mode === "edit" && event.key.startsWith("Arrow")) {
                requestAnimationFrame(() => {
                    focusContainer();
                });
            }
        }
    }, [canMutateActiveSelection, dispatch, focusContainer, isAnyModalOpen, shouldBypassMatrixKeyHandling, state]);

    return {
        containerRef,
        focusContainer,
        selectTarget,
        startEditForKey,
        startOverwriteEditForKey,
        commitEditAndRefocus,
        cancelEditAndRefocus,
        draftHasFormatError,
        axisContext,
        handlePaste,
        handleKeyDown,
    };
}
