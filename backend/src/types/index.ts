// User types
export type UserRole = 'admin' | 'hiring_manager' | 'recruiter' | 'vendor';

export interface User {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  companyRoleId?: string | null;
  companyRole?: {
    id: string;
    name: string;
  } | null;
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
  // Enhanced company profile fields (Requirements 7.1, 7.2)
  website?: string;
  companySize?: string;
  industry?: string;
  description?: string;
  // Contact & Location
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  // Social Media Links
  linkedinUrl?: string;
  twitterUrl?: string;
  facebookUrl?: string;
  careersPageUrl?: string;
  // Branding
  brandColor?: string;
}

// Mandatory criteria structure for job screening
export interface MandatoryCriteria {
  title: string;
  intro: string;
  criteria: string[];
  note: string;
}

// Screening question types for job applications
export type ScreeningQuestionType = 'text' | 'textarea' | 'single_choice' | 'multiple_choice' | 'yes_no' | 'number';

export interface ScreeningQuestion {
  id?: string;
  question: string;
  type: ScreeningQuestionType;
  required: boolean;
  options?: string[];
  idealAnswer?: string | string[];
}

export interface ScreeningQuestionAnswer {
  questionId: string;
  answer: string | string[] | number | boolean;
}

// Flexible Auto-rejection rules structure (Requirements 9.1)
// Supported candidate fields for auto-rejection
export type RuleField = 'experience' | 'location' | 'skills' | 'education' | 'salary_expectation';

// Operators by field type
export type NumericOperator = 'less_than' | 'greater_than' | 'equals' | 'not_equals' | 'between';
export type TextOperator = 'equals' | 'not_equals' | 'contains' | 'not_contains';
export type ArrayOperator = 'contains' | 'not_contains' | 'contains_all' | 'contains_any';
export type RuleOperator = NumericOperator | TextOperator | ArrayOperator;

// Logic connector for multiple rules
export type LogicConnector = 'AND' | 'OR';

// Individual auto-rejection rule
export interface AutoRejectionRule {
  id: string;
  field: RuleField;
  operator: RuleOperator;
  value: number | string | string[] | [number, number]; // [number, number] for 'between' operator
  logicConnector?: LogicConnector; // How this rule connects to the next
}

// Complete auto-rejection rules configuration
export interface AutoRejectionRules {
  enabled: boolean;
  rules: AutoRejectionRule[];
}

// Legacy auto-rejection rules structure (for backward compatibility)
export interface LegacyAutoRejectionRules {
  enabled: boolean;
  rules: {
    minExperience?: number;
    maxExperience?: number;
    requiredSkills?: string[];
    requiredEducation?: string[];
  };
}

// Job types
export type JobStatus = 'active' | 'paused' | 'closed';
export type WorkMode = 'Onsite' | 'WFH' | 'Hybrid' | 'C2C' | 'C2H';
export type JobPriority = 'Low' | 'Medium' | 'High';

export interface Job {
  id: string;
  companyId: string;
  title: string;
  department: string;

  // Experience range (Requirements 1.1, 1.2)
  experienceMin?: number;
  experienceMax?: number;

  // Salary range (Requirements 1.1, 1.3)
  salaryMin?: number;
  salaryMax?: number;
  variables?: string;

  // Requirements (Requirements 1.1)
  educationQualification?: string;
  ageUpTo?: number;
  skills: string[];
  preferredIndustry?: string;

  // Work details (Requirements 1.1, 1.4, 1.5, 1.6)
  workMode?: WorkMode;
  locations: string[];
  priority?: JobPriority;
  jobDomain?: string;

  // Assignment (Requirements 1.1)
  assignedRecruiterId?: string;

  // Content
  description: string;

  // Mandatory criteria - editable screening criteria
  mandatoryCriteria?: MandatoryCriteria;

  // Screening questions - questions candidates must answer before applying
  screeningQuestions?: ScreeningQuestion[];

  // Auto-rejection rules (Requirements 9.1)
  autoRejectionRules?: AutoRejectionRules;

  // Existing fields
  status: JobStatus;
  openings: number;
  createdAt: Date;
  updatedAt: Date;

  // Legacy fields (kept for compatibility)
  location?: string;
  employmentType?: string;
  salaryRange?: string;
}

// Pipeline types
export interface PipelineStage {
  id: string;
  jobId: string;
  name: string;
  position: number;
  isDefault: boolean;
  isMandatory: boolean;
  parentId?: string;
  subStages?: PipelineStage[];
}

// Pipeline stage configuration for job creation
export interface PipelineStageConfig {
  id?: string;
  name: string;
  position: number;
  isMandatory: boolean;
  subStages?: SubStageConfig[];
  type?: 'shortlisting' | 'screening' | 'interview' | 'selected' | 'offer' | 'hired';
  isCustom?: boolean;
  parentStageId?: string;
  requirements?: string[];
  estimatedDuration?: number;
}

export interface SubStageConfig {
  id?: string;
  name: string;
  position: number;
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
  // Score breakdown fields (Requirements 8.1, 8.2)
  domainScore?: number;
  industryScore?: number;
  keyResponsibilitiesScore?: number;
  createdAt: Date;
  updatedAt: Date;
  // Enhanced fields
  age?: number;
  industry?: string;
  jobDomain?: string;
  candidateSummary?: string;
  tags?: string[];
  title?: string;
  department?: string;
  internalMobility?: boolean;
}

export interface JobCandidate {
  id: string;
  jobId: string;
  candidateId: string;
  currentStageId: string;
  appliedAt: Date;
  updatedAt: Date;
}

