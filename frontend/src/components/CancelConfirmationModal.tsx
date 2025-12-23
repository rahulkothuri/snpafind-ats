/**
 * CancelConfirmationModal Component
 * 
 * Modal for confirming interview cancellation with:
 * - Confirmation prompt
 * - Optional cancellation reason
 * 
 * Requirements: 8.4
 */

import { useState } from 'react';
import { Button } from './Button';
import { interviewsService } from '../services/interviews.service';
import type { Interview } from '../services/interviews.service';

export interface CancelConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (interview: Interview) => void;
  interview: Interview;
}

export function CancelConfirmationModal({
  isOpen,
  onClose,
  onSuccess,
  interview,
}: CancelConfirmationModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const cancelledInterview = await interviewsService.cancel(
        interview.id, 
        reason.trim() || undefined
      );
      onSuccess(cancelledInterview);
      onClose();
    } catch (err: unknown) {
      console.error('Failed to cancel interview:', err);
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message || 'Failed to cancel interview. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const candidateName = interview.jobCandidate?.candidate?.name || 'Unknown Candidate';
  const jobTitle = interview.jobCandidate?.job?.title || 'Unknown Job';
  
  // Format scheduled time for display
  const scheduledDate = new Date(interview.scheduledAt);
  const formattedDate = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: interview.timezone,
  });
  const formattedTime = scheduledDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: interview.timezone,
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 transform transition-all">
          {/* Warning Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-[#111827]">
              Cancel Interview?
            </h2>
            <p className="text-sm text-[#64748b] mt-2">
              This action cannot be undone. The interview will be cancelled and all participants will be notified.
            </p>
          </div>

          {/* Interview Details */}
          <div className="p-4 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] mb-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#64748b]">Candidate</span>
                <span className="text-sm font-medium text-[#111827]">{candidateName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#64748b]">Position</span>
                <span className="text-sm text-[#374151]">{jobTitle}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#64748b]">Scheduled</span>
                <span className="text-sm text-[#374151]">{formattedDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#64748b]">Time</span>
                <span className="text-sm text-[#374151]">{formattedTime} ({interview.timezone})</span>
              </div>
            </div>
          </div>

          {/* Cancellation Reason */}
          <div className="mb-6">
            <label htmlFor="cancelReason" className="block text-sm font-medium text-[#374151] mb-1.5">
              Cancellation Reason <span className="text-[#64748b]">(optional)</span>
            </label>
            <textarea
              id="cancelReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Provide a reason for cancellation (will be included in notification emails)..."
              className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Notification Info */}
          <div className="mb-6 p-3 bg-[#fef3c7] rounded-lg border border-[#fcd34d]">
            <div className="flex items-start gap-2">
              <span className="text-sm">📧</span>
              <p className="text-xs text-[#92400e]">
                Cancellation emails will be sent to the candidate and all panel members. Calendar events will be automatically removed.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Keep Interview
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleCancel}
              className="flex-1 !bg-red-600 hover:!bg-red-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Cancelling...
                </span>
              ) : (
                'Cancel Interview'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CancelConfirmationModal;
