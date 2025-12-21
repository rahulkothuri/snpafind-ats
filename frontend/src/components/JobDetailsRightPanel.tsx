/**
 * JobDetailsRightPanel Component - Requirements 3.1, 5.2, 5.3, 5.5
 * 
 * Right panel of the split-panel layout containing:
 * - Job header with title, department, and actions
 * - KPI cards row (4 metrics)
 * - Candidate search input
 * - Stage summary strip
 * - Candidate view (table or board)
 * 
 * Styled with 60% width on desktop
 * Shows placeholder when no role is selected
 */

import { KPICard, Badge, Button, Table, SearchInput, LoadingSpinner } from './index';
import type { Column } from './Table';

// Types
export interface PipelineCandidate {
  id: string;
  name: string;
  title: string;
  stage: string;
  score: number;
  experience: number;
  location: string;
  source: string;
  updatedAt: string;
  skills: string[];
  email: string;
  phone: string;
  currentCompany: string;
  currentCtc: string;
  expectedCtc: string;
  noticePeriod: string;
  resumeUrl?: string;
}

export interface Role {
  id: string;
  title: string;
  department: string;
  location: string;
  openings: number;
  applicants: number;
  interviews: number;
  sla: 'On track' | 'At risk' | 'Breached';
  priority: 'High' | 'Medium' | 'Low';
  recruiter: string;
  status: 'active' | 'paused' | 'closed';
}

export interface StageCount {
  name: string;
  count: number;
}

export type ViewMode = 'table' | 'board';

