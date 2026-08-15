// Base backend API URL, defaults to local host for development, or reads VITE_BACKEND_URL for production
export const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080').replace(/\/$/, '');
