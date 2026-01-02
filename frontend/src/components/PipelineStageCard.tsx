/**
 * PipelineStageCard Component - Requirements 4.1, 4.5
 * 
 * Displays a pipeline stage card with:
 * - Stage name and candidate count
 * - SLA breach count highlighted
 * - Click to filter candidates by stage
 * - Visual indicators for stage status
 */

export interface StageMetric {
  stageId: string;
  stageName: string;
  candidateCount: number;
  avgDaysInStage: number;
  slaBreachCount: number;
}

export interface PipelineStageCardProps {
  stage: StageMetric;
  isSelected: boolean;
  onClick: () => void;
}

// Stage color mapping for visual differentiation
const stageColors: Record<string, { bg: string; border: string; indicator: string; selectedBg: string }> = {
  'Queue': { bg: 'bg-[#f8fafc]', border: 'border-[#e2e8f0]', indicator: 'bg-[#94a3b8]', selectedBg: 'bg-[#f1f5f9]' },
  'Applied': { bg: 'bg-[#f0f9ff]', border: 'border-[#bae6fd]', indicator: 'bg-[#0ea5e9]', selectedBg: 'bg-[#e0f2fe]' },
  'Screening': { bg: 'bg-[#fffbeb]', border: 'border-[#fde68a]', indicator: 'bg-[#f59e0b]', selectedBg: 'bg-[#fef3c7]' },
  'Shortlisted': { bg: 'bg-[#f0fdf4]', border: 'border-[#bbf7d0]', indicator: 'bg-[#22c55e]', selectedBg: 'bg-[#dcfce7]' },
  'Interview': { bg: 'bg-[#eef2ff]', border: 'border-[#c7d2fe]', indicator: 'bg-[#6366f1]', selectedBg: 'bg-[#e0e7ff]' },
  'Selected': { bg: 'bg-[#fdf2f8]', border: 'border-[#fbcfe8]', indicator: 'bg-[#ec4899]', selectedBg: 'bg-[#fce7f3]' },
  'Offer': { bg: 'bg-[#faf5ff]', border: 'border-[#ddd6fe]', indicator: 'bg-[#8b5cf6]', selectedBg: 'bg-[#f5f3ff]' },
  'Hired': { bg: 'bg-[#ecfdf5]', border: 'border-[#a7f3d0]', indicator: 'bg-[#10b981]', selectedBg: 'bg-[#d1fae5]' },
  'Rejected': { bg: 'bg-[#fef2f2]', border: 'border-[#fecaca]', indicator: 'bg-[#ef4444]', selectedBg: 'bg-[#fee2e2]' },
};

function getStageStyle(stageName: string) {
  return stageColors[stageName] || stageColors['Queue'];
}

export function PipelineStageCard({ stage, isSelected, onClick }: PipelineStageCardProps) {
  const stageStyle = getStageStyle(stage.stageName);
  const hasSLABreaches = stage.slaBreachCount > 0;

  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col p-3 rounded-xl border-2 transition-all duration-200
        min-w-[140px] max-w-[180px] flex-shrink-0
        hover:shadow-md hover:-translate-y-0.5
        ${isSelected 
          ? `${stageStyle.selectedBg} ${stageStyle.border} ring-2 ring-[#0b6cf0]/30 shadow-sm` 
          : `${stageStyle.bg} ${stageStyle.border} hover:border-[#0b6cf0]/50`
        }
      `}
      aria-pressed={isSelected}
      aria-label={`${stage.stageName} stage with ${stage.candidateCount} candidates${hasSLABreaches ? ` and ${stage.slaBreachCount} SLA breaches` : ''}`}
    >
      {/* Stage indicator and name */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2.5 h-2.5 rounded-full ${stageStyle.indicator}`} />
        <span className="text-sm font-semibold text-[#374151] truncate">
          {stage.stageName}
        </span>
      </div>

      {/* Candidate count */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-[#111827]">
            {stage.candidateCount}
          </span>
          <span className="text-xs text-[#64748b]">
            {stage.candidateCount === 1 ? 'candidate' : 'candidates'}
          </span>
        </div>
      </div>

      {/* SLA breach indicator - Requirements 4.5 */}
      {hasSLABreaches && (
        <div className="mt-2 flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2 py-0.5 bg-red-50 border border-red-200 rounded-full">
            <svg 
              className="w-3 h-3 text-red-500" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
                clipRule="evenodd" 
              />
            </svg>
            <span className="text-xs font-medium text-red-600">
              {stage.slaBreachCount} SLA
            </span>
          </div>
        </div>
      )}

      {/* Average time in stage */}
      {stage.avgDaysInStage > 0 && (
        <div className="mt-1.5 text-[10px] text-[#94a3b8]">
          Avg: {stage.avgDaysInStage.toFixed(1)} days
        </div>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <svg 
            className="w-4 h-4 text-[#0b6cf0]" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
      )}
    </button>
  );
}

export default PipelineStageCard;
