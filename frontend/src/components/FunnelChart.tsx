/**
 * FunnelChart Component - Using Recharts for Professional Power BI-like design
 * Requirements 2.1, 2.3, 2.4, 2.5, 2.6
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
  LabelList
} from 'recharts';

interface FunnelStage {
  id: string;
  name: string;
  count: number;
  percentage: number;
  conversionToNext?: number;
}

interface FunnelChartProps {
  stages: FunnelStage[];
  onStageClick?: (stage: FunnelStage) => void;
  showPercentages?: boolean;
  colorScheme?: string[];
  className?: string;
}

// Blue gradient colors matching Power BI design
const defaultFunnelColors = [
  '#6366f1', // indigo-500 - Applied
  '#8b5cf6', // violet-500 - Screening  
  '#3b82f6', // blue-500 - Shortlisted
  '#0ea5e9', // sky-500 - Interview
  '#14b8a6', // teal-500 - Offer
  '#22c55e', // green-500 - Hired
];

function getStageColor(stageName: string, index: number): string {
  if (stageName.toLowerCase() === 'hired') {
    return '#22c55e';
  }
  const colorIndex = Math.min(index, defaultFunnelColors.length - 1);
  return defaultFunnelColors[colorIndex];
}

// Custom tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white px-3 py-2 shadow-lg rounded-lg border border-gray-100">
        <p className="text-sm font-semibold text-gray-800">{data.name}</p>
        <p className="text-sm text-gray-600">
          {data.count.toLocaleString()} candidates
        </p>
        <p className="text-xs text-gray-500">{data.percentage.toFixed(1)}% of total</p>
      </div>
    );
  }
  return null;
};

export function FunnelChart({
  stages,
  onStageClick,
  showPercentages = true,
  className = '',
}: FunnelChartProps) {
  // Empty state
  if (!stages || stages.length === 0) {
    return (
      <div className={`bg-white rounded-xl border border-[#e2e8f0] p-6 ${className}`}>
        <div className="text-center text-[#64748b] py-8">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">No funnel data available</p>
          <p className="text-xs mt-1">Try adjusting your filters or date range</p>
        </div>
      </div>
    );
  }

  const totalApplicants = stages[0]?.count || 0;

  // Transform data for Recharts
  const chartData = stages.map((stage, index) => ({
    ...stage,
    fill: getStageColor(stage.name, index),
    displayLabel: showPercentages && index > 0
      ? `${stage.count.toLocaleString()} (${stage.percentage.toFixed(0)}%)`
      : stage.count.toLocaleString()
  }));

  return (
    <div className={`bg-white rounded-xl border border-[#e2e8f0] p-6 ${className}`}>
      <div className="w-full" style={{ height: Math.max(stages.length * 48, 250) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 5, right: 80, left: 10, bottom: 5 }}
            barCategoryGap="15%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={true} vertical={false} />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              domain={[0, 'dataMax']}
            />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#374151', fontWeight: 500 }}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Bar
              dataKey="count"
              radius={[0, 6, 6, 0]}
              maxBarSize={28}
              animationDuration={1000}
              animationEasing="ease-out"
              onClick={(data) => onStageClick?.(data as unknown as FunnelStage)}
              style={{ cursor: onStageClick ? 'pointer' : 'default' }}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill}
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}
                />
              ))}
              <LabelList
                dataKey="displayLabel"
                position="right"
                fill="#374151"
                fontSize={11}
                fontWeight={500}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Footer */}
      {stages.length > 0 && totalApplicants > 0 && (
        <div className="mt-4 pt-3 border-t border-[#e2e8f0]">
          <div className="flex items-center justify-between text-xs text-[#64748b]">
            <span>
              Total: <span className="font-medium text-[#111827]">
                {totalApplicants.toLocaleString()}
              </span> applicants
            </span>
            {stages.length > 1 && (
              <span>
                Overall conversion: <span className="font-medium text-[#111827]">
                  {totalApplicants > 0
                    ? ((stages[stages.length - 1]?.count / totalApplicants) * 100).toFixed(1)
                    : 0}%
                </span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FunnelChart;