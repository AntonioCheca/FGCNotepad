// services/api.js
import axios from "axios";

// Check if we're running on the client side (browser) or server side (Node runtime)
const isClient = typeof window !== 'undefined';

function resolveApiBaseUrl() {
    const configuredUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!isClient) {
        return configuredUrl || "http://nginx:80/api";
    }

    const fallbackUrl = "http://127.0.0.1:8000/api";
    const apiUrl = configuredUrl || fallbackUrl;

    try {
        const parsedUrl = new URL(apiUrl, window.location.origin);
        const pageHost = window.location.hostname;
        const loopbackHosts = new Set(["localhost", "127.0.0.1"]);

        if (loopbackHosts.has(parsedUrl.hostname) && loopbackHosts.has(pageHost)) {
            parsedUrl.hostname = pageHost;
        }

        return parsedUrl.toString();
    } catch {
        return apiUrl;
    }
}

const API_BASE_URL = resolveApiBaseUrl();

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {"Content-Type": "application/json"},
    withCredentials: true,
});

let csrfToken = null;

export const setCsrfToken = (token) => {
    csrfToken = typeof token === "string" && token.length > 0 ? token : null;
};

export const clearCsrfToken = () => {
    csrfToken = null;
};

api.interceptors.request.use((config) => {
    const method = String(config.method || "get").toUpperCase();
    if (csrfToken && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
        config.headers["X-CSRF-Token"] = csrfToken;
    }
    return config;
});

export default api;
