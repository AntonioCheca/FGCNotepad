import React from "react";

import {MatrixBodyCell} from "@/src/features/matrix/model";
import {buildMoveDisplayLabel} from "../services/dynamicComboMoveService";

interface UseMoveLabelsOptions {
    bodyCells: Record<string, MatrixBodyCell>;
    getSpecificMove: (id: string) => Promise<unknown>;
}

export function useMoveLabels({bodyCells, getSpecificMove}: UseMoveLabelsOptions) {
    const [moveLabelById, setMoveLabelById] = React.useState<Record<string, string>>({});
    const getSpecificMoveRef = React.useRef(getSpecificMove);

    React.useEffect(() => {
        getSpecificMoveRef.current = getSpecificMove;
    }, [getSpecificMove]);

    React.useEffect(() => {
        const allMoveIds = new Set<string>();

        Object.values(bodyCells).forEach((cell) => {
            if (cell.kind !== "dynamic_combo" || !cell.dynamicCombo) {
                return;
            }

            cell.dynamicCombo.starterMoveIds.forEach((starterMoveId) => {
                allMoveIds.add(starterMoveId);
            });
        });

        const missingMoveIds = Array.from(allMoveIds).filter((moveId) => !moveLabelById[moveId]);
        if (missingMoveIds.length === 0) {
            return;
        }

        let canceled = false;

        Promise.all(
            missingMoveIds.map(async (moveId) => {
                try {
                    const move = await getSpecificMoveRef.current(moveId);
                    return [moveId, buildMoveDisplayLabel(moveId, move)] as const;
                } catch {
                    return [moveId, `Move #${moveId}`] as const;
                }
            })
        ).then((pairs) => {
            if (canceled) {
                return;
            }

            setMoveLabelById((previous) => {
                const next = {...previous};
                pairs.forEach(([moveId, label]) => {
                    next[moveId] = label;
                });
                return next;
            });
        });

        return () => {
            canceled = true;
        };
    }, [bodyCells, moveLabelById]);

    const mergeMoveLabels = React.useCallback((labels: Record<string, string>) => {
        setMoveLabelById((previous) => ({
            ...previous,
            ...labels,
        }));
    }, []);

    return {
        moveLabelById,
        mergeMoveLabels,
    };
}
