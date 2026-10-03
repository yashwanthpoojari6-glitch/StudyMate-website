// services/api.js — Axios instance with auth interceptor and error handling
// This single Axios instance is imported throughout the app for all API calls.

import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Vite proxy handles forwarding to localhost:5000
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // 30s timeout for AI endpoints which may be slow
});

// ── Request Interceptor: Attach JWT token to every request ────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('studymate_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: Handle 401 globally ─────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear auth state and redirect to login
      localStorage.removeItem('studymate_token');
      localStorage.removeItem('studymate_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
