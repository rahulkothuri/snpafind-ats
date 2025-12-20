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
export interface Company {
    id: string;
    name: string;
    logoUrl?: string;
    contactEmail: string;
    address?: string;
    createdAt: Date;
    updatedAt: Date;
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
export type JobStatus = 'active' | 'paused' | 'closed';
export type WorkMode = 'Onsite' | 'WFH' | 'Hybrid' | 'C2C' | 'C2H';
export type JobPriority = 'Low' | 'Medium' | 'High';
export interface Job {
    id: string;
    companyId: string;
    title: string;
    department: string;
    experienceMin?: number;
    experienceMax?: number;
    salaryMin?: number;
    salaryMax?: number;
    variables?: string;
    educationQualification?: string;
    ageUpTo?: number;
    skills: string[];
    preferredIndustry?: string;
    workMode?: WorkMode;
    locations: string[];
    priority?: JobPriority;
    jobDomain?: string;
    assignedRecruiterId?: string;
    description: string;
    status: JobStatus;
    openings: number;
    createdAt: Date;
    updatedAt: Date;
    location?: string;
    employmentType?: string;
    salaryRange?: string;
}
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
export interface PipelineStageConfig {
    id?: string;
    name: string;
    position: number;
    isMandatory: boolean;
    subStages?: SubStageConfig[];
}
export interface SubStageConfig {
    id?: string;
    name: string;
    position: number;
}
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
}
export interface JobCandidate {
    id: string;
    jobId: string;
    candidateId: string;
    currentStageId: string;
    appliedAt: Date;
    updatedAt: Date;
}
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
export interface JWTPayload {
    userId: string;
    companyId: string;
    role: UserRole;
}
export interface AuthResponse {
    token: string;
    user: Omit<User, 'passwordHash'>;
}
//# sourceMappingURL=index.d.ts.map