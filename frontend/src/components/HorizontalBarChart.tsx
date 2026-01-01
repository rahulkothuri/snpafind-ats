/**
 * HorizontalBarChart Component - Requirements 5.1, 6.4, 7.2
 * 
 * Features:
 * - Support color coding based on thresholds
 * - Display labels and values
 * - Horizontal bar layout for better label readability
 * - Threshold-based warning indicators
 */

interface BarData {
  id: string;
  label: string;
  value: number;
  displayValue?: string;
  isOverThreshold?: boolean;
  subtitle?: string;
}

interface HorizontalBarChartProps {
  data: BarData[];
  title?: string;
  valueLabel?: string;
  threshold?: number;
  thresholdLabel?: string;
  colorScheme?: {
    normal: string;
    warning: string;
    threshold: string;
  };
  showValues?: boolean;
  maxBarWidth?: number;
  className?: string;
}

const defaultColorScheme = {
  normal: '#3b82f6',    // blue-500
  warning: '#f43f5e',   // rose-500 (softer red)
  threshold: '#fbbf24', // amber-400
};

export function HorizontalBarChart({
  data,
  title,
  valueLabel,
  threshold,
  thresholdLabel,
  colorScheme = defaultColorScheme,
  showValues = true,
  maxBarWidth = 100,
  className = '',
}: HorizontalBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`bg-white rounded-xl border border-[#e2e8f0] p-6 ${className}`}>
        {title && (
          <h3 className="text-lg font-semibold text-[#111827] mb-4">{title}</h3>
        )}
        <div className="text-center text-[#64748b]">
          No data available
        </div>
      </div>
    );
  }

  // Find the maximum value to calculate proportional widths
  const maxValue = Math.max(...data.map(item => item.value), threshold || 0);

  return (
    <div className={`bg-white rounded-xl border border-[#e2e8f0] p-6 ${className}`}>
      {title && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-[#111827]">{title}</h3>
          {valueLabel && (
            <p className="text-sm text-[#64748b] mt-1">{valueLabel}</p>
          )}
        </div>
      )}

      <div className="space-y-4">
        {data.map((item) => {
          const widthPercentage = maxValue > 0 ? (item.value / maxValue) * maxBarWidth : 0;
          const isWarning = item.isOverThreshold || (threshold && item.value > threshold);
          const barColor = isWarning ? colorScheme.warning : colorScheme.normal;

          return (
            <div key={item.id} className="space-y-2">
              {/* Label and Value */}
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#374151] truncate">
                      {item.label}
                    </span>
                    {isWarning && (
                      <svg
                        className="w-4 h-4 text-[#ef4444] flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  {item.subtitle && (
                    <span className="text-xs text-[#64748b]">{item.subtitle}</span>
                  )}
                </div>
                {showValues && (
                  <span className="text-sm font-semibold text-[#111827] ml-4">
                    {item.displayValue || item.value.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Bar */}
              <div className="relative flex items-center">
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${widthPercentage}%`,
                      backgroundColor: barColor,
                      minWidth: item.value > 0 ? '4px' : '0px',
                    }}
                  />
                </div>

                {/* Threshold Line */}
                {threshold && threshold <= maxValue && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
                    style={{
                      left: `${(threshold / maxValue) * maxBarWidth}%`,
                    }}
                  >
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {(threshold || data.some(item => item.isOverThreshold)) && (
        <div className="mt-6 pt-4 border-t border-[#e2e8f0]">
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: colorScheme.normal }} />
              <span className="text-[#64748b]">Normal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: colorScheme.warning }} />
              <span className="text-[#64748b]">Above Threshold</span>
            </div>
            {threshold && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-amber-500" />
                <span className="text-[#64748b]">
                  {thresholdLabel || `Threshold: ${threshold}`}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default HorizontalBarChart;