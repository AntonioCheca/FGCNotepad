import {useState, useEffect} from "react";
import useApi from "@/hooks/useApi";
import api from "@/services/api";

export interface Character {
    id: string;
    name: string;
    game?: string;
    imageUrl?: string;
}

export function useCharacters() {
    const {request} = useApi();
    const [characters, setCharacters] = useState<Character[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchCharacters() {
            setLoading(true);
            try {
                console.log("Fetching characters...");
                const response = await request(() =>
                    api.get<Character[]>("/characters")
                );
                console.log("Full response:", response); // array of characters
                setCharacters(response);
                setError(null);
            } catch (err) {
                console.error("Error fetching characters:", err);
                setError(err as Error);
            } finally {
                console.log("Setting loading to false");
                setLoading(false);
            }
        }

        fetchCharacters();
    }, [request]);

    return {characters, loading, error};
}

