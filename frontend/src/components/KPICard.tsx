/**
 * KPICard Component - Requirements 27.1, 15.1
 * 
 * Features:
 * - White background with border radius and subtle shadow
 * - Label, value, optional subtitle
 * - Trend indicator (ok/warn/bad)
 * - Optional chip for additional context
 */

type TrendType = 'ok' | 'warn' | 'bad';

interface KPICardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    text: string;
    type: TrendType;
  };
  chip?: string;
  className?: string;
}

const trendStyles: Record<TrendType, string> = {
  ok: 'text-green-600',
  warn: 'text-orange-600',
  bad: 'text-red-600',
};

export function KPICard({
  label,
  value,
  subtitle,
  trend,
  chip,
  className = '',
}: KPICardProps) {
  return (
    <div
      className={`
        bg-white rounded-xl border border-[#e2e8f0] p-4
        shadow-sm hover:shadow-md transition-shadow
        ${className}
      `}
    >
      {/* Label */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[#64748b] font-medium uppercase tracking-wide">
          {label}
        </span>
        {chip && (
          <span className="text-[10px] px-2 py-0.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-full text-[#4b5563]">
            {chip}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="text-2xl font-bold text-[#111827] mb-1">
        {value}
      </div>

      {/* Subtitle and Trend */}
      <div className="flex items-center gap-2 text-xs">
        {subtitle && (
          <span className="text-[#64748b]">{subtitle}</span>
        )}
        {trend && (
          <span className={`font-medium ${trendStyles[trend.type]}`}>
            {trend.text}
          </span>
        )}
      </div>
    </div>
  );
}

export default KPICard;
