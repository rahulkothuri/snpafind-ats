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

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MdCalendarToday,
  MdAccessTime,
  MdPerson,
  MdLocationOn,
  MdVideocam,
  MdCheckCircle,
  MdCancel,
  MdSchedule,
  MdChevronLeft,
  MdChevronRight,
  MdFilterList,
  MdViewModule,
  MdViewList,
  MdBusiness,
  MdOutlineTimer,
  MdClose,
  MdLaptopMac,
  MdInfo,
  MdWork,
  MdSearch
} from 'react-icons/md';
import {
  Layout,
  LoadingSpinner,
  ErrorMessage,
  EmptyState,
  InterviewDetailModal,
  RescheduleModal,
  CancelConfirmationModal,
  Button
} from '../components';
import { useAuth } from '../hooks/useAuth';
import { useInterviews } from '../hooks/useInterviews';
import { useUsers } from '../hooks/useUsers';
import type { Interview, InterviewMode } from '../services/interviews.service';

type ViewMode = 'calendar' | 'list';

// Pipeline stage definitions with all stages
const PIPELINE_STAGES = [
  { id: 'to_schedule', label: 'To Schedule', color: 'bg-gray-50', borderColor: 'border-gray-200', textColor: 'text-gray-700', dotColor: 'bg-gray-400' },
  { id: 'scheduled', label: 'Scheduled', color: 'bg-blue-50/50', borderColor: 'border-blue-100', textColor: 'text-blue-700', dotColor: 'bg-blue-400' },
  { id: 'today', label: 'Today / Ongoing', color: 'bg-amber-50/50', borderColor: 'border-amber-100', textColor: 'text-amber-700', dotColor: 'bg-amber-400' },
  { id: 'feedback_pending', label: 'Feedback Pending', color: 'bg-orange-50/50', borderColor: 'border-orange-100', textColor: 'text-orange-700', dotColor: 'bg-orange-400' },
  { id: 'completed', label: 'Completed', color: 'bg-green-50/50', borderColor: 'border-green-100', textColor: 'text-green-700', dotColor: 'bg-green-400' },
  { id: 'no_show', label: 'No-show / Cancelled', color: 'bg-red-50/50', borderColor: 'border-red-100', textColor: 'text-red-700', dotColor: 'bg-red-400' },
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
    custom_url: 'Custom URL',
  };
  return labels[mode] || mode;
};

