import axios from "axios";

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

export function buildApiUrl(path) {
    const normalizedPath = String(path).replace(/^\/+/, "");

    return new URL(normalizedPath, API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`).toString();
}

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {"Content-Type": "application/json"},
    withCredentials: true,
});

let csrfToken = null;
let sessionCheckPending = isClient;
let resolveSessionCheck = null;
let sessionCheckPromise = isClient
    ? new Promise((resolve) => {
        resolveSessionCheck = resolve;
    })
    : Promise.resolve();

function isUnsafeMethod(method) {
    return ["POST", "PUT", "PATCH", "DELETE"].includes(String(method || "get").toUpperCase());
}

function getConfigPathname(config) {
    try {
        return new URL(config.url || "", config.baseURL || API_BASE_URL).pathname;
    } catch {
        return String(config.url || "");
    }
}

function skipsBrowserSessionCsrf(config) {
    const pathname = getConfigPathname(config);

    return pathname.endsWith("/login") || pathname.includes("/register") || pathname.includes("/shared-review/");
}

function isInvalidCsrfError(error) {
    const status = error?.response?.status;
    const message = error?.response?.data?.message;

    return status === 403 && message === "Invalid CSRF token.";
}

async function refreshCsrfToken() {
    const response = await api.get("/csrf-token");
    setCsrfToken(response.data?.csrfToken ?? null);
}

export const beginAuthSessionCheck = () => {
    if (!isClient || sessionCheckPending) {
        return;
    }

    sessionCheckPending = true;
    sessionCheckPromise = new Promise((resolve) => {
        resolveSessionCheck = resolve;
    });
};

export const completeAuthSessionCheck = () => {
    if (!isClient || !sessionCheckPending) {
        return;
    }

    sessionCheckPending = false;
    resolveSessionCheck?.();
    resolveSessionCheck = null;
    sessionCheckPromise = Promise.resolve();
};

export const setCsrfToken = (token) => {
    csrfToken = typeof token === "string" && token.length > 0 ? token : null;
};

export const clearCsrfToken = () => {
    csrfToken = null;
};

api.interceptors.request.use(async (config) => {
    if (isUnsafeMethod(config.method) && !csrfToken && sessionCheckPending && !skipsBrowserSessionCsrf(config)) {
        await sessionCheckPromise;
    }

    if (csrfToken && isUnsafeMethod(config.method) && !skipsBrowserSessionCsrf(config)) {
        config.headers["X-CSRF-Token"] = csrfToken;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error?.config;
        if (
            originalRequest
            && isUnsafeMethod(originalRequest.method)
            && !originalRequest._csrfRetry
            && isInvalidCsrfError(error)
        ) {
            originalRequest._csrfRetry = true;
            await refreshCsrfToken();

            return api(originalRequest);
        }

        return Promise.reject(error);
    },
);

export default api;
