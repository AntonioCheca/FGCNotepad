import {useState, useEffect} from "react";
import useApi from "@/hooks/useApi";
import api from "@/services/api";

export interface Character {
    id: string;
    name: string;
    life?: number;
    game?: string;
    imageUrl?: string;
}

let cachedCharacters: Character[] | null = null;

export function useCharacters() {
    const {request} = useApi();
    const [characters, setCharacters] = useState<Character[]>(cachedCharacters ?? []);
    const hasLifeInCache = cachedCharacters !== null && cachedCharacters.every((character) => typeof character.life === "number");
    const [loading, setLoading] = useState(!hasLifeInCache);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const cacheHasLife = cachedCharacters !== null && cachedCharacters.every((character) => typeof character.life === "number");
        if (cacheHasLife) return;

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

