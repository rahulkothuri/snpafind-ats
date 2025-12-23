/**
 * Interview Service
 * 
 * Handles API calls for interview management including scheduling,
 * rescheduling, cancellation, and querying interviews.
 * 
 * Requirements: 1.3, 8.3, 8.5
 */

import api from './api';

// Interview mode enum (Requirements 2.1)
export type InterviewMode = 'google_meet' | 'microsoft_teams' | 'in_person';

// Interview status enum (Requirements 1.3, 8.5)
export type InterviewStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

// Interview recommendation enum (Requirements 9.4)
export type InterviewRecommendation = 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire';

// User type for panel members
export interface InterviewUser {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interview panel member
export interface InterviewPanelMember {
  id: string;
  interviewId: string;
  userId: string;
  user?: InterviewUser;
  createdAt: string;
}

// Feedback rating
export interface FeedbackRating {
  criterion: string;
  score: number; // 1-5
  comments?: string;
}

// Interview feedback
export interface InterviewFeedback {
  id: string;
  interviewId: string;
  panelMemberId: string;
  ratings: FeedbackRating[];
  overallComments: string;
  recommendation: InterviewRecommendation;
  submittedAt: string;
  panelMember?: InterviewUser;
}

// Candidate info in interview
export interface InterviewCandidate {
  id: string;
  companyId: string;
  name: string;
  email: string;
  phone?: string;
  experienceYears: number;
  currentCompany?: string;
  location: string;
  skills: string[];
  resumeUrl?: string;
}

// Job info in interview
export interface InterviewJob {
  id: string;
  companyId: string;
  title: string;
  department: string;
  description: string;
  status: string;
  openings: number;
  skills: string[];
  locations: string[];
}

// Job candidate relation
export interface InterviewJobCandidate {
  id: string;
  jobId: string;
  candidateId: string;
  currentStageId: string;
  appliedAt: string;
  updatedAt: string;
  candidate?: InterviewCandidate;
  job?: InterviewJob;
}

// Main Interview type
export interface Interview {
  id: string;
  jobCandidateId: string;
  scheduledAt: string;
  duration: number; // minutes
  timezone: string;
  mode: InterviewMode;
  meetingLink?: string;
  location?: string;
  status: InterviewStatus;
  notes?: string;
  cancelReason?: string;
  scheduledBy: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  jobCandidate?: InterviewJobCandidate;
  scheduler?: InterviewUser;
  panelMembers?: InterviewPanelMember[];
  feedback?: InterviewFeedback[];
}

// Create interview input (Requirements 1.3, 1.4)
export interface CreateInterviewInput {
  jobCandidateId: string;
  scheduledAt: string; // ISO date string
  duration: number; // minutes
  timezone: string; // IANA timezone (e.g., 'Asia/Kolkata')
  mode: InterviewMode;
  location?: string; // Required for in_person
  panelMemberIds: string[]; // User IDs of interviewers
  notes?: string;
}

// Update interview input (Requirements 8.2, 8.3)
export interface UpdateInterviewInput {
  scheduledAt?: string;
  duration?: number;
  timezone?: string;
  mode?: InterviewMode;
  location?: string;
  panelMemberIds?: string[];
  notes?: string;
}

// Interview filters for querying (Requirements 17.2)
export interface InterviewFilters {
  jobId?: string;
  candidateId?: string;
  panelMemberId?: string;
  status?: InterviewStatus;
  dateFrom?: string;
  dateTo?: string;
  mode?: InterviewMode;
  jobCandidateId?: string;
}

// Dashboard interviews response (Requirements 11.1, 11.2, 12.1)
export interface DashboardInterviews {
  today: Interview[];
  tomorrow: Interview[];
  thisWeek: Interview[];
  pendingFeedback: Interview[];
}

// Panel load distribution (Requirements 13.1, 13.2)
export interface PanelLoad {
  userId: string;
  userName: string;
  userEmail: string;
  interviewCount: number;
  averageLoad: number;
}

// Timezone option
export interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
  region: string;
}

export const interviewsService = {
  /**
   * Create a new interview
   * Requirements: 1.3, 1.4
   */
  async create(data: CreateInterviewInput): Promise<Interview> {
    const response = await api.post('/interviews', data);
    return response.data;
  },

  /**
   * Update/reschedule an interview
   * Requirements: 8.2, 8.3
   */
  async update(id: string, data: UpdateInterviewInput): Promise<Interview> {
    const response = await api.put(`/interviews/${id}`, data);
    return response.data;
  },

  /**
   * Cancel an interview
   * Requirements: 8.4, 8.5
   */
  async cancel(id: string, reason?: string): Promise<Interview> {
    const response = await api.delete(`/interviews/${id}`, {
      data: { reason },
    });
    return response.data;
  },

  /**
   * Get interview by ID
   */
  async getById(id: string): Promise<Interview> {
    const response = await api.get(`/interviews/${id}`);
    return response.data;
  },

  /**
   * List interviews with filters
   * Requirements: 17.2
   */
  async list(filters?: InterviewFilters): Promise<Interview[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/interviews?${params.toString()}`);
    return response.data;
  },

  /**
   * Get dashboard interviews (today, tomorrow, this week, pending feedback)
   * Requirements: 11.1, 11.2, 12.1
   */
  async getDashboard(): Promise<DashboardInterviews> {
    const response = await api.get('/interviews/dashboard');
    return response.data;
  },

  /**
   * Get panel load distribution
   * Requirements: 13.1, 13.2
   */
  async getPanelLoad(period: 'week' | 'month' = 'week'): Promise<PanelLoad[]> {
    const response = await api.get(`/interviews/panel-load?period=${period}`);
    return response.data;
  },

  /**
   * Get pending feedback for current user
   * Requirements: 14.2
   */
  async getPendingFeedback(): Promise<Interview[]> {
    const response = await api.get('/interviews/pending-feedback');
    return response.data;
  },

  /**
   * Submit feedback for an interview
   * Requirements: 9.2
   */
  async submitFeedback(
    interviewId: string,
    data: {
      ratings: FeedbackRating[];
      overallComments: string;
      recommendation: InterviewRecommendation;
    }
  ): Promise<InterviewFeedback> {
    const response = await api.post(`/interviews/${interviewId}/feedback`, data);
    return response.data;
  },

  /**
   * Get feedback for an interview
   * Requirements: 14.5
   */
  async getFeedback(interviewId: string): Promise<InterviewFeedback[]> {
    const response = await api.get(`/interviews/${interviewId}/feedback`);
    return response.data;
  },

  /**
   * Get available timezones
   * Requirements: 3.1
   */
  async getTimezones(): Promise<TimezoneOption[]> {
    const response = await api.get('/timezones');
    return response.data.timezones;
  },
};

export default interviewsService;
