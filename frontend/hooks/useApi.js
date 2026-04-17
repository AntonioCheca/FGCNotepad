// hooks/useApi.js
import {useCallback, useState} from "react";
import {useRouter} from "next/router";

const useApi = () => {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const request = useCallback(async (axiosCall) => {
        try {
            setLoading(true);
            const response = await axiosCall();
            setLoading(false);
            return response.data;
        } catch (error) {
            if (error.response?.status === 401) {
                localStorage.removeItem("jwt"); // Clear token if unauthorized
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
