// hooks/useApi.js
import {useCallback, useState} from "react";
import {useRouter} from "next/router";
import {clearStoredAuthToken} from "@/services/api";

const useApi = () => {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

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
                router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
            }
            throw error;
        } finally {
            setLoading(false);
        }
    }, [router]);

    return {request, loading};
};

export default useApi;
