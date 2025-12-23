/**
 * InterviewDetailModal Component
 * 
 * Modal for viewing interview details with integrated feedback functionality:
 * - Shows interview details (time, candidate, job, panel members)
 * - Shows feedback form for panel members who haven't submitted feedback
 * - Shows feedback summary for all users
 * 
 * Requirements: 9.2, 14.5
 */

import { useState } from 'react';
import { Badge } from './Badge';
import { Button } from './Button';
import { FeedbackScorecard } from './FeedbackScorecard';
import type { FeedbackSubmission } from './FeedbackScorecard';
import { FeedbackSummary } from './FeedbackSummary';
import { useInterviewFeedback, useSubmitFeedback } from '../hooks/useInterviews';
import type { Interview, InterviewMode, InterviewStatus } from '../services/interviews.service';

export interface InterviewDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview: Interview;
  currentUserId: string;
  onReschedule?: (interview: Interview) => void;
  onCancel?: (interview: Interview) => void;
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
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
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
      return 'Scheduled';
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
function getModeInfo(mode: InterviewMode): { icon: string; label: string } {
  switch (mode) {
    case 'google_meet':
      return { icon: '📹', label: 'Google Meet' };
    case 'microsoft_teams':
      return { icon: '💼', label: 'Microsoft Teams' };
    case 'in_person':
      return { icon: '🏢', label: 'In-Person' };
    default:
      return { icon: '📅', label: mode };
  }
}

type TabType = 'details' | 'feedback' | 'submit-feedback';

