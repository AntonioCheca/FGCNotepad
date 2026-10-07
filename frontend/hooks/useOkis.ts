import {useCallback} from "react";
import useApi from "@/hooks/useApi";
import api from "@/services/api";
import type {OkiProfileDetail, OkiProfilePayload, OkiProfileSummary, OkiSearchFilters} from "@/src/types/oki";

export default function useOkis() {
    const {request} = useApi();

    const listOkis = useCallback((filters: OkiSearchFilters = {}) => {
        return request(() => api.get<OkiProfileSummary[]>("/okis", {params: filters})) as Promise<OkiProfileSummary[]>;
    }, [request]);

    const getOki = useCallback((id: number | string) => {
        return request(() => api.get<OkiProfileDetail>(`/okis/${id}`)) as Promise<OkiProfileDetail>;
    }, [request]);

    const createOki = useCallback((payload: OkiProfilePayload) => {
        return request(() => api.post<OkiProfileDetail>("/okis", payload)) as Promise<OkiProfileDetail>;
    }, [request]);

    const updateOki = useCallback((id: number | string, payload: OkiProfilePayload) => {
        return request(() => api.patch<OkiProfileDetail>(`/okis/${id}`, payload)) as Promise<OkiProfileDetail>;
    }, [request]);

    const deleteOki = useCallback((id: number | string) => {
        return request(() => api.delete(`/okis/${id}`)) as Promise<void>;
    }, [request]);

    // The character's moves that do not have an oki yet, in /moves/search result shape.
    const searchEnders = useCallback((query: string, characterId?: string) => {
        return request(() => api.get<unknown[]>("/okis/enders", {params: {query, characterId}})) as Promise<unknown[]>;
    }, [request]);

    return {listOkis, getOki, createOki, updateOki, deleteOki, searchEnders};
}
