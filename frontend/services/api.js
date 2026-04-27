// services/api.js
import axios from "axios";

// Check if we're running on the client side (browser) or server side (Node runtime)
const isClient = typeof window !== 'undefined';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (isClient
    ? "http://127.0.0.1:8000/api"
    : "http://nginx:80/api");

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {"Content-Type": "application/json"},
});

const AUTH_TOKEN_STORAGE_KEYS = ["jwt", "token"];

const normalizeToken = (token) => {
    if (typeof token !== "string") {
        return null;
    }

    const trimmedToken = token.trim();
    if (!trimmedToken) {
        return null;
    }

    return trimmedToken.replace(/^Bearer\s+/i, "").trim() || null;
};

export const getStoredAuthToken = () => {
    if (typeof window === "undefined") {
        return null;
    }

    for (const key of AUTH_TOKEN_STORAGE_KEYS) {
        const normalizedToken = normalizeToken(localStorage.getItem(key));
        if (normalizedToken) {
            return normalizedToken;
        }
    }

    return null;
};

export const setStoredAuthToken = (token) => {
    if (typeof window === "undefined") {
        return;
    }

    const normalizedToken = normalizeToken(token);
    if (!normalizedToken) {
        clearStoredAuthToken();
        return;
    }

    localStorage.setItem("jwt", normalizedToken);
    localStorage.removeItem("token");
};

export const clearStoredAuthToken = () => {
    if (typeof window === "undefined") {
        return;
    }

    for (const key of AUTH_TOKEN_STORAGE_KEYS) {
        localStorage.removeItem(key);
    }
};

// Attach token to all requests
api.interceptors.request.use((config) => {
    const token = getStoredAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
