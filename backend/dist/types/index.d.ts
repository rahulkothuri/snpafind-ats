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
export interface MandatoryCriteria {
    title: string;
    intro: string;
    criteria: string[];
    note: string;
}
export type ScreeningQuestionType = 'text' | 'textarea' | 'single_choice' | 'multiple_choice' | 'yes_no' | 'number';
export interface ScreeningQuestion {
    id: string;
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
    mandatoryCriteria?: MandatoryCriteria;
    screeningQuestions?: ScreeningQuestion[];
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
export type ActivityType = 'stage_change' | 'note_added' | 'resume_uploaded' | 'interview_scheduled' | 'interview_rescheduled' | 'interview_cancelled' | 'interview_feedback' | 'score_updated';
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
export type InterviewMode = 'google_meet' | 'microsoft_teams' | 'in_person' | 'custom_url';
export type InterviewStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type InterviewRecommendation = 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire';
export interface InterviewPanelMember {
    id: string;
    interviewId: string;
    userId: string;
    user?: User;
    createdAt: Date;
}
export interface FeedbackRating {
    criterion: string;
    score: number;
    comments?: string;
}
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
export interface Interview {
    id: string;
    jobCandidateId: string;
    scheduledAt: Date;
    duration: number;
    timezone: string;
    mode: InterviewMode;
    meetingLink?: string;
    location?: string;
    status: InterviewStatus;
    notes?: string;
    cancelReason?: string;
    scheduledBy: string;
    createdAt: Date;
    updatedAt: Date;
    jobCandidate?: JobCandidate & {
        candidate?: Candidate;
        job?: Job;
    };
    scheduler?: User;
    panelMembers?: InterviewPanelMember[];
    feedback?: InterviewFeedback[];
}
export interface CreateInterviewInput {
    jobCandidateId: string;
    scheduledAt: Date;
    duration: number;
    timezone: string;
    mode: InterviewMode;
    location?: string;
    panelMemberIds: string[];
    notes?: string;
    scheduledBy: string;
}
export interface UpdateInterviewInput {
    scheduledAt?: Date;
    duration?: number;
    timezone?: string;
    mode?: InterviewMode;
    location?: string;
    panelMemberIds?: string[];
    notes?: string;
}
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
export interface DashboardInterviews {
    today: Interview[];
    tomorrow: Interview[];
    thisWeek: Interview[];
    pendingFeedback: Interview[];
}
export interface PanelLoad {
    userId: string;
    userName: string;
    userEmail: string;
    interviewCount: number;
    averageLoad: number;
}
export type OAuthProvider = 'google' | 'microsoft';
export interface OAuthTokenData {
    accessToken: string;
    refreshToken?: string;
    expiresAt: Date;
    scope?: string;
}
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
export interface CalendarEventResult {
    provider: OAuthProvider;
    eventId: string;
    meetingLink?: string;
}
export interface CalendarEventInput {
    interviewId: string;
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    timezone: string;
    attendees: Array<{
        email: string;
        name?: string;
    }>;
    createMeetingLink: boolean;
}
export interface CalendarEventUpdateInput {
    title?: string;
    description?: string;
    startTime?: Date;
    endTime?: Date;
    timezone?: string;
    attendees?: Array<{
        email: string;
        name?: string;
    }>;
}
export interface CalendarConnectionStatus {
    google: boolean;
    microsoft: boolean;
}
/**
 * Timezone option for selection lists
 * Requirements: 3.1 - Allow selection of timezone from standard timezone list (IANA format)
 */
export interface TimezoneOption {
    value: string;
    label: string;
    offset: string;
    region: string;
}
/**
 * Formatted time display for different contexts
 */
export interface FormattedDateTime {
    date: string;
    time: string;
    full: string;
    timezone: string;
}
//# sourceMappingURL=index.d.ts.map