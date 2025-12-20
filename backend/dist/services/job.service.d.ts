import type { Job, PipelineStage, PipelineStageConfig, WorkMode, JobPriority } from '../types/index.js';
export interface CreateJobData {
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
    skills?: string[];
    preferredIndustry?: string;
    workMode?: WorkMode;
    locations?: string[];
    priority?: JobPriority;
    jobDomain?: string;
    assignedRecruiterId?: string;
    description?: string;
    openings?: number;
    pipelineStages?: PipelineStageConfig[];
    location?: string;
    employmentType?: string;
    salaryRange?: string;
}
export interface UpdateJobData {
    title?: string;
    department?: string;
    experienceMin?: number | null;
    experienceMax?: number | null;
    salaryMin?: number | null;
    salaryMax?: number | null;
    variables?: string | null;
    educationQualification?: string | null;
    ageUpTo?: number | null;
    skills?: string[];
    preferredIndustry?: string | null;
    workMode?: WorkMode | null;
    locations?: string[];
    priority?: JobPriority | null;
    jobDomain?: string | null;
    assignedRecruiterId?: string | null;
    description?: string | null;
    status?: 'active' | 'paused' | 'closed';
    openings?: number;
    pipelineStages?: PipelineStageConfig[];
    location?: string | null;
    employmentType?: string | null;
    salaryRange?: string | null;
}
export interface JobWithStages extends Job {
    stages?: PipelineStage[];
    companyName?: string;
    companyLogo?: string;
}
export declare const jobService: {
    /**
     * Create a new job with pipeline stages
     * Requirements: 1.1, 4.1, 4.2, 4.5, 5.1, 5.2, 6.1
     */
    create(data: CreateJobData): Promise<JobWithStages>;
    /**
     * Validate and normalize pipeline stages configuration
     * Ensures mandatory stages are present (Requirements 4.2)
     */
    validateAndNormalizePipelineStages(stages: PipelineStageConfig[]): PipelineStageConfig[];
    /**
     * Get a job by ID with all fields and pipeline stages
     * Requirements: 7.3, 8.3
     */
    getById(id: string): Promise<JobWithStages>;
    /**
     * Get all jobs for a company with candidate counts
     */
    getByCompanyId(companyId: string): Promise<Job[]>;
    /**
     * Get all jobs (with optional filters) with candidate counts
     */
    getAll(filters?: {
        companyId?: string;
        status?: string;
    }): Promise<Job[]>;
    /**
     * Update a job with all fields
     * Requirements: 8.3
     */
    update(id: string, data: UpdateJobData): Promise<JobWithStages>;
    /**
     * Delete a job
     */
    delete(id: string): Promise<void>;
    /**
     * Map Prisma job to Job type with all new fields
     */
    mapToJob(job: {
        id: string;
        companyId: string;
        title: string;
        department: string;
        experienceMin: number | null;
        experienceMax: number | null;
        salaryMin: number | null;
        salaryMax: number | null;
        variables: string | null;
        educationQualification: string | null;
        ageUpTo: number | null;
        skills: unknown;
        preferredIndustry: string | null;
        workMode: string | null;
        locations: unknown;
        priority: string | null;
        jobDomain: string | null;
        assignedRecruiterId: string | null;
        description: string | null;
        status: string;
        openings: number;
        createdAt: Date;
        updatedAt: Date;
        location: string | null;
        employmentType: string | null;
        salaryRange: string | null;
    }, stages?: Array<{
        id: string;
        jobId: string;
        name: string;
        position: number;
        isDefault: boolean;
        isMandatory: boolean;
        parentId: string | null;
        subStages?: Array<{
            id: string;
            jobId: string;
            name: string;
            position: number;
            isDefault: boolean;
            isMandatory: boolean;
            parentId: string | null;
        }>;
    }>, company?: {
        name: string;
        logoUrl: string | null;
    } | null): JobWithStages;
    /**
     * Map Prisma job with counts to Job type with candidateCount and interviewCount
     */
    mapToJobWithCounts(job: {
        id: string;
        companyId: string;
        title: string;
        department: string;
        experienceMin: number | null;
        experienceMax: number | null;
        salaryMin: number | null;
        salaryMax: number | null;
        variables: string | null;
        educationQualification: string | null;
        ageUpTo: number | null;
        skills: unknown;
        preferredIndustry: string | null;
        workMode: string | null;
        locations: unknown;
        priority: string | null;
        jobDomain: string | null;
        assignedRecruiterId: string | null;
        description: string | null;
        status: string;
        openings: number;
        createdAt: Date;
        updatedAt: Date;
        location: string | null;
        employmentType: string | null;
        salaryRange: string | null;
        _count?: {
            jobCandidates: number;
        };
        jobCandidates?: Array<{
            currentStage?: {
                name: string;
            } | null;
        }>;
    }): Job & {
        candidateCount: number;
        interviewCount: number;
        offerCount: number;
    };
};
export default jobService;
//# sourceMappingURL=job.service.d.ts.map