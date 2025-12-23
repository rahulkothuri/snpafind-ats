/**
 * OAuth Callback Page
 * 
 * Handles OAuth callback redirects from Google and Microsoft.
 * Shows a loading state while processing and displays success/error messages.
 * 
 * Requirements: 4.1, 5.1
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '../components';

type CallbackStatus = 'processing' | 'success' | 'error';

interface OAuthCallbackPageProps {
  provider: 'google' | 'microsoft';
}

// Google Calendar icon
const GoogleCalendarIcon = () => (
  <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
  <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 7.387v10.478c0 .574-.467 1.041-1.041 1.041h-8.438v-11.56h8.438c.574 0 1.041.467 1.041 1.041z" fill="#0364B8"/>
    <path d="M24 7.387v10.478c0 .574-.467 1.041-1.041 1.041h-5.917V6.346h5.917c.574 0 1.041.467 1.041 1.041z" fill="#0078D4"/>
    <path d="M17.042 18.906h5.917c.574 0 1.041-.467 1.041-1.041v-2.604h-6.958v3.645z" fill="#28A8EA"/>
    <path d="M9.563 5.302H1.125C.504 5.302 0 5.806 0 6.427v11.146c0 .621.504 1.125 1.125 1.125h8.438c.621 0 1.125-.504 1.125-1.125V6.427c0-.621-.504-1.125-1.125-1.125z" fill="#0078D4"/>
    <path d="M5.344 9.521c-2.07 0-3.75 1.68-3.75 3.75s1.68 3.75 3.75 3.75 3.75-1.68 3.75-3.75-1.68-3.75-3.75-3.75zm0 6.094c-1.293 0-2.344-1.05-2.344-2.344 0-1.293 1.05-2.344 2.344-2.344 1.293 0 2.344 1.05 2.344 2.344 0 1.293-1.05 2.344-2.344 2.344z" fill="#fff"/>
  </svg>
);

export function OAuthCallbackPage({ provider }: OAuthCallbackPageProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const providerName = provider === 'google' ? 'Google Calendar' : 'Microsoft Outlook';
  const ProviderIcon = provider === 'google' ? GoogleCalendarIcon : MicrosoftOutlookIcon;

  useEffect(() => {
    // Check for error in URL params
    const error = searchParams.get('error') || searchParams.get('calendar_error');
    const errorDescription = searchParams.get('error_description');
    const connected = searchParams.get('calendar_connected');

    if (error) {
      setStatus('error');
      setErrorMessage(errorDescription || error || 'An unknown error occurred');
      // Redirect to settings after showing error
      setTimeout(() => {
        navigate(`/settings?calendar_error=${encodeURIComponent(errorDescription || error)}`, { replace: true });
      }, 3000);
    } else if (connected) {
      setStatus('success');
      // Redirect to settings after showing success
      setTimeout(() => {
        navigate(`/settings?calendar_connected=${provider}`, { replace: true });
      }, 2000);
    } else {
      // If we're on this page without params, the backend callback will handle the redirect
      // Just show processing state
      setStatus('processing');
    }
  }, [searchParams, navigate, provider]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-[#e2e8f0] p-8 max-w-md w-full text-center">
        {/* Provider Icon */}
        <div className="flex justify-center mb-6">
          <ProviderIcon />
        </div>

        {/* Status Content */}
        {status === 'processing' && (
          <>
            <h1 className="text-xl font-semibold text-[#111827] mb-2">
              Connecting {providerName}
            </h1>
            <p className="text-[#64748b] mb-6">
              Please wait while we complete the connection...
            </p>
            <div className="flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-[#111827] mb-2">
              Successfully Connected!
            </h1>
            <p className="text-[#64748b] mb-4">
              Your {providerName} account has been connected successfully.
            </p>
            <p className="text-sm text-[#9ca3af]">
              Redirecting to settings...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-[#111827] mb-2">
              Connection Failed
            </h1>
            <p className="text-[#64748b] mb-4">
              We couldn't connect your {providerName} account.
            </p>
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}
            <p className="text-sm text-[#9ca3af]">
              Redirecting to settings...
            </p>
          </>
        )}

        {/* Manual Navigation Link */}
        <div className="mt-6 pt-6 border-t border-[#e2e8f0]">
          <button
            onClick={() => navigate('/settings', { replace: true })}
            className="text-sm text-[#0b6cf0] hover:text-[#0958c7] font-medium"
          >
            Go to Settings →
          </button>
        </div>
      </div>
    </div>
  );
}

// Wrapper components for each provider
export function GoogleOAuthCallbackPage() {
  return <OAuthCallbackPage provider="google" />;
}

export function MicrosoftOAuthCallbackPage() {
  return <OAuthCallbackPage provider="microsoft" />;
}

export default OAuthCallbackPage;
