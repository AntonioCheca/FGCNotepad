import {useCallback} from "react";
import useApi from "@/hooks/useApi";
import api from "@/services/api";

const useBlockstrings = () => {
    const {request} = useApi();

    const listBlockstrings = useCallback(async (options = {}) => {
        return await request(() => api.get("/blockstrings", {params: {...options}}));
    }, [request]);

    const getBlockstring = useCallback(async (id) => {
        return await request(() => api.get(`/blockstrings/${id}`));
    }, [request]);

    const createBlockstring = useCallback(async (payload) => {
        return await request(() => api.post("/blockstrings", payload));
    }, [request]);

    const updateBlockstring = useCallback(async (id, payload) => {
        return await request(() => api.patch(`/blockstrings/${id}`, payload));
    }, [request]);

    const deleteBlockstring = useCallback(async (id) => {
        return await request(() => api.delete(`/blockstrings/${id}`));
    }, [request]);

    return {listBlockstrings, getBlockstring, createBlockstring, updateBlockstring, deleteBlockstring};
};

export default useBlockstrings;
