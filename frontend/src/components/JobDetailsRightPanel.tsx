/**
 * JobDetailsRightPanel Component - Requirements 1.1, 1.2, 3.1, 4.1, 4.2, 4.5, 5.2, 5.3, 5.5
 * 
 * Right panel of the split-panel layout containing:
 * - Job header with title, department, and actions
 * - KPI cards row (4 metrics)
 * - Enhanced pipeline stage cards with SLA breach indicators
 * - Bulk actions toolbar (when candidates selected)
 * - Candidate search input
 * - Stage summary strip with drill-down filtering
 * - Candidate view (table or board) with checkbox selection
 * 
 * Styled with 60% width on desktop
 * Shows placeholder when no role is selected
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  KPICard, Badge, Button, Table, SearchInput, LoadingSpinner, BulkActionsToolbar, InterviewScheduleModal, JobActionsDropdown, ShareJobModal,
  AddCandidateModal,
  AddNoteModal,
  MoveCandidateModal,
  BulkImportModal,
  calculateAverageScore
} from './index';
import { LegacyAdvancedFilters } from './AdvancedFilters';
import type { Column } from './Table';
import type { AdvancedFiltersState } from './AdvancedFilters';
import { pipelineService, jobsService, getResumeUrl } from '../services';
import type { BulkMoveResult, PipelineAnalytics } from '../services';
import { extractUniqueSkills, extractUniqueSources, applyAdvancedFilters } from '../utils/filters';
import { DEFAULT_PIPELINE_STAGES, STAGE_COLORS, getStageColors, getStageIndicatorColor } from '../constants';

// Types
export interface PipelineCandidate {
  id: string;
  jobCandidateId?: string; // ID of the JobCandidate record for bulk operations
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
  // Score breakdown fields - Requirements 2.1, 8.2
  domainScore?: number | null;
  industryScore?: number | null;
  keyResponsibilitiesScore?: number | null;
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
  /** Callback for Edit JD button - Requirements 1.1 */
  onEditJobDescription?: () => void;
  pipelineStages?: { id: string; name: string; position: number }[];
  onCandidatesMoved?: () => void;
  /** Enable enhanced pipeline view with stage cards - Requirements 4.1, 4.5 */
  showEnhancedPipeline?: boolean;
  /** Callback when job status is toggled (open/close) */
  onToggleStatus?: () => void;
  /** Callback when job is duplicated */
  onDuplicateJob?: () => void;
}


const defaultStages = [...DEFAULT_PIPELINE_STAGES];

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
  const colors = getStageColors(stage);
  return { bg: colors.bg, text: colors.text };
}

// Using imported getStageIndicatorColor from constants

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


