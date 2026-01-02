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

// Mandatory Criteria structure for job screening
export interface MandatoryCriteria {
  title: string;
  intro: string;
  criteria: string[];
  note: string;
}

// Flexible Auto-rejection rules structure for job postings
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
  value: number | string | string[] | [number, number];
  logicConnector?: LogicConnector;
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

// Screening Question types for job applications
export type ScreeningQuestionType = 'text' | 'textarea' | 'single_choice' | 'multiple_choice' | 'yes_no' | 'number';

export interface ScreeningQuestion {
  id: string;
  question: string;
  type: ScreeningQuestionType;
  required: boolean;
  options?: string[]; // For single_choice and multiple_choice types
  idealAnswer?: string | string[]; // For knockout/scoring purposes
}

export interface ScreeningQuestionAnswer {
  questionId: string;
  answer: string | string[] | number | boolean;
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
  // Enhanced job fields
  experienceMin?: number;
  experienceMax?: number;
  salaryMin?: number;
  salaryMax?: number;
  variables?: string;
  educationQualification?: string;
  ageUpTo?: number;
  skills?: string[];
  preferredIndustry?: string;
  workMode?: WorkMode;
  locations?: string[];
  priority?: JobPriority;
  jobDomain?: string;
  assignedRecruiterId?: string;
  mandatoryCriteria?: MandatoryCriteria;
  screeningQuestions?: ScreeningQuestion[];
  autoRejectionRules?: AutoRejectionRules;
}

// Job form data for creating/editing jobs
export interface JobFormData {
  title: string;
  department: string;
  experienceMin: number;
  experienceMax: number;
  salaryMin: number;
  salaryMax: number;
  variables: string;
  educationQualification: string;
  openings: number;
  ageUpTo: number;
  skills: string[];
  preferredIndustry: string;
  workMode: WorkMode;
  locations: string[];
  priority: JobPriority;
  jobDomain: string;
  assignedRecruiterId: string;
  description: string;
  pipelineStages: PipelineStageConfig[];
}

// Job details with company info for display
export interface JobDetails extends JobFormData {
  id: string;
  companyId: string;
  companyName: string;
  companyLogo?: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
}

// Pipeline stage configuration for job creation
export interface PipelineStageConfig {
  id?: string;
  name: string;
  position: number;
  isMandatory: boolean;
  subStages: SubStageConfig[];
  type?: 'shortlisting' | 'screening' | 'interview' | 'selected' | 'offer' | 'hired';
  isCustom?: boolean;
  parentStageId?: string;
  requirements?: string[];
  estimatedDuration?: number;
}

// Sub-stage configuration for pipeline stages
export interface SubStageConfig {
  id?: string;
  name: string;
  position: number;
}

// Pipeline types
export interface PipelineStage {
  id: string;
  jobId: string;
  name: string;
  position: number;
  isDefault: boolean;
  isMandatory?: boolean;
  parentId?: string;
  subStages?: PipelineStage[];
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
