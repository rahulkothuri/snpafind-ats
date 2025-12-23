/**
 * Calendar Connection Settings Component
 * 
 * Allows users to connect/disconnect their Google Calendar and Microsoft Outlook
 * accounts for interview calendar sync.
 * 
 * Requirements: 4.1, 5.1
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, LoadingSpinner } from './index';
import { calendarService } from '../services/calendar.service';
import type { CalendarConnectionStatus, CalendarProvider } from '../services/calendar.service';

export interface CalendarConnectionSettingsProps {
  className?: string;
}

// Google Calendar icon
const GoogleCalendarIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.316 5.684H5.684v12.632h12.632V5.684z" fill="#fff"/>
    <path d="M18.316 24L24 18.316V5.684L18.316 0H5.684L0 5.684v12.632L5.684 24h12.632z" fill="#4285F4"/>
    <path d="M18.316 18.316H24V5.684h-5.684v12.632z" fill="#1967D2"/>
    <path d="M5.684 24v-5.684H0v5.684h5.684z" fill="#1967D2"/>
    <path d="M18.316 5.684V0H5.684v5.684h12.632z" fill="#34A853"/>
    <path d="M5.684 18.316H0V5.684h5.684v12.632z" fill="#188038"/>
    <path d="M18.316 24h5.684v-5.684h-5.684V24z" fill="#FBBC04"/>
    <path d="M18.316 5.684H24V0h-5.684v5.684z" fill="#EA4335"/>
    <path d="M5.684 5.684V0H0v5.684h5.684z" fill="#1967D2"/>
    <path d="M5.684 24h12.632v-5.684H5.684V24z" fill="#34A853"/>
    <path d="M8.526 15.158l1.263-1.263 2.211 2.21 4.737-4.736 1.263 1.263-6 6-3.474-3.474z" fill="#4285F4"/>
  </svg>
);

// Microsoft Outlook icon
const MicrosoftOutlookIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 7.387v10.478c0 .574-.467 1.041-1.041 1.041h-8.438v-11.56h8.438c.574 0 1.041.467 1.041 1.041z" fill="#0364B8"/>
    <path d="M24 7.387v10.478c0 .574-.467 1.041-1.041 1.041h-5.917V6.346h5.917c.574 0 1.041.467 1.041 1.041z" fill="#0078D4"/>
    <path d="M17.042 18.906h5.917c.574 0 1.041-.467 1.041-1.041v-2.604h-6.958v3.645z" fill="#28A8EA"/>
    <path d="M9.563 5.302H1.125C.504 5.302 0 5.806 0 6.427v11.146c0 .621.504 1.125 1.125 1.125h8.438c.621 0 1.125-.504 1.125-1.125V6.427c0-.621-.504-1.125-1.125-1.125z" fill="#0078D4"/>
    <path d="M5.344 9.521c-2.07 0-3.75 1.68-3.75 3.75s1.68 3.75 3.75 3.75 3.75-1.68 3.75-3.75-1.68-3.75-3.75-3.75zm0 6.094c-1.293 0-2.344-1.05-2.344-2.344 0-1.293 1.05-2.344 2.344-2.344 1.293 0 2.344 1.05 2.344 2.344 0 1.293-1.05 2.344-2.344 2.344z" fill="#fff"/>
  </svg>
);

export function CalendarConnectionSettings({ className = '' }: CalendarConnectionSettingsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<CalendarConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectingProvider, setConnectingProvider] = useState<CalendarProvider | null>(null);
  const [disconnectingProvider, setDisconnectingProvider] = useState<CalendarProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for OAuth callback results in URL params
  useEffect(() => {
    const calendarConnected = searchParams.get('calendar_connected');
    const calendarError = searchParams.get('calendar_error');

    if (calendarConnected) {
      const providerName = calendarConnected === 'google' ? 'Google Calendar' : 'Microsoft Outlook';
      setSuccessMessage(`${providerName} connected successfully!`);
      // Clear the URL params
      searchParams.delete('calendar_connected');
      setSearchParams(searchParams, { replace: true });
      // Refresh status
      fetchStatus();
    }

    if (calendarError) {
      setError(`Failed to connect calendar: ${calendarError}`);
      // Clear the URL params
      searchParams.delete('calendar_error');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      const connectionStatus = await calendarService.getConnectionStatus();
      setStatus(connectionStatus);
    } catch (err) {
      console.error('Failed to fetch calendar status:', err);
      setError('Failed to load calendar connection status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnect = async (provider: CalendarProvider) => {
    try {
      setConnectingProvider(provider);
      setError(null);
      
      const authUrl = provider === 'google' 
        ? await calendarService.getGoogleAuthUrl()
        : await calendarService.getMicrosoftAuthUrl();
      
      // Redirect to OAuth provider
      window.location.href = authUrl;
    } catch (err) {
      console.error(`Failed to initiate ${provider} OAuth:`, err);
      setError(`Failed to connect to ${provider === 'google' ? 'Google Calendar' : 'Microsoft Outlook'}`);
      setConnectingProvider(null);
    }
  };

  const handleDisconnect = async (provider: CalendarProvider) => {
    try {
      setDisconnectingProvider(provider);
      setError(null);
      
      await calendarService.disconnect(provider);
      
      const providerName = provider === 'google' ? 'Google Calendar' : 'Microsoft Outlook';
      setSuccessMessage(`${providerName} disconnected successfully`);
      
      // Refresh status
      await fetchStatus();
    } catch (err) {
      console.error(`Failed to disconnect ${provider}:`, err);
      setError(`Failed to disconnect ${provider === 'google' ? 'Google Calendar' : 'Microsoft Outlook'}`);
    } finally {
      setDisconnectingProvider(null);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex justify-center py-8 ${className}`}>
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-[#111827]">Calendar Integration</h3>
        <p className="text-sm text-[#64748b] mt-1">
          Connect your calendar to automatically sync interview schedules
        </p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {successMessage}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Calendar Providers */}
      <div className="space-y-4">
        {/* Google Calendar */}
        <CalendarProviderCard
          provider="google"
          name="Google Calendar"
          description="Sync interviews with Google Calendar and create Google Meet links"
          icon={<GoogleCalendarIcon />}
          isConnected={status?.google.connected || false}
          connectedEmail={status?.google.email}
          connectedAt={status?.google.connectedAt}
          isConnecting={connectingProvider === 'google'}
          isDisconnecting={disconnectingProvider === 'google'}
          onConnect={() => handleConnect('google')}
          onDisconnect={() => handleDisconnect('google')}
        />

        {/* Microsoft Outlook */}
        <CalendarProviderCard
          provider="microsoft"
          name="Microsoft Outlook"
          description="Sync interviews with Outlook Calendar and create Teams meeting links"
          icon={<MicrosoftOutlookIcon />}
          isConnected={status?.microsoft.connected || false}
          connectedEmail={status?.microsoft.email}
          connectedAt={status?.microsoft.connectedAt}
          isConnecting={connectingProvider === 'microsoft'}
          isDisconnecting={disconnectingProvider === 'microsoft'}
          onConnect={() => handleConnect('microsoft')}
          onDisconnect={() => handleDisconnect('microsoft')}
        />
      </div>

      {/* Info Note */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg">
        <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <div className="text-sm text-blue-700">
          <p className="font-medium">How calendar sync works</p>
          <p className="mt-1 text-blue-600">
            When you schedule an interview, calendar events will be automatically created for all panel members 
            who have connected their calendars. Meeting links (Google Meet or Teams) will be generated based on 
            the interview mode you select.
          </p>
        </div>
      </div>
    </div>
  );
}