// Candidate Table View Component with checkbox selection - Requirements 1.1
function CandidateTableView({
  candidates,
  onCandidateClick,
  selectedCandidates,
  onSelectionChange,
  onScheduleInterview,
  onAddNote,
  onMoveCandidate,
  onViewCV,
}: {
  candidates: PipelineCandidate[];
  onCandidateClick: (candidate: PipelineCandidate) => void;
  selectedCandidates: string[];
  onSelectionChange: (candidateIds: string[]) => void;
  onScheduleInterview: (candidate: PipelineCandidate) => void;
  onAddNote: (candidate: PipelineCandidate) => void;
  onMoveCandidate: (candidate: PipelineCandidate) => void;
  onViewCV: (candidate: PipelineCandidate) => void;
}) {
  const allSelected = candidates.length > 0 && candidates.every(c => selectedCandidates.includes(c.jobCandidateId || c.id));
  const someSelected = candidates.some(c => selectedCandidates.includes(c.jobCandidateId || c.id)) && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all
      const candidateIds = candidates.map(c => c.jobCandidateId || c.id);
      onSelectionChange(selectedCandidates.filter(id => !candidateIds.includes(id)));
    } else {
      // Select all
      const candidateIds = candidates.map(c => c.jobCandidateId || c.id);
      const newSelection = [...new Set([...selectedCandidates, ...candidateIds])];
      onSelectionChange(newSelection);
    }
  };

  const handleSelectCandidate = (candidate: PipelineCandidate, e: React.MouseEvent) => {
    e.stopPropagation();
    const candidateId = candidate.jobCandidateId || candidate.id;
    if (selectedCandidates.includes(candidateId)) {
      onSelectionChange(selectedCandidates.filter(id => id !== candidateId));
    } else {
      onSelectionChange([...selectedCandidates, candidateId]);
    }
  };

  const columns: Column<PipelineCandidate>[] = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = someSelected;
          }}
          onChange={handleSelectAll}
          className="w-4 h-4 rounded border-gray-300 text-[#0b6cf0] focus:ring-[#0b6cf0] cursor-pointer"
        />
      ),
      width: '40px',
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedCandidates.includes(row.jobCandidateId || row.id)}
          onChange={() => { }}
          onClick={(e) => handleSelectCandidate(row, e)}
          className="w-4 h-4 rounded border-gray-300 text-[#0b6cf0] focus:ring-[#0b6cf0] cursor-pointer"
        />
      ),
    },
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
      key: 'contact',
      header: 'Contact',
      render: (row) => (
        <div className="text-xs min-w-[140px] max-w-[180px]">
          <div
            className="text-gray-600 break-all leading-tight"
            title={row.email || undefined}
            style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
          >
            {row.email || '-'}
          </div>
          <div className="text-gray-500 mt-0.5">{row.phone || '-'}</div>
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
      render: (row) => {
        // Calculate average from sub-scores if available, otherwise use existing score - Requirements 2.4
        const calculatedScore = calculateAverageScore(
          row.domainScore,
          row.industryScore,
          row.keyResponsibilitiesScore
        );
        const displayScore = calculatedScore ?? row.score;
        return (
          <Badge text={String(displayScore)} variant={getScoreVariant(displayScore)} />
        );
      },
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
      render: (row) => {
        const handleScheduleClick = () => {
          onScheduleInterview(row);
        };
        return (
          <div className="grid grid-cols-2 gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="mini" miniColor="note" onClick={() => onAddNote(row)}>Note</Button>
            <Button variant="mini" miniColor="move" onClick={() => onMoveCandidate(row)}>Move</Button>
            <Button variant="mini" miniColor="schedule" onClick={handleScheduleClick}>Sched</Button>
            <Button variant="mini" miniColor="cv" onClick={() => onViewCV(row)} disabled={!row.resumeUrl}>CV</Button>
          </div>
        );
      },
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


// Kanban Card Component with checkbox selection and drag support - Requirements 1.1
function KanbanCard({
  candidate,
  onClick,
  isSelected,
  onSelect,
  isDragging,
  onDragStart,
  onDragEnd,
  onScheduleInterview,
  onViewCV,
  onMoveCandidate,
  onAddNote,
}: {
  candidate: PipelineCandidate;
  onClick: () => void;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onScheduleInterview: () => void;
  onViewCV?: () => void;
  onMoveCandidate?: () => void;
  onAddNote: () => void;
}) {
  // Calculate average from sub-scores if available, otherwise use existing score - Requirements 2.4
  const calculatedScore = calculateAverageScore(
    candidate.domainScore,
    candidate.industryScore,
    candidate.keyResponsibilitiesScore
  );
  const displayScore = calculatedScore ?? candidate.score;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`
        bg-white rounded-lg border p-2 shadow-sm transition-all cursor-grab active:cursor-grabbing
        ${isSelected ? 'border-[#0b6cf0] ring-1 ring-[#0b6cf0]/20' : 'border-gray-200'}
        ${isDragging ? 'opacity-50 scale-95 shadow-md ring-1 ring-[#0b6cf0]' : 'hover:shadow-md hover:-translate-y-0.5'}
      `}
    >
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => { }}
            onClick={onSelect}
            className="w-4 h-4 rounded border-gray-300 text-[#0b6cf0] focus:ring-[#0b6cf0] cursor-pointer"
          />
          <div className={`w-8 h-8 rounded-full ${getAvatarColor(candidate.name)} flex items-center justify-center text-white text-xs font-medium`}>
            {getInitials(candidate.name)}
          </div>
          <div>
            <div className="font-semibold text-sm text-[#111827]">{candidate.name}</div>
            <div className="text-[10px] text-[#64748b]">{candidate.title}</div>
          </div>
        </div>
        <Badge text={String(displayScore)} variant={getScoreVariant(displayScore)} />
      </div>

      <div className="text-[10px] text-[#64748b] mb-1.5">
        {candidate.experience} yrs · {candidate.location}
      </div>

      {/* Contact Information - Requirements 1.4 */}
      <div className="text-[10px] text-[#64748b] mb-2 space-y-0.5">
        {candidate.email && (
          <div
            className="break-all leading-tight"
            title={candidate.email}
            style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
          >
            📧 {candidate.email}
          </div>
        )}
        {candidate.phone && (
          <div>
            📞 {candidate.phone}
          </div>
        )}
        {!candidate.email && !candidate.phone && (
          <div className="text-[#94a3b8] italic">No contact info</div>
        )}
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

      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <Button variant="mini" miniColor="note" onClick={onAddNote}>Note</Button>
        <Button variant="mini" miniColor="move" onClick={onMoveCandidate}>Move</Button>
        <Button variant="mini" miniColor="schedule" onClick={onScheduleInterview}>Sched</Button>
        <Button
          variant="mini"
          miniColor="cv"
          onClick={onViewCV}
          disabled={!candidate.resumeUrl}
        >
          CV
        </Button>
      </div>
    </div>
  );
}

