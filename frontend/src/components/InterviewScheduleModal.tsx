/**
 * InterviewScheduleModal Component
 * 
 * Modal for scheduling interviews with candidates.
 * 
 * Features:
 * - Date/time picker with timezone selection (Requirements 1.1, 3.1)
 * - Duration selector (30, 45, 60, 90 min) (Requirements 1.1)
 * - Interview mode selector (Google Meet, Teams, In-person) (Requirements 2.1)
 * - Panel member multi-select (Requirements 1.2)
 * - Location field for in-person interviews (Requirements 2.4)
 * - Notes field (Requirements 1.1)
 */

import { useState, useEffect } from 'react';
import { Button } from './Button';
import { MultiSelect } from './MultiSelect';
import type { MultiSelectOption } from './MultiSelect';
import { usersService } from '../services/users.service';
import type { User } from '../services/users.service';
import { interviewsService } from '../services/interviews.service';
import type { 
  InterviewMode, 
  TimezoneOption,
  CreateInterviewInput,
  Interview,
  InterviewRoundOption,
} from '../services/interviews.service';

export interface InterviewScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (interview: Interview) => void;
  jobCandidateId: string;
  candidateName: string;
  jobTitle: string;
  jobId?: string; // Job ID for fetching interview round options (Requirements 6.2)
}

interface InterviewFormData {
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  timezone: string;
  mode: InterviewMode;
  location: string;
  customUrl: string;
  panelMemberIds: string[];
  notes: string;
  roundType: string; // Interview round type (Requirements 6.5)
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
  { value: 'custom_url', label: 'Custom URL', icon: '🔗' },
];

// Default interview round options (Requirements 6.4)
const DEFAULT_INTERVIEW_ROUNDS: InterviewRoundOption[] = [
  { id: 'technical', name: 'Technical Round', isCustom: false },
  { id: 'hr', name: 'HR Round', isCustom: false },
  { id: 'managerial', name: 'Managerial Round', isCustom: false },
  { id: 'final', name: 'Final Round', isCustom: false },
];

// Get user's timezone or default to IST (Asia/Kolkata)
function getDefaultTimezone(): string {
  try {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // If user is in India or timezone detection fails, default to IST
    if (userTimezone.includes('Kolkata') || userTimezone.includes('India')) {
      return 'Asia/Kolkata';
    }
    // For other users, still default to IST for consistency
    return 'Asia/Kolkata';
  } catch {
    return 'Asia/Kolkata';
  }
}

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// Get current time rounded to next 30 minutes
function getDefaultTime(): string {
  const now = new Date();
  const minutes = now.getMinutes();
  const roundedMinutes = minutes < 30 ? 30 : 0;
  const hours = minutes < 30 ? now.getHours() : now.getHours() + 1;
  return `${String(hours).padStart(2, '0')}:${String(roundedMinutes).padStart(2, '0')}`;
}

