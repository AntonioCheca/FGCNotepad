import React from "react";
import useApi from "@/hooks/useApi";
import api from "@/services/api";
import type {TurnsGuide} from "@/src/types/guide";

export function useTurnsGuide() {
    const {request} = useApi();
    const [guide, setGuide] = React.useState<TurnsGuide | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        let canceled = false;
        setLoading(true);
        setError(null);

        request(() => api.get<TurnsGuide>("/guides/turns"))
            .then((payload: TurnsGuide) => {
                if (!canceled) {
                    setGuide(payload);
                }
            })
            .catch(() => {
                if (!canceled) {
                    setError("Could not load the turns guide.");
                }
            })
            .finally(() => {
                if (!canceled) {
                    setLoading(false);
                }
            });

        return () => {
            canceled = true;
        };
    }, [request]);

    return {guide, loading, error};
}
