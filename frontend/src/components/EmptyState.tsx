import { Button } from './Button';

/**
 * EmptyState Component - Requirement 23.4
 * 
 * Features:
 * - Empty state message with icon
 * - Guidance text for next steps
 * - Optional action button
 */

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`
        bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-8
        flex flex-col items-center justify-center text-center gap-4
        ${className}
      `}
    >
      <span className="text-4xl">{icon}</span>
      <div>
        <h3 className="text-lg font-semibold text-[#374151] mb-1">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-[#64748b] max-w-md">
            {description}
          </p>
        )}
      </div>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
