/**
 * FunnelChart Component - Requirements 2.1, 2.2, 2.4, 2.5
 * 
 * Features:
 * - Display stages with proportional bar widths
 * - Show counts and percentages
 * - Support click handler for stage navigation
 * - Visual indication of conversion rates between stages
 */

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

const defaultColors = [
  '#3b82f6', // blue-500
  '#06b6d4', // cyan-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
];

export function FunnelChart({
  stages,
  onStageClick,
  showPercentages = true,
  colorScheme = defaultColors,
  className = '',
}: FunnelChartProps) {
  if (!stages || stages.length === 0) {
    return (
      <div className={`bg-white rounded-xl border border-[#e2e8f0] p-6 ${className}`}>
        <div className="text-center text-[#64748b]">
          No funnel data available
        </div>
      </div>
    );
  }

  // Find the maximum count to calculate proportional widths
  const maxCount = Math.max(...stages.map(stage => stage.count));
  
  return (
    <div className={`bg-white rounded-xl border border-[#e2e8f0] p-6 ${className}`}>
      <div className="space-y-4">
        {stages.map((stage, index) => {
          const widthPercentage = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
          const color = colorScheme[index % colorScheme.length];
          const isClickable = !!onStageClick;
          
          return (
            <div key={stage.id} className="space-y-2">
              {/* Stage Header */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-[#374151]">
                  {stage.name}
                </h4>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-[#111827]">
                    {stage.count.toLocaleString()}
                  </span>
                  {showPercentages && (
                    <span className="text-[#64748b]">
                      ({stage.percentage.toFixed(1)}%)
                    </span>
                  )}
                </div>
              </div>
              
              {/* Funnel Bar */}
              <div className="relative">
                <div className="w-full bg-[#f1f5f9] rounded-lg h-8 overflow-hidden">
                  <div
                    className={`
                      h-full rounded-lg transition-all duration-300 flex items-center justify-center
                      ${isClickable ? 'cursor-pointer hover:opacity-80' : ''}
                    `}
                    style={{
                      width: `${widthPercentage}%`,
                      backgroundColor: color,
                      minWidth: stage.count > 0 ? '60px' : '0px',
                    }}
                    onClick={() => isClickable && onStageClick?.(stage)}
                  >
                    {stage.count > 0 && (
                      <span className="text-white text-xs font-medium">
                        {stage.count.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Conversion Rate to Next Stage */}
              {stage.conversionToNext !== undefined && index < stages.length - 1 && (
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-1 text-xs text-[#64748b]">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                    <span>{stage.conversionToNext.toFixed(1)}% conversion</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Summary */}
      {stages.length > 0 && (
        <div className="mt-6 pt-4 border-t border-[#e2e8f0]">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#64748b]">
              Total Applicants: <span className="font-medium text-[#111827]">
                {stages[0]?.count.toLocaleString() || 0}
              </span>
            </span>
            {stages.length > 1 && (
              <span className="text-[#64748b]">
                Overall Conversion: <span className="font-medium text-[#111827]">
                  {stages[0]?.count > 0 
                    ? ((stages[stages.length - 1]?.count / stages[0]?.count) * 100).toFixed(1)
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