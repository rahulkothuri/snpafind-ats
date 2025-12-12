import prisma from '../lib/prisma.js';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';
import type { Job, PipelineStage } from '../types/index.js';

// Type for Prisma job result
interface PrismaJobResult {
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
}



// Default pipeline stages as per Requirements 6.1
const DEFAULT_STAGES = [
  'Queue',
  'Applied',
  'Screening',
  'Shortlisted',
  'Interview',
  'Selected',
  'Offer',
  'Hired',
];

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

export const jobService = {
  /**
   * Create a new job with default pipeline stages
   * Requirements: 5.1, 5.2, 6.1
   */
  async create(data: CreateJobData): Promise<JobWithStages> {
    // Validate required fields (Requirements 5.3, 5.4)
    const errors: Record<string, string[]> = {};
    if (!data.title || data.title.trim() === '') {
      errors.title = ['Title is required'];
    }
    if (!data.department || data.department.trim() === '') {
      errors.department = ['Department is required'];
    }
    if (!data.location || data.location.trim() === '') {
      errors.location = ['Location is required'];
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError(errors);
    }

    // Create job with default pipeline stages in a transaction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await prisma.$transaction(async (tx: any) => {
      // Create the job (Requirements 5.1, 5.2 - unique ID and active status)
      const newJob = await tx.job.create({
        data: {
          companyId: data.companyId,
          title: data.title.trim(),
          department: data.department.trim(),
          location: data.location.trim(),
          employmentType: data.employmentType,
          salaryRange: data.salaryRange,
          description: data.description,
          openings: data.openings ?? 1,
          status: 'active', // Requirements 5.2 - initial status is active
        },
      });

      // Create default pipeline stages (Requirements 6.1)
      await tx.pipelineStage.createMany({
        data: DEFAULT_STAGES.map((name, index) => ({
          jobId: newJob.id,
          name,
          position: index,
          isDefault: true,
        })),
      });

      // Fetch the created stages
      const stages = await tx.pipelineStage.findMany({
        where: { jobId: newJob.id },
        orderBy: { position: 'asc' },
      });

      return { job: newJob, stages };
    });

    return this.mapToJob(result.job, result.stages);
  },

  /**
   * Get a job by ID
   */
  async getById(id: string): Promise<JobWithStages> {
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        pipelineStages: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!job) {
      throw new NotFoundError('Job');
    }

    return this.mapToJob(job, job.pipelineStages);
  },

  /**
   * Get all jobs for a company
   */
  async getByCompanyId(companyId: string): Promise<Job[]> {
    const jobs = await prisma.job.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    return jobs.map((j: PrismaJobResult) => this.mapToJob(j));
  },

  /**
   * Get all jobs (with optional filters)
   */
  async getAll(filters?: { companyId?: string; status?: string }): Promise<Job[]> {
    const where: Record<string, unknown> = {};
    if (filters?.companyId) {
      where.companyId = filters.companyId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return jobs.map((j: PrismaJobResult) => this.mapToJob(j));
  },

  /**
   * Update a job
   */
  async update(id: string, data: UpdateJobData): Promise<Job> {
    const existing = await prisma.job.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Job');
    }

    const job = await prisma.job.update({
      where: { id },
      data: {
        title: data.title?.trim(),
        department: data.department?.trim(),
        location: data.location?.trim(),
        employmentType: data.employmentType,
        salaryRange: data.salaryRange,
        description: data.description,
        status: data.status,
        openings: data.openings,
      },
    });

    return this.mapToJob(job);
  },

  /**
   * Delete a job
   */
  async delete(id: string): Promise<void> {
    const existing = await prisma.job.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Job');
    }

    await prisma.job.delete({
      where: { id },
    });
  },

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
  }>): JobWithStages {
    const result: JobWithStages = {
      id: job.id,
      companyId: job.companyId,
      title: job.title,
      department: job.department,
      location: job.location,
      employmentType: job.employmentType ?? '',
      salaryRange: job.salaryRange ?? undefined,
      description: job.description ?? '',
      status: job.status as 'active' | 'paused' | 'closed',
      openings: job.openings,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };

    if (stages) {
      result.stages = stages.map((s) => ({
        id: s.id,
        jobId: s.jobId,
        name: s.name,
        position: s.position,
        isDefault: s.isDefault,
      }));
    }

    return result;
  },
};

export default jobService;
