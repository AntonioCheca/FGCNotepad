// services/api.js
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://fgc_backend:80/api";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {"Content-Type": "application/json"},
});

// Retrieve token from localStorage
const getToken = () => localStorage.getItem("jwt");

// Attach token to all requests
api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
