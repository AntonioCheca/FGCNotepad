import React from "react";

import type {CharacterOption, MoveOption} from "./scenarioEditorTypes";
import {buildTriggerMoveSummaryFromSpecificMove, filterMoveOptionsForCharacter, normalizeMoveListResults} from "./scenarioEditorMoveSearch";

interface UseScenarioTriggerMoveSearchProps {
    attackerCharacterId: string;
    selectedAttacker: CharacterOption | null;
    triggerMoveQuery: string;
    initialTriggerMoveId?: string | null;
    initialTriggerMoveLabel?: string | null;
    searchMoves: (query: string, characterId?: string) => Promise<unknown>;
    getSpecificMove: (id: string) => Promise<unknown>;
    onResolvedInitialMove: (move: MoveOption) => void;
    onResetTriggerMove: () => void;
}

export function useScenarioTriggerMoveSearch({
    attackerCharacterId,
    selectedAttacker,
    triggerMoveQuery,
    initialTriggerMoveId,
    initialTriggerMoveLabel,
    searchMoves,
    getSpecificMove,
    onResolvedInitialMove,
    onResetTriggerMove,
}: UseScenarioTriggerMoveSearchProps) {
    const searchMovesRef = React.useRef(searchMoves);
    const getSpecificMoveRef = React.useRef(getSpecificMove);
    const [moveOptions, setMoveOptions] = React.useState<MoveOption[]>([]);
    const [isSearchingMoves, setIsSearchingMoves] = React.useState(false);

    React.useEffect(() => {
        searchMovesRef.current = searchMoves;
        getSpecificMoveRef.current = getSpecificMove;
    }, [searchMoves, getSpecificMove]);

    React.useEffect(() => {
        if (!initialTriggerMoveId) {
            return;
        }

        const fallbackSummary = initialTriggerMoveLabel?.trim() || initialTriggerMoveId;

        getSpecificMoveRef.current(initialTriggerMoveId)
            .then((result) => {
                const summary = buildTriggerMoveSummaryFromSpecificMove(result, fallbackSummary);
                onResolvedInitialMove({id: initialTriggerMoveId, summary, characterId: ""});
            })
            .catch(() => {
                onResolvedInitialMove({id: initialTriggerMoveId, summary: fallbackSummary, characterId: ""});
            });
    }, [initialTriggerMoveId, initialTriggerMoveLabel, onResolvedInitialMove]);

    React.useEffect(() => {
        if (!attackerCharacterId) {
            setMoveOptions([]);
            onResetTriggerMove();
            return;
        }

        if (!selectedAttacker) {
            setMoveOptions([]);
            return;
        }

        const query = triggerMoveQuery.trim();
        const backendQuery = query === "" ? " " : query;

        let canceled = false;
        setIsSearchingMoves(true);

        searchMovesRef.current(backendQuery, attackerCharacterId)
            .then((results) => {
                if (canceled) {
                    return;
                }

                const normalized = normalizeMoveListResults(results);
                setMoveOptions(filterMoveOptionsForCharacter(normalized, selectedAttacker.name));
            })
            .catch(() => {
                if (!canceled) {
                    setMoveOptions([]);
                }
            })
            .finally(() => {
                if (!canceled) {
                    setIsSearchingMoves(false);
                }
            });

        return () => {
            canceled = true;
        };
    }, [attackerCharacterId, selectedAttacker, triggerMoveQuery, onResetTriggerMove]);

    return {moveOptions, isSearchingMoves};
}
