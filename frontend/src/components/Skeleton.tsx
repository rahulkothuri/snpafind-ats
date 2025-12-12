/**
 * Skeleton Component - Requirement 23.1
 * 
 * Features:
 * - Animated placeholder for loading content
 * - Multiple variants (text, card, avatar, button)
 * - Customizable dimensions
 */

interface SkeletonProps {
  variant?: 'text' | 'card' | 'avatar' | 'button' | 'custom';
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  count = 1,
}: SkeletonProps) {
  const variantStyles = {
    text: 'h-4 rounded',
    card: 'h-32 rounded-xl',
    avatar: 'h-10 w-10 rounded-full',
    button: 'h-9 w-24 rounded-lg',
    custom: '',
  };

  const baseStyle = variantStyles[variant];
  
  const style: React.CSSProperties = {
    width: width ?? (variant === 'text' ? '100%' : undefined),
    height: height ?? undefined,
  };

  const skeletons = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`
        bg-[#e2e8f0] animate-pulse
        ${baseStyle}
        ${className}
      `}
      style={style}
    />
  ));

  if (count === 1) {
    return skeletons[0];
  }

  return <div className="space-y-2">{skeletons}</div>;
}

// Pre-built skeleton layouts
export function KPICardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm">
      <Skeleton variant="text" width="60%" className="mb-2" />
      <Skeleton variant="text" width="40%" height={28} className="mb-2" />
      <Skeleton variant="text" width="80%" height={12} />
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-[#e2e8f0]">
      {Array.from({ length: columns }, (_, i) => (
        <td key={i} className="py-3 px-3">
          <Skeleton variant="text" width={i === 0 ? '80%' : '60%'} />
        </td>
      ))}
    </tr>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton variant="avatar" />
        <div className="flex-1">
          <Skeleton variant="text" width="60%" className="mb-1" />
          <Skeleton variant="text" width="40%" height={12} />
        </div>
      </div>
      <Skeleton variant="text" count={3} />
    </div>
  );
}

export default Skeleton;
