// User types
export type UserRole = 'admin' | 'hiring_manager' | 'recruiter';

export interface User {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Company types
export interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  contactEmail: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
  // Enhanced company profile fields
  website?: string;
  companySize?: string;
  industry?: string;
  description?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  facebookUrl?: string;
  careersPageUrl?: string;
  brandColor?: string;
}

// Job types
export type JobStatus = 'active' | 'paused' | 'closed';

export interface Job {
  id: string;
  companyId: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  salaryRange?: string;
  description: string;
  status: JobStatus;
  openings: number;
  createdAt: Date;
  updatedAt: Date;
  stages?: PipelineStage[];
  candidateCount?: number;
}

// Pipeline types
export interface PipelineStage {
  id: string;
  jobId: string;
  name: string;
  position: number;
  isDefault: boolean;
  candidateCount?: number;
}

// Candidate types
export interface Candidate {
  id: string;
  companyId: string;
  name: string;
  email: string;
  phone?: string;
  experienceYears: number;
  currentCompany?: string;
  location: string;
  currentCtc?: string;
  expectedCtc?: string;
  noticePeriod?: string;
  source: string;
  availability?: string;
  skills: string[];
  resumeUrl?: string;
  score?: number;
  createdAt: Date;
  updatedAt: Date;
  currentStage?: string;
  jobApplications?: JobApplication[];
}

export interface JobApplication {
  id: string;
  jobId: string;
  candidateId: string;
  currentStageId: string;
  appliedAt: Date;
  updatedAt: Date;
}

// Activity types
export type ActivityType = 'stage_change' | 'note_added' | 'resume_uploaded' | 'interview_scheduled' | 'score_updated';

export interface CandidateActivity {
  id: string;
  candidateId: string;
  jobCandidateId?: string;
  activityType: ActivityType;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// Dashboard types
export interface DashboardMetrics {
  openRoles: number;
  activeCandidates: number;
  interviewsToday: number;
  offersPending: number;
  timeToFillMedian: number;
  offerAcceptanceRate: number;
}

export interface Alert {
  id: string;
  level: 'critical' | 'warning' | 'info';
  message: string;
  action: string;
}

export interface Task {
  id: string;
  type: 'Feedback' | 'Approval' | 'Reminder' | 'Pipeline';
  text: string;
  age: string;
  severity: 'high' | 'medium' | 'low';
}

// API types
export interface APIError {
  status: number;
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}
