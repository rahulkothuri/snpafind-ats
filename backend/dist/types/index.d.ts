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
}
export interface PipelineStage {
    id: string;
    jobId: string;
    name: string;
    position: number;
    isDefault: boolean;
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