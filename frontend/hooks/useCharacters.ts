import {useState, useEffect} from "react";
import useApi from "@/hooks/useApi";
import api from "@/services/api";

export interface Character {
    id: string;
    name: string;
    game?: string;
    imageUrl?: string;
}

let cachedCharacters: Character[] | null = null;

export function useCharacters() {
    const {request} = useApi();
    const [characters, setCharacters] = useState<Character[]>(cachedCharacters ?? []);
    const [loading, setLoading] = useState(!cachedCharacters);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (cachedCharacters) return;

        let canceled = false;
        setLoading(true);

        request(() => api.get<Character[]>("/characters"))
            .then((data) => {
                if (!canceled) {
                    cachedCharacters = data;
                    setCharacters(data);
                    setError(null);
                }
            })
            .catch((err) => !canceled && setError(err as Error))
            .finally(() => !canceled && setLoading(false));

        return () => {
            canceled = true;
        };
    }, [request]);

    return {characters, loading, error};
}

