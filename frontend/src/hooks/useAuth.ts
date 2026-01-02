import { useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import { queryClient } from '../lib/queryClient';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    // Clear any stale cached data from previous user sessions
    queryClient.clear();
  }, []);

  /**
   * Logout function - clears authentication data and query cache
   * Requirements: 6.1, 6.2 - Clear token and user data from localStorage
   * Also clears the React Query cache to ensure no data leaks between users
   * @param onComplete - Optional callback to execute after logout (e.g., navigation)
   */
  const logout = useCallback((onComplete?: () => void) => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    // Clear the entire query cache to ensure no user-specific data leaks
    queryClient.clear();
    // Call the callback after clearing auth data
    if (onComplete) {
      onComplete();
    }
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
