/**
 * InterviewDashboardFilters Component
 * 
 * Provides filtering options for the interview dashboard:
 * - Filter by job
 * - Filter by panel member
 * - Filter by interview mode
 * 
 * Requirements: 12.5
 */

import type { InterviewMode } from '../services/interviews.service';

export interface InterviewDashboardFiltersProps {
  // Job filter
  jobs: Array<{ id: string; title: string }>;
  selectedJobId: string | null;
  onJobChange: (jobId: string | null) => void;
  
  // Panel member filter
  panelMembers: Array<{ id: string; name: string }>;
  selectedPanelMemberId: string | null;
  onPanelMemberChange: (panelMemberId: string | null) => void;
  
  // Interview mode filter
  selectedMode: InterviewMode | null;
  onModeChange: (mode: InterviewMode | null) => void;
  
  // Clear all filters
  onClearFilters?: () => void;
  
  // Loading state
  isLoading?: boolean;
}

const INTERVIEW_MODES: Array<{ value: InterviewMode; label: string; icon: string }> = [
  { value: 'google_meet', label: 'Google Meet', icon: '📹' },
  { value: 'microsoft_teams', label: 'Teams', icon: '💼' },
  { value: 'in_person', label: 'In-Person', icon: '🏢' },
];

export function InterviewDashboardFilters({
  jobs,
  selectedJobId,
  onJobChange,
  panelMembers,
  selectedPanelMemberId,
  onPanelMemberChange,
  selectedMode,
  onModeChange,
  onClearFilters,
  isLoading = false,
}: InterviewDashboardFiltersProps) {
  const hasActiveFilters = selectedJobId || selectedPanelMemberId || selectedMode;

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#111827]">Filters</h3>
        {hasActiveFilters && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="text-xs text-[#0b6cf0] hover:text-[#0952b8] font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Job Filter */}
        <div>
          <label className="block text-xs font-medium text-[#374151] mb-1.5">
            Job / Role
          </label>
          <select
            value={selectedJobId || ''}
            onChange={(e) => onJobChange(e.target.value || null)}
            disabled={isLoading}
            className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b6cf0] focus:border-transparent disabled:bg-[#f8fafc] disabled:cursor-not-allowed"
          >
            <option value="">All Jobs</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>

        {/* Panel Member Filter */}
        <div>
          <label className="block text-xs font-medium text-[#374151] mb-1.5">
            Panel Member
          </label>
          <select
            value={selectedPanelMemberId || ''}
            onChange={(e) => onPanelMemberChange(e.target.value || null)}
            disabled={isLoading}
            className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b6cf0] focus:border-transparent disabled:bg-[#f8fafc] disabled:cursor-not-allowed"
          >
            <option value="">All Panel Members</option>
            {panelMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>

        {/* Interview Mode Filter */}
        <div>
          <label className="block text-xs font-medium text-[#374151] mb-1.5">
            Interview Mode
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onModeChange(null)}
              disabled={isLoading}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                selectedMode === null
                  ? 'bg-[#0b6cf0] text-white'
                  : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              All
            </button>
            {INTERVIEW_MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => onModeChange(mode.value)}
                disabled={isLoading}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                  selectedMode === mode.value
                    ? 'bg-[#0b6cf0] text-white'
                    : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span>{mode.icon}</span>
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active filters summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-3 border-t border-[#e2e8f0]">
          <div className="flex flex-wrap gap-2">
            {selectedJobId && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#e8f2fe] text-[#0b6cf0] text-xs rounded-full">
                Job: {jobs.find(j => j.id === selectedJobId)?.title || 'Unknown'}
                <button
                  onClick={() => onJobChange(null)}
                  className="hover:text-[#0952b8]"
                >
                  ×
                </button>
              </span>
            )}
            {selectedPanelMemberId && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#e8f2fe] text-[#0b6cf0] text-xs rounded-full">
                Panel: {panelMembers.find(m => m.id === selectedPanelMemberId)?.name || 'Unknown'}
                <button
                  onClick={() => onPanelMemberChange(null)}
                  className="hover:text-[#0952b8]"
                >
                  ×
                </button>
              </span>
            )}
            {selectedMode && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#e8f2fe] text-[#0b6cf0] text-xs rounded-full">
                Mode: {INTERVIEW_MODES.find(m => m.value === selectedMode)?.label || selectedMode}
                <button
                  onClick={() => onModeChange(null)}
                  className="hover:text-[#0952b8]"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default InterviewDashboardFilters;
