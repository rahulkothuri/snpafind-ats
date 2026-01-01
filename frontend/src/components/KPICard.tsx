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
  className?: string;
  onClick?: () => void;
}

export function KPICard({
  label,
  value,
  subtitle,
  trend,
  icon: Icon,
  className = '',
  onClick,
}: KPICardProps) {

  const baseClasses = `
    relative rounded-xl p-5
    bg-white border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]
    hover:shadow-md transition-shadow duration-200
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `;

  const labelClasses = 'text-gray-500';
  const valueClasses = 'text-gray-900';

  // Trend Badge Styles (Pill shape)
  const getTrendBadge = (t: { text: string; type: TrendType }) => {
    switch (t.type) {
      case 'ok':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">+{t.text}</span>;
      case 'bad':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">{t.text}</span>;
      case 'warn':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">{t.text}</span>;
      case 'neutral':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">{t.text}</span>;
      default:
        return <span className="text-xs text-gray-500">{t.text}</span>;
    }
  };

  return (
    <div className={baseClasses} onClick={onClick}>

      {/* Top Row: Label & Icon */}
      <div className="flex justify-between items-start mb-2">
        <h3 className={`text-[10px] uppercase tracking-wider font-bold ${labelClasses}`}>
          {label}
        </h3>
        {Icon && (
          <div className="p-1.5 rounded-lg bg-gray-50 text-gray-400 group-hover:text-blue-600 transition-colors">
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
          <span className="text-[11px] text-gray-400 font-medium">
            {subtitle}
          </span>
        )}
      </div>

      {/* Progress Bar REMOVED per user request to reduce height */}
    </div>
  );
}

export default KPICard;
