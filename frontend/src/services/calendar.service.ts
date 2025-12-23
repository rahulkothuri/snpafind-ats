/**
 * Calendar Service
 * 
 * Handles API calls for calendar integration including OAuth flows,
 * connection status, and disconnection.
 * 
 * Requirements: 4.1, 5.1
 */

import api from './api';

// Calendar provider types
export type CalendarProvider = 'google' | 'microsoft';

// Calendar connection status
export interface CalendarConnectionStatus {
  google: {
    connected: boolean;
    email?: string;
    connectedAt?: string;
  };
  microsoft: {
    connected: boolean;
    email?: string;
    connectedAt?: string;
  };
}

// OAuth URL response
export interface OAuthUrlResponse {
  authUrl: string;
}

// Connected providers response
export interface ConnectedProvidersResponse {
  providers: CalendarProvider[];
}

export const calendarService = {
  /**
   * Get Google OAuth authorization URL
   * Requirements: 4.1
   */
  async getGoogleAuthUrl(redirectUri?: string): Promise<string> {
    const params = redirectUri ? `?redirectUri=${encodeURIComponent(redirectUri)}` : '';
    const response = await api.get<OAuthUrlResponse>(`/calendar/google/auth${params}`);
    return response.data.authUrl;
  },

  /**
   * Get Microsoft OAuth authorization URL
   * Requirements: 5.1
   */
  async getMicrosoftAuthUrl(redirectUri?: string): Promise<string> {
    const params = redirectUri ? `?redirectUri=${encodeURIComponent(redirectUri)}` : '';
    const response = await api.get<OAuthUrlResponse>(`/calendar/microsoft/auth${params}`);
    return response.data.authUrl;
  },

  /**
   * Get calendar connection status for current user
   * Requirements: 4.1, 5.1
   */
  async getConnectionStatus(): Promise<CalendarConnectionStatus> {
    const response = await api.get<CalendarConnectionStatus>('/calendar/status');
    return response.data;
  },

  /**
   * Get list of connected calendar providers
   * Requirements: 4.1, 5.1
   */
  async getConnectedProviders(): Promise<CalendarProvider[]> {
    const response = await api.get<ConnectedProvidersResponse>('/calendar/connected-providers');
    return response.data.providers;
  },

  /**
   * Disconnect a calendar provider
   * Requirements: 4.1, 5.1
   */
  async disconnect(provider: CalendarProvider): Promise<void> {
    await api.delete(`/calendar/${provider}/disconnect`);
  },
};

export default calendarService;
