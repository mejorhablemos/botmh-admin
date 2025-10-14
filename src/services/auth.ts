import { api } from './api';
import type { LoginRequest, LoginResponse, AdminUser } from '../types/auth';

/**
 * Authentication service
 * Handles login, logout, and user session management
 */
export const authService = {
  /**
   * Login with username (email) and password
   * Stores JWT token and user data in localStorage
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // Backend espera 'email', no 'username'
    const payload = {
      email: credentials.username, // username es en realidad el email
      password: credentials.password, // no se valida en desarrollo
    };

    const response = await api.post('/admin/auth/login', payload);

    // Backend devuelve {success, data: {user, token}}
    const { data } = response.data;
    const { token, user } = data;

    // Store token and user in localStorage
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));

    return { token, user };
  },

  /**
   * Logout
   * Clears token and user data from localStorage
   */
  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser(): AdminUser | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr) as AdminUser;
    } catch {
      return null;
    }
  },

  /**
   * Get token from localStorage
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  /**
   * Verify token with backend (calls /me endpoint)
   */
  async verifyToken(): Promise<AdminUser> {
    const response = await api.get('/admin/auth/me');

    // Backend devuelve {success, data: user}
    const { data } = response.data;

    // Update user in localStorage
    localStorage.setItem('user', JSON.stringify(data));

    return data;
  },
};
