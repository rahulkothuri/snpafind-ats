import api from './api';
import type { AuthResponse, LoginRequest } from '../types';

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}

export const authService = {
  /**
   * Login with email and password
   * Returns JWT token and user data on success
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  /**
   * Register a new admin user with a new company
   * Requirements: 1.2, 1.3, 1.4
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>('/auth/register', data);
    return response.data;
  },

  /**
   * Logout and invalidate the current token
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      // Always clear local storage even if API call fails
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Get current authenticated user info
   */
  async getCurrentUser(): Promise<{ userId: string; companyId: string; role: string }> {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export default authService;
