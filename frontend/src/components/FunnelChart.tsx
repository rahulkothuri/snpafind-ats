/**
 * FunnelChart Component - Requirements 2.1, 2.3, 2.4, 2.5, 2.6
 * 
 * Features:
 * - Display stages in order with proportional bar widths based on percentage
 * - Show candidate count and percentage for each stage
 * - Use blue gradient colors with green for Hired stage
 * - Support click handler for stage navigation
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

// Blue gradient colors matching reference design (Requirements 2.5)
// From lightest to darkest blue, with green for Hired stage
const defaultFunnelColors = [
  '#bfdbfe', // blue-200 - Applied
  '#93c5fd', // blue-300 - Screening
  '#60a5fa', // blue-400 - Shortlisted
  '#3b82f6', // blue-500 - Interview
  '#2563eb', // blue-600 - Offer
  '#22c55e', // green-500 - Hired (special color)
];

/**
 * Get the appropriate color for a funnel stage
 * Uses blue gradient for most stages, green for Hired (Requirements 2.5)
 */
function getStageColor(stageName: string, index: number): string {
  // Use green for Hired stage
  if (stageName.toLowerCase() === 'hired') {
    return '#22c55e';
  }
  
  // Calculate color index based on position in funnel
  // Distribute colors evenly across non-hired stages
  const colorIndex = Math.min(index, defaultFunnelColors.length - 2);
  return defaultFunnelColors[colorIndex];
}

export function FunnelChart({
  stages,
  onStageClick,
  showPercentages = true,
  className = '',
}: FunnelChartProps) {
  // Empty state (Requirements 10.2)
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

  // Find the first stage count (total applicants) for percentage calculation
  const totalApplicants = stages[0]?.count || 0;
  
  return (
    <div className={`bg-white rounded-xl border border-[#e2e8f0] p-6 ${className}`}>
      <div className="space-y-3">
        {stages.map((stage, index) => {
          // Calculate width based on percentage of total applicants (Requirements 2.4)
          const widthPercentage = totalApplicants > 0 
            ? Math.max((stage.count / totalApplicants) * 100, stage.count > 0 ? 6 : 0) 
            : 0;
          
          // Get appropriate color for this stage (Requirements 2.5)
          const color = getStageColor(stage.name, index);
          const isClickable = !!onStageClick;
          
          return (
            <div key={stage.id} className="funnel-stage">
              {/* Stage Label Row - matching reference design */}
              <div className="flex items-center justify-between text-[10px] text-[#64748b] mb-1">
                <span className="font-medium">{stage.name}</span>
                <span>
                  {stage.count.toLocaleString()} {stage.count === 1 ? 'candidate' : 'candidates'}
                  {showPercentages && index > 0 && (
                    <span className="ml-1">· {stage.percentage.toFixed(1)}%</span>
                  )}
                </span>
              </div>
              
              {/* Funnel Bar - matching reference design style */}
              <div 
                className={`
                  h-3 rounded-full transition-all duration-300
                  ${isClickable ? 'cursor-pointer hover:opacity-80' : ''}
                `}
                style={{
                  width: `${widthPercentage}%`,
                  backgroundColor: color,
                  minWidth: stage.count > 0 ? '24px' : '0px',
                }}
                onClick={() => isClickable && onStageClick?.(stage)}
                title={`${stage.name}: ${stage.count.toLocaleString()} (${stage.percentage.toFixed(1)}%)`}
              />
            </div>
          );
        })}
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