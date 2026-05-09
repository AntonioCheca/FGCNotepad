import React from "react";

import {MatrixEditorState, MatrixLinkedCellResolution} from "@/src/features/matrix/model";
import {MatrixAction, matrixActions} from "@/src/features/matrix/state/actions";
import {buildPayoffMatrix, toSolveRowsAndColumns} from "../services/matrixSolveService";

interface UseSolveMatrixOptions {
    stateRef: React.MutableRefObject<MatrixEditorState>;
    dispatch: React.Dispatch<MatrixAction>;
    actions: typeof matrixActions;
    effectiveLayerLimit: number | null;
    displayedBodyValues: Record<string, number | null>;
    solveGame: (payoffMatrix: Record<string, Record<string, number>>) => Promise<unknown>;
    resolveDynamicCellsForSolve: () => Promise<Record<string, number | null>>;
    resolveLinkedCellsForSolve?: () => Promise<Record<string, MatrixLinkedCellResolution>>;
    onLinkedCellsResolved?: (resolutions: Record<string, MatrixLinkedCellResolution>) => void;
    forceSolveColumnIds?: string[] | null;
    unavailableRowIds?: Set<string>;
    unavailableColumnIds?: Set<string>;
}

export function useSolveMatrix({
    stateRef,
    dispatch,
    actions,
    effectiveLayerLimit,
    displayedBodyValues,
    solveGame,
    resolveDynamicCellsForSolve,
    resolveLinkedCellsForSolve,
    onLinkedCellsResolved,
    forceSolveColumnIds,
    unavailableRowIds = new Set<string>(),
    unavailableColumnIds = new Set<string>(),
}: UseSolveMatrixOptions) {
    const [isSolving, setIsSolving] = React.useState(false);

    const solveCurrentMatrix = React.useCallback(async () => {
        setIsSolving(true);

        try {
            const dynamicOverrides = await resolveDynamicCellsForSolve();
            const linkedResolutions = resolveLinkedCellsForSolve ? await resolveLinkedCellsForSolve() : {};
            onLinkedCellsResolved?.(linkedResolutions);
            const currentState = stateRef.current;
            const linkedDisplayedValues = Object.entries(linkedResolutions).reduce<Record<string, number>>((acc, [key, resolution]) => {
                acc[key] = resolution.finalValue;
                return acc;
            }, {});
            const {rows: solveRows, columns: candidateColumns} = toSolveRowsAndColumns(currentState, effectiveLayerLimit);
            const forcedColumnSet = forceSolveColumnIds && forceSolveColumnIds.length > 0 ? new Set(forceSolveColumnIds) : null;
            const solveColumns = forcedColumnSet
                ? candidateColumns.filter((column) => forcedColumnSet.has(column.id))
                : candidateColumns;
            const legalRows = solveRows.filter((row) => !unavailableRowIds.has(row.id));
            const legalColumns = solveColumns.filter((column) => !unavailableColumnIds.has(column.id));

            unavailableRowIds.forEach((rowId) => dispatch(actions.setRowSummaryValue(rowId, 0)));
            unavailableColumnIds.forEach((columnId) => dispatch(actions.setColumnSummaryValue(columnId, 0)));

            if (legalRows.length === 0 || legalColumns.length === 0) {
                dispatch(actions.setGlobalValidation([{code: "unknown", message: "No legal resource-available actions remain for solving."}]));
                return;
            }

            const payoffMatrix = buildPayoffMatrix({
                state: currentState,
                rows: legalRows,
                columns: legalColumns,
                displayedBodyValues: {...displayedBodyValues, ...linkedDisplayedValues},
                dynamicOverrides,
            });

            const result = await solveGame(payoffMatrix);
            const equilibrium = Array.isArray((result as {equilibria?: unknown[]})?.equilibria)
                ? (result as {equilibria?: unknown[]}).equilibria?.[0]
                : null;

            if (!equilibrium || typeof equilibrium !== "object") {
                dispatch(actions.setGlobalValidation([{code: "unknown", message: "Solver returned no equilibria for this matrix."}]));
                return;
            }

            const nextRowActions = legalRows.flatMap((row) => {
                const rowKey = row.label.trim() || row.id;
                const p1Value = (equilibrium as Record<string, Record<string, unknown>>).P1?.[rowKey];
                const numeric = typeof p1Value === "number" && Number.isFinite(p1Value) ? p1Value : 0;
                return actions.setRowSummaryValue(row.id, numeric);
            });

            const nextColumnActions = legalColumns.flatMap((column) => {
                const columnKey = column.label.trim() || column.id;
                const p2Value = (equilibrium as Record<string, Record<string, unknown>>).P2?.[columnKey];
                const numeric = typeof p2Value === "number" && Number.isFinite(p2Value) ? p2Value : 0;
                return actions.setColumnSummaryValue(column.id, numeric);
            });

            [...nextRowActions, ...nextColumnActions].forEach((action) => dispatch(action));
            dispatch(actions.setGlobalValidation([]));
        } catch {
            dispatch(actions.setGlobalValidation([{code: "unknown", message: "Unable to solve game right now. Please retry."}]));
        } finally {
            setIsSolving(false);
        }
    }, [actions, dispatch, displayedBodyValues, effectiveLayerLimit, forceSolveColumnIds, onLinkedCellsResolved, resolveDynamicCellsForSolve, resolveLinkedCellsForSolve, solveGame, stateRef, unavailableColumnIds, unavailableRowIds]);

    return {
        isSolving,
        solveCurrentMatrix,
    };
}
