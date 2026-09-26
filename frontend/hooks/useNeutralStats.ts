import React from "react";
import useApi from "@/hooks/useApi";
import api from "@/services/api";
import type {NeutralStatsOptions, NeutralStatsResponse} from "@/src/types/neutralStats";
import type {NeutralQuery} from "@/src/features/neutral-stats/neutralStatsQuery";

const REQUEST_DEBOUNCE_MS = 150;

export function useNeutralStatsOptions(characterId: string | null, opponentId: string | null) {
    const {request} = useApi();
    const [options, setOptions] = React.useState<NeutralStatsOptions | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        let canceled = false;
        const params: Record<string, string> = {};
        if (characterId) params.character = characterId;
        if (opponentId) params.opponent = opponentId;

        request(() => api.get<NeutralStatsOptions>("/neutral-stats/options", {params}))
            .then((data: NeutralStatsOptions) => {
                if (!canceled) {
                    setOptions(data);
                    setError(null);
                }
            })
            .catch(() => !canceled && setError("Could not load Neutral Stats filters."));

        return () => {
            canceled = true;
        };
    }, [request, characterId, opponentId]);

    return {options, error};
}

/**
 * Loads aggregated stats for the query. The last successful result stays available while a newer request runs or
 * after it fails; responses from superseded queries are ignored.
 */
export function useNeutralStats(query: NeutralQuery | null) {
    const {request} = useApi();
    const [data, setData] = React.useState<NeutralStatsResponse | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [retryToken, setRetryToken] = React.useState(0);
    const latestRequest = React.useRef(0);
    const queryKey = query === null ? null : JSON.stringify(query);

    React.useEffect(() => {
        if (queryKey === null) {
            latestRequest.current += 1;
            setData(null);
            setLoading(false);
            setError(null);
            return;
        }

        const requestId = latestRequest.current + 1;
        latestRequest.current = requestId;
        setLoading(true);

        const timer = window.setTimeout(() => {
            request(() => api.get<NeutralStatsResponse>("/neutral-stats", {params: JSON.parse(queryKey) as NeutralQuery}))
                .then((response: NeutralStatsResponse) => {
                    if (latestRequest.current === requestId) {
                        setData(response);
                        setError(null);
                    }
                })
                .catch(() => {
                    if (latestRequest.current === requestId) {
                        setError("Could not update the stats for these filters.");
                    }
                })
                .finally(() => {
                    if (latestRequest.current === requestId) {
                        setLoading(false);
                    }
                });
        }, REQUEST_DEBOUNCE_MS);

        return () => window.clearTimeout(timer);
    }, [request, queryKey, retryToken]);

    const retry = React.useCallback(() => setRetryToken((current) => current + 1), []);

    return {data, loading, error, retry};
}
