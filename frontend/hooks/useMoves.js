// hooks/useMoves.js
import {useCallback} from "react";
import useApi from "@/hooks/useApi";
import api from "@/services/api";

const useMoves = () => {
    const {request} = useApi();

    const searchMoves = useCallback((query) =>
        request(() => api.get(`/moves/search?query=${encodeURIComponent(query)}`)), [request]);

    const listMoves = useCallback(() => request(() => api.get('/moves')), [request]);

    const getSpecificMove = useCallback((id) => request(() => api.get(`/moves/${id}`)), [request]);

    return {searchMoves, listMoves, getSpecificMove};
};

export default useMoves;