export interface JobDetailsRightPanelProps {
  role: Role | null;
  candidates: PipelineCandidate[];
  candidateSearchQuery: string;
  onCandidateSearchChange: (query: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  stageFilter: string | null;
  onStageFilterChange: (stage: string | null) => void;
  onCandidateClick: (candidate: PipelineCandidate) => void;
  isLoading: boolean;
  onViewJobDescription?: () => void;
  jobDescriptionLoading?: boolean;
}


const defaultStages = ['Queue', 'Applied', 'Screening', 'Shortlisted', 'Interview', 'Offer', 'Hired', 'Rejected'];

// Helper functions
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-[#0b6cf0]', 'bg-[#16a34a]', 'bg-[#dc2626]', 'bg-[#9333ea]',
    'bg-[#ea580c]', 'bg-[#0891b2]', 'bg-[#4f46e5]', 'bg-[#be185d]'
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

function getScoreVariant(score: number): 'green' | 'orange' | 'red' {
  if (score >= 80) return 'green';
  if (score >= 50) return 'orange';
  return 'red';
}

function getStageColor(stage: string): { bg: string; text: string } {
  const colors: Record<string, { bg: string; text: string }> = {
    'Queue': { bg: 'bg-[#f1f5f9]', text: 'text-[#475569]' },
    'Applied': { bg: 'bg-[#e0f2fe]', text: 'text-[#0369a1]' },
    'Screening': { bg: 'bg-[#fef3c7]', text: 'text-[#92400e]' },
    'Shortlisted': { bg: 'bg-[#dcfce7]', text: 'text-[#166534]' },
    'Interview': { bg: 'bg-[#e0e7ff]', text: 'text-[#4338ca]' },
    'Offer': { bg: 'bg-[#f5f3ff]', text: 'text-[#6d28d9]' },
    'Hired': { bg: 'bg-[#d1fae5]', text: 'text-[#047857]' },
    'Rejected': { bg: 'bg-[#fee2e2]', text: 'text-[#b91c1c]' },
  };
  return colors[stage] || { bg: 'bg-[#dbeafe]', text: 'text-[#1d4ed8]' };
}

function getStageIndicatorColor(stageName: string): string {
  const colors: Record<string, string> = {
    'Queue': 'bg-[#94a3b8]',
    'Applied': 'bg-[#0ea5e9]',
    'Screening': 'bg-[#f59e0b]',
    'Shortlisted': 'bg-[#22c55e]',
    'Interview': 'bg-[#6366f1]',
    'Offer': 'bg-[#8b5cf6]',
    'Hired': 'bg-[#10b981]',
    'Rejected': 'bg-[#ef4444]',
  };
  return colors[stageName] || 'bg-[#94a3b8]';
}

// Stage Summary Strip Component
function StageSummaryStrip({ 
  stages, 
  activeStage,
  onStageFilter 
}: { 
  stages: StageCount[]; 
  activeStage: string | null;
  onStageFilter: (stage: string | null) => void;
}) {
  const handleStageClick = (stageName: string) => {
    const newStage = activeStage === stageName ? null : stageName;
    onStageFilter(newStage);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {stages.map((stage) => (
        <button
          key={stage.name}
          onClick={() => handleStageClick(stage.name)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
            ${activeStage === stage.name 
              ? 'bg-[#0b6cf0] text-white shadow-sm' 
              : 'bg-[#f8fafc] text-[#4b5563] border border-dashed border-[#e2e8f0] hover:bg-[#e8f2fe] hover:border-[#0b6cf0]'
            }
          `}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${activeStage === stage.name ? 'bg-white' : getStageIndicatorColor(stage.name)}`}></span>
          {stage.name} <span className="ml-0.5 opacity-75">{stage.count}</span>
        </button>
      ))}
    </div>
  );
}


// Candidate Table View Component
function CandidateTableView({ 
  candidates, 
  onCandidateClick 
}: { 
  candidates: PipelineCandidate[]; 
  onCandidateClick: (candidate: PipelineCandidate) => void;
}) {
  const columns: Column<PipelineCandidate>[] = [
    {
      key: 'name',
      header: 'Candidate',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full ${getAvatarColor(row.name)} flex items-center justify-center text-white text-xs font-medium flex-shrink-0`}>
            {getInitials(row.name)}
          </div>
          <div>
            <div className="font-semibold text-[#111827]">{row.name}</div>
            <div className="text-[10px] text-[#64748b]">{row.location}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'stage',
      header: 'Stage',
      sortable: true,
      render: (row) => {
        const stageColor = getStageColor(row.stage);
        return (
          <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${stageColor.bg} ${stageColor.text}`}>
            {row.stage}
          </span>
        );
      },
    },
    {
      key: 'score',
      header: 'Score',
      sortable: true,
      align: 'center',
      render: (row) => (
        <Badge text={String(row.score)} variant={getScoreVariant(row.score)} />
      ),
    },
    {
      key: 'experience',
      header: 'Exp',
      sortable: true,
      align: 'center',
      render: (row) => <span className="text-[#64748b]">{row.experience} yrs</span>,
    },
    {
      key: 'source',
      header: 'Source',
      sortable: true,
      render: (row) => <span className="text-[#64748b]">{row.source}</span>,
    },
    {
      key: 'updatedAt',
      header: 'Updated',
      sortable: true,
      render: (row) => <span className="text-[#64748b]">{row.updatedAt}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      render: () => (
        <div className="grid grid-cols-2 gap-1">
          <Button variant="mini" miniColor="note" onClick={() => {}}>Note</Button>
          <Button variant="mini" miniColor="move" onClick={() => {}}>Move</Button>
          <Button variant="mini" miniColor="schedule" onClick={() => {}}>Sched</Button>
          <Button variant="mini" miniColor="cv" onClick={() => {}}>CV</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
      <Table
        columns={columns}
        data={candidates}
        keyExtractor={(row) => row.id}
        onRowClick={onCandidateClick}
      />
    </div>
  );
}


// Kanban Card Component
function KanbanCard({ 
  candidate, 
  onClick 
}: { 
  candidate: PipelineCandidate; 
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-[#e2e8f0] p-3 shadow-sm hover:shadow-lg transition-all cursor-pointer hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full ${getAvatarColor(candidate.name)} flex items-center justify-center text-white text-xs font-medium`}>
            {getInitials(candidate.name)}
          </div>
          <div>
            <div className="font-semibold text-sm text-[#111827]">{candidate.name}</div>
            <div className="text-[10px] text-[#64748b]">{candidate.title}</div>
          </div>
        </div>
        <Badge text={String(candidate.score)} variant={getScoreVariant(candidate.score)} />
      </div>
      
      <div className="text-[10px] text-[#64748b] mb-2">
        {candidate.experience} yrs · {candidate.location}
      </div>
      
      <div className="flex flex-wrap gap-1 mb-3">
        {candidate.skills.slice(0, 3).map((skill) => (
          <span
            key={skill}
            className="px-1.5 py-0.5 bg-[#f8fafc] text-[#4b5563] text-[9px] rounded-full border border-[#e2e8f0]"
          >
            {skill}
          </span>
        ))}
        {candidate.skills.length > 3 && (
          <span className="text-[9px] text-[#94a3b8]">+{candidate.skills.length - 3}</span>
        )}
      </div>
      
      <div className="flex gap-1">
        <Button variant="mini" miniColor="note">Note</Button>
        <Button variant="mini" miniColor="move">Move</Button>
        <Button variant="mini" miniColor="schedule">Sched</Button>
        <Button variant="mini" miniColor="cv">CV</Button>
      </div>
    </div>
  );
}

// Stage color mapping for pipeline indicators
const stageColors: Record<string, { bg: string; border: string; indicator: string }> = {
  'Queue': { bg: 'bg-[#f1f5f9]', border: 'border-[#e2e8f0]', indicator: 'bg-[#94a3b8]' },
  'Applied': { bg: 'bg-[#e0f2fe]', border: 'border-[#bae6fd]', indicator: 'bg-[#0ea5e9]' },
  'Screening': { bg: 'bg-[#fef3c7]', border: 'border-[#fde68a]', indicator: 'bg-[#f59e0b]' },
  'Shortlisted': { bg: 'bg-[#dcfce7]', border: 'border-[#bbf7d0]', indicator: 'bg-[#22c55e]' },
  'Interview': { bg: 'bg-[#e0e7ff]', border: 'border-[#c7d2fe]', indicator: 'bg-[#6366f1]' },
  'Offer': { bg: 'bg-[#f5f3ff]', border: 'border-[#ddd6fe]', indicator: 'bg-[#8b5cf6]' },
  'Hired': { bg: 'bg-[#d1fae5]', border: 'border-[#a7f3d0]', indicator: 'bg-[#10b981]' },
  'Rejected': { bg: 'bg-[#fee2e2]', border: 'border-[#fecaca]', indicator: 'bg-[#ef4444]' },
};

// Kanban Board View Component
function KanbanBoardView({ 
  candidates, 
  stages,
  onCandidateClick 
}: { 
  candidates: PipelineCandidate[]; 
  stages: string[];
  onCandidateClick: (candidate: PipelineCandidate) => void;
}) {
  const getCandidatesByStage = (stage: string) => 
    candidates.filter((c) => c.stage === stage);

  const getStageStyle = (stage: string) => stageColors[stage] || stageColors['Queue'];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.filter(s => s !== 'Rejected').map((stage) => {
        const stageCandidates = getCandidatesByStage(stage);
        const stageStyle = getStageStyle(stage);
        return (
          <div
            key={stage}
            className={`flex-shrink-0 w-[280px] ${stageStyle.bg} rounded-xl p-3 border ${stageStyle.border}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${stageStyle.indicator}`}></div>
                <h4 className="text-sm font-semibold text-[#374151]">{stage}</h4>
              </div>
              <span className="px-2 py-0.5 bg-white rounded-full text-xs font-medium text-[#64748b] border border-[#e2e8f0] shadow-sm">
                {stageCandidates.length}
              </span>
            </div>
            
            <div className="space-y-3 min-h-[200px] max-h-[calc(100vh-500px)] overflow-y-auto">
              {stageCandidates.map((candidate) => (
                <KanbanCard
                  key={candidate.id}
                  candidate={candidate}
                  onClick={() => onCandidateClick(candidate)}
                />
              ))}
              {stageCandidates.length === 0 && (
                <div className="text-center py-8 text-xs text-[#94a3b8]">
                  No candidates
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}


// Main JobDetailsRightPanel Component
export function JobDetailsRightPanel({
  role,
  candidates,
  candidateSearchQuery,
  onCandidateSearchChange,
  viewMode,
  onViewModeChange,
  stageFilter,
  onStageFilterChange,
  onCandidateClick,
  isLoading,
  onViewJobDescription,
  jobDescriptionLoading = false,
}: JobDetailsRightPanelProps) {
  // Calculate stage counts
  const stageCounts: StageCount[] = defaultStages.map((stage) => ({
    name: stage,
    count: candidates.filter((c) => c.stage === stage).length,
  }));

  // Calculate KPI metrics
  const totalCandidates = candidates.length;
  const newThisWeek = candidates.length > 0 ? Math.min(3, candidates.length) : 0;
  const interviewsScheduled = candidates.filter((c) => c.stage === 'Interview').length;
  const pendingFeedback = interviewsScheduled > 0 ? Math.min(2, interviewsScheduled) : 0;
  const offersMade = candidates.filter((c) => c.stage === 'Offer').length;
  const acceptanceRate = 75;
  const avgTimeInStage = 4.2;

  // Show placeholder when no role is selected - Requirement 5.5
  if (!role) {
    return (
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm h-full flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#f8fafc] rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[#111827] mb-2">Select a Role</h3>
          <p className="text-sm text-[#64748b]">Click on a role from the list to view its pipeline details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full overflow-auto">
      {/* Job Header - Requirement 5.2 */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#111827]">{role.title}</h2>
            <p className="text-sm text-[#64748b]">
              {role.department} · {role.location} · Recruiter: {role.recruiter}
            </p>
          </div>
          <div className="flex gap-2">
            {onViewJobDescription && (
              <Button 
                variant="outline" 
                onClick={onViewJobDescription}
                disabled={jobDescriptionLoading}
              >
                {jobDescriptionLoading ? 'Loading...' : 'View JD'}
              </Button>
            )}
            <Button variant="primary">+ Add candidate</Button>
          </div>
        </div>
      </div>

      {/* KPI Cards - Requirement 5.3 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label="Total candidates"
          value={totalCandidates}
          trend={{ text: `${pendingFeedback} New Candidates`, type: 'ok' }}
        />
        <KPICard
          label="Interviews"
          value={interviewsScheduled}
          trend={{ text: `${pendingFeedback} pending`, type: 'warn' }}
        />
        <KPICard
          label="Offers made"
          value={offersMade}
          trend={{ text: `${acceptanceRate}% accept`, type: 'ok' }}
        />
        <KPICard
          label="Avg time"
          value={`${avgTimeInStage}d`}
          trend={{ text: 'In stage', type: 'warn' }}
        />
      </div>

      {/* Candidate Search and Stage Strip */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm space-y-3">
        {/* Candidate Search - Requirement 3.1 */}
        <div className="flex items-center justify-between gap-4">
          <SearchInput
            value={candidateSearchQuery}
            onChange={onCandidateSearchChange}
            placeholder="Search candidates..."
            className="flex-1 max-w-xs"
          />
          <div className="flex gap-2">
            <button
              onClick={() => onViewModeChange('table')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-[#0b6cf0] text-white'
                  : 'bg-[#f8fafc] text-[#4b5563] hover:bg-[#e8f2fe]'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => onViewModeChange('board')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                viewMode === 'board'
                  ? 'bg-[#0b6cf0] text-white'
                  : 'bg-[#f8fafc] text-[#4b5563] hover:bg-[#e8f2fe]'
              }`}
            >
              Board
            </button>
          </div>
        </div>

        {/* Stage Summary Strip */}
        <StageSummaryStrip 
          stages={stageCounts} 
          activeStage={stageFilter}
          onStageFilter={onStageFilterChange} 
        />
      </div>

      {/* Candidates View */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : candidates.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-8 text-center">
          {/* Empty state for no matching candidates - Requirement 3.4 */}
          {candidateSearchQuery.trim() || stageFilter ? (
            <>
              <div className="w-12 h-12 mx-auto mb-3 bg-[#f8fafc] rounded-full flex items-center justify-center">
                <span className="text-2xl">🔍</span>
              </div>
              <p className="text-[#374151] font-medium">No matching candidates</p>
              <p className="text-sm text-[#64748b] mt-1">
                {candidateSearchQuery.trim() && stageFilter
                  ? `No candidates found matching "${candidateSearchQuery}" in ${stageFilter} stage`
                  : candidateSearchQuery.trim()
                    ? `No candidates found matching "${candidateSearchQuery}"`
                    : `No candidates in ${stageFilter} stage`}
              </p>
              <p className="text-xs text-[#94a3b8] mt-2">Try adjusting your search or filter criteria</p>
            </>
          ) : (
            <>
              <p className="text-[#64748b]">No candidates have applied to this role yet.</p>
              <p className="text-sm text-[#94a3b8] mt-1">Candidates will appear here when they apply.</p>
            </>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <CandidateTableView
          candidates={candidates}
          onCandidateClick={onCandidateClick}
        />
      ) : (
        <KanbanBoardView
          candidates={candidates}
          stages={defaultStages}
          onCandidateClick={onCandidateClick}
        />
      )}
    </div>
  );
}

export default JobDetailsRightPanel;
