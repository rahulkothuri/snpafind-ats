import { LoadingSpinner } from './LoadingSpinner';

/**
 * LoadingOverlay Component - Requirement 23.1
 * 
 * Features:
 * - Full-page or section loading overlay
 * - Semi-transparent background
 * - Centered spinner with optional text
 */

interface LoadingOverlayProps {
  text?: string;
  fullPage?: boolean;
  className?: string;
}

export function LoadingOverlay({
  text = 'Loading...',
  fullPage = false,
  className = '',
}: LoadingOverlayProps) {
  if (fullPage) {
    return (
      <div
        className={`
          fixed inset-0 bg-white/80 backdrop-blur-sm z-50
          flex items-center justify-center
          ${className}
        `}
      >
        <LoadingSpinner size="lg" text={text} />
      </div>
    );
  }

  return (
    <div
      className={`
        absolute inset-0 bg-white/80 backdrop-blur-sm z-10
        flex items-center justify-center rounded-xl
        ${className}
      `}
    >
      <LoadingSpinner size="md" text={text} />
    </div>
  );
}

export default LoadingOverlay;
