import React from "react";

import {normalizeMoveSearchResults} from "./dynamicComboPanelUtils";
import type {DynamicComboMoveOption} from "./dynamicComboPanelTypes";

interface UseDynamicComboMoveSearchProps {
    starterQuery: string;
    selectedCharacterName: string;
    searchMoves: (query: string, characterId?: string) => Promise<unknown>;
}

export function useDynamicComboMoveSearch({starterQuery, selectedCharacterName, searchMoves}: UseDynamicComboMoveSearchProps) {
    const [starterOptions, setStarterOptions] = React.useState<DynamicComboMoveOption[]>([]);
    const [searchingMoves, setSearchingMoves] = React.useState(false);
    const searchMovesRef = React.useRef(searchMoves);

    React.useEffect(() => {
        searchMovesRef.current = searchMoves;
    }, [searchMoves]);

    React.useEffect(() => {
        let canceled = false;
        const normalizedQuery = starterQuery.trim();
        const backendQuery = selectedCharacterName
            ? `${selectedCharacterName}${normalizedQuery ? ` ${normalizedQuery}` : ""}`
            : normalizedQuery;

        if (backendQuery.length === 0) {
            setStarterOptions([]);
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setSearchingMoves(true);

            searchMovesRef.current(backendQuery)
                .then((results: unknown) => {
                    if (canceled) {
                        return;
                    }

                    const normalized = normalizeMoveSearchResults(results);
                    setStarterOptions(normalized.filter((option) => option.summary.toLowerCase().includes(normalizedQuery.toLowerCase())));
                })
                .catch(() => {
                    if (!canceled) {
                        setStarterOptions([]);
                    }
                })
                .finally(() => {
                    if (!canceled) {
                        setSearchingMoves(false);
                    }
                });
        }, 200);

        return () => {
            canceled = true;
            window.clearTimeout(timeoutId);
        };
    }, [starterQuery, selectedCharacterName]);

    return {starterOptions, searchingMoves, clearStarterOptions: () => setStarterOptions([])};
}
