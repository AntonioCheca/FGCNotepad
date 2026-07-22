import {useState, useCallback} from "react";
import useApi from "@/hooks/useApi";
import api from "@/services/api";
import type {ConnectionType} from "@/src/types/combo";

const useConnections = () => {
    const {request} = useApi();
    const [connections, setConnections] = useState<ConnectionType[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchConnections = useCallback(async (): Promise<ConnectionType[]> => {
        setLoading(true);
        try {
            const payload = await request(() => api.get("/connection-types"));
            const data = Array.isArray(payload) ? (payload as ConnectionType[]) : [];
            setConnections(data);
            return data;
        } finally {
            setLoading(false);
        }
    }, [request]);

    return {connections, loading, fetchConnections};
};

export default useConnections;
