import React from "react";

import {MatrixDynamicComboData, MatrixEditorState} from "@/src/features/matrix/model";
import {MatrixAction, matrixActions} from "@/src/features/matrix/state/actions";
import {MatrixPayload} from "@/src/types/matrixPayload";
import {matrixPayloadToEditorState} from "../modules/payloadAdapter";
import {extractMoveDamage} from "../services/dynamicComboMoveService";

interface UseDynamicComboResolverOptions {
    stateRef: React.MutableRefObject<MatrixEditorState>;
    dispatch: React.Dispatch<MatrixAction>;
    actions: typeof matrixActions;
    getSpecificMove: (id: string) => Promise<unknown>;
    onRefreshDynamicCells?: () => Promise<MatrixPayload>;
    onResolveDynamicComboCell?: (dynamicCombo: MatrixDynamicComboData) => Promise<number | null>;
}

export function extractDynamicComboRefreshOverrides(
    currentState: MatrixEditorState,
    refreshedState: MatrixEditorState
): Record<string, number | null> {
    const overrides: Record<string, number | null> = {};

    Object.entries(currentState.grid.bodyCells).forEach(([key, currentCell]) => {
        if (currentCell.kind !== "dynamic_combo") {
            return;
        }

        const refreshedCell = refreshedState.grid.bodyCells[key];
        if (!refreshedCell || refreshedCell.kind !== "dynamic_combo") {
            return;
        }

        overrides[key] = refreshedCell.value;
    });

    return overrides;
}

export function useDynamicComboResolver({
    stateRef,
    dispatch,
    actions,
    getSpecificMove,
    onRefreshDynamicCells,
    onResolveDynamicComboCell,
}: UseDynamicComboResolverOptions) {
    const getSpecificMoveRef = React.useRef(getSpecificMove);

    React.useEffect(() => {
        getSpecificMoveRef.current = getSpecificMove;
    }, [getSpecificMove]);

    const resolveDynamicComboFallbackDamage = React.useCallback(async (starterMoveIds: string[]): Promise<number | null> => {
        if (starterMoveIds.length === 0) {
            return null;
        }

        const damages = await Promise.all(
            starterMoveIds.map(async (starterMoveId) => {
                try {
                    const move = await getSpecificMoveRef.current(starterMoveId);
                    return extractMoveDamage(move);
                } catch {
                    return null;
                }
            })
        );

        const numericDamages = damages.filter((damage): damage is number => typeof damage === "number" && Number.isFinite(damage));
        if (numericDamages.length === 0) {
            return null;
        }

        return Math.max(...numericDamages);
    }, []);

    const resolveDynamicComboValue = React.useCallback(async (dynamicCombo: MatrixDynamicComboData): Promise<number | null> => {
        let resolvedValue: number | null = null;

        if (onResolveDynamicComboCell) {
            try {
                resolvedValue = await onResolveDynamicComboCell(dynamicCombo);
            } catch {
                resolvedValue = null;
            }
        }

        if (resolvedValue === null) {
            resolvedValue = await resolveDynamicComboFallbackDamage(dynamicCombo.starterMoveIds);
        }

        return resolvedValue;
    }, [onResolveDynamicComboCell, resolveDynamicComboFallbackDamage]);

    const resolveDynamicCellsForSolve = React.useCallback(async (): Promise<Record<string, number | null>> => {
        if (onRefreshDynamicCells) {
            try {
                const refreshedMatrix = await onRefreshDynamicCells();
                const refreshedState = matrixPayloadToEditorState(refreshedMatrix);
                const overrides = extractDynamicComboRefreshOverrides(stateRef.current, refreshedState);

                Object.entries(overrides).forEach(([key, value]) => {
                    dispatch(actions.setDynamicComboResolvedValue(key, value));
                });

                return overrides;
            } catch {
            }
        }

        const currentState = stateRef.current;
        const dynamicCells = Object.values(currentState.grid.bodyCells).filter(
            (cell) => cell.kind === "dynamic_combo" && Array.isArray(cell.dynamicCombo?.starterMoveIds)
        );

        const updates = await Promise.all(
            dynamicCells.map(async (cell) => {
                if (!cell.dynamicCombo) {
                    return {key: cell.key, value: null};
                }

                const value = await resolveDynamicComboValue(cell.dynamicCombo);
                return {key: cell.key, value};
            })
        );

        const overrides: Record<string, number | null> = {};
        updates.forEach((update) => {
            overrides[update.key] = update.value;
            dispatch(actions.setDynamicComboResolvedValue(update.key, update.value));
        });

        return overrides;
    }, [actions, dispatch, onRefreshDynamicCells, resolveDynamicComboValue, stateRef]);

    return {
        resolveDynamicComboFallbackDamage,
        resolveDynamicComboValue,
        resolveDynamicCellsForSolve,
    };
}
