import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

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

// Handle authentication errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("jwt"); // Clear token if unauthorized
            window.location.href = "/login_check"; // Redirect to login
        }
        return Promise.reject(error);
    }
);

export const registerUser = async (username, password) => {
    const response = await api.post("/register", {username, password});
    return response.data;
};

export const loginUser = async (username, password) => {
    const response = await api.post("/login_check", {username, password});
    const {token} = response.data;
    localStorage.setItem("jwt", token);
    return response.data;
};

export const createPost = async (title, body) => {
    const token = localStorage.getItem("jwt"); // Ensure it's being retrieved

    if (!token) throw new Error("No token found");

    const response = await api.post(
        "/posts",
        {title, body},
    );

    return response.data
};

export const searchMoves = async (query) => {
    const token = localStorage.getItem("jwt"); // Ensure it's being retrieved

    if (!token) throw new Error("No token found");

    const response = await api.get(
        `/moves/search?query=${encodeURIComponent(query)}`,
    );

    return response.data
};

export const getSpecificMove = async (id) => {
    const token = localStorage.getItem("jwt"); // Ensure it's being retrieved

    if (!token) throw new Error("No token found");

    const response = await api.get(
        `/moves/${id}`,
    );

    return response.data
};

export const getSpecificPost = async (id) => {
    const token = localStorage.getItem("jwt"); // Ensure it's being retrieved

    if (!token) throw new Error("No token found");

    const response = await api.get(
        `/posts/${id}`,
    );

    return response.data
};

export default api;
