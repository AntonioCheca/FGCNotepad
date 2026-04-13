import useApi from "@/hooks/useApi";
import api from "@/services/api";

const useSolverGames = () => {
    const {request} = useApi();

    const solveGame = async (payoffMatrix) => {
        try {
            const jsonPayload = payoffMatrix;

            const response = await request(() => api.post("/solve_game", {game: jsonPayload}));

            return {
                equilibria: response.equilibria, derivedMetrics: response.derivedMetrics
            };
        } catch (error) {
            console.error("Error solving game", error);
            throw error; // Re-throw the error for handling elsewhere
        }
    };

    return {solveGame};
};

export default useSolverGames;
