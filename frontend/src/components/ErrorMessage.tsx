import { Button } from './Button';

/**
 * ErrorMessage Component - Requirement 23.2
 * 
 * Features:
 * - Error message display with icon
 * - Retry button option
 * - Different severity levels (error, warning)
 */

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
  severity?: 'error' | 'warning';
  className?: string;
}

export function ErrorMessage({
  title = 'Something went wrong',
  message,
  onRetry,
  retryText = 'Try again',
  severity = 'error',
  className = '',
}: ErrorMessageProps) {
  const severityStyles = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: '❌',
      titleColor: 'text-red-700',
      textColor: 'text-red-600',
    },
    warning: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      icon: '⚠️',
      titleColor: 'text-orange-700',
      textColor: 'text-orange-600',
    },
  };

  const styles = severityStyles[severity];

  return (
    <div
      className={`
        ${styles.bg} ${styles.border} border rounded-xl p-6
        flex flex-col items-center justify-center text-center gap-4
        ${className}
      `}
      role="alert"
    >
      <span className="text-3xl">{styles.icon}</span>
      <div>
        <h3 className={`text-lg font-semibold ${styles.titleColor} mb-1`}>
          {title}
        </h3>
        <p className={`text-sm ${styles.textColor}`}>
          {message}
        </p>
      </div>
      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          {retryText}
        </Button>
      )}
    </div>
  );
}

export default ErrorMessage;
