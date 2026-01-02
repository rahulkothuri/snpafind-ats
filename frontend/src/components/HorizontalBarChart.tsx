/**
 * HorizontalBarChart Component - Using Recharts for Professional Power BI-like design
 * Requirements: 5.1, 6.4, 7.2
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  LabelList
} from 'recharts';

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
  warning: '#f43f5e',   // rose-500
  threshold: '#fbbf24', // amber-400
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-3 py-2 shadow-lg rounded-lg border border-gray-100">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-sm text-gray-600">
          {payload[0].payload.displayValue || `${payload[0].value}`}
        </p>
      </div>
    );
  }
  return null;
};

export function HorizontalBarChart({
  data,
  title,
  valueLabel,
  threshold,
  thresholdLabel,
  colorScheme = defaultColorScheme,
  showValues = true,
  className = '',
}: HorizontalBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`bg-white rounded-xl border border-[#e2e8f0] p-6 ${className}`}>
        {title && (
          <h3 className="text-lg font-semibold text-[#111827] mb-4">{title}</h3>
        )}
        <div className="text-center text-[#64748b] py-8">
          No data available
        </div>
      </div>
    );
  }

  // Transform data for Recharts
  const chartData = data.map(item => ({
    ...item,
    name: item.label,
    fill: item.isOverThreshold || (threshold && item.value > threshold)
      ? colorScheme.warning
      : colorScheme.normal
  }));

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

      <div className="w-full" style={{ height: Math.max(data.length * 50, 200) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 5, right: 50, left: 10, bottom: 5 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={true} vertical={false} />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748b' }}
              domain={[0, 'auto']}
            />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#374151', fontWeight: 500 }}
              width={120}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />

            {threshold && (
              <ReferenceLine
                x={threshold}
                stroke={colorScheme.threshold}
                strokeWidth={2}
                strokeDasharray="4 4"
                label={{
                  value: thresholdLabel || `${threshold}`,
                  position: 'top',
                  fill: colorScheme.threshold,
                  fontSize: 10
                }}
              />
            )}

            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              maxBarSize={24}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              {showValues && (
                <LabelList
                  dataKey="displayValue"
                  position="right"
                  fill="#374151"
                  fontSize={11}
                  fontWeight={600}
                />
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
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
                <div className="w-6 h-0.5" style={{ backgroundColor: colorScheme.threshold }} />
                <span className="text-[#64748b]">
                  {thresholdLabel || `Target: ${threshold}`}
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