import {useCallback, useState} from "react";
import useApi from "@/hooks/useApi";
import api from "@/services/api";
import type {ComboSpacingOption} from "@/src/types/combo";

const useComboSpacings = () => {
    const {request} = useApi();
    const [spacings, setSpacings] = useState<ComboSpacingOption[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchComboSpacings = useCallback(async (): Promise<ComboSpacingOption[]> => {
        setLoading(true);
        try {
            const payload = await request(() => api.get("/combo-spacings"));
            const data = Array.isArray(payload) ? (payload as ComboSpacingOption[]) : [];
            setSpacings(data);
            return data;
        } finally {
            setLoading(false);
        }
    }, [request]);

    return {spacings, loading, fetchComboSpacings};
};

export default useComboSpacings;
