import React from "react";

import {MatrixPayload} from "@/src/types/matrixPayload";
import {MatrixEditorState, MatrixLinkedCellResolution} from "@/src/features/matrix/model";
import {MatrixAction, matrixActions} from "@/src/features/matrix/state/actions";
import {computeDisplayedExpectedValue} from "../services/matrixComputationService";
import {createMapReferenceResolver, resolveReferenceDisplayValues} from "../services/referenceResolutionService";
import {buildReferenceInspectorData} from "../services/referenceInspector";
import {buildMatrixInsights} from "../services/matrixInsightService";

interface UseMatrixReferenceViewModelOptions {
    matrix: MatrixPayload;
    state: MatrixEditorState;
    filteredVisibleState: MatrixEditorState;
    linkedCellResolutions: Record<string, MatrixLinkedCellResolution>;
    editorLinkedCellResolutions: Record<string, MatrixLinkedCellResolution>;
    dispatch: React.Dispatch<MatrixAction>;
    actions: typeof matrixActions;
}

export function useMatrixReferenceViewModel({
    matrix,
    state,
    filteredVisibleState,
    linkedCellResolutions,
    editorLinkedCellResolutions,
    dispatch,
    actions,
}: UseMatrixReferenceViewModelOptions) {
    const referenceSourceMap = React.useMemo(() => {
        const raw = matrix.extensions?.referenceValueByScenarioId;
        if (raw && typeof raw === "object" && !Array.isArray(raw)) {
            return raw as Record<string, unknown>;
        }
        return {};
    }, [matrix.extensions]);

    const referenceMetadataMap = React.useMemo(() => {
        const raw = matrix.extensions?.referenceMetadataByScenarioId;
        if (raw && typeof raw === "object" && !Array.isArray(raw)) {
            return raw as Record<string, unknown>;
        }
        return {};
    }, [matrix.extensions]);

    const effectiveLinkedCellResolutions = React.useMemo(() => ({
        ...linkedCellResolutions,
        ...editorLinkedCellResolutions,
    }), [editorLinkedCellResolutions, linkedCellResolutions]);

    const referenceResolution = React.useMemo(() => {
        const resolver = createMapReferenceResolver(referenceSourceMap);
        const cellValueByKey = Object.entries(effectiveLinkedCellResolutions).reduce<Record<string, number>>((acc, [key, resolution]) => {
            acc[key] = resolution.finalValue;
            return acc;
        }, {});

        return resolveReferenceDisplayValues(state, resolver, {
            cellValueByKey,
            resolverExpected: Object.keys(referenceSourceMap).length > 0 || Object.keys(cellValueByKey).length > 0,
        });
    }, [state, referenceSourceMap, effectiveLinkedCellResolutions]);

    const referenceDisplayLabels = React.useMemo(() => {
        return Object.entries(effectiveLinkedCellResolutions).reduce<Record<string, string>>((acc, [key, resolution]) => {
            acc[key] = resolution.displayFormula;
            return acc;
        }, {});
    }, [effectiveLinkedCellResolutions]);

    const displayedExpectedValue = React.useMemo(
        () => computeDisplayedExpectedValue(filteredVisibleState, referenceResolution.displayedBodyValues),
        [filteredVisibleState, referenceResolution.displayedBodyValues]
    );

    const matrixInsights = React.useMemo(
        () => buildMatrixInsights(filteredVisibleState, referenceResolution.displayedBodyValues, displayedExpectedValue),
        [displayedExpectedValue, filteredVisibleState, referenceResolution.displayedBodyValues]
    );

    React.useEffect(() => {
        if (referenceResolution.cacheUpdates.length === 0) {
            return;
        }

        dispatch(actions.batchUpdateReferenceCache(referenceResolution.cacheUpdates));
    }, [referenceResolution.cacheUpdates, actions, dispatch]);

    const displayWarnings = React.useMemo(() => {
        const messages = state.validation.globalIssues.map((issue) => issue.message);
        const knownMessages = new Set(messages);

        referenceResolution.issues.forEach((issue) => {
            if (!knownMessages.has(issue.message)) {
                messages.push(issue.message);
                knownMessages.add(issue.message);
            }
        });

        const activeKey = state.selection.activeTarget?.key;
        if (activeKey) {
            const activeIssue = state.validation.byKey[activeKey]?.[0]?.message;
            if (activeIssue && !knownMessages.has(activeIssue)) {
                messages.unshift(activeIssue);
            }
        }

        return messages;
    }, [state.validation.globalIssues, state.validation.byKey, state.selection.activeTarget, referenceResolution.issues]);

    const selectedBodyCell = React.useMemo(() => {
        const active = state.selection.activeTarget;
        if (!active || active.zone !== "body") {
            return null;
        }

        return state.grid.bodyCells[active.key] ?? null;
    }, [state.selection.activeTarget, state.grid.bodyCells]);

    const selectedReferenceLabel = React.useMemo(() => {
        if (!selectedBodyCell || selectedBodyCell.kind !== "reference") {
            return null;
        }

        return selectedBodyCell.reference?.scenarioLabel ?? selectedBodyCell.reference?.scenarioId ?? null;
    }, [selectedBodyCell]);

    const inspectorData = React.useMemo(() => {
        return buildReferenceInspectorData(
            state,
            state.selection.activeTarget,
            referenceResolution.displayedBodyValues,
            referenceMetadataMap
        );
    }, [state, referenceResolution.displayedBodyValues, referenceMetadataMap]);

    return {
        effectiveLinkedCellResolutions,
        referenceResolution,
        referenceDisplayLabels,
        displayedExpectedValue,
        matrixInsights,
        displayWarnings,
        selectedBodyCell,
        selectedReferenceLabel,
        inspectorData,
    };
}
