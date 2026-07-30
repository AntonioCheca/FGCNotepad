import {useCallback} from "react";
import useApi from "@/hooks/useApi";
import api from "@/services/api";
import type {CharacterReversal, CharacterReversalPayload, OkiProfileDetail, OkiProfilePayload, OkiProfileSummary, OkiSearchFilters} from "@/src/types/oki";

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

    const listReversals = useCallback((characterId?: string) => {
        return request(() => api.get<CharacterReversal[]>("/okis/reversals", {params: characterId ? {characterId} : {}})) as Promise<CharacterReversal[]>;
    }, [request]);

    const createReversal = useCallback((payload: CharacterReversalPayload) => {
        return request(() => api.post<CharacterReversal>("/okis/reversals", payload)) as Promise<CharacterReversal>;
    }, [request]);

    const updateReversal = useCallback((id: number | string, payload: CharacterReversalPayload) => {
        return request(() => api.patch<CharacterReversal>(`/okis/reversals/${id}`, payload)) as Promise<CharacterReversal>;
    }, [request]);

    const deleteReversal = useCallback((id: number | string) => {
        return request(() => api.delete(`/okis/reversals/${id}`)) as Promise<void>;
    }, [request]);

    return {listOkis, getOki, createOki, updateOki, deleteOki, listReversals, createReversal, updateReversal, deleteReversal};
}