// Stage color mapping for pipeline indicators - using imported STAGE_COLORS
const stageColorsMapping: Record<string, { bg: string; border: string; indicator: string }> = Object.fromEntries(
  Object.entries(STAGE_COLORS).map(([key, value]) => [
    key,
    {
      bg: value.bg,
      border: value.border || 'border-[#e2e8f0]',
      indicator: value.indicator
    }
  ])
);

// Kanban Board View Component with checkbox selection and drag-drop - Requirements 1.1
function KanbanBoardView({
  candidates,
  stages,
  pipelineStages,
  onCandidateClick,
  selectedCandidates,
  onSelectionChange,
  onCandidateDrop,
  isMoving,
  onScheduleInterview,
  onAddNote,
  onMoveCandidate,
  onViewCV,
}: {
  candidates: PipelineCandidate[];
  stages: string[];
  pipelineStages: { id: string; name: string; position: number }[];
  onCandidateClick: (candidate: PipelineCandidate) => void;
  selectedCandidates: string[];
  onSelectionChange: (candidateIds: string[]) => void;
  onCandidateDrop: (candidateId: string, targetStageId: string, targetStageName: string) => void;
  isMoving: boolean;
  onScheduleInterview: (candidate: PipelineCandidate) => void;
  onAddNote: (candidate: PipelineCandidate) => void;
  onMoveCandidate: (candidate: PipelineCandidate) => void;
  onViewCV: (candidate: PipelineCandidate) => void;
}) {
  const [draggingCandidateId, setDraggingCandidateId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const getCandidatesByStage = (stage: string) =>
    candidates.filter((c) => c.stage === stage);

  const getStageStyle = (stage: string) => stageColorsMapping[stage] || stageColorsMapping['Queue'];

  // Get stage ID from name
  const getStageId = (stageName: string): string => {
    const stage = pipelineStages.find(s => s.name === stageName);
    return stage?.id || stageName;
  };

  const handleSelectCandidate = (candidate: PipelineCandidate, e: React.MouseEvent) => {
    e.stopPropagation();
    const candidateId = candidate.jobCandidateId || candidate.id;
    if (selectedCandidates.includes(candidateId)) {
      onSelectionChange(selectedCandidates.filter(id => id !== candidateId));
    } else {
      onSelectionChange([...selectedCandidates, candidateId]);
    }
  };

  const handleDragStart = (e: React.DragEvent, candidate: PipelineCandidate) => {
    const candidateId = candidate.jobCandidateId || candidate.id;
    setDraggingCandidateId(candidateId);
    e.dataTransfer.setData('text/plain', JSON.stringify({
      candidateId,
      candidateName: candidate.name,
      fromStage: candidate.stage,
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingCandidateId(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stageName: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageName);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the stage column entirely
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDragOverStage(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStageName: string) => {
    e.preventDefault();
    setDragOverStage(null);

    if (isMoving) return;

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { candidateId, fromStage } = data;

      // Don't do anything if dropping on the same stage
      if (fromStage === targetStageName) {
        return;
      }

      const targetStageId = getStageId(targetStageName);
      onCandidateDrop(candidateId, targetStageId, targetStageName);
    } catch (error) {
      console.error('Failed to parse drag data:', error);
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.filter(s => s !== 'Rejected').map((stage) => {
        const stageCandidates = getCandidatesByStage(stage);
        const stageStyle = getStageStyle(stage);
        const isDragOver = dragOverStage === stage;

        return (
          <div
            key={stage}
            onDragOver={(e) => handleDragOver(e, stage)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage)}
            className={`
              flex-shrink-0 w-[260px] rounded-lg p-2 border transition-all duration-200
              ${stageStyle.bg} ${stageStyle.border}
              ${isDragOver ? 'ring-2 ring-[#0b6cf0] ring-offset-1 border-[#0b6cf0]' : ''}
            `}
          >
            <div className="flex items-center justify-between mb-1.5 px-1">
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${stageStyle.indicator}`}></div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-tight">{stage}</h4>
              </div>
              <span className={`
                px-1.5 py-0.5 rounded text-[10px] font-bold border leading-none
                ${isDragOver ? 'bg-[#0b6cf0] text-white border-[#0b6cf0]' : 'bg-white text-gray-400 border-gray-100'}
              `}>
                {stageCandidates.length}
              </span>
            </div>

            <div className={`
              space-y-1.5 min-h-[100px] max-h-[calc(100vh-280px)] overflow-y-auto rounded p-0.5 transition-colors custom-scrollbar
              ${isDragOver ? 'bg-[#0b6cf0]/5' : ''}
            `}>
              {stageCandidates.map((candidate) => (
                <KanbanCard
                  key={candidate.id}
                  candidate={candidate}
                  onClick={() => onCandidateClick(candidate)}
                  isSelected={selectedCandidates.includes(candidate.jobCandidateId || candidate.id)}
                  onSelect={(e) => handleSelectCandidate(candidate, e)}
                  isDragging={draggingCandidateId === (candidate.jobCandidateId || candidate.id)}
                  onDragStart={(e) => handleDragStart(e, candidate)}
                  onDragEnd={handleDragEnd}
                  onScheduleInterview={() => onScheduleInterview(candidate)}
                  onAddNote={() => onAddNote(candidate)}
                  onMoveCandidate={() => onMoveCandidate(candidate)}
                  onViewCV={() => onViewCV(candidate)}
                />
              ))}
              {stageCandidates.length === 0 && (
                <div className={`
                  text-center py-8 text-xs rounded-lg border-2 border-dashed transition-colors
                  ${isDragOver ? 'border-[#0b6cf0] bg-[#0b6cf0]/10 text-[#0b6cf0]' : 'border-transparent text-[#94a3b8]'}
                `}>
                  {isDragOver ? 'Drop here' : 'No candidates'}
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
  onEditJobDescription,
  pipelineStages = [],
  onCandidatesMoved,
  showEnhancedPipeline = true,
  onToggleStatus,
  onDuplicateJob,
}: JobDetailsRightPanelProps) {
  // URL search params for stage filter - Requirements 4.2
  const [searchParams, setSearchParams] = useSearchParams();

  // Selection state for bulk operations - Requirements 1.1, 1.2
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [isBulkMoving, setIsBulkMoving] = useState(false);

  // Drag-drop state for single candidate moves
  const [isDragMoving, setIsDragMoving] = useState(false);

  // Pipeline analytics state - Requirements 4.1, 4.5
  const [pipelineAnalytics, setPipelineAnalytics] = useState<PipelineAnalytics | null>(null);

  // Interview scheduling state - Requirements 1.1
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedCandidateForInterview, setSelectedCandidateForInterview] = useState<PipelineCandidate | null>(null);

  // Bulk Import Modal State
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Share job modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Add Candidate modal state
  const [isAddCandidateModalOpen, setIsAddCandidateModalOpen] = useState(false);

  // Note modal state
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedCandidateForNote, setSelectedCandidateForNote] = useState<{ id: string; name: string } | null>(null);

  // Move Candidate Modal State
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [selectedCandidateForMove, setSelectedCandidateForMove] = useState<PipelineCandidate | null>(null);

  // Advanced filters state - Requirements 4.3
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersState>({
    skills: [],
    experienceMin: null,
    experienceMax: null,
    source: null,
  });
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  // Extract available skills and sources from candidates - Requirements 4.3
  const availableSkills = useMemo(() => {
    const candidatesWithSkills = candidates.map(c => ({
      ...c,
      skills: c.skills || [],
      experience: c.experience,
      source: c.source,
    }));
    return extractUniqueSkills(candidatesWithSkills);
  }, [candidates]);

  const availableSources = useMemo(() => {
    const candidatesWithSource = candidates.map(c => ({
      ...c,
      skills: c.skills || [],
      experience: c.experience,
      source: c.source,
    }));
    return extractUniqueSources(candidatesWithSource);
  }, [candidates]);

  // Apply advanced filters to candidates - Requirements 4.3, 4.4
  const filteredByAdvanced = useMemo(() => {
    const candidatesForFilter = candidates.map(c => ({
      ...c,
      skills: c.skills || [],
      experience: c.experience,
      source: c.source,
    }));
    return applyAdvancedFilters(candidatesForFilter, advancedFilters);
  }, [candidates, advancedFilters]);

  // Sync stage filter with URL - Requirements 4.2
  useEffect(() => {
    const urlStage = searchParams.get('stage');
    if (urlStage && urlStage !== stageFilter) {
      onStageFilterChange(urlStage);
    }
  }, [searchParams, stageFilter, onStageFilterChange]);

  // Update URL when stage filter changes - Requirements 4.2
  const handleStageFilterChange = useCallback((stage: string | null) => {
    onStageFilterChange(stage);
    if (stage) {
      setSearchParams({ stage });
    } else {
      setSearchParams({});
    }
  }, [onStageFilterChange, setSearchParams]);

  // Fetch pipeline analytics when role changes - Requirements 4.1
  useEffect(() => {
    async function fetchAnalytics() {
      if (!role || !showEnhancedPipeline) {
        setPipelineAnalytics(null);
        return;
      }

      try {
        const analytics = await jobsService.getPipelineAnalytics(role.id);
        setPipelineAnalytics(analytics);
      } catch (error) {
        console.error('Failed to fetch pipeline analytics:', error);
        setPipelineAnalytics(null);
      }
    }

    fetchAnalytics();
  }, [role, showEnhancedPipeline]);

  // Calculate stage counts from filtered candidates - Requirements 4.4
  const stageCounts: StageCount[] = defaultStages.map((stage) => ({
    name: stage,
    count: filteredByAdvanced.filter((c) => c.stage === stage).length,
  }));

  // Calculate KPI metrics
  const totalCandidates = candidates.length;
  const newThisWeek = candidates.length > 0 ? Math.min(3, candidates.length) : 0;
  const interviewsScheduled = candidates.filter((c) => c.stage === 'Interview').length;
  const pendingFeedback = interviewsScheduled > 0 ? Math.min(2, interviewsScheduled) : 0;
  const offersMade = candidates.filter((c) => c.stage === 'Offer').length;
  const acceptanceRate = 75;
  const avgTimeInStage = 4.2;

  // Handle bulk move - Requirements 1.3, 1.5
  const handleBulkMove = useCallback(async (targetStageId: string, comment?: string): Promise<BulkMoveResult> => {
    if (!role) {
      return { success: false, movedCount: 0, failedCount: selectedCandidates.length };
    }

    setIsBulkMoving(true);
    try {
      const result = await pipelineService.bulkMove({
        candidateIds: selectedCandidates,
        targetStageId,
        jobId: role.id,
        comment,
      });

      // Refresh candidates list after successful move
      if (result.movedCount > 0 && onCandidatesMoved) {
        onCandidatesMoved();
      }

      return result;
    } finally {
      setIsBulkMoving(false);
    }
  }, [role, selectedCandidates, onCandidatesMoved]);

  // Clear selection handler
  const handleClearSelection = useCallback(() => {
    setSelectedCandidates([]);
  }, []);

  // Handle opening interview schedule modal - Requirements 1.1
  const handleScheduleInterview = useCallback((candidate: PipelineCandidate) => {
    setSelectedCandidateForInterview(candidate);
    setIsScheduleModalOpen(true);
  }, []);

  const handleAddNoteClick = useCallback((candidate: PipelineCandidate) => {
    setSelectedCandidateForNote({ id: candidate.id, name: candidate.name });
    setIsNoteModalOpen(true);
  }, []);

  // Handle move candidate - Button click
  const handleMoveCandidate = useCallback((candidate: PipelineCandidate) => {
    setSelectedCandidateForMove(candidate);
    setIsMoveModalOpen(true);
  }, []);

  // Handle confirm move
  const handleConfirmMove = useCallback(async (targetStageId: string) => {
    if (!role || !selectedCandidateForMove) return;

    await pipelineService.bulkMove({
      candidateIds: [selectedCandidateForMove.jobCandidateId || selectedCandidateForMove.id],
      targetStageId,
      jobId: role.id,
    });

    if (onCandidatesMoved) {
      onCandidatesMoved();
    }
  }, [role, selectedCandidateForMove, onCandidatesMoved]);

  // Handle View CV
  const handleViewCV = useCallback((candidate: PipelineCandidate) => {
    if (candidate.resumeUrl) {
      const fullUrl = getResumeUrl(candidate.resumeUrl);
      window.open(fullUrl, '_blank');
    } else {
      // Optional: Show toast or alert
      console.warn('No resume available for this candidate');
    }
  }, []);

  // Handle share job modal
  const handleShareJob = useCallback(() => {
    setIsShareModalOpen(true);
  }, []);


  // Handle bulk import
  const handleBulkImport = useCallback(() => {
    setIsBulkImportOpen(true);
  }, []);

  // Handle interview scheduled success
  const handleInterviewScheduled = useCallback((_interview: any) => {
    setIsScheduleModalOpen(false);
    setSelectedCandidateForInterview(null);
    // Optionally refresh data or show success message
  }, []);

  // Handle single candidate drag-drop move
  const handleCandidateDrop = useCallback(async (candidateId: string, targetStageId: string, _targetStageName: string) => {
    if (!role || isDragMoving) return;

    setIsDragMoving(true);
    try {
      await pipelineService.bulkMove({
        candidateIds: [candidateId],
        targetStageId,
        jobId: role.id,
      });

      // Refresh candidates list after successful move
      if (onCandidatesMoved) {
        onCandidatesMoved();
      }
    } catch (error) {
      console.error('Failed to move candidate:', error);
    } finally {
      setIsDragMoving(false);
    }
  }, [role, isDragMoving, onCandidatesMoved]);

  // Get pipeline stages for bulk move dropdown
  const bulkMoveStages = pipelineStages.length > 0
    ? pipelineStages
    : defaultStages.map((name, index) => ({ id: name, name, position: index }));

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
                size="sm"
                onClick={onViewJobDescription}
                disabled={jobDescriptionLoading}
              >
                {jobDescriptionLoading ? 'Loading...' : 'View JD'}
              </Button>
            )}
            {onEditJobDescription && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEditJobDescription}
              >
                Edit JD
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={() => setIsAddCandidateModalOpen(true)}>+ Add candidate</Button>
            <JobActionsDropdown
              jobId={role.id}
              jobTitle={role.title}
              jobStatus={role.status}
              onShareJob={handleShareJob}
              onBulkImport={handleBulkImport}
              onToggleStatus={onToggleStatus}
              onDuplicateJob={onDuplicateJob}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards - Requirement 5.3 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label="Total candidates"
          value={totalCandidates}
          trend={{ text: `${newThisWeek} New Candidates`, type: 'ok' }}
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
          value={pipelineAnalytics ? `${pipelineAnalytics.overallTAT.toFixed(1)}d` : `${avgTimeInStage}d`}
          trend={{ text: 'In stage', type: 'warn' }}
        />
      </div>

      {/* Bulk Actions Toolbar - Requirements 1.1, 1.2 */}
      <BulkActionsToolbar
        selectedCandidates={selectedCandidates}
        stages={bulkMoveStages}
        onBulkMove={handleBulkMove}
        onClearSelection={handleClearSelection}
        isLoading={isBulkMoving}
      />

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
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${viewMode === 'table'
                ? 'bg-[#0b6cf0] text-white'
                : 'bg-[#f8fafc] text-[#4b5563] hover:bg-[#e8f2fe]'
                }`}
            >
              Table
            </button>
            <button
              onClick={() => onViewModeChange('board')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${viewMode === 'board'
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
          onStageFilter={handleStageFilterChange}
        />
      </div>

      {/* Advanced Filters - Requirements 4.3 */}
      <LegacyAdvancedFilters
        filters={advancedFilters}
        onFiltersChange={setAdvancedFilters}
        availableSkills={availableSkills}
        availableSources={availableSources}
        isExpanded={isFiltersExpanded}
        onToggleExpand={() => setIsFiltersExpanded(!isFiltersExpanded)}
      />

      {/* Candidates View */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredByAdvanced.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-8 text-center">
          {/* Empty state for no matching candidates - Requirement 3.4 */}
          {candidateSearchQuery.trim() || stageFilter || advancedFilters.skills.length > 0 || advancedFilters.source || advancedFilters.experienceMin !== null || advancedFilters.experienceMax !== null ? (
            <>
              <div className="w-12 h-12 mx-auto mb-3 bg-[#f8fafc] rounded-full flex items-center justify-center">
                <span className="text-2xl">🔍</span>
              </div>
              <p className="text-[#374151] font-medium">No matching candidates</p>
              <p className="text-sm text-[#64748b] mt-1">
                No candidates found matching your filter criteria
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
          candidates={filteredByAdvanced}
          onCandidateClick={onCandidateClick}
          selectedCandidates={selectedCandidates}
          onSelectionChange={setSelectedCandidates}
          onScheduleInterview={handleScheduleInterview}
          onAddNote={handleAddNoteClick}
          onMoveCandidate={handleMoveCandidate}
          onViewCV={handleViewCV}
        />
      ) : (
        <KanbanBoardView
          candidates={filteredByAdvanced}
          stages={defaultStages}
          pipelineStages={pipelineStages}
          onCandidateClick={onCandidateClick}
          selectedCandidates={selectedCandidates}
          onSelectionChange={setSelectedCandidates}
          onCandidateDrop={handleCandidateDrop}
          isMoving={isDragMoving}
          onScheduleInterview={handleScheduleInterview}
          onAddNote={handleAddNoteClick}
          onMoveCandidate={handleMoveCandidate}
          onViewCV={handleViewCV}
        />
      )}

      {/* Interview Schedule Modal - Requirements 1.1 */}
      {selectedCandidateForInterview && role && (
        <InterviewScheduleModal
          isOpen={isScheduleModalOpen}
          onClose={() => {
            setIsScheduleModalOpen(false);
            setSelectedCandidateForInterview(null);
          }}
          onSuccess={handleInterviewScheduled}
          jobCandidateId={selectedCandidateForInterview.jobCandidateId || selectedCandidateForInterview.id}
          candidateName={selectedCandidateForInterview.name}
          jobTitle={role.title}
          jobId={role.id}
        />
      )}

      {/* Share Job Modal */}
      {role && (
        <ShareJobModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          jobTitle={role.title}
          jobId={role.id}
        />
      )}

      {/* Add Candidate Modal */}
      {role && (
        <AddCandidateModal
          isOpen={isAddCandidateModalOpen}
          onClose={() => setIsAddCandidateModalOpen(false)}
          jobId={role.id}
          jobTitle={role.title}
          onSuccess={onCandidatesMoved}
        />
      )}

      {selectedCandidateForNote && (
        <AddNoteModal
          isOpen={isNoteModalOpen}
          onClose={() => {
            setIsNoteModalOpen(false);
            setSelectedCandidateForNote(null);
          }}
          candidateId={selectedCandidateForNote.id}
          candidateName={selectedCandidateForNote.name}
          onSuccess={() => {
            // Optional: refresh if needed, usually notes don't change list view immediately
          }}
        />
      )}

      {role && selectedCandidateForMove && (
        <MoveCandidateModal
          isOpen={isMoveModalOpen}
          onClose={() => {
            setIsMoveModalOpen(false);
            setSelectedCandidateForMove(null);
          }}
          candidateName={selectedCandidateForMove.name}
          currentStageId={pipelineStages.find(s => s.name === selectedCandidateForMove.stage)?.id || selectedCandidateForMove.stage}
          stages={bulkMoveStages}
          onMove={handleConfirmMove}
        />
      )}

      {role && (
        <BulkImportModal
          isOpen={isBulkImportOpen}
          onClose={() => setIsBulkImportOpen(false)}
          jobId={role.id}
          onSuccess={() => {
            setIsBulkImportOpen(false);
            if (onCandidatesMoved) onCandidatesMoved();
          }}
        />
      )}

    </div>
  );
}

export default JobDetailsRightPanel;
