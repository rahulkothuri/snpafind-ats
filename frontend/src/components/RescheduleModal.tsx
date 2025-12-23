/**
 * RescheduleModal Component
 * 
 * Modal for rescheduling interviews with:
 * - Pre-filled current interview details
 * - Allow modification of all fields
 * - Show change summary before confirm
 * 
 * Requirements: 8.1, 8.2
 */

import { useState, useEffect, useMemo } from 'react';
import { Button } from './Button';
import { MultiSelect } from './MultiSelect';
import type { MultiSelectOption } from './MultiSelect';
import { usersService } from '../services/users.service';
import type { User } from '../services/users.service';
import { interviewsService } from '../services/interviews.service';
import type { 
  InterviewMode, 
  TimezoneOption,
  UpdateInterviewInput,
  Interview 
} from '../services/interviews.service';

export interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (interview: Interview) => void;
  interview: Interview;
}

interface InterviewFormData {
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  timezone: string;
  mode: InterviewMode;
  location: string;
  panelMemberIds: string[];
  notes: string;
}

interface ChangeItem {
  field: string;
  oldValue: string;
  newValue: string;
}

const DURATION_OPTIONS = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '60 minutes' },
  { value: 90, label: '90 minutes' },
];

const MODE_OPTIONS: { value: InterviewMode; label: string; icon: string }[] = [
  { value: 'google_meet', label: 'Google Meet', icon: '🎥' },
  { value: 'microsoft_teams', label: 'Microsoft Teams', icon: '📹' },
  { value: 'in_person', label: 'In-Person', icon: '🏢' },
];

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// Parse ISO date string to date and time parts
function parseDateTime(isoString: string, timezone?: string): { date: string; time: string } {
  const date = new Date(isoString);
  // Format date as YYYY-MM-DD
  const dateStr = date.toLocaleDateString('en-CA', { timeZone: timezone || 'UTC' });
  // Format time as HH:MM
  const timeStr = date.toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false,
    timeZone: timezone || 'UTC'
  });
  return { date: dateStr, time: timeStr };
}

// Format mode for display
function formatMode(mode: InterviewMode): string {
  switch (mode) {
    case 'google_meet': return 'Google Meet';
    case 'microsoft_teams': return 'Microsoft Teams';
    case 'in_person': return 'In-Person';
    default: return mode;
  }
}

