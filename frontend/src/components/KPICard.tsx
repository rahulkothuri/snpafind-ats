import type { IconType } from 'react-icons';

/**
 * KPICard Component - Refined to match "FuturePayOS" style
 * Features:
 * - Uppercase muted labels
 * - Large bold values
 * - Floating top-right icons
 * - Hero/Solid variant support
 */

type TrendType = 'ok' | 'warn' | 'bad' | 'neutral';

interface KPICardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    text: string;
    type: TrendType;
  };
  icon?: IconType;
  variant?: 'default' | 'solid-blue';
  className?: string;
  onClick?: () => void;
}

export function KPICard({
  label,
  value,
  subtitle,
  trend,
  icon: Icon,
  variant = 'default',
  className = '',
  onClick,
}: KPICardProps) {

  const isSolid = variant === 'solid-blue';

  const baseClasses = `
    relative rounded-xl p-5
    transition-all duration-200
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `;

  const variantClasses = isSolid
    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 border border-blue-500'
    : 'bg-white border border-gray-100 shadow-sm hover:shadow-md';

  const labelClasses = isSolid
    ? 'text-blue-100'
    : 'text-gray-500';

  const valueClasses = isSolid
    ? 'text-white'
    : 'text-gray-900';

  // Trend Badge Styles (Pill shape)
  const getTrendBadge = (t: { text: string; type: TrendType }) => {
    if (isSolid) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/50 text-white">
          {t.text}
        </span>
      );
    }

    switch (t.type) {
      case 'ok':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700">+{t.text}</span>;
      case 'bad':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700">{t.text}</span>;
      case 'warn':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700">{t.text}</span>;
      default:
        return <span className="text-xs text-gray-500">{t.text}</span>;
    }
  };

  return (
    <div className={`${baseClasses} ${variantClasses}`} onClick={onClick}>

      {/* Top Row: Label & Icon */}
      <div className="flex justify-between items-start mb-2">
        <h3 className={`text-[10px] uppercase tracking-wider font-bold ${labelClasses}`}>
          {label}
        </h3>
        {Icon && (
          <div className={`p-1.5 rounded-lg ${isSolid ? 'bg-blue-500/30 text-white' : 'bg-gray-50 text-gray-400'}`}>
            <Icon size={18} />
          </div>
        )}
      </div>

      {/* Value */}
      <div className={`text-2xl font-bold mb-2 tracking-tight ${valueClasses}`}>
        {value}
      </div>

      {/* Bottom Row: Trend & Subtitle */}
      <div className="flex items-center gap-2">
        {trend && getTrendBadge(trend)}

        {subtitle && (
          <span className={`text-[11px] ${isSolid ? 'text-blue-200' : 'text-gray-400'}`}>
            {subtitle}
          </span>
        )}
      </div>

      {/* Progress Bar REMOVED per user request to reduce height */}
    </div>
  );
}

export default KPICard;