// Activity types
export type ActivityType =
  | 'stage_change'
  | 'note_added'
  | 'resume_uploaded'
  | 'interview_scheduled'
  | 'interview_rescheduled'
  | 'interview_cancelled'
  | 'interview_feedback'
  | 'score_updated';

export interface CandidateActivity {
  id: string;
  candidateId: string;
  jobCandidateId?: string;
  activityType: ActivityType;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// Auth types
export interface JWTPayload {
  userId: string;
  companyId: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'passwordHash'>;
}

// Phase 3: Interview Management Types

// Interview mode enum (Requirements 2.1)
export type InterviewMode = 'google_meet' | 'microsoft_teams' | 'in_person' | 'custom_url';

// Interview status enum (Requirements 1.3, 8.5)
export type InterviewStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

// Interview recommendation enum (Requirements 9.4)
export type InterviewRecommendation = 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire';

// Interview panel member
export interface InterviewPanelMember {
  id: string;
  interviewId: string;
  userId: string;
  user?: User;
  createdAt: Date;
}

// Interview feedback rating
export interface FeedbackRating {
  criterion: string;
  score: number; // 1-5
  comments?: string;
}

// Interview feedback (Requirements 9.1, 9.5)
export interface InterviewFeedback {
  id: string;
  interviewId: string;
  panelMemberId: string;
  ratings: FeedbackRating[];
  overallComments: string;
  recommendation: InterviewRecommendation;
  submittedAt: Date;
  panelMember?: User;
}

// Main Interview type (Requirements 1.3, 1.4, 17.1)
export interface Interview {
  id: string;
  jobCandidateId: string;
  scheduledAt: Date;
  duration: number; // minutes
  timezone: string;
  mode: InterviewMode;
  meetingLink?: string;
  location?: string;
  status: InterviewStatus;
  notes?: string;
  cancelReason?: string;
  scheduledBy: string;
  roundType?: string; // Interview round type (Requirements 6.5, 6.6)
  createdAt: Date;
  updatedAt: Date;
  // Relations
  jobCandidate?: JobCandidate & {
    candidate?: Candidate;
    job?: Job;
  };
  scheduler?: User;
  panelMembers?: InterviewPanelMember[];
  feedback?: InterviewFeedback[];
}

// Create interview input (Requirements 1.3, 1.4)
export interface CreateInterviewInput {
  jobCandidateId: string;
  scheduledAt: Date;
  duration: number; // minutes
  timezone: string; // IANA timezone (e.g., 'Asia/Kolkata')
  mode: InterviewMode;
  location?: string; // Required for in_person
  panelMemberIds: string[]; // User IDs of interviewers
  notes?: string;
  scheduledBy: string; // User ID
  roundType?: string; // Interview round type (Requirements 6.5)
}

// Update interview input (Requirements 8.2, 8.3)
export interface UpdateInterviewInput {
  scheduledAt?: Date;
  duration?: number;
  timezone?: string;
  mode?: InterviewMode;
  location?: string;
  panelMemberIds?: string[];
  notes?: string;
  roundType?: string; // Interview round type (Requirements 6.5)
}

// Interview filters for querying (Requirements 17.2)
export interface InterviewFilters {
  companyId?: string;
  jobId?: string;
  candidateId?: string;
  panelMemberId?: string;
  status?: InterviewStatus;
  dateFrom?: Date;
  dateTo?: Date;
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


// Phase 3: Calendar Integration Types

// OAuth provider type
export type OAuthProvider = 'google' | 'microsoft';

// OAuth token data for storage
export interface OAuthTokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  scope?: string;
}

// Stored OAuth token
export interface StoredOAuthToken {
  id: string;
  userId: string;
  provider: OAuthProvider;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  scope?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Calendar event result
export interface CalendarEventResult {
  provider: OAuthProvider;
  eventId: string;
  meetingLink?: string;
}

// Calendar event input for creation
export interface CalendarEventInput {
  interviewId: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  attendees: Array<{ email: string; name?: string }>;
  createMeetingLink: boolean;
}

// Calendar event update input
export interface CalendarEventUpdateInput {
  title?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  timezone?: string;
  attendees?: Array<{ email: string; name?: string }>;
}

// Calendar connection status
export interface CalendarConnectionStatus {
  google: boolean;
  microsoft: boolean;
}


// Phase 3: Timezone Types

/**
 * Timezone option for selection lists
 * Requirements: 3.1 - Allow selection of timezone from standard timezone list (IANA format)
 */
export interface TimezoneOption {
  value: string;      // IANA timezone identifier
  label: string;      // Human-readable label
  offset: string;     // UTC offset string (e.g., "+05:30")
  region: string;     // Geographic region
}

/**
 * Formatted time display for different contexts
 */
export interface FormattedDateTime {
  date: string;       // Formatted date string
  time: string;       // Formatted time string
  full: string;       // Full date and time string
  timezone: string;   // Timezone abbreviation
}


// Vendor Management Types (Requirements 7.1, 7.2, 10.1)

/**
 * Vendor job assignment
 */
export interface VendorJobAssignment {
  id: string;
  vendorId: string;
  jobId: string;
  createdAt: Date;
  job?: Job;
}

/**
 * Vendor user with job assignments
 */
export interface Vendor extends User {
  vendorJobAssignments?: VendorJobAssignment[];
  assignedJobs?: Array<{ id: string; title: string }>;
}

/**
 * Create vendor input (Requirements 7.3, 10.1)
 */
export interface CreateVendorInput {
  companyId: string;
  name: string;
  email: string;
  password: string;
  assignedJobIds?: string[];
}

/**
 * Update vendor input (Requirements 7.7)
 */
export interface UpdateVendorInput {
  name?: string;
  email?: string;
  isActive?: boolean;
  assignedJobIds?: string[];
}
