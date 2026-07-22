import React from "react";

import {filterScenarioMovesForAttacker, normalizeScenarioMoveSearchResults} from "./scenarioSearchUtils";
import type {ScenarioCharacterOption, ScenarioTriggerMoveOption} from "./scenarioSearchTypes";

interface UseScenarioTriggerMoveSearchProps {
    triggerMoveInput: string;
    attackerCharacterId: string;
    selectedAttacker: ScenarioCharacterOption | null;
    searchMoves: (query: string, characterId?: string) => Promise<unknown>;
}

export function useScenarioTriggerMoveSearch({triggerMoveInput, attackerCharacterId, selectedAttacker, searchMoves}: UseScenarioTriggerMoveSearchProps) {
    const [triggerMoveOptions, setTriggerMoveOptions] = React.useState<ScenarioTriggerMoveOption[]>([]);
    const [searchingMoves, setSearchingMoves] = React.useState(false);

    React.useEffect(() => {
        const handle = window.setTimeout(() => {
            const queryToSend = triggerMoveInput.trim() || " ";

            setSearchingMoves(true);
            searchMoves(queryToSend, attackerCharacterId || undefined)
                .then((result: unknown) => {
                    const normalized = normalizeScenarioMoveSearchResults(result);

                    if (selectedAttacker?.name) {
                        setTriggerMoveOptions(filterScenarioMovesForAttacker(normalized, selectedAttacker.name));
                        return;
                    }

                    setTriggerMoveOptions(normalized);
                })
                .catch(() => {
                    setTriggerMoveOptions([]);
                })
                .finally(() => {
                    setSearchingMoves(false);
                });
        }, 250);

        return () => {
            window.clearTimeout(handle);
        };
    }, [triggerMoveInput, attackerCharacterId, searchMoves, selectedAttacker]);

    return {triggerMoveOptions, searchingMoves, clearTriggerMoveOptions: () => setTriggerMoveOptions([])};
}
