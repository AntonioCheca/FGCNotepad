// hooks/useApi.js
import {useCallback, useEffect, useRef, useState} from "react";
import {useRouter} from "next/router";
import {clearStoredAuthToken} from "@/services/api";

const useApi = () => {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const routerPushRef = useRef(router.push);

    useEffect(() => {
        routerPushRef.current = router.push;
    }, [router.push]);

    /**
     * Executes an API call and always returns the normalized payload.
     * Never returns a raw Axios response to callers.
     */
    const request = useCallback(async (axiosCall) => {
        setLoading(true);
        try {
            const response = await axiosCall();

            if (response && typeof response === "object" && "data" in response) {
                return response.data;
            }

            return response;
        } catch (error) {
            if (error.response?.status === 401) {
                clearStoredAuthToken();
                window.dispatchEvent(new Event("auth:unauthorized"));
                routerPushRef.current(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
            }
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    return {request, loading};
};

export default useApi;
