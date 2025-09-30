import axios from 'axios';

// Create a centralized Axios instance for all API calls.
const api = axios.create({
  baseURL: 'https://blockchain-negotiation-api-9wsj.onrender.com/api', // Production server URL
  //baseURL: 'http://localhost:5000/api', // Use this for local development
  headers: {
    'Content-Type': 'application/json',
  },
});

// Use an interceptor to automatically add the auth token to every request.
// This is a critical piece for handling authenticated sessions.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