const getModeIcon = (mode: InterviewMode) => {
  switch (mode) {
    case 'google_meet': return <MdVideocam className="w-3.5 h-3.5" />;
    case 'microsoft_teams': return <MdLaptopMac className="w-3.5 h-3.5" />;
    case 'in_person': return <MdBusiness className="w-3.5 h-3.5" />;
    case 'custom_url': return <MdVideocam className="w-3.5 h-3.5" />;
    default: return <MdVideocam className="w-3.5 h-3.5" />;
  }
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
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
        {alert && (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-red-50 text-red-600 rounded-full border border-red-100 uppercase tracking-wide">
            Needs attention
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-gray-900 tracking-tight">{value}</div>
      <div className="text-xs font-medium text-gray-500 mt-2 flex items-center gap-1.5">
        <MdOutlineTimer className="w-3.5 h-3.5" />
        {subtext}
      </div>
    </div>
  );
}

// Status Badge Component
interface StatusBadgeProps {
  status: string;
  isToday?: boolean;
}

function StatusBadge({ status, isToday: isTodayInterview }: StatusBadgeProps) {
  const getStatusConfig = () => {
    if (isTodayInterview && status === 'scheduled') {
      return { className: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Today', icon: MdSchedule };
    }
    switch (status) {
      case 'scheduled': return { className: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Scheduled', icon: MdCalendarToday };
      case 'in_progress': return { className: 'bg-amber-50 text-amber-700 border-amber-200', label: 'In Progress', icon: MdOutlineTimer };
      case 'completed': return { className: 'bg-green-50 text-green-700 border-green-200', label: 'Completed', icon: MdCheckCircle };
      case 'cancelled': return { className: 'bg-red-50 text-red-700 border-red-200', label: 'Cancelled', icon: MdCancel };
      case 'no_show': return { className: 'bg-red-50 text-red-700 border-red-200', label: 'No-show', icon: MdCancel };
      default: return { className: 'bg-gray-50 text-gray-700 border-gray-200', label: status, icon: MdInfo };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      <Icon className="w-3 h-3" />
      {config.label}
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
      className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all duration-200 group relative"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
            {candidateName}
          </h4>
          <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
            <MdWork className="w-3 h-3 text-gray-400" />
            {jobTitle}
          </p>
        </div>
        <span className="text-xs font-medium text-gray-500 whitespace-nowrap bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
          {formatTime(interview.scheduledAt)}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3 pb-3 border-b border-gray-50 border-dashed">
        <MdCalendarToday className="w-3.5 h-3.5 text-gray-400" />
        {formatDate(interview.scheduledAt)}
        <span className="text-gray-300">|</span>
        <MdAccessTime className="w-3.5 h-3.5 text-gray-400" />
        {interview.duration} min
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-gray-50 text-gray-600 rounded-md border border-gray-200/60">
          {getModeIcon(interview.mode)} {getModeLabel(interview.mode)}
        </span>
        {interview.roundType && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
            {interview.roundType}
          </span>
        )}
        {panelMembers.length > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 rounded-md border border-blue-100 truncate max-w-[120px]">
            <MdPerson className="w-3 h-3" />
            {panelMembers[0]}{panelMembers.length > 1 ? ` +${panelMembers.length - 1}` : ''}
          </span>
        )}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-purple-50 text-purple-700 rounded-md border border-purple-100">
          <MdSchedule className="w-3 h-3" />
          {recruiterName}
        </span>
        {interview.meetingLink && interview.status === 'scheduled' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(interview.meetingLink, '_blank');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-md shadow-sm hover:shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
          >
            <MdVideocam className="w-3 h-3" />
            Join Now
          </button>
        )}
      </div>
    </div>
  );
}

// Pipeline Column Component
interface PipelineColumnProps {
  stage: typeof PIPELINE_STAGES[number];
  interviews: Interview[];
  onInterviewClick: (interview: Interview) => void;
  visibleCount: number;
  onViewMore: () => void;
}

function PipelineColumn({ stage, interviews, onInterviewClick, visibleCount, onViewMore }: PipelineColumnProps) {
  const visibleInterviews = interviews.slice(0, visibleCount);
  const hasMore = interviews.length > visibleCount;
  const remainingCount = interviews.length - visibleCount;

  return (
    <div className={`flex-1 min-w-[280px] max-w-[320px] rounded-xl ${stage.color} border ${stage.borderColor} p-3 flex flex-col`}>
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${stage.dotColor} ring-2 ring-white`} />
          <h3 className={`text-sm font-bold ${stage.textColor}`}>{stage.label}</h3>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-bold bg-white text-gray-600 rounded-md shadow-sm border border-gray-100/50">
          {interviews.length}
        </span>
      </div>

      <div className="space-y-3 flex-1 min-h-[100px]">
        {interviews.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-4 text-center border-2 border-dashed border-gray-200/50 rounded-lg">
            <p className="text-xs font-medium text-gray-400">No interviews</p>
          </div>
        ) : (
          <>
            {visibleInterviews.map(interview => (
              <PipelineCard
                key={interview.id}
                interview={interview}
                onClick={() => onInterviewClick(interview)}
              />
            ))}
            {hasMore && (
              <button
                onClick={onViewMore}
                className="w-full py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
              >
                View {remainingCount} more
              </button>
            )}
          </>
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
        relative p-2 min-h-[80px] rounded-xl text-left transition-all duration-200 border
        ${isTodayCell
          ? 'bg-blue-50/30 border-blue-200 ring-1 ring-blue-100'
          : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-sm'
        }
        ${isSelected
          ? 'ring-2 ring-blue-600 border-transparent shadow-md z-10'
          : ''
        }
      `}
    >
      <div className="flex justify-between items-start">
        <span className={`
          text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full
          ${isTodayCell ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-700'}
        `}>
          {day}
        </span>
        {count > 0 && (
          <span className={`
            text-[10px] font-bold px-1.5 py-0.5 rounded-full
            ${isSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}
          `}>
            {count}
          </span>
        )}
      </div>

      <div className="mt-2 space-y-1">
        {count > 0 ? (
          <div className="flex items-center gap-1 text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md w-fit">
            <MdVideocam className="w-3 h-3" />
            <span>{count} scheduled</span>
          </div>
        ) : (
          <div className="h-4" /> // Spacer
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
      className="w-full text-left p-4 rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
          {candidateName}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
          <MdAccessTime className="w-3.5 h-3.5" />
          {formatTime(interview.scheduledAt)}
        </span>
      </div>
      <p className="text-xs font-medium text-gray-600 flex items-center gap-1.5 mb-1.5">
        <MdWork className="w-3.5 h-3.5 text-gray-400" />
        {jobTitle}
      </p>
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          {getModeIcon(interview.mode)}
          {getModeLabel(interview.mode)}
        </span>
        {interview.roundType && (
          <>
            <span className="text-gray-300">|</span>
            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-indigo-50 text-indigo-700 rounded">
              {interview.roundType}
            </span>
          </>
        )}
        <span className="text-gray-300">|</span>
        <span className="flex items-center gap-1 truncate max-w-[150px]">
          <MdPerson className="w-3.5 h-3.5" />
          {panelMembers}
        </span>
        {interview.meetingLink && interview.status === 'scheduled' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(interview.meetingLink, '_blank');
            }}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-md shadow-sm hover:shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
          >
            <MdVideocam className="w-3.5 h-3.5" />
            Join Now
          </button>
        )}
      </div>
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
      className="hover:bg-gray-50/80 cursor-pointer transition-colors border-b border-gray-100 last:border-0 group"
    >
      <td className="py-4 px-4 align-top">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            {formatDate(interview.scheduledAt)}
            {isTodayInterview && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Today" />
            )}
          </span>
          <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <MdAccessTime className="w-3 h-3" />
            {formatTime(interview.scheduledAt)}
          </span>
        </div>
      </td>
      <td className="py-4 px-4 align-top">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {candidateName}
          </span>
          <span className="text-xs text-gray-500 mt-0.5">
            {candidateExp} yrs · {candidateLocation}
          </span>
        </div>
      </td>
      <td className="py-4 px-4 align-top">
        <span className="text-sm text-gray-700 font-medium">{jobTitle}</span>
      </td>
      <td className="py-4 px-4 align-top">
        <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
          {getModeIcon(interview.mode)}
          <span className="text-xs font-medium">{getModeLabel(interview.mode)}</span>
        </span>
      </td>
      <td className="py-4 px-4 align-top">
        {interview.roundType ? (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
            {interview.roundType}
          </span>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        )}
      </td>
      <td className="py-4 px-4 align-top">
        <span className="text-sm text-gray-600 truncate max-w-[150px] block" title={panelMembers}>{panelMembers}</span>
      </td>
      <td className="py-4 px-4 align-top">
        <span className="text-sm text-gray-600">{recruiterName}</span>
      </td>
      <td className="py-4 px-4 align-top">
        <StatusBadge status={interview.status} isToday={isTodayInterview} />
      </td>
      <td className="py-4 px-4 align-top">
        <div
          className="flex items-center gap-2 "
          onClick={(e) => e.stopPropagation()}
        >
          {interview.meetingLink && interview.status === 'scheduled' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onJoin()}
              className="h-8 text-xs px-3 font-bold bg-gradient-to-r from-blue-600 to-indigo-600 border-0 hover:from-blue-700 hover:to-indigo-700 shadow-sm hover:shadow-md transition-all duration-200 rounded-md"
            >
              <MdVideocam className="w-3.5 h-3.5 mr-1.5" />
              Join Now
            </Button>
          )}
          {interview.status === 'scheduled' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReschedule()}
              className="h-7 text-xs px-2.5"
            >
              Reschedule
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

