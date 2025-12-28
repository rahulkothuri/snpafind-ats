/**
 * Interview Dashboard Page
 * 
 * Comprehensive interview management dashboard with:
 * - View toggle (Calendar view / List + pipeline)
 * - Filters row (Month, Recruiter, Interview type)
 * - 4 KPI summary cards
 * - Calendar View: Monthly calendar grid + selected date interview list
 * - List View: Interview table (top) + Interview pipeline board (bottom)
 * - Pipeline stages: To Schedule, Scheduled, Today/Ongoing, Feedback Pending, Completed, No-show/Cancelled
 * 
 * Requirements: 11.1, 11.2, 11.3, 12.1, 12.2, 12.5, 13.1, 13.2, 13.3, 13.4
 */

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layout, 
  LoadingSpinner, 
  ErrorMessage, 
  EmptyState,
  InterviewDetailModal,
  RescheduleModal,
  CancelConfirmationModal,
} from '../components';
import { useAuth } from '../hooks/useAuth';
import { useInterviews } from '../hooks/useInterviews';
import { useUsers } from '../hooks/useUsers';
import type { Interview, InterviewMode } from '../services/interviews.service';

type ViewMode = 'calendar' | 'list';

// Pipeline stage definitions with all stages
const PIPELINE_STAGES = [
  { id: 'to_schedule', label: 'To Schedule', color: 'bg-gray-100', borderColor: 'border-gray-300', textColor: 'text-gray-700', dotColor: 'bg-gray-400' },
  { id: 'scheduled', label: 'Scheduled', color: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-700', dotColor: 'bg-blue-400' },
  { id: 'today', label: 'Today / Ongoing', color: 'bg-amber-50', borderColor: 'border-amber-200', textColor: 'text-amber-700', dotColor: 'bg-amber-400' },
  { id: 'feedback_pending', label: 'Feedback Pending', color: 'bg-orange-50', borderColor: 'border-orange-200', textColor: 'text-orange-700', dotColor: 'bg-orange-400' },
  { id: 'completed', label: 'Completed', color: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-700', dotColor: 'bg-green-400' },
  { id: 'no_show', label: 'No-show / Cancelled', color: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-700', dotColor: 'bg-red-400' },
] as const;

type PipelineStageId = typeof PIPELINE_STAGES[number]['id'];

// Helper functions
const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
};

const formatFullDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
};

const isToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const getModeLabel = (mode: InterviewMode): string => {
  const labels: Record<InterviewMode, string> = {
    google_meet: 'Google Meet',
    microsoft_teams: 'MS Teams',
    in_person: 'In-Person',
  };
  return labels[mode] || mode;
};

const getModeIcon = (mode: InterviewMode): string => {
  const icons: Record<InterviewMode, string> = {
    google_meet: '📹',
    microsoft_teams: '💼',
    in_person: '🏢',
  };
  return icons[mode] || '📅';
};

// Determine pipeline stage for an interview
const getInterviewStage = (interview: Interview): PipelineStageId => {
  const scheduledDate = new Date(interview.scheduledAt);
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const interviewDateStr = scheduledDate.toISOString().split('T')[0];
  
  if (interview.status === 'cancelled') return 'no_show';
  if (interview.status === 'no_show') return 'no_show';
  if (interview.status === 'completed') {
    // Check if feedback is pending
    if (!interview.feedback || interview.feedback.length === 0) {
      return 'feedback_pending';
    }
    return 'completed';
  }
  if (interview.status === 'in_progress') return 'today';
  if (interview.status === 'scheduled') {
    if (interviewDateStr === todayStr) return 'today';
    if (scheduledDate > now) return 'scheduled';
    // Past scheduled but not completed - needs scheduling or feedback
    return 'feedback_pending';
  }
  return 'to_schedule';
};

// KPI Card Component
interface KPICardProps {
  label: string;
  value: number | string;
  subtext: string;
  alert?: boolean;
}

function KPICard({ label, value, subtext, alert }: KPICardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        {alert && (
          <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
            Needs attention
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{subtext}</div>
    </div>
  );
}

// Status Badge Component
interface StatusBadgeProps {
  status: string;
  isToday?: boolean;
}

function StatusBadge({ status, isToday: isTodayInterview }: StatusBadgeProps) {
  const getStatusStyles = () => {
    if (isTodayInterview && status === 'scheduled') {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'no_show': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = () => {
    if (isTodayInterview && status === 'scheduled') return 'Today';
    switch (status) {
      case 'scheduled': return 'Scheduled';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'no_show': return 'No-show';
      default: return status;
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusStyles()}`}>
      {getStatusLabel()}
    </span>
  );
}

// Pipeline Card Component
interface PipelineCardProps {
  interview: Interview;
  onClick: () => void;
}

function PipelineCard({ interview, onClick }: PipelineCardProps) {
  const candidateName = interview.jobCandidate?.candidate?.name || 'Unknown Candidate';
  const jobTitle = interview.jobCandidate?.job?.title || 'Unknown Role';
  const panelMembers = interview.panelMembers?.map(pm => pm.user?.name).filter(Boolean) || [];
  const recruiterName = interview.scheduler?.name || 'Unknown';

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600">
            {candidateName}
          </h4>
          <p className="text-xs text-gray-500 truncate">{jobTitle}</p>
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {formatTime(interview.scheduledAt)}
        </span>
      </div>
      
      <div className="text-xs text-gray-500 mb-2">
        {formatDate(interview.scheduledAt)} · {interview.duration} min
      </div>
      
      <div className="flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
          {getModeIcon(interview.mode)} {getModeLabel(interview.mode)}
        </span>
        {panelMembers.length > 0 && (
          <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-600 rounded-full truncate max-w-[120px]">
            {panelMembers[0]}{panelMembers.length > 1 ? ` +${panelMembers.length - 1}` : ''}
          </span>
        )}
        <span className="px-2 py-0.5 text-xs bg-purple-50 text-purple-600 rounded-full">
          {recruiterName}
        </span>
      </div>
    </div>
  );
}

// Pipeline Column Component
interface PipelineColumnProps {
  stage: typeof PIPELINE_STAGES[number];
  interviews: Interview[];
  onInterviewClick: (interview: Interview) => void;
}

function PipelineColumn({ stage, interviews, onInterviewClick }: PipelineColumnProps) {
  return (
    <div className={`flex-1 min-w-[200px] max-w-[280px] rounded-xl ${stage.color} border ${stage.borderColor} p-3`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${stage.dotColor}`} />
          <h3 className={`text-sm font-semibold ${stage.textColor}`}>{stage.label}</h3>
        </div>
        <span className="px-2 py-0.5 text-xs font-medium bg-white/80 text-gray-700 rounded-full shadow-sm">
          {interviews.length}
        </span>
      </div>
      
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {interviews.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No interviews</p>
        ) : (
          interviews.map(interview => (
            <PipelineCard
              key={interview.id}
              interview={interview}
              onClick={() => onInterviewClick(interview)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Calendar Day Cell Component
interface CalendarDayCellProps {
  day: number;
  count: number;
  isToday: boolean;
  isSelected: boolean;
  onClick: () => void;
}

function CalendarDayCell({ day, count, isToday: isTodayCell, isSelected, onClick }: CalendarDayCellProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative p-2 min-h-[70px] rounded-lg text-left transition-all
        ${isTodayCell ? 'bg-blue-50 ring-2 ring-blue-200' : 'bg-gray-50 hover:bg-gray-100'}
        ${isSelected ? 'ring-2 ring-blue-500 shadow-md' : ''}
      `}
    >
      <span className={`text-sm font-semibold ${isTodayCell ? 'text-blue-600' : 'text-gray-900'}`}>
        {day}
      </span>
      <div className="mt-1">
        {count > 0 ? (
          <>
            <p className="text-xs text-gray-500">{count} interview{count > 1 ? 's' : ''}</p>
            <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 rounded">
              {count} scheduled
            </span>
          </>
        ) : (
          <p className="text-xs text-gray-400">No interviews</p>
        )}
      </div>
    </button>
  );
}

// Day Interview List Item Component
interface DayInterviewItemProps {
  interview: Interview;
  onClick: () => void;
}

function DayInterviewItem({ interview, onClick }: DayInterviewItemProps) {
  const candidateName = interview.jobCandidate?.candidate?.name || 'Unknown';
  const jobTitle = interview.jobCandidate?.job?.title || 'Unknown Role';
  const panelMembers = interview.panelMembers?.map(pm => pm.user?.name).filter(Boolean).join(', ') || 'No panel';

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-200 transition-all"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-gray-900">{candidateName}</span>
        <span className="text-xs font-medium text-blue-600">{formatTime(interview.scheduledAt)}</span>
      </div>
      <p className="text-xs text-gray-500">{jobTitle}</p>
      <p className="text-xs text-gray-400 mt-1">{getModeLabel(interview.mode)} · {panelMembers}</p>
    </button>
  );
}

// Interview Table Row Component
interface InterviewTableRowProps {
  interview: Interview;
  onClick: () => void;
  onJoin: () => void;
  onReschedule: () => void;
}

function InterviewTableRow({ interview, onClick, onJoin, onReschedule }: InterviewTableRowProps) {
  const candidateName = interview.jobCandidate?.candidate?.name || 'Unknown';
  const candidateExp = interview.jobCandidate?.candidate?.experienceYears || 0;
  const candidateLocation = interview.jobCandidate?.candidate?.location || 'N/A';
  const jobTitle = interview.jobCandidate?.job?.title || 'Unknown Role';
  const panelMembers = interview.panelMembers?.map(pm => pm.user?.name).filter(Boolean).join(', ') || 'No panel';
  const recruiterName = interview.scheduler?.name || 'Unknown';
  const isTodayInterview = isToday(interview.scheduledAt);

  return (
    <tr 
      onClick={onClick}
      className="hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
    >
      <td className="py-3 px-4">
        <div className="text-sm font-medium text-gray-900">
          {formatDate(interview.scheduledAt)}
          {isTodayInterview && <span className="ml-1 text-amber-600">· Today</span>}
        </div>
        <div className="text-xs text-gray-500">{formatTime(interview.scheduledAt)}</div>
      </td>
      <td className="py-3 px-4">
        <div className="text-sm font-semibold text-gray-900">{candidateName}</div>
        <div className="text-xs text-gray-500">{candidateExp} yrs · {candidateLocation}</div>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-gray-700">{jobTitle}</span>
      </td>
      <td className="py-3 px-4">
        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
          {getModeIcon(interview.mode)} {getModeLabel(interview.mode)}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-gray-600 truncate max-w-[150px] block">{panelMembers}</span>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-gray-600">{recruiterName}</span>
      </td>
      <td className="py-3 px-4">
        <StatusBadge status={interview.status} isToday={isTodayInterview} />
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          {interview.meetingLink && interview.status === 'scheduled' && (
            <button
              onClick={(e) => { e.stopPropagation(); onJoin(); }}
              className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
            >
              Join
            </button>
          )}
          {interview.status === 'scheduled' && (
            <button
              onClick={(e) => { e.stopPropagation(); onReschedule(); }}
              className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
            >
              Reschedule
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// Detail Slide Panel Component
interface DetailPanelProps {
  interview: Interview | null;
  isOpen: boolean;
  onClose: () => void;
  onJoin: () => void;
  onReschedule: () => void;
  onCancel: () => void;
  onFeedback: () => void;
}

function DetailPanel({ interview, isOpen, onClose, onJoin, onReschedule, onCancel, onFeedback }: DetailPanelProps) {
  if (!interview) return null;

  const candidateName = interview.jobCandidate?.candidate?.name || 'Unknown';
  const candidateExp = interview.jobCandidate?.candidate?.experienceYears || 0;
  const candidateCompany = interview.jobCandidate?.candidate?.currentCompany || 'N/A';
  const candidateLocation = interview.jobCandidate?.candidate?.location || 'N/A';
  const candidateSkills = interview.jobCandidate?.candidate?.skills || [];
  const jobTitle = interview.jobCandidate?.job?.title || 'Unknown Role';
  const panelMembers = interview.panelMembers?.map(pm => pm.user?.name).filter(Boolean).join(', ') || 'No panel';
  const recruiterName = interview.scheduler?.name || 'Unknown';

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Panel */}
      <aside className={`
        fixed top-0 right-0 h-full w-[380px] bg-white shadow-2xl z-50
        transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{candidateName}</h2>
            <p className="text-sm text-gray-500">{jobTitle} · {getModeLabel(interview.mode)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto h-[calc(100%-180px)]">
          {/* Interview Details */}
          <section className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Interview Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date & Time</span>
                <span className="text-gray-900 font-medium">{formatFullDate(interview.scheduledAt)} · {formatTime(interview.scheduledAt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Duration</span>
                <span className="text-gray-900">{interview.duration} minutes</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Mode</span>
                <span className="text-gray-900">{getModeIcon(interview.mode)} {getModeLabel(interview.mode)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <StatusBadge status={interview.status} />
              </div>
            </div>
          </section>

          {/* Panel & Recruiter */}
          <section className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Panel & Recruiter</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Panel Members</span>
                <span className="text-gray-900">{panelMembers}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Scheduled By</span>
                <span className="text-gray-900">{recruiterName}</span>
              </div>
            </div>
          </section>

          {/* Candidate Info */}
          <section className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Candidate Snapshot</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Experience</span>
                <span className="text-gray-900">{candidateExp} years</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Current Company</span>
                <span className="text-gray-900">{candidateCompany}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Location</span>
                <span className="text-gray-900">{candidateLocation}</span>
              </div>
            </div>
            {candidateSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {candidateSkills.slice(0, 6).map((skill, i) => (
                  <span key={i} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                    {skill}
                  </span>
                ))}
                {candidateSkills.length > 6 && (
                  <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full">
                    +{candidateSkills.length - 6} more
                  </span>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Actions Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex flex-wrap gap-2">
            {interview.meetingLink && interview.status === 'scheduled' && (
              <button
                onClick={onJoin}
                className="flex-1 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Join Meeting
              </button>
            )}
            {interview.status === 'scheduled' && (
              <button
                onClick={onReschedule}
                className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Reschedule
              </button>
            )}
            {interview.status === 'scheduled' && (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
            {(interview.status === 'completed' || interview.status === 'in_progress') && (
              <button
                onClick={onFeedback}
                className="flex-1 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Submit Feedback
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

// Main Page Component
export function InterviewDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  
  // Calendar state
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  // Filters
  const [selectedRecruiterId, setSelectedRecruiterId] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<string>('');
  
  // Panel state
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  
  // Modal states
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [rescheduleInterview, setRescheduleInterview] = useState<Interview | null>(null);
  const [cancelInterview, setCancelInterview] = useState<Interview | null>(null);
  
  // Data fetching
  const { data: interviews = [], isLoading, error, refetch } = useInterviews();
  const { data: users = [] } = useUsers();
  
  const recruiters = useMemo(() => 
    users.filter(u => u.isActive).map(u => ({ id: u.id, name: u.name })),
    [users]
  );
  
  // Filter interviews
  const filteredInterviews = useMemo(() => {
    return interviews.filter(interview => {
      if (selectedRecruiterId && interview.scheduledBy !== selectedRecruiterId) return false;
      if (selectedMode && interview.mode !== selectedMode) return false;
      return true;
    });
  }, [interviews, selectedRecruiterId, selectedMode]);

  // KPI calculations
  const kpiStats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const todayInterviews = filteredInterviews.filter(i => 
      new Date(i.scheduledAt).toISOString().split('T')[0] === todayStr
    );
    
    const weekInterviews = filteredInterviews.filter(i => {
      const date = new Date(i.scheduledAt);
      return date >= weekStart && date <= weekEnd;
    });
    
    const feedbackPending = filteredInterviews.filter(i => 
      i.status === 'completed' && (!i.feedback || i.feedback.length === 0)
    );
    
    const last30Days = new Date(now);
    last30Days.setDate(now.getDate() - 30);
    const recentInterviews = filteredInterviews.filter(i => new Date(i.scheduledAt) >= last30Days);
    const noShows = recentInterviews.filter(i => i.status === 'no_show');
    const noShowRate = recentInterviews.length > 0 
      ? Math.round((noShows.length / recentInterviews.length) * 100) 
      : 0;
    
    return {
      todayCount: todayInterviews.length,
      todaySubtext: `${todayInterviews.filter(i => i.mode === 'google_meet').length} virtual · ${todayInterviews.filter(i => i.mode === 'in_person').length} in-person`,
      weekCount: weekInterviews.length,
      weekSubtext: `${weekInterviews.filter(i => i.status === 'scheduled').length} pending`,
      feedbackCount: feedbackPending.length,
      feedbackSubtext: `${feedbackPending.filter(i => {
        const hours = (now.getTime() - new Date(i.scheduledAt).getTime()) / (1000 * 60 * 60);
        return hours > 24;
      }).length} overdue (24+ hrs)`,
      noShowRate: `${noShowRate}%`,
      noShowSubtext: `${noShows.length} of ${recentInterviews.length} interviews`,
    };
  }, [filteredInterviews]);

  // Calendar data
  const calendarData = useMemo(() => {
    const { year, month } = selectedMonth;
    const firstDay = new Date(year, month, 1);
    const startWeekday = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const countsByDay: Record<number, number> = {};
    filteredInterviews.forEach(interview => {
      const date = new Date(interview.scheduledAt);
      if (date.getFullYear() === year && date.getMonth() === month) {
        const day = date.getDate();
        countsByDay[day] = (countsByDay[day] || 0) + 1;
      }
    });
    
    return { startWeekday, daysInMonth, countsByDay };
  }, [selectedMonth, filteredInterviews]);

  // Selected date interviews
  const selectedDateInterviews = useMemo(() => {
    return filteredInterviews
      .filter(i => new Date(i.scheduledAt).toISOString().split('T')[0] === selectedDate)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [filteredInterviews, selectedDate]);

  // Pipeline data - group by stage
  const pipelineData = useMemo(() => {
    const grouped: Record<PipelineStageId, Interview[]> = {
      to_schedule: [],
      scheduled: [],
      today: [],
      feedback_pending: [],
      completed: [],
      no_show: [],
    };
    
    filteredInterviews.forEach(interview => {
      const stage = getInterviewStage(interview);
      grouped[stage].push(interview);
    });
    
    // Sort each group by scheduled time
    Object.keys(grouped).forEach(key => {
      grouped[key as PipelineStageId].sort((a, b) => 
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );
    });
    
    return grouped;
  }, [filteredInterviews]);

  // Handlers
  const handleClearFilters = useCallback(() => {
    setSelectedRecruiterId('');
    setSelectedMode('');
  }, []);

  const handleInterviewClick = useCallback((interview: Interview) => {
    setSelectedInterview(interview);
    setIsDetailPanelOpen(true);
  }, []);

  const handleClosePanel = useCallback(() => {
    setIsDetailPanelOpen(false);
    setTimeout(() => setSelectedInterview(null), 300);
  }, []);

  const handleJoin = useCallback((interview: Interview) => {
    if (interview.meetingLink) {
      window.open(interview.meetingLink, '_blank');
    }
  }, []);

  const handleReschedule = useCallback((interview: Interview) => {
    setRescheduleInterview(interview);
    setIsDetailPanelOpen(false);
  }, []);

  const handleCancel = useCallback((interview: Interview) => {
    setCancelInterview(interview);
    setIsDetailPanelOpen(false);
  }, []);

  const handleFeedback = useCallback((interview: Interview) => {
    setSelectedInterview(interview);
    setIsDetailModalOpen(true);
    setIsDetailPanelOpen(false);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsDetailModalOpen(false);
    setRescheduleInterview(null);
    setCancelInterview(null);
    refetch();
  }, [refetch]);

  // Month navigation
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handlePrevMonth = () => {
    setSelectedMonth(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setSelectedMonth(prev => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
  };

  const hasFilters = selectedRecruiterId || selectedMode;

  return (
    <Layout
      pageTitle="Interviews & Scheduling"
      pageSubtitle="Manage all interviews, screening calls & panel activity"
      user={user}
      companyName="SnapFind ATS"
      footerLeftText="Interview Management · Calendar & Pipeline Views"
      footerRightText={`${kpiStats.todayCount} interviews today`}
      onLogout={logout}
    >
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {error && (
        <ErrorMessage
          message="Failed to load interviews"
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !error && (
        <div className="space-y-4">
          {/* Filters & View Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-gray-500">Filters:</span>
              
              <select
                value={`${selectedMonth.year}-${selectedMonth.month}`}
                onChange={(e) => {
                  const [year, month] = e.target.value.split('-').map(Number);
                  setSelectedMonth({ year, month });
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-full bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {[-2, -1, 0, 1, 2, 3].map(offset => {
                  const date = new Date();
                  date.setMonth(date.getMonth() + offset);
                  return (
                    <option key={offset} value={`${date.getFullYear()}-${date.getMonth()}`}>
                      {monthNames[date.getMonth()]} {date.getFullYear()}
                    </option>
                  );
                })}
              </select>

              <select
                value={selectedRecruiterId}
                onChange={(e) => setSelectedRecruiterId(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-full bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Recruiters</option>
                {recruiters.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>

              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-full bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                <option value="google_meet">Google Meet</option>
                <option value="microsoft_teams">MS Teams</option>
                <option value="in_person">In-Person</option>
              </select>

              {hasFilters && (
                <button
                  onClick={handleClearFilters}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">View:</span>
              <div className="flex rounded-full border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                    viewMode === 'calendar'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  📅 Calendar
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  📋 List + Pipeline
                </button>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Interviews Today"
              value={kpiStats.todayCount}
              subtext={kpiStats.todaySubtext}
            />
            <KPICard
              label="This Week"
              value={kpiStats.weekCount}
              subtext={kpiStats.weekSubtext}
            />
            <KPICard
              label="Feedback Pending"
              value={kpiStats.feedbackCount}
              subtext={kpiStats.feedbackSubtext}
              alert={kpiStats.feedbackCount > 0}
            />
            <KPICard
              label="No-show Rate (30d)"
              value={kpiStats.noShowRate}
              subtext={kpiStats.noShowSubtext}
            />
          </div>

          {/* Calendar View */}
          {viewMode === 'calendar' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Calendar Grid */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {monthNames[selectedMonth.month]} {selectedMonth.year}
                    </h2>
                    <p className="text-sm text-gray-500">Click a date to view interviews</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevMonth}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => {
                        const now = new Date();
                        setSelectedMonth({ year: now.getFullYear(), month: now.getMonth() });
                        setSelectedDate(now.toISOString().split('T')[0]);
                      }}
                      className="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Today
                    </button>
                    <button
                      onClick={handleNextMonth}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      →
                    </button>
                  </div>
                </div>

                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: calendarData.startWeekday }).map((_, i) => (
                    <div key={`empty-${i}`} className="min-h-[70px]" />
                  ))}
                  {Array.from({ length: calendarData.daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const todayStr = new Date().toISOString().split('T')[0];
                    return (
                      <CalendarDayCell
                        key={day}
                        day={day}
                        count={calendarData.countsByDay[day] || 0}
                        isToday={dateStr === todayStr}
                        isSelected={dateStr === selectedDate}
                        onClick={() => setSelectedDate(dateStr)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Selected Date Interviews */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {formatFullDate(selectedDate)}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedDateInterviews.length} interview{selectedDateInterviews.length !== 1 ? 's' : ''} scheduled
                  </p>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {selectedDateInterviews.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No interviews on this date</p>
                    </div>
                  ) : (
                    selectedDateInterviews.map(interview => (
                      <DayInterviewItem
                        key={interview.id}
                        interview={interview}
                        onClick={() => handleInterviewClick(interview)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* List + Pipeline View */}
          {viewMode === 'list' && (
            <div className="space-y-4">
              {/* Interview Table - Top */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">All Interviews</h2>
                  <p className="text-sm text-gray-500">Click any row for details and actions</p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-4">Date & Time</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-4">Candidate</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-4">Role</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-4">Type</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-4">Panel</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-4">Recruiter</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-4">Status</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInterviews
                        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                        .slice(0, 20)
                        .map(interview => (
                          <InterviewTableRow
                            key={interview.id}
                            interview={interview}
                            onClick={() => handleInterviewClick(interview)}
                            onJoin={() => handleJoin(interview)}
                            onReschedule={() => handleReschedule(interview)}
                          />
                        ))}
                    </tbody>
                  </table>
                  
                  {filteredInterviews.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-400">No interviews found</p>
                    </div>
                  )}
                  
                  {filteredInterviews.length > 20 && (
                    <div className="text-center py-3 border-t border-gray-100">
                      <p className="text-sm text-gray-500">
                        Showing 20 of {filteredInterviews.length} interviews
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pipeline Board - Bottom */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Interview Pipeline</h2>
                  <p className="text-sm text-gray-500">Drag-and-drop style board view of all interview stages</p>
                </div>
                
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {PIPELINE_STAGES.map(stage => (
                    <PipelineColumn
                      key={stage.id}
                      stage={stage}
                      interviews={pipelineData[stage.id]}
                      onInterviewClick={handleInterviewClick}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && interviews.length === 0 && (
        <EmptyState
          icon="📅"
          title="No interviews scheduled"
          description="Start by scheduling interviews from the candidate pipeline in Roles."
          actionLabel="Go to Roles"
          onAction={() => navigate('/roles')}
        />
      )}

      {/* Detail Slide Panel */}
      <DetailPanel
        interview={selectedInterview}
        isOpen={isDetailPanelOpen}
        onClose={handleClosePanel}
        onJoin={() => selectedInterview && handleJoin(selectedInterview)}
        onReschedule={() => selectedInterview && handleReschedule(selectedInterview)}
        onCancel={() => selectedInterview && handleCancel(selectedInterview)}
        onFeedback={() => selectedInterview && handleFeedback(selectedInterview)}
      />

      {/* Interview Detail Modal with Feedback */}
      {selectedInterview && isDetailModalOpen && (
        <InterviewDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleModalClose}
          interview={selectedInterview}
          currentUserId={user?.id || ''}
          onReschedule={handleReschedule}
          onCancel={handleCancel}
        />
      )}

      {/* Reschedule Modal */}
      {rescheduleInterview && (
        <RescheduleModal
          isOpen={!!rescheduleInterview}
          onClose={handleModalClose}
          onSuccess={handleModalClose}
          interview={rescheduleInterview}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {cancelInterview && (
        <CancelConfirmationModal
          isOpen={!!cancelInterview}
          onClose={handleModalClose}
          onSuccess={handleModalClose}
          interview={cancelInterview}
        />
      )}
    </Layout>
  );
}

export default InterviewDashboardPage;
