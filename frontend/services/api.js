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

// Retrieve token from localStorage (only on client side)
const getToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem("jwt");
    }
    return null;
};

// Attach token to all requests
api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
