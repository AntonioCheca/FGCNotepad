import useApi from "@/hooks/useApi";
import api from "@/services/api";

const useSolverGames = () => {
    const {request} = useApi();

    const solveGame = async (payoffMatrix) => {
        try {
            // Send a GET request with the JSON body (as the endpoint expects JSON in the body)

            const jsonPayload = payoffMatrix;
            console.log("LOGGING JSON PAYLOAD", jsonPayload);

            const response = await request(() => api.post("/solve_game", {'game': jsonPayload}));

            return response.data; // Return the response data (equilibria)
        } catch (error) {
            console.error("Error solving game", error);
            throw error; // Re-throw the error for handling elsewhere
        }
    };

    return {solveGame};
};

export default useSolverGames;
