import type { Job, PipelineStage } from '../types/index.js';
export interface CreateJobData {
    companyId: string;
    title: string;
    department: string;
    location: string;
    employmentType?: string;
    salaryRange?: string;
    description?: string;
    openings?: number;
}
export interface UpdateJobData {
    title?: string;
    department?: string;
    location?: string;
    employmentType?: string | null;
    salaryRange?: string | null;
    description?: string | null;
    status?: 'active' | 'paused' | 'closed';
    openings?: number;
}
export interface JobWithStages extends Job {
    stages?: PipelineStage[];
}
export declare const jobService: {
    /**
     * Create a new job with default pipeline stages
     * Requirements: 5.1, 5.2, 6.1
     */
    create(data: CreateJobData): Promise<JobWithStages>;
    /**
     * Get a job by ID
     */
    getById(id: string): Promise<JobWithStages>;
    /**
     * Get all jobs for a company
     */
    getByCompanyId(companyId: string): Promise<Job[]>;
    /**
     * Get all jobs (with optional filters)
     */
    getAll(filters?: {
        companyId?: string;
        status?: string;
    }): Promise<Job[]>;
    /**
     * Update a job
     */
    update(id: string, data: UpdateJobData): Promise<Job>;
    /**
     * Delete a job
     */
    delete(id: string): Promise<void>;
    /**
     * Map Prisma job to Job type
     */
    mapToJob(job: {
        id: string;
        companyId: string;
        title: string;
        department: string;
        location: string;
        employmentType: string | null;
        salaryRange: string | null;
        description: string | null;
        status: string;
        openings: number;
        createdAt: Date;
        updatedAt: Date;
    }, stages?: Array<{
        id: string;
        jobId: string;
        name: string;
        position: number;
        isDefault: boolean;
    }>): JobWithStages;
};
export default jobService;
//# sourceMappingURL=job.service.d.ts.map