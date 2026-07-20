// hooks/useApi.js
import {useCallback, useRef, useState} from "react";
import {clearCsrfToken} from "@/services/api";

const useApi = () => {
    const [loading, setLoading] = useState(false);
    const redirectingRef = useRef(false);

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
                clearCsrfToken();
                window.dispatchEvent(new Event("auth:unauthorized"));

                const currentPath = `${window.location.pathname}${window.location.search}`;
                const isAuthRoute = window.location.pathname.startsWith('/auth/');

                if (!isAuthRoute && !redirectingRef.current) {
                    redirectingRef.current = true;
                    localStorage.setItem('redirectAfterLogin', currentPath);
                }
            }
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    return {request, loading};
};

export default useApi;
