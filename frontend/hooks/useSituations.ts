import {useCallback} from "react";
import useApi from "@/hooks/useApi";
import api from "@/services/api";
import type {SituationPayload, SituationSummary, SituationTypeOption} from "@/src/types/situation";

export function useSituations() {
    const {request} = useApi();

    const fetchSituationTypes = useCallback(async (): Promise<SituationTypeOption[]> => {
        return request(() => api.get("/situations/types"));
    }, [request]);

    const fetchSituations = useCallback(async (options: {typeCode?: string; includeArchived?: boolean} = {}): Promise<SituationSummary[]> => {
        return request(() => api.get("/situations", {params: options}));
    }, [request]);

    const createSituation = useCallback(async (payload: SituationPayload): Promise<SituationSummary> => {
        return request(() => api.post("/situations", payload));
    }, [request]);

    const updateSituation = useCallback(async (id: number, payload: SituationPayload): Promise<SituationSummary> => {
        return request(() => api.patch(`/situations/${id}`, payload));
    }, [request]);

    const archiveSituation = useCallback(async (id: number): Promise<void> => {
        await request(() => api.delete(`/situations/${id}`));
    }, [request]);

    return {fetchSituationTypes, fetchSituations, createSituation, updateSituation, archiveSituation};
}
