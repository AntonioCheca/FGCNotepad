import React from "react";
import useApi from "@/hooks/useApi";
import api from "@/services/api";
import type {ResearchArticleLikes} from "@/src/types/research";

const RATE_LIMITED_MESSAGE = "Too many likes for now. Try again later.";
const FAILED_MESSAGE = "Could not save your like.";

// The article's like count, null until loaded (and if it cannot be read). Liking locks until the page reloads; nothing
// about the visitor is remembered.
export function useResearchArticleLikes(slug: string) {
    const {request} = useApi();
    const [count, setCount] = React.useState<number | null>(null);
    const [liked, setLiked] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const path = `/research/${encodeURIComponent(slug)}/likes`;

    React.useEffect(() => {
        let canceled = false;
        setCount(null);
        setLiked(false);
        request(() => api.get<ResearchArticleLikes>(path))
            .then((payload: ResearchArticleLikes) => {
                if (!canceled) {
                    setCount(payload.count);
                }
            })
            .catch(() => undefined);

        return () => {
            canceled = true;
        };
    }, [path, request]);

    const like = React.useCallback(async () => {
        if (count === null || liked) {
            return;
        }

        setLiked(true);
        setError(null);
        setCount(count + 1);
        try {
            const payload: ResearchArticleLikes = await request(() => api.post<ResearchArticleLikes>(path));
            setCount(payload.count);
        } catch (caught) {
            setLiked(false);
            setCount(count);
            const status = (caught as {response?: {status?: number}}).response?.status;
            setError(status === 429 ? RATE_LIMITED_MESSAGE : FAILED_MESSAGE);
        }
    }, [count, liked, path, request]);

    return {count, liked, like, error};
}
