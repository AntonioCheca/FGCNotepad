// services/api.js
import axios from "axios";

// Check if we're running on the client side (browser) or server side (Docker container)
const isClient = typeof window !== 'undefined';

const API_BASE_URL = isClient
    ? "http://localhost:8000/api"  // Browser can reach localhost:8000
    : "http://nginx:80/api";       // Docker container uses service name

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
