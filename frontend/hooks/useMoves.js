// hooks/useMoves.js
import useApi from "@/hooks/useApi";
import api from "@/services/api";

const useMoves = () => {
    const {request} = useApi();

    const searchMoves = (query) =>
        request(() => api.get(`/moves/search?query=${encodeURIComponent(query)}`));

    const listMoves = () => request(() => api.get('/moves'));

    const getSpecificMove = (id) => request(() => api.get(`/moves/${id}`));

    return {searchMoves, listMoves, getSpecificMove};
};

export default useMoves;
