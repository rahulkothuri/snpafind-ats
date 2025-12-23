/**
 * InterviewCard Component
 * 
 * Displays interview information in a card format with:
 * - Time, candidate, job, mode, panel members
 * - Status indicators (upcoming, in progress, completed)
 * - Quick actions (reschedule, cancel, view)
 * 
 * Requirements: 11.4, 11.5
 */

import { Badge } from './Badge';
import { Button } from './Button';
import type { Interview, InterviewMode, InterviewStatus } from '../services/interviews.service';

export interface InterviewCardProps {
  interview: Interview;
  onReschedule?: (interview: Interview) => void;
  onCancel?: (interview: Interview) => void;
  onView?: (interview: Interview) => void;
  onJoin?: (interview: Interview) => void;
  showActions?: boolean;
  compact?: boolean;
}

// Format time for display
function formatTime(dateString: string, timezone?: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone || undefined,
  });
}

// Format date for display
function formatDate(dateString: string, timezone?: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: timezone || undefined,
  });
}

// Get status badge variant
function getStatusVariant(status: InterviewStatus): 'green' | 'blue' | 'orange' | 'red' | 'gray' {
  switch (status) {
    case 'scheduled':
      return 'blue';
    case 'in_progress':
      return 'orange';
    case 'completed':
      return 'green';
    case 'cancelled':
      return 'red';
    case 'no_show':
      return 'gray';
    default:
      return 'gray';
  }
}

// Get status display text
function getStatusText(status: InterviewStatus): string {
  switch (status) {
    case 'scheduled':
      return 'Upcoming';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'no_show':
      return 'No Show';
    default:
      return status;
  }
}

// Get mode icon and label
function getModeInfo(mode: InterviewMode): { icon: string; label: string; variant: 'blue' | 'green' | 'gray' } {
  switch (mode) {
    case 'google_meet':
      return { icon: '📹', label: 'Google Meet', variant: 'blue' };
    case 'microsoft_teams':
      return { icon: '💼', label: 'Teams', variant: 'blue' };
    case 'in_person':
      return { icon: '🏢', label: 'In-Person', variant: 'green' };
    default:
      return { icon: '📅', label: mode, variant: 'gray' };
  }
}

// Check if interview is joinable (within 15 minutes of start time or in progress)
function isJoinable(interview: Interview): boolean {
  if (interview.status === 'in_progress') return true;
  if (interview.status !== 'scheduled') return false;
  
  const now = new Date();
  const startTime = new Date(interview.scheduledAt);
  const diffMinutes = (startTime.getTime() - now.getTime()) / (1000 * 60);
  
  return diffMinutes <= 15 && diffMinutes >= -interview.duration;
}

export function InterviewCard({
  interview,
  onReschedule,
  onCancel,
  onView,
  onJoin,
  showActions = true,
  compact = false,
}: InterviewCardProps) {
  const modeInfo = getModeInfo(interview.mode);
  const candidateName = interview.jobCandidate?.candidate?.name || 'Unknown Candidate';
  const jobTitle = interview.jobCandidate?.job?.title || 'Unknown Job';
  const panelMembers = interview.panelMembers?.map(pm => pm.user?.name || 'Unknown').join(', ') || 'No panel assigned';
  const canJoin = isJoinable(interview) && interview.meetingLink;

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] hover:border-[#cbd5e1] transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-sm font-medium text-[#0b6cf0] whitespace-nowrap">
            {formatTime(interview.scheduledAt, interview.timezone)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-[#111827] truncate">{candidateName}</div>
            <div className="text-xs text-[#64748b] truncate">{jobTitle}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge text={modeInfo.label} variant={modeInfo.variant} />
          <Badge text={getStatusText(interview.status)} variant={getStatusVariant(interview.status)} />
          {showActions && canJoin && onJoin && (
            <Button variant="mini" miniColor="schedule" onClick={() => onJoin(interview)}>
              Join
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header with time and status */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-semibold text-[#0b6cf0]">
              {formatTime(interview.scheduledAt, interview.timezone)}
            </span>
            <span className="text-sm text-[#64748b]">
              {formatDate(interview.scheduledAt, interview.timezone)}
            </span>
          </div>
          <div className="text-xs text-[#94a3b8]">
            {interview.duration} min · {interview.timezone}
          </div>
        </div>
        <Badge text={getStatusText(interview.status)} variant={getStatusVariant(interview.status)} />
      </div>

      {/* Candidate and Job Info */}
      <div className="mb-3">
        <div className="text-base font-medium text-[#111827]">{candidateName}</div>
        <div className="text-sm text-[#64748b]">{jobTitle}</div>
      </div>

      {/* Mode and Location */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">{modeInfo.icon}</span>
        <Badge text={modeInfo.label} variant={modeInfo.variant} />
        {interview.mode === 'in_person' && interview.location && (
          <span className="text-xs text-[#64748b] truncate">{interview.location}</span>
        )}
      </div>

      {/* Panel Members */}
      <div className="mb-4">
        <div className="text-xs text-[#94a3b8] mb-1">Panel</div>
        <div className="text-sm text-[#374151]">{panelMembers}</div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-2 pt-3 border-t border-[#e2e8f0]">
          {canJoin && onJoin && (
            <Button variant="primary" size="sm" onClick={() => onJoin(interview)}>
              Join Meeting
            </Button>
          )}
          {onView && (
            <Button variant="outline" size="sm" onClick={() => onView(interview)}>
              View
            </Button>
          )}
          {interview.status === 'scheduled' && onReschedule && (
            <Button variant="secondary" size="sm" onClick={() => onReschedule(interview)}>
              Reschedule
            </Button>
          )}
          {interview.status === 'scheduled' && onCancel && (
            <Button variant="text" size="sm" onClick={() => onCancel(interview)}>
              Cancel
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default InterviewCard;
