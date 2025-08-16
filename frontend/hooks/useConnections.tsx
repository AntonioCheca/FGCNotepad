import {useState, useCallback} from "react";
import useApi from "@/hooks/useApi";
import api from "@/services/api";
import type {ConnectionType} from "@/src/types/combo";

/**
 * Hook for fetching Connection Types (CHAIN, CANCEL, etc.)
 * Mirrors your existing hooks style (useApi + api client)
 */
const useConnections = () => {
    const {request} = useApi();
    const [connections, setConnections] = useState<ConnectionType[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchConnections = useCallback(async (): Promise<ConnectionType[]> => {
        setLoading(true);
        try {
            const res = await request(() => api.get("/connection-types"));
            const data = (res?.data ?? []) as ConnectionType[];
            setConnections(data);
            return data;
        } finally {
            setLoading(false);
        }
    }, [request]); // stable reference to request

    return {connections, loading, fetchConnections};
};

export default useConnections;
