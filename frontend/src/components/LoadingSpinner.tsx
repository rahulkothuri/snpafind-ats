/**
 * LoadingSpinner Component - Requirement 23.1
 * 
 * Features:
 * - Animated spinner for data fetching states
 * - Multiple sizes (sm, md, lg)
 * - Optional loading text
 */

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
};

export function LoadingSpinner({ 
  size = 'md', 
  text,
  className = '' 
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`
          animate-spin rounded-full border-[#0b6cf0] border-t-transparent
          ${sizeClasses[size]}
        `}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <p className="text-sm text-[#64748b]">{text}</p>
      )}
    </div>
  );
}

export default LoadingSpinner;
