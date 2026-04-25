// hooks/useMoves.js
import {useCallback} from "react";
import useApi from "@/hooks/useApi";
import api from "@/services/api";

const useMoves = () => {
    const {request} = useApi();

    const searchMoves = useCallback((query, characterId) => {
        const params = new URLSearchParams({query});
        if (characterId) {
            params.set("characterId", String(characterId));
            params.set("character_id", String(characterId));
        }

        return request(() => api.get(`/moves/search?${params.toString()}`));
    }, [request]);

    const listMoves = useCallback(() => request(() => api.get('/moves')), [request]);

    const getSpecificMove = useCallback((id) => request(() => api.get(`/moves/${id}`)), [request]);

    return {searchMoves, listMoves, getSpecificMove};
};

export default useMoves;
