import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api', // Adjust according to Symfony API routes
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