export function InterviewScheduleModal({
  isOpen,
  onClose,
  onSuccess,
  jobCandidateId,
  candidateName,
  jobTitle,
  jobId,
}: InterviewScheduleModalProps) {
  const [formData, setFormData] = useState<InterviewFormData>({
    scheduledDate: getTodayDate(),
    scheduledTime: getDefaultTime(),
    duration: 60,
    timezone: getDefaultTimezone(),
    mode: 'google_meet',
    location: '',
    customUrl: '',
    panelMemberIds: [],
    notes: '',
    roundType: '', // Interview round type (Requirements 6.5)
  });

  const [users, setUsers] = useState<User[]>([]);
  const [timezones, setTimezones] = useState<TimezoneOption[]>([]);
  const [interviewRounds, setInterviewRounds] = useState<InterviewRoundOption[]>(DEFAULT_INTERVIEW_ROUNDS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load users and timezones when modal opens
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, timezonesData] = await Promise.all([
        usersService.getAll(),
        interviewsService.getTimezones(),
      ]);
      setUsers(usersData.filter(u => u.isActive));
      setTimezones(timezonesData);

      // Fetch interview round options if jobId is provided (Requirements 6.2, 6.3)
      if (jobId) {
        try {
          const roundOptions = await interviewsService.getInterviewRoundOptions(jobId);
          if (roundOptions && roundOptions.length > 0) {
            setInterviewRounds(roundOptions);
          } else {
            setInterviewRounds(DEFAULT_INTERVIEW_ROUNDS);
          }
        } catch (error) {
          console.error('Failed to load interview round options:', error);
          // Fall back to default options (Requirements 6.4)
          setInterviewRounds(DEFAULT_INTERVIEW_ROUNDS);
        }
      } else {
        setInterviewRounds(DEFAULT_INTERVIEW_ROUNDS);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        scheduledDate: getTodayDate(),
        scheduledTime: getDefaultTime(),
        duration: 60,
        timezone: getDefaultTimezone(),
        mode: 'google_meet',
        location: '',
        customUrl: '',
        panelMemberIds: [],
        notes: '',
        roundType: '',
      });
      setErrors({});
      setInterviewRounds(DEFAULT_INTERVIEW_ROUNDS);
    }
  }, [isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when field is modified
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
      location: mode !== 'in_person' ? '' : prev.location,
      customUrl: mode !== 'custom_url' ? '' : prev.customUrl
    }));
    if (errors.location) {
      setErrors(prev => ({ ...prev, location: '' }));
    }
    if (errors.customUrl) {
      setErrors(prev => ({ ...prev, customUrl: '' }));
    }
  };

  const handlePanelMembersChange = (panelMemberIds: string[]) => {
    setFormData(prev => ({ ...prev, panelMemberIds }));
    if (errors.panelMemberIds) {
      setErrors(prev => ({ ...prev, panelMemberIds: '' }));
    }
  };

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

    if (formData.mode === 'custom_url' && !formData.customUrl.trim()) {
      newErrors.customUrl = 'Meeting URL is required for custom URL interviews';
    }

    // Validate custom URL format
    if (formData.mode === 'custom_url' && formData.customUrl.trim()) {
      try {
        new URL(formData.customUrl);
      } catch {
        newErrors.customUrl = 'Please enter a valid URL (e.g., https://zoom.us/j/123456789)';
      }
    }

    // Validate date is not in the past
    const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
    if (scheduledDateTime < new Date()) {
      newErrors.scheduledDate = 'Cannot schedule interview in the past';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Combine date and time into ISO string
      const scheduledAt = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString();

      const input: CreateInterviewInput = {
        jobCandidateId,
        scheduledAt,
        duration: formData.duration,
        timezone: formData.timezone,
        mode: formData.mode,
        location: formData.mode === 'in_person' ? formData.location : 
                 formData.mode === 'custom_url' ? formData.customUrl : undefined,
        panelMemberIds: formData.panelMemberIds,
        notes: formData.notes || undefined,
        roundType: formData.roundType || undefined, // Interview round type (Requirements 6.5)
      };

      const interview = await interviewsService.create(input);
      onSuccess(interview);
      onClose();
    } catch (error: unknown) {
      console.error('Failed to schedule interview:', error);
      const apiError = error as { response?: { data?: { details?: Record<string, string[]> } } };
      if (apiError.response?.data?.details) {
        const apiErrors: Record<string, string> = {};
        Object.entries(apiError.response.data.details).forEach(([key, messages]) => {
          apiErrors[key] = messages[0];
        });
        setErrors(apiErrors);
      } else {
        setErrors({ submit: 'Failed to schedule interview. Please try again.' });
      }
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
                Schedule Interview
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
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
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

              {/* Interview Round/Type - Requirements 6.1, 6.2, 6.3, 6.4 */}
              <div>
                <label htmlFor="roundType" className="block text-sm font-medium text-[#374151] mb-1.5">
                  Interview Round/Type
                </label>
                <select
                  id="roundType"
                  name="roundType"
                  value={formData.roundType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0b6cf0]"
                >
                  <option value="">Select interview round...</option>
                  {interviewRounds.map(round => (
                    <option key={round.id} value={round.name}>
                      {round.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[#64748b] mt-1">
                  {interviewRounds.some(r => r.isCustom) 
                    ? 'Options based on job pipeline sub-stages' 
                    : 'Default interview round options'}
                </p>
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

              {/* Custom URL (for custom meetings) */}
              {formData.mode === 'custom_url' && (
                <div>
                  <label htmlFor="customUrl" className="block text-sm font-medium text-[#374151] mb-1.5">
                    Meeting URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    id="customUrl"
                    name="customUrl"
                    value={formData.customUrl}
                    onChange={handleInputChange}
                    placeholder="https://zoom.us/j/123456789 or https://meet.jit.si/room-name"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0b6cf0] ${
                      errors.customUrl ? 'border-red-500' : 'border-[#e2e8f0]'
                    }`}
                  />
                  {errors.customUrl && (
                    <p className="text-xs text-red-500 mt-1">{errors.customUrl}</p>
                  )}
                  <p className="text-xs text-[#64748b] mt-1">
                    Enter the meeting URL for Zoom, Jitsi Meet, or any other video conferencing platform
                  </p>
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Scheduling...
                    </span>
                  ) : (
                    'Schedule Interview'
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default InterviewScheduleModal;
