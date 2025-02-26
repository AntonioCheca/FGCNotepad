import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const registerUser = async (username, password) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/register`, { username, password });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : { message: 'Network error' };
    }
};

export const loginUser = async (username, password) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/login`, { username, password });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : { message: 'Invalid username or password' };
    }
};