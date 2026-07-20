import React from "react";

import {MatrixEditorState, selectGridValues} from "@/src/features/matrix/model";
import {MatrixAction, matrixActions} from "@/src/features/matrix/state/actions";
import {computeExpectedValue} from "../services/matrixComputationService";
import {buildMatrixResourceGating, MatrixResourceContext} from "../services/matrixResourceGating";
import {useMatrixLayerVisibility} from "./useMatrixLayerVisibility";

interface UseMatrixEditorViewModelOptions {
    state: MatrixEditorState;
    dispatch: React.Dispatch<MatrixAction>;
    actions: typeof matrixActions;
    editable: boolean;
    columnVisibilityByLabel?: Record<string, boolean> | null;
    displayFrequenciesAsPercent: boolean;
    layerSolveSnapshots?: Record<number, {rowAxis: Array<number | null>; columnAxis: Array<number | null>; expectedValue: number | null}>;
    onLayerViewChange?: (layerLimit: number | null) => void;
    resourceContext?: MatrixResourceContext | null;
}

export function useMatrixEditorViewModel({
    state,
    dispatch,
    actions,
    editable,
    columnVisibilityByLabel,
    displayFrequenciesAsPercent,
    layerSolveSnapshots,
    onLayerViewChange,
    resourceContext = null,
}: UseMatrixEditorViewModelOptions) {
    const layerVisibility = useMatrixLayerVisibility({state, editable});
    const {effectiveLayerLimit, showAllLayers, visibleState} = layerVisibility;

    const expectedValue = React.useMemo(() => {
        const values = selectGridValues(state);
        const rowWeights = state.grid.rows.map((row) => state.grid.rowSummaryCells[`row-summary::${row.id}`]?.value ?? null);
        const columnWeights = state.grid.columns.map((column) => state.grid.columnSummaryCells[`column-summary::${column.id}`]?.value ?? null);
        return computeExpectedValue(values, rowWeights, columnWeights);
    }, [state]);

    const columnVisibilitySet = React.useMemo(() => {
        if (!columnVisibilityByLabel) {
            return null;
        }

        const visible = new Set<string>();
        state.grid.columns.forEach((column) => {
            if (columnVisibilityByLabel[column.label] !== false) {
                visible.add(column.id);
            }
        });

        return visible;
    }, [columnVisibilityByLabel, state.grid.columns]);

    const filteredVisibleState = React.useMemo(() => {
        if (!columnVisibilitySet) {
            return visibleState;
        }

        const filteredColumns = visibleState.grid.columns.filter((column) => columnVisibilitySet.has(column.id));
        const filteredColumnIds = new Set(filteredColumns.map((column) => column.id));
        const bodyCells = Object.fromEntries(Object.entries(visibleState.grid.bodyCells).filter(([, cell]) => filteredColumnIds.has(cell.columnId)));
        const columnSummaryCells = Object.fromEntries(
            Object.entries(visibleState.grid.columnSummaryCells).filter(([, summary]) => {
                const columnId = summary.key.replace("column-summary::", "");
                return filteredColumnIds.has(columnId);
            })
        );

        return {
            ...visibleState,
            grid: {
                ...visibleState.grid,
                columns: filteredColumns,
                bodyCells,
                columnSummaryCells,
            },
        };
    }, [columnVisibilitySet, visibleState]);

    const resourceGating = React.useMemo(() => buildMatrixResourceGating(state, resourceContext), [resourceContext, state]);

    const hasResourceRequirements = React.useMemo(() => {
        return state.grid.rows.some((row) => row.requirements.length > 0) || state.grid.columns.some((column) => column.requirements.length > 0);
    }, [state.grid.columns, state.grid.rows]);

    const forceSolveColumnIds = React.useMemo(() => {
        if (!columnVisibilitySet) {
            return null;
        }

        return Array.from(columnVisibilitySet);
    }, [columnVisibilitySet]);

    const summaryValueFormatter = React.useMemo(() => {
        if (!displayFrequenciesAsPercent) {
            return undefined;
        }

        return (value: number | null): string => {
            if (value === null) {
                return "";
            }
            return `${(value * 100).toFixed(2)}%`;
        };
    }, [displayFrequenciesAsPercent]);

    React.useEffect(() => {
        if (onLayerViewChange) {
            onLayerViewChange(effectiveLayerLimit);
        }
    }, [effectiveLayerLimit, onLayerViewChange]);

    React.useEffect(() => {
        if (editable || showAllLayers || effectiveLayerLimit === null || !layerSolveSnapshots || (resourceContext && hasResourceRequirements)) {
            return;
        }

        const snapshot = layerSolveSnapshots[effectiveLayerLimit];
        if (!snapshot) {
            return;
        }

        state.grid.rows.forEach((row, index) => {
            const value = snapshot.rowAxis[index];
            if (typeof value === "number" && Number.isFinite(value)) {
                const current = state.grid.rowSummaryCells[`row-summary::${row.id}`]?.value;
                if (current !== value) {
                    dispatch(actions.setRowSummaryValue(row.id, value));
                }
            }
        });

        state.grid.columns.forEach((column, index) => {
            const value = snapshot.columnAxis[index];
            if (typeof value === "number" && Number.isFinite(value)) {
                const current = state.grid.columnSummaryCells[`column-summary::${column.id}`]?.value;
                if (current !== value) {
                    dispatch(actions.setColumnSummaryValue(column.id, value));
                }
            }
        });

        if (typeof snapshot.expectedValue === "number" && Number.isFinite(snapshot.expectedValue) && state.grid.expectedValueCell.value !== snapshot.expectedValue) {
            dispatch(actions.setExpectedValue(snapshot.expectedValue));
        }
    }, [
        actions,
        dispatch,
        effectiveLayerLimit,
        editable,
        layerSolveSnapshots,
        hasResourceRequirements,
        resourceContext,
        showAllLayers,
        state.grid.columns,
        state.grid.columnSummaryCells,
        state.grid.expectedValueCell.value,
        state.grid.rowSummaryCells,
        state.grid.rows,
    ]);

    React.useEffect(() => {
        if (state.grid.expectedValueCell.value !== expectedValue) {
            dispatch(actions.setExpectedValue(expectedValue));
        }
    }, [dispatch, expectedValue, actions, state.grid.expectedValueCell.value]);

    return {
        ...layerVisibility,
        expectedValue,
        filteredVisibleState,
        resourceGating,
        hasResourceRequirements,
        forceSolveColumnIds,
        summaryValueFormatter,
    };
}