// Detail Slide Panel Component
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
  const recruiterName = interview.scheduler?.name || 'Unknown';

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <aside className={`
        fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl z-50
        transform transition-transform duration-300 ease-out flex flex-col
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100 bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{candidateName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100/50">
                {jobTitle}
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                {getModeIcon(interview.mode)} {getModeLabel(interview.mode)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {/* Interview Details */}
          <section className="mb-8">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MdCalendarToday className="w-4 h-4" />
              Interview Details
            </h3>
            <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date & Time</span>
                <span className="text-gray-900 font-semibold">{formatFullDate(interview.scheduledAt)} · {formatTime(interview.scheduledAt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Duration</span>
                <span className="text-gray-900 font-medium">{interview.duration} minutes</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Mode</span>
                <span className="text-gray-900 font-medium flex items-center gap-1">
                  {getModeIcon(interview.mode)} {getModeLabel(interview.mode)}
                </span>
              </div>
              {interview.roundType && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Round Type</span>
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                    {interview.roundType}
                  </span>
                </div>
              )}
              <div className="flex justify-between center text-sm pt-1 border-t border-gray-200/50 mt-1">
                <span className="text-gray-500 self-center">Status</span>
                <StatusBadge status={interview.status} />
              </div>
            </div>
          </section>

          {/* Panel & Recruiter */}
          <section className="mb-8">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MdPerson className="w-4 h-4" />
              Panel & Recruiter
            </h3>
            <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 space-y-3">
              <div>
                <span className="text-xs text-gray-500 block mb-1">Panel Members</span>
                <div className="flex items-center gap-2">
                  {interview.panelMembers?.map((pm, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-white border border-gray-200 px-2 py-1 rounded-md shadow-sm">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-600">
                        {pm.user?.name?.charAt(0) || '?'}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{pm.user?.name}</span>
                    </div>
                  ))}
                  {(!interview.panelMembers || interview.panelMembers.length === 0) && (
                    <span className="text-sm text-gray-400 italic">No panel members assigned</span>
                  )}
                </div>
              </div>
              <div className="pt-2 border-t border-gray-200/50">
                <span className="text-xs text-gray-500 block mb-1">Scheduled By</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600">
                    {recruiterName.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{recruiterName}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Candidate Info */}
          <section className="mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MdWork className="w-4 h-4" />
              Candidate Snapshot
            </h3>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-xs text-gray-500 block">Experience</span>
                  <span className="text-sm font-semibold text-gray-900">{candidateExp} years</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Current Company</span>
                  <span className="text-sm font-semibold text-gray-900 truncate" title={candidateCompany}>{candidateCompany}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-gray-500 block">Location</span>
                  <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                    <MdLocationOn className="w-3.5 h-3.5 text-gray-400" />
                    {candidateLocation}
                  </div>
                </div>
              </div>

              {candidateSkills.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500 block mb-2">Skills</span>
                  <div className="flex flex-wrap gap-1.5">
                    {candidateSkills.slice(0, 6).map((skill, i) => (
                      <span key={i} className="px-2 py-0.5 text-[10px] uppercase font-bold bg-gray-100 text-gray-600 rounded-md border border-gray-200">
                        {skill}
                      </span>
                    ))}
                    {candidateSkills.length > 6 && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-gray-50 text-gray-400 rounded-md border border-gray-100">
                        +{candidateSkills.length - 6}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Actions Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 backdrop-blur-sm">
          <div className="flex flex-col gap-2">
            {interview.meetingLink && interview.status === 'scheduled' && (
              <Button
                variant="primary"
                onClick={onJoin}
                className="w-full justify-center shadow-md shadow-blue-500/20"
              >
                Join Meeting
              </Button>
            )}
            <div className="flex gap-2">
              {interview.status === 'scheduled' && (
                <>
                  <Button
                    variant="outline"
                    onClick={onReschedule}
                    className="flex-1 justify-center"
                  >
                    Reschedule
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onCancel}
                    className="flex-1 justify-center text-red-600 hover:bg-red-50 hover:border-red-200"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
            {(interview.status === 'completed' || interview.status === 'in_progress') && (
              <Button
                variant="primary"
                onClick={onFeedback}
                className="w-full justify-center bg-green-600 hover:bg-green-700 shadow-md shadow-green-500/20"
              >
                Submit Feedback
              </Button>
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
  const [searchParams] = useSearchParams();

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
  const [selectedJobId, setSelectedJobId] = useState<string>('');

  // Pagination
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Pipeline cards visible count
  const [pipelineVisibleCounts, setPipelineVisibleCounts] = useState<Record<string, number>>({});
  const CARDS_PER_LOAD = 5;

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

  // Extract unique jobs from interviews
  const uniqueJobs = useMemo(() => {
    const jobMap = new Map<string, { id: string; title: string }>();
    interviews.forEach(interview => {
      const job = interview.jobCandidate?.job;
      if (job && job.id && job.title) {
        jobMap.set(job.id, { id: job.id, title: job.title });
      }
    });
    return Array.from(jobMap.values()).sort((a, b) => a.title.localeCompare(b.title));
  }, [interviews]);

  // Filter interviews
  const filteredInterviews = useMemo(() => {
    return interviews.filter(interview => {
      if (selectedRecruiterId && interview.scheduledBy !== selectedRecruiterId) return false;
      if (selectedMode && interview.mode !== selectedMode) return false;
      if (selectedJobId && interview.jobCandidate?.job?.id !== selectedJobId) return false;
      return true;
    });
  }, [interviews, selectedRecruiterId, selectedMode, selectedJobId]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRecruiterId, selectedMode, selectedJobId]);

  // Handle deep linking to interview
  useEffect(() => {
    const interviewId = searchParams.get('interviewId');
    if (interviewId && interviews.length > 0) {
      const interview = interviews.find(i => i.id === interviewId);
      if (interview) {
        setSelectedInterview(interview);
        setIsDetailPanelOpen(true);
        // Optionally switch to the date of the interview if in calendar mode?
        // setSelectedDate(new Date(interview.scheduledAt).toISOString().split('T')[0]);
      }
    }
  }, [searchParams, interviews]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredInterviews.length / ITEMS_PER_PAGE);
  const paginatedInterviews = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInterviews.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInterviews, currentPage]);

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
      if (grouped[stage]) {
        grouped[stage].push(interview);
      }
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
        <div className="space-y-6">
          {/* Filters & View Toggle */}
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                <MdFilterList className="w-4 h-4 text-gray-500" />
                Filters
              </span>

              <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

              <select
                value={`${selectedMonth.year}-${selectedMonth.month}`}
                onChange={(e) => {
                  const [year, month] = e.target.value.split('-').map(Number);
                  setSelectedMonth({ year, month });
                }}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-white transition-colors cursor-pointer outline-none"
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
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-white transition-colors cursor-pointer outline-none"
              >
                <option value="">All Recruiters</option>
                {recruiters.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>

              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-white transition-colors cursor-pointer outline-none"
              >
                <option value="">All Types</option>
                <option value="google_meet">Google Meet</option>
                <option value="microsoft_teams">MS Teams</option>
                <option value="in_person">In-Person</option>
              </select>

              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-white transition-colors cursor-pointer outline-none max-w-[180px]"
              >
                <option value="">All Job Roles</option>
                {uniqueJobs.map(job => (
                  <option key={job.id} value={job.id}>{job.title}</option>
                ))}
              </select>

              {(hasFilters || selectedJobId) && (
                <button
                  onClick={() => {
                    handleClearFilters();
                    setSelectedJobId('');
                  }}
                  className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5 font-medium"
                >
                  <MdClose className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-500 hidden sm:block">Display View:</span>
              <div className="flex p-1 bg-gray-100/80 rounded-lg border border-gray-200">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 ${viewMode === 'calendar'
                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                    }`}
                >
                  <MdCalendarToday className="w-4 h-4" />
                  Calendar
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 ${viewMode === 'list'
                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                    }`}
                >
                  <MdViewList className="w-4 h-4" />
                  List + Pipeline
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
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Calendar Grid */}
              <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <MdCalendarToday className="w-5 h-5 text-blue-600" />
                      {monthNames[selectedMonth.month]} {selectedMonth.year}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Select a date to view scheduled interviews</p>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                    <button
                      onClick={handlePrevMonth}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-white hover:shadow-sm rounded-md transition-all"
                    >
                      <MdChevronLeft className="w-5 h-5" />
                    </button>

                    <button
                      onClick={handleNextMonth}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-white hover:shadow-sm rounded-md transition-all"
                    >
                      <MdChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map(day => (
                    <div key={day} className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: calendarData.startWeekday }).map((_, i) => (
                    <div key={`empty-${i}`} className="min-h-[70px] bg-gray-50/30 rounded-lg" />
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
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col h-full max-h-[800px]">
                <div className="mb-6 pb-4 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">
                    {formatFullDate(selectedDate)}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                      {selectedDateInterviews.length} Scheduled
                    </span>
                  </div>
                </div>

                <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-1">
                  {selectedDateInterviews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center border-2 border-dashed border-gray-100 rounded-xl">
                      <MdAccessTime className="w-8 h-8 text-gray-300 mb-2" />
                      <p className="text-sm font-medium text-gray-500">No interviews</p>
                      <p className="text-xs text-gray-400">Time to schedule some!</p>
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
            <div className="space-y-6">
              {/* Interview Table - Top */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <MdViewList className="w-5 h-5 text-gray-500" />
                      All Scheduled Interviews
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">Comprehensive list of all upcoming and past interviews</p>
                  </div>
                  <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-600 shadow-sm">
                    Showing {Math.min(filteredInterviews.length, 20)} of {filteredInterviews.length}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider py-4 px-4">Date & Time</th>
                        <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider py-4 px-4">Candidate</th>
                        <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider py-4 px-4">Role</th>
                        <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider py-4 px-4">Type</th>
                        <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider py-4 px-4">Round</th>
                        <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider py-4 px-4">Panel</th>
                        <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider py-4 px-4">Recruiter</th>
                        <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider py-4 px-4">Status</th>
                        <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider py-4 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedInterviews
                        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
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

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                      <div className="text-sm text-gray-500">
                        Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredInterviews.length)} of {filteredInterviews.length} interviews
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Previous
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}

                  {filteredInterviews.length === 0 && (
                    <div className="text-center py-16 bg-gray-50/30">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <MdSearch className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium">No interviews match your filters</p>
                      <button onClick={() => { handleClearFilters(); setSelectedJobId(''); }} className="text-blue-600 text-sm font-semibold hover:underline mt-2">Clear all filters</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Pipeline Board - Bottom */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <MdViewModule className="w-5 h-5 text-gray-500" />
                      Interview Pipeline
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Visual overview of candidate progress across stages</p>
                  </div>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x">
                  {PIPELINE_STAGES.map(stage => (
                    <PipelineColumn
                      key={stage.id}
                      stage={stage}
                      interviews={pipelineData[stage.id]}
                      onInterviewClick={handleInterviewClick}
                      visibleCount={pipelineVisibleCounts[stage.id] || CARDS_PER_LOAD}
                      onViewMore={() => setPipelineVisibleCounts(prev => ({
                        ...prev,
                        [stage.id]: (prev[stage.id] || CARDS_PER_LOAD) + CARDS_PER_LOAD
                      }))}
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
