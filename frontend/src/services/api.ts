import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Base URL for static files (without /api)
export const BACKEND_BASE_URL = API_BASE_URL.replace('/api', '');

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Get the full URL for a resume file
 * @param resumeUrl - The relative resume URL from the database (e.g., /uploads/resumes/file.pdf)
 * @returns The full URL to access the resume
 */
export function getResumeUrl(resumeUrl: string | undefined): string {
  if (!resumeUrl) return '#';
  // If it's already a full URL, return as-is
  if (resumeUrl.startsWith('http')) return resumeUrl;
  // Otherwise, prepend the backend base URL
  return `${BACKEND_BASE_URL}${resumeUrl}`;
}

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
