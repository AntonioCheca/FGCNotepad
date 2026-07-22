import React from "react";

import type {ComboCharacterOption, ComboMoveSearchOption} from "./comboFilterTypes";
import {filterComboMovesForCharacter, normalizeComboMoveSearchResults} from "./comboFilterUtils";

interface UseComboFirstMoveSearchProps {
    firstMoveQuery: string;
    characterId: string;
    selectedCharacter: ComboCharacterOption | null;
    searchMoves: (query: string, characterId?: string) => Promise<unknown>;
}

export function useComboFirstMoveSearch({firstMoveQuery, characterId, selectedCharacter, searchMoves}: UseComboFirstMoveSearchProps) {
    const [firstMoveOptions, setFirstMoveOptions] = React.useState<ComboMoveSearchOption[]>([]);
    const [searchingMoves, setSearchingMoves] = React.useState(false);

    React.useEffect(() => {
        const handle = window.setTimeout(() => {
            const trimmed = firstMoveQuery.trim();
            const queryToSend = trimmed.length > 0 ? trimmed : " ";

            setSearchingMoves(true);
            searchMoves(queryToSend, characterId || undefined)
                .then((result: unknown) => {
                    const normalized = normalizeComboMoveSearchResults(result);

                    if (selectedCharacter?.name) {
                        setFirstMoveOptions(filterComboMovesForCharacter(normalized, selectedCharacter.name));
                        return;
                    }

                    setFirstMoveOptions(normalized);
                })
                .catch(() => {
                    setFirstMoveOptions([]);
                })
                .finally(() => {
                    setSearchingMoves(false);
                });
        }, 250);

        return () => {
            window.clearTimeout(handle);
        };
    }, [firstMoveQuery, characterId, searchMoves, selectedCharacter]);

    return {firstMoveOptions, searchingMoves, clearFirstMoveOptions: () => setFirstMoveOptions([])};
}
