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
  type?: 'shortlisting' | 'screening' | 'interview' | 'offer' | 'hired';
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