export function InterviewDetailModal({
  isOpen,
  onClose,
  interview,
  currentUserId,
  onReschedule,
  onCancel,
}: InterviewDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch feedback for this interview
  const { 
    data: feedbackData, 
    isLoading: feedbackLoading,
    refetch: refetchFeedback,
  } = useInterviewFeedback(interview.id);

  // Submit feedback mutation
  const submitFeedbackMutation = useSubmitFeedback();

  if (!isOpen) return null;

  const modeInfo = getModeInfo(interview.mode);
  const candidateName = interview.jobCandidate?.candidate?.name || 'Unknown Candidate';
  const candidateEmail = interview.jobCandidate?.candidate?.email || '';
  const jobTitle = interview.jobCandidate?.job?.title || 'Unknown Job';
  const panelMembers = interview.panelMembers || [];
  const totalPanelMembers = panelMembers.length;

  // Check if current user is a panel member
  const isPanelMember = panelMembers.some(pm => pm.userId === currentUserId);

  // Check if current user has already submitted feedback
  const hasSubmittedFeedback = feedbackData?.some(
    fb => fb.panelMemberId === currentUserId
  );

  // Determine if feedback can be submitted (interview completed and user is panel member)
  const canSubmitFeedback = isPanelMember && 
    !hasSubmittedFeedback && 
    (interview.status === 'completed' || interview.status === 'in_progress');

  // Handle feedback submission
  const handleFeedbackSubmit = async (feedback: FeedbackSubmission) => {
    setSubmitError(null);
    try {
      await submitFeedbackMutation.mutateAsync({
        interviewId: interview.id,
        ratings: feedback.ratings,
        overallComments: feedback.overallComments,
        recommendation: feedback.recommendation,
      });
      // Refetch feedback and switch to feedback tab
      await refetchFeedback();
      setActiveTab('feedback');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      setSubmitError('Failed to submit feedback. Please try again.');
    }
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <div className="space-y-6">
            {/* Interview Time & Status */}
            <div className="flex items-start justify-between">
              <div>
                <div className="text-2xl font-semibold text-[#0b6cf0]">
                  {formatTime(interview.scheduledAt, interview.timezone)}
                </div>
                <div className="text-sm text-[#64748b]">
                  {formatDate(interview.scheduledAt, interview.timezone)}
                </div>
                <div className="text-xs text-[#94a3b8] mt-1">
                  {interview.duration} minutes · {interview.timezone}
                </div>
              </div>
              <Badge 
                text={getStatusText(interview.status)} 
                variant={getStatusVariant(interview.status)} 
              />
            </div>

            {/* Candidate Info */}
            <div className="p-4 bg-[#f8fafc] rounded-lg">
              <div className="text-xs text-[#94a3b8] uppercase tracking-wide mb-2">Candidate</div>
              <div className="text-lg font-medium text-[#111827]">{candidateName}</div>
              {candidateEmail && (
                <div className="text-sm text-[#64748b]">{candidateEmail}</div>
              )}
              <div className="text-sm text-[#0b6cf0] mt-1">{jobTitle}</div>
            </div>

            {/* Interview Mode & Location */}
            <div className="p-4 bg-[#f8fafc] rounded-lg">
              <div className="text-xs text-[#94a3b8] uppercase tracking-wide mb-2">Interview Mode</div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{modeInfo.icon}</span>
                <span className="text-sm font-medium text-[#111827]">{modeInfo.label}</span>
              </div>
              {interview.meetingLink && (
                <a 
                  href={interview.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#0b6cf0] hover:underline mt-2 block"
                >
                  Join Meeting →
                </a>
              )}
              {interview.location && (
                <div className="text-sm text-[#64748b] mt-2">{interview.location}</div>
              )}
            </div>

            {/* Panel Members */}
            <div className="p-4 bg-[#f8fafc] rounded-lg">
              <div className="text-xs text-[#94a3b8] uppercase tracking-wide mb-2">
                Panel Members ({totalPanelMembers})
              </div>
              <div className="space-y-2">
                {panelMembers.map(pm => (
                  <div key={pm.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#0b6cf0] flex items-center justify-center text-white text-sm font-medium">
                      {pm.user?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#111827]">
                        {pm.user?.name || 'Unknown'}
                        {pm.userId === currentUserId && (
                          <span className="text-xs text-[#64748b] ml-1">(You)</span>
                        )}
                      </div>
                      <div className="text-xs text-[#64748b]">{pm.user?.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {interview.notes && (
              <div className="p-4 bg-[#f8fafc] rounded-lg">
                <div className="text-xs text-[#94a3b8] uppercase tracking-wide mb-2">Notes</div>
                <p className="text-sm text-[#374151] whitespace-pre-wrap">{interview.notes}</p>
              </div>
            )}

            {/* Cancel Reason */}
            {interview.status === 'cancelled' && interview.cancelReason && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-xs text-red-600 uppercase tracking-wide mb-2">Cancellation Reason</div>
                <p className="text-sm text-red-700">{interview.cancelReason}</p>
              </div>
            )}

            {/* Actions */}
            {interview.status === 'scheduled' && (
              <div className="flex gap-3 pt-4 border-t border-[#e2e8f0]">
                {onReschedule && (
                  <Button 
                    variant="secondary" 
                    onClick={() => onReschedule(interview)}
                  >
                    Reschedule
                  </Button>
                )}
                {onCancel && (
                  <Button 
                    variant="text" 
                    onClick={() => onCancel(interview)}
                  >
                    Cancel Interview
                  </Button>
                )}
              </div>
            )}
          </div>
        );

      case 'feedback':
        return (
          <div>
            {feedbackLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0b6cf0]"></div>
              </div>
            ) : (
              <FeedbackSummary 
                feedback={feedbackData || []} 
                totalPanelMembers={totalPanelMembers}
              />
            )}
          </div>
        );

      case 'submit-feedback':
        return (
          <div>
            {submitError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{submitError}</p>
              </div>
            )}
            <FeedbackScorecard
              interview={interview}
              onSubmit={handleFeedbackSubmit}
              onCancel={() => setActiveTab('details')}
              isSubmitting={submitFeedbackMutation.isPending}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full transform transition-all max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-xl font-semibold text-[#111827]">
                Interview Details
              </h2>
              <p className="text-sm text-[#64748b] mt-0.5">
                {candidateName} • {jobTitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-[#64748b] hover:text-[#111827] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="px-6 border-b border-[#e2e8f0] flex-shrink-0">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'details'
                    ? 'border-[#0b6cf0] text-[#0b6cf0]'
                    : 'border-transparent text-[#64748b] hover:text-[#111827]'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('feedback')}
                className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'feedback'
                    ? 'border-[#0b6cf0] text-[#0b6cf0]'
                    : 'border-transparent text-[#64748b] hover:text-[#111827]'
                }`}
              >
                Feedback
                {feedbackData && feedbackData.length > 0 && (
                  <span className="px-1.5 py-0.5 text-xs bg-[#dbeafe] text-[#1e40af] rounded-full">
                    {feedbackData.length}
                  </span>
                )}
              </button>
              {canSubmitFeedback && (
                <button
                  onClick={() => setActiveTab('submit-feedback')}
                  className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'submit-feedback'
                      ? 'border-[#0b6cf0] text-[#0b6cf0]'
                      : 'border-transparent text-[#64748b] hover:text-[#111827]'
                  }`}
                >
                  Submit Feedback
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {renderTabContent()}
          </div>

          {/* Footer with feedback prompt for panel members */}
          {canSubmitFeedback && activeTab === 'details' && (
            <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#fef3c7] flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📝</span>
                  <span className="text-sm text-[#92400e]">
                    You haven't submitted feedback for this interview yet.
                  </span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveTab('submit-feedback')}
                >
                  Submit Feedback
                </Button>
              </div>
            </div>
          )}

          {/* Footer showing feedback submitted */}
          {isPanelMember && hasSubmittedFeedback && activeTab === 'details' && (
            <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#dcfce7] flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">✅</span>
                <span className="text-sm text-[#166534]">
                  You have submitted your feedback for this interview.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InterviewDetailModal;
