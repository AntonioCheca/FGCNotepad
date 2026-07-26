import React from "react";

import type {ComboCharacterOption, ComboMoveSearchOption} from "./comboFilterTypes";
import {filterComboMovesForCharacter, normalizeComboMoveSearchResults} from "./comboFilterUtils";

interface UseComboMoveSearchProps {
    moveQuery: string;
    characterId: string;
    selectedCharacter: ComboCharacterOption | null;
    searchMoves: (query: string, characterId?: string) => Promise<unknown>;
}

export function useComboMoveSearch({moveQuery, characterId, selectedCharacter, searchMoves}: UseComboMoveSearchProps) {
    const [moveOptions, setMoveOptions] = React.useState<ComboMoveSearchOption[]>([]);
    const [searchingMoves, setSearchingMoves] = React.useState(false);

    React.useEffect(() => {
        const handle = window.setTimeout(() => {
            const trimmed = moveQuery.trim();
            const queryToSend = trimmed.length > 0 ? trimmed : " ";

            setSearchingMoves(true);
            searchMoves(queryToSend, characterId || undefined)
                .then((result: unknown) => {
                    const normalized = normalizeComboMoveSearchResults(result);

                    if (selectedCharacter?.name) {
                        setMoveOptions(filterComboMovesForCharacter(normalized, selectedCharacter.name));
                        return;
                    }

                    setMoveOptions(normalized);
                })
                .catch(() => {
                    setMoveOptions([]);
                })
                .finally(() => {
                    setSearchingMoves(false);
                });
        }, 250);

        return () => {
            window.clearTimeout(handle);
        };
    }, [moveQuery, characterId, searchMoves, selectedCharacter]);

    return {moveOptions, searchingMoves, clearMoveOptions: () => setMoveOptions([])};
}