// Format date for display
function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function RescheduleModal({
  isOpen,
  onClose,
  onSuccess,
  interview,
}: RescheduleModalProps) {
  // Parse initial values from interview
  const initialDateTime = parseDateTime(interview.scheduledAt, interview.timezone);
  const initialPanelMemberIds = interview.panelMembers?.map(pm => pm.userId) || [];

  const [formData, setFormData] = useState<InterviewFormData>({
    scheduledDate: initialDateTime.date,
    scheduledTime: initialDateTime.time,
    duration: interview.duration,
    timezone: interview.timezone,
    mode: interview.mode,
    location: interview.location || '',
    panelMemberIds: initialPanelMemberIds,
    notes: interview.notes || '',
  });

  const [users, setUsers] = useState<User[]>([]);
  const [timezones, setTimezones] = useState<TimezoneOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Load users and timezones when modal opens
  useEffect(() => {
    if (isOpen) {
      loadData();
      // Reset form to interview values when modal opens
      const dateTime = parseDateTime(interview.scheduledAt, interview.timezone);
      setFormData({
        scheduledDate: dateTime.date,
        scheduledTime: dateTime.time,
        duration: interview.duration,
        timezone: interview.timezone,
        mode: interview.mode,
        location: interview.location || '',
        panelMemberIds: interview.panelMembers?.map(pm => pm.userId) || [],
        notes: interview.notes || '',
      });
      setShowConfirmation(false);
      setErrors({});
    }
  }, [isOpen, interview]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, timezonesData] = await Promise.all([
        usersService.getAll(),
        interviewsService.getTimezones(),
      ]);
      setUsers(usersData.filter(u => u.isActive));
      setTimezones(timezonesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDurationChange = (duration: number) => {
    setFormData(prev => ({ ...prev, duration }));
  };

  const handleModeChange = (mode: InterviewMode) => {
    setFormData(prev => ({ 
      ...prev, 
      mode,
      location: mode !== 'in_person' ? '' : prev.location 
    }));
    if (errors.location) {
      setErrors(prev => ({ ...prev, location: '' }));
    }
  };

  const handlePanelMembersChange = (panelMemberIds: string[]) => {
    setFormData(prev => ({ ...prev, panelMemberIds }));
    if (errors.panelMemberIds) {
      setErrors(prev => ({ ...prev, panelMemberIds: '' }));
    }
  };

  // Calculate changes between original and current form data
  const changes = useMemo((): ChangeItem[] => {
    const changeList: ChangeItem[] = [];
    const originalDateTime = parseDateTime(interview.scheduledAt, interview.timezone);
    const originalPanelMemberIds = interview.panelMembers?.map(pm => pm.userId) || [];

    // Date change
    if (formData.scheduledDate !== originalDateTime.date) {
      changeList.push({
        field: 'Date',
        oldValue: formatDateDisplay(originalDateTime.date),
        newValue: formatDateDisplay(formData.scheduledDate),
      });
    }

    // Time change
    if (formData.scheduledTime !== originalDateTime.time) {
      changeList.push({
        field: 'Time',
        oldValue: originalDateTime.time,
        newValue: formData.scheduledTime,
      });
    }

    // Duration change
    if (formData.duration !== interview.duration) {
      changeList.push({
        field: 'Duration',
        oldValue: `${interview.duration} minutes`,
        newValue: `${formData.duration} minutes`,
      });
    }

    // Timezone change
    if (formData.timezone !== interview.timezone) {
      changeList.push({
        field: 'Timezone',
        oldValue: interview.timezone,
        newValue: formData.timezone,
      });
    }

    // Mode change
    if (formData.mode !== interview.mode) {
      changeList.push({
        field: 'Interview Mode',
        oldValue: formatMode(interview.mode),
        newValue: formatMode(formData.mode),
      });
    }

    // Location change (for in-person)
    if (formData.location !== (interview.location || '')) {
      changeList.push({
        field: 'Location',
        oldValue: interview.location || 'Not set',
        newValue: formData.location || 'Not set',
      });
    }

    // Panel members change
    const panelMembersChanged = 
      formData.panelMemberIds.length !== originalPanelMemberIds.length ||
      !formData.panelMemberIds.every(id => originalPanelMemberIds.includes(id));
    
    if (panelMembersChanged) {
      const getNames = (ids: string[]) => 
        ids.map(id => users.find(u => u.id === id)?.name || 'Unknown').join(', ') || 'None';
      changeList.push({
        field: 'Panel Members',
        oldValue: getNames(originalPanelMemberIds),
        newValue: getNames(formData.panelMemberIds),
      });
    }

    // Notes change
    if (formData.notes !== (interview.notes || '')) {
      changeList.push({
        field: 'Notes',
        oldValue: interview.notes ? 'Updated' : 'Not set',
        newValue: formData.notes ? 'Updated' : 'Cleared',
      });
    }

    return changeList;
  }, [formData, interview, users]);

  const hasChanges = changes.length > 0;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'Date is required';
    }

    if (!formData.scheduledTime) {
      newErrors.scheduledTime = 'Time is required';
    }

    if (!formData.timezone) {
      newErrors.timezone = 'Timezone is required';
    }

    if (formData.panelMemberIds.length === 0) {
      newErrors.panelMemberIds = 'At least one panel member is required';
    }

    if (formData.mode === 'in_person' && !formData.location.trim()) {
      newErrors.location = 'Location is required for in-person interviews';
    }

    // Validate date is not in the past
    const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
    if (scheduledDateTime < new Date()) {
      newErrors.scheduledDate = 'Cannot schedule interview in the past';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReviewChanges = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!hasChanges) {
      setErrors({ submit: 'No changes have been made to the interview.' });
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmReschedule = async () => {
    setIsSubmitting(true);
    try {
      // Combine date and time into ISO string
      const scheduledAt = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString();

      const input: UpdateInterviewInput = {
        scheduledAt,
        duration: formData.duration,
        timezone: formData.timezone,
        mode: formData.mode,
        location: formData.mode === 'in_person' ? formData.location : undefined,
        panelMemberIds: formData.panelMemberIds,
        notes: formData.notes || undefined,
      };

      const updatedInterview = await interviewsService.update(interview.id, input);
      onSuccess(updatedInterview);
      onClose();
    } catch (error: unknown) {
      console.error('Failed to reschedule interview:', error);
      const apiError = error as { response?: { data?: { details?: Record<string, string[]> } } };
      if (apiError.response?.data?.details) {
        const apiErrors: Record<string, string> = {};
        Object.entries(apiError.response.data.details).forEach(([key, messages]) => {
          apiErrors[key] = messages[0];
        });
        setErrors(apiErrors);
      } else {
        setErrors({ submit: 'Failed to reschedule interview. Please try again.' });
      }
      setShowConfirmation(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Convert users to MultiSelect options
  const panelMemberOptions: MultiSelectOption[] = users.map(user => ({
    value: user.id,
    label: `${user.name} (${user.email})`,
  }));

  const candidateName = interview.jobCandidate?.candidate?.name || 'Unknown Candidate';
  const jobTitle = interview.jobCandidate?.job?.title || 'Unknown Job';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6 transform transition-all max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-[#111827]">
                {showConfirmation ? 'Confirm Changes' : 'Reschedule Interview'}
              </h2>
              <p className="text-sm text-[#64748b] mt-1">
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

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0b6cf0]"></div>
            </div>
          ) : showConfirmation ? (
            /* Confirmation View */
            <div className="space-y-5">
              <div className="p-4 bg-[#fef3c7] rounded-lg border border-[#fcd34d]">
                <div className="flex items-start gap-3">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <p className="text-sm font-medium text-[#92400e]">
                      Please review the changes before confirming
                    </p>
                    <p className="text-xs text-[#b45309] mt-1">
                      Calendar events and email notifications will be updated automatically.
                    </p>
                  </div>
                </div>
              </div>

              {/* Changes Summary */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-[#374151]">Changes to be made:</h3>
                <div className="space-y-2">
                  {changes.map((change, index) => (
                    <div key={index} className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                      <div className="text-xs text-[#64748b] mb-1">{change.field}</div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-[#ef4444] line-through">{change.oldValue}</span>
                        <span className="text-[#64748b]">→</span>
                        <span className="text-[#22c55e] font-medium">{change.newValue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              {/* Confirmation Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Back to Edit
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleConfirmReschedule}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Updating...
                    </span>
                  ) : (
                    'Confirm Reschedule'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* Edit Form */
            <form onSubmit={handleReviewChanges} className="space-y-5">
              {/* Date and Time Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="scheduledDate" className="block text-sm font-medium text-[#374151] mb-1.5">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="scheduledDate"
                    name="scheduledDate"
                    value={formData.scheduledDate}
                    onChange={handleInputChange}
                    min={getTodayDate()}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0b6cf0] ${
                      errors.scheduledDate ? 'border-red-500' : 'border-[#e2e8f0]'
                    }`}
                  />
                  {errors.scheduledDate && (
                    <p className="text-xs text-red-500 mt-1">{errors.scheduledDate}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="scheduledTime" className="block text-sm font-medium text-[#374151] mb-1.5">
                    Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    id="scheduledTime"
                    name="scheduledTime"
                    value={formData.scheduledTime}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0b6cf0] ${
                      errors.scheduledTime ? 'border-red-500' : 'border-[#e2e8f0]'
                    }`}
                  />
                  {errors.scheduledTime && (
                    <p className="text-xs text-red-500 mt-1">{errors.scheduledTime}</p>
                  )}
                </div>
              </div>

              {/* Timezone */}
              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-[#374151] mb-1.5">
                  Timezone <span className="text-red-500">*</span>
                </label>
                <select
                  id="timezone"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0b6cf0] ${
                    errors.timezone ? 'border-red-500' : 'border-[#e2e8f0]'
                  }`}
                >
                  {timezones.map(tz => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label} ({tz.offset})
                    </option>
                  ))}
                </select>
                {errors.timezone && (
                  <p className="text-xs text-red-500 mt-1">{errors.timezone}</p>
                )}
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">
                  Duration <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {DURATION_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleDurationChange(option.value)}
                      className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                        formData.duration === option.value
                          ? 'bg-[#0b6cf0] text-white border-[#0b6cf0]'
                          : 'bg-white text-[#374151] border-[#e2e8f0] hover:border-[#0b6cf0]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interview Mode */}
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">
                  Interview Mode <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {MODE_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleModeChange(option.value)}
                      className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors flex items-center justify-center gap-2 ${
                        formData.mode === option.value
                          ? 'bg-[#0b6cf0] text-white border-[#0b6cf0]'
                          : 'bg-white text-[#374151] border-[#e2e8f0] hover:border-[#0b6cf0]'
                      }`}
                    >
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Location (for in-person) */}
              {formData.mode === 'in_person' && (
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-[#374151] mb-1.5">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Enter interview location/address"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0b6cf0] ${
                      errors.location ? 'border-red-500' : 'border-[#e2e8f0]'
                    }`}
                  />
                  {errors.location && (
                    <p className="text-xs text-red-500 mt-1">{errors.location}</p>
                  )}
                </div>
              )}

              {/* Panel Members */}
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">
                  Panel Members <span className="text-red-500">*</span>
                </label>
                <MultiSelect
                  options={panelMemberOptions}
                  value={formData.panelMemberIds}
                  onChange={handlePanelMembersChange}
                  placeholder="Select interviewers..."
                  searchPlaceholder="Search by name or email..."
                  error={!!errors.panelMemberIds}
                />
                {errors.panelMemberIds && (
                  <p className="text-xs text-red-500 mt-1">{errors.panelMemberIds}</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-[#374151] mb-1.5">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Add any notes or instructions for the interview..."
                  className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0b6cf0] resize-none"
                />
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  disabled={isSubmitting || !hasChanges}
                >
                  Review Changes
                </Button>
              </div>

              {/* No changes indicator */}
              {!hasChanges && (
                <p className="text-xs text-center text-[#64748b]">
                  Make changes to the interview details to enable rescheduling.
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default RescheduleModal;
