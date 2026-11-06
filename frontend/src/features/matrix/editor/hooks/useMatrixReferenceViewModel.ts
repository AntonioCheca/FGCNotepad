import React from "react";

import {MatrixPayload} from "@/src/types/matrixPayload";
import {MatrixEditorState, MatrixLinkedCellResolution} from "@/src/features/matrix/model";
import {MatrixAction, matrixActions} from "@/src/features/matrix/state/actions";
import {computeDisplayedExpectedValue} from "../services/matrixComputationService";
import {createMapReferenceResolver, resolveReferenceDisplayValues} from "../services/referenceResolutionService";
import {buildReferenceInspectorData} from "../services/referenceInspector";
import {buildMatrixInsights} from "../services/matrixInsightService";
import {withAxisResourceCosts} from "../services/matrixAxisResourceCost";
import {linkedEvFactor} from "../services/linkedReferenceResolutionService";

// A weight or side edited in the cell editor applies right away: the linked EV is known, so only the total changes.
function applyCurrentReferenceWeights(
    resolutions: Record<string, MatrixLinkedCellResolution>,
    bodyCells: MatrixEditorState["grid"]["bodyCells"]
): Record<string, MatrixLinkedCellResolution> {
    let changed = false;
    const next = {...resolutions};
    Object.entries(resolutions).forEach(([key, resolution]) => {
        const cell = bodyCells[key];
        const weight = cell?.kind === "reference" ? cell.reference?.weight ?? 1 : resolution.weight;
        const perspective = cell?.kind === "reference" ? cell.reference?.perspective ?? "same" : resolution.perspective ?? "same";
        if (weight !== resolution.weight || perspective !== (resolution.perspective ?? "same")) {
            changed = true;
            next[key] = {...resolution, weight, perspective, finalValue: resolution.basePreValue + linkedEvFactor(weight, perspective) * resolution.linkedExpectedValue};
        }
    });

    return changed ? next : resolutions;
}

interface UseMatrixReferenceViewModelOptions {
    matrix: MatrixPayload;
    state: MatrixEditorState;
    filteredVisibleState: MatrixEditorState;
    linkedCellResolutions: Record<string, MatrixLinkedCellResolution>;
    editorLinkedCellResolutions: Record<string, MatrixLinkedCellResolution>;
    dispatch: React.Dispatch<MatrixAction>;
    actions: typeof matrixActions;
    // The equilibrium value solved with the mixes (a precomputed resource grid's), shown instead of mixes × cells.
    expectedValueOverride?: number | null;
}

export function useMatrixReferenceViewModel({
    matrix,
    state,
    filteredVisibleState,
    linkedCellResolutions,
    editorLinkedCellResolutions,
    dispatch,
    actions,
    expectedValueOverride = null,
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

    const bodyCells = state.grid.bodyCells;
    const effectiveLinkedCellResolutions = React.useMemo(
        () => applyCurrentReferenceWeights({...linkedCellResolutions, ...editorLinkedCellResolutions}, bodyCells),
        [bodyCells, editorLinkedCellResolutions, linkedCellResolutions]
    );

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

    const payoffBodyValues = React.useMemo(
        () => withAxisResourceCosts(filteredVisibleState, referenceResolution.displayedBodyValues),
        [filteredVisibleState, referenceResolution.displayedBodyValues]
    );

    const displayedExpectedValue = React.useMemo(
        () => expectedValueOverride ?? computeDisplayedExpectedValue(filteredVisibleState, payoffBodyValues),
        [expectedValueOverride, filteredVisibleState, payoffBodyValues]
    );

    const matrixInsights = React.useMemo(
        () => buildMatrixInsights(filteredVisibleState, payoffBodyValues, displayedExpectedValue),
        [displayedExpectedValue, filteredVisibleState, payoffBodyValues]
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
        linkedResolutionsByKey: effectiveLinkedCellResolutions,
        displayedExpectedValue,
        matrixInsights,
        displayWarnings,
        selectedBodyCell,
        selectedReferenceLabel,
        inspectorData,
    };
}
