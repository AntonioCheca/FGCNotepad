import React from "react";

import type {ScenarioListItem} from "@/hooks/useScenarios";
import type {ScenarioSearchDraft} from "./scenarioSearchTypes";

interface UseScenarioSearchResultsProps {
    filters: ScenarioSearchDraft;
    listScenarios: (filters: ScenarioSearchDraft & {size?: number}) => Promise<ScenarioListItem[]>;
}

export function useScenarioSearchResults({filters, listScenarios}: UseScenarioSearchResultsProps) {
    const [items, setItems] = React.useState<ScenarioListItem[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [hasLoadedAtLeastOnce, setHasLoadedAtLeastOnce] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
    const requestSequence = React.useRef(0);

    React.useEffect(() => {
        const currentRequestId = requestSequence.current + 1;
        requestSequence.current = currentRequestId;

        setLoading(true);
        setErrorMessage(null);

        listScenarios({
            q: filters.q,
            scenarioType: filters.scenarioType,
            defenderCharacterId: filters.defenderCharacterId,
            attackerCharacterId: filters.attackerCharacterId,
            triggerMoveId: filters.triggerMoveId,
            size: 80,
        })
            .then((data) => {
                if (requestSequence.current !== currentRequestId) {
                    return;
                }

                setItems(Array.isArray(data) ? data : []);
                setHasLoadedAtLeastOnce(true);
            })
            .catch(() => {
                if (requestSequence.current !== currentRequestId) {
                    return;
                }

                setErrorMessage("Unable to load scenarios for this filter set.");
                setHasLoadedAtLeastOnce(true);
            })
            .finally(() => {
                if (requestSequence.current === currentRequestId) {
                    setLoading(false);
                }
            });
    }, [listScenarios, filters]);

    return {items, loading, hasLoadedAtLeastOnce, errorMessage};
}
