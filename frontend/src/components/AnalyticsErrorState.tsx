/**
 * AnalyticsErrorState Component - Requirements 10.3
 * 
 * Displays error message when API fails with retry functionality.
 * Used consistently across all analytics sections.
 */

import { MdError, MdRefresh } from 'react-icons/md';

interface AnalyticsErrorStateProps {
  message?: string;
  onRetry: () => void;
  className?: string;
  compact?: boolean;
}

export function AnalyticsErrorState({
  message = 'Failed to load data',
  onRetry,
  className = '',
  compact = false,
}: AnalyticsErrorStateProps) {
  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-red-600 ${className}`}>
        <MdError size={16} />
        <span className="text-sm">{message}</span>
        <button
          onClick={onRetry}
          className="text-sm font-medium text-red-700 hover:text-red-800 underline ml-1"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center py-8 text-center ${className}`}>
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
        <MdError className="text-red-500" size={24} />
      </div>
      <p className="text-sm text-red-600 mb-3">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
      >
        <MdRefresh size={16} />
        Try Again
      </button>
    </div>
  );
}

export default AnalyticsErrorState;