// Calendar Provider Card Sub-component
interface CalendarProviderCardProps {
  provider: CalendarProvider;
  name: string;
  description: string;
  icon: React.ReactNode;
  isConnected: boolean;
  connectedEmail?: string;
  connectedAt?: string;
  isConnecting: boolean;
  isDisconnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

function CalendarProviderCard({
  provider,
  name,
  description,
  icon,
  isConnected,
  connectedEmail,
  connectedAt,
  isConnecting,
  isDisconnecting,
  onConnect,
  onDisconnect,
}: CalendarProviderCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-sm" data-provider={provider}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {/* Provider Icon */}
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center">
            {icon}
          </div>
          
          {/* Provider Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-semibold text-[#111827]">{name}</h4>
              {isConnected && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  Connected
                </span>
              )}
            </div>
            <p className="text-sm text-[#64748b] mt-1">{description}</p>
            
            {/* Connected Account Info */}
            {isConnected && connectedEmail && (
              <div className="mt-3 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-[#374151]">
                  <svg className="w-4 h-4 text-[#64748b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{connectedEmail}</span>
                </div>
                {connectedAt && (
                  <div className="flex items-center gap-1.5 text-[#64748b]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Connected {formatDate(connectedAt)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex-shrink-0 ml-4">
          {isConnected ? (
            <Button
              variant="secondary"
              onClick={onDisconnect}
              disabled={isDisconnecting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              {isDisconnecting ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Disconnecting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                  Disconnect
                </span>
              )}
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={onConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Connecting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Connect
                </span>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CalendarConnectionSettings;
