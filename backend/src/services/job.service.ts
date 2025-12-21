import prisma from '../lib/prisma.js';
import { NotFoundError, ValidationError, AuthorizationError } from '../middleware/errorHandler.js';
import type { Job, PipelineStage, PipelineStageConfig, SubStageConfig, WorkMode, JobPriority, UserRole } from '../types/index.js';
import { jobAccessControlService } from './jobAccessControl.service.js';

// Mandatory stages that cannot be removed (Requirements 4.2)
const MANDATORY_STAGES = ['Screening', 'Shortlisted', 'Offer'];

// Default pipeline stages as per Requirements 6.1
const DEFAULT_STAGES: PipelineStageConfig[] = [
  { name: 'Queue', position: 0, isMandatory: false },
  { name: 'Applied', position: 1, isMandatory: false },
  { name: 'Screening', position: 2, isMandatory: true },
  { name: 'Shortlisted', position: 3, isMandatory: true },
  { name: 'Interview', position: 4, isMandatory: false },
  { name: 'Selected', position: 5, isMandatory: false },
  { name: 'Offer', position: 6, isMandatory: true },
  { name: 'Hired', position: 7, isMandatory: false },
];

export interface CreateJobData {
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
  skills?: string[];
  preferredIndustry?: string;
  
  // Work details (Requirements 1.1, 1.4, 1.5, 1.6)
  workMode?: WorkMode;
  locations?: string[];
  priority?: JobPriority;
  jobDomain?: string;
  
  // Assignment (Requirements 1.1)
  assignedRecruiterId?: string;
  
  // Content
  description?: string;
  openings?: number;
  
  // Pipeline stages configuration (Requirements 4.1)
  pipelineStages?: PipelineStageConfig[];
  
  // Legacy fields (kept for compatibility)
  location?: string;
  employmentType?: string;
  salaryRange?: string;
}

export interface UpdateJobData {
  title?: string;
  department?: string;
  
  // Experience range
  experienceMin?: number | null;
  experienceMax?: number | null;
  
  // Salary range
  salaryMin?: number | null;
  salaryMax?: number | null;
  variables?: string | null;
  
  // Requirements
  educationQualification?: string | null;
  ageUpTo?: number | null;
  skills?: string[];
  preferredIndustry?: string | null;
  
  // Work details
  workMode?: WorkMode | null;
  locations?: string[];
  priority?: JobPriority | null;
  jobDomain?: string | null;
  
  // Assignment
  assignedRecruiterId?: string | null;
  
  // Content
  description?: string | null;
  status?: 'active' | 'paused' | 'closed';
  openings?: number;
  
  // Pipeline stages configuration
  pipelineStages?: PipelineStageConfig[];
  
  // Legacy fields
  location?: string | null;
  employmentType?: string | null;
  salaryRange?: string | null;
}

export interface JobWithStages extends Job {
  stages?: PipelineStage[];
  companyName?: string;
  companyLogo?: string;
}

export const jobService = {
  /**
   * Create a new job with pipeline stages
   * Requirements: 1.1, 4.1, 4.2, 4.5, 5.1, 5.2, 6.1
   */
  async create(data: CreateJobData): Promise<JobWithStages> {
    // Validate required fields (Requirements 1.7)
    const errors: Record<string, string[]> = {};
    if (!data.title || data.title.trim() === '') {
      errors.title = ['Title is required'];
    }
    if (!data.department || data.department.trim() === '') {
      errors.department = ['Department is required'];
    }
    
    // Validate experience range (Requirements 1.2)
    if (data.experienceMin !== undefined && data.experienceMax !== undefined) {
      if (data.experienceMin > data.experienceMax) {
        errors.experienceMin = ['Minimum experience cannot be greater than maximum'];
      }
    }
    
    // Validate salary range (Requirements 1.3)
    if (data.salaryMin !== undefined && data.salaryMax !== undefined) {
      if (data.salaryMin > data.salaryMax) {
        errors.salaryMin = ['Minimum salary cannot be greater than maximum'];
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError(errors);
    }

    // Determine pipeline stages to use
    const stagesToCreate = data.pipelineStages && data.pipelineStages.length > 0
      ? this.validateAndNormalizePipelineStages(data.pipelineStages)
      : DEFAULT_STAGES;

    // Create job with pipeline stages in a transaction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await prisma.$transaction(async (tx: any) => {
      // Create the job (Requirements 5.1, 5.2 - unique ID and active status)
      const newJob = await tx.job.create({
        data: {
          companyId: data.companyId,
          title: data.title.trim(),
          department: data.department.trim(),
          
          // Experience range
          experienceMin: data.experienceMin,
          experienceMax: data.experienceMax,
          
          // Salary range
          salaryMin: data.salaryMin,
          salaryMax: data.salaryMax,
          variables: data.variables,
          
          // Requirements
          educationQualification: data.educationQualification,
          ageUpTo: data.ageUpTo,
          skills: data.skills || [],
          preferredIndustry: data.preferredIndustry,
          
          // Work details
          workMode: data.workMode,
          locations: data.locations || [],
          priority: data.priority || 'Medium',
          jobDomain: data.jobDomain,
          
          // Assignment
          assignedRecruiterId: data.assignedRecruiterId,
          
          // Content
          description: data.description,
          openings: data.openings ?? 1,
          status: 'active',
          
          // Legacy fields
          location: data.location || (data.locations && data.locations.length > 0 ? data.locations[0] : ''),
          employmentType: data.employmentType,
          salaryRange: data.salaryRange,
        },
      });

      // Create pipeline stages (Requirements 4.1, 4.5)
      for (const stage of stagesToCreate) {
        const createdStage = await tx.pipelineStage.create({
          data: {
            jobId: newJob.id,
            name: stage.name,
            position: stage.position,
            isDefault: true,
            isMandatory: stage.isMandatory,
          },
        });

        // Create sub-stages if any (Requirements 4.3)
        if (stage.subStages && stage.subStages.length > 0) {
          for (const subStage of stage.subStages) {
            await tx.pipelineStage.create({
              data: {
                jobId: newJob.id,
                name: subStage.name,
                position: subStage.position,
                isDefault: false,
                isMandatory: false,
                parentId: createdStage.id,
              },
            });
          }
        }
      }

      // Fetch the created stages with sub-stages
      const stages = await tx.pipelineStage.findMany({
        where: { jobId: newJob.id, parentId: null },
        orderBy: { position: 'asc' },
        include: {
          subStages: {
            orderBy: { position: 'asc' },
          },
        },
      });

      return { job: newJob, stages };
    });

    return this.mapToJob(result.job, result.stages);
  },

  /**
   * Validate and normalize pipeline stages configuration
   * Ensures mandatory stages are present (Requirements 4.2)
   */
  validateAndNormalizePipelineStages(stages: PipelineStageConfig[]): PipelineStageConfig[] {
    // Check that all mandatory stages are present
    const stageNames = stages.map(s => s.name);
    for (const mandatoryStage of MANDATORY_STAGES) {
      if (!stageNames.includes(mandatoryStage)) {
        // Add missing mandatory stage
        const existingMandatory = DEFAULT_STAGES.find(s => s.name === mandatoryStage);
        if (existingMandatory) {
          stages.push({ ...existingMandatory });
        }
      }
    }

    // Mark mandatory stages
    return stages.map(stage => ({
      ...stage,
      isMandatory: MANDATORY_STAGES.includes(stage.name),
    }));
  },

  /**
   * Validate job access for a user
   * Requirements: 4.2, 4.3, 4.4
   */
  async validateJobAccess(jobId: string, userId: string, userRole: UserRole): Promise<boolean> {
    return jobAccessControlService.validateJobAccess(jobId, userId, userRole);
  },

  /**
   * Get a job by ID with access control validation
   * Requirements: 7.3, 8.3, 4.2
   */
  async getById(id: string, userId?: string, userRole?: UserRole): Promise<JobWithStages> {
    // Validate access if user info is provided
    if (userId && userRole) {
      const hasAccess = await this.validateJobAccess(id, userId, userRole);
      if (!hasAccess) {
        throw new AuthorizationError();
      }
    }

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        pipelineStages: {
          where: { parentId: null },
          orderBy: { position: 'asc' },
          include: {
            subStages: {
              orderBy: { position: 'asc' },
            },
          },
        },
        company: {
          select: {
            name: true,
            logoUrl: true,
          },
        },
        assignedRecruiter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundError('Job');
    }

    return this.mapToJob(job, job.pipelineStages, job.company);
  },

  /**
   * Get all jobs for a company with role-based filtering
   * Requirements: 1.1, 1.2, 1.3, 4.1
   */
  async getByCompanyId(companyId: string, userId?: string, userRole?: UserRole): Promise<Job[]> {
    if (userId && userRole) {
      // Use access control service for role-based filtering
      return jobAccessControlService.getAccessibleJobs(userId, userRole, companyId);
    }

    // Fallback to all jobs if no user context (for backward compatibility)
    const jobs = await prisma.job.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { jobCandidates: true }
        },
        jobCandidates: {
          include: {
            currentStage: true
          }
        }
      }
    });

    return jobs.map((j) => this.mapToJobWithCounts(j));
  },

  /**
   * Get all jobs with role-based filtering
   * Requirements: 4.1, 4.5
   */
  async getAll(filters?: { companyId?: string; status?: string }, userId?: string, userRole?: UserRole): Promise<Job[]> {
    if (userId && userRole && filters?.companyId) {
      // Use access control service for role-based filtering
      const accessibleJobs = await jobAccessControlService.getAccessibleJobs(userId, userRole, filters.companyId);
      
      // Apply status filter if provided
      if (filters.status) {
        return accessibleJobs.filter(job => job.status === filters.status);
      }
      
      return accessibleJobs;
    }

    // Fallback to original implementation for backward compatibility
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
      include: {
        _count: {
          select: { jobCandidates: true }
        },
        jobCandidates: {
          include: {
            currentStage: true
          }
        }
      }
    });

    return jobs.map((j) => this.mapToJobWithCounts(j));
  },

  /**
   * Update a job with access control validation
   * Requirements: 8.3, 4.3
   */
  async update(id: string, data: UpdateJobData, userId?: string, userRole?: UserRole): Promise<JobWithStages> {
    // Validate access if user info is provided
    if (userId && userRole) {
      const hasAccess = await this.validateJobAccess(id, userId, userRole);
      if (!hasAccess) {
        throw new AuthorizationError();
      }
    }

    const existing = await prisma.job.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Job');
    }

    // Validate experience range if both provided
    if (data.experienceMin !== undefined && data.experienceMax !== undefined) {
      if (data.experienceMin !== null && data.experienceMax !== null && 
          data.experienceMin > data.experienceMax) {
        throw new ValidationError({ 
          experienceMin: ['Minimum experience cannot be greater than maximum'] 
        });
      }
    }

    // Validate salary range if both provided
    if (data.salaryMin !== undefined && data.salaryMax !== undefined) {
      if (data.salaryMin !== null && data.salaryMax !== null && 
          data.salaryMin > data.salaryMax) {
        throw new ValidationError({ 
          salaryMin: ['Minimum salary cannot be greater than maximum'] 
        });
      }
    }

    // Handle immediate permission updates when assignedRecruiterId changes (Requirements 4.5)
    if (data.assignedRecruiterId !== undefined && data.assignedRecruiterId !== existing.assignedRecruiterId) {
      // Permission updates are handled automatically by the database update
      // The new assignment will be immediately effective for subsequent requests
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await prisma.$transaction(async (tx: any) => {
      // Update the job
      const job = await tx.job.update({
        where: { id },
        data: {
          title: data.title?.trim(),
          department: data.department?.trim(),
          
          // Experience range
          experienceMin: data.experienceMin,
          experienceMax: data.experienceMax,
          
          // Salary range
          salaryMin: data.salaryMin,
          salaryMax: data.salaryMax,
          variables: data.variables,
          
          // Requirements
          educationQualification: data.educationQualification,
          ageUpTo: data.ageUpTo,
          skills: data.skills,
          preferredIndustry: data.preferredIndustry,
          
          // Work details
          workMode: data.workMode,
          locations: data.locations,
          priority: data.priority,
          jobDomain: data.jobDomain,
          
          // Assignment (Requirements 4.5 - immediate permission updates)
          assignedRecruiterId: data.assignedRecruiterId,
          
          // Content
          description: data.description,
          status: data.status,
          openings: data.openings,
          
          // Legacy fields
          location: data.location,
          employmentType: data.employmentType,
          salaryRange: data.salaryRange,
        },
      });

      // Update pipeline stages if provided (Requirements 8.3)
      if (data.pipelineStages && data.pipelineStages.length > 0) {
        // Delete existing stages
        await tx.pipelineStage.deleteMany({
          where: { jobId: id },
        });

        // Create new stages
        const stagesToCreate = this.validateAndNormalizePipelineStages(data.pipelineStages);
        for (const stage of stagesToCreate) {
          const createdStage = await tx.pipelineStage.create({
            data: {
              jobId: id,
              name: stage.name,
              position: stage.position,
              isDefault: true,
              isMandatory: stage.isMandatory,
            },
          });

          // Create sub-stages if any
          if (stage.subStages && stage.subStages.length > 0) {
            for (const subStage of stage.subStages) {
              await tx.pipelineStage.create({
                data: {
                  jobId: id,
                  name: subStage.name,
                  position: subStage.position,
                  isDefault: false,
                  isMandatory: false,
                  parentId: createdStage.id,
                },
              });
            }
          }
        }
      }

      // Fetch updated stages
      const stages = await tx.pipelineStage.findMany({
        where: { jobId: id, parentId: null },
        orderBy: { position: 'asc' },
        include: {
          subStages: {
            orderBy: { position: 'asc' },
          },
        },
      });

      return { job, stages };
    });

    return this.mapToJob(result.job, result.stages);
  },

  /**
   * Delete a job with access control validation
   * Requirements: 4.4
   */
  async delete(id: string, userId?: string, userRole?: UserRole): Promise<void> {
    // Validate access if user info is provided
    if (userId && userRole) {
      const hasAccess = await this.validateJobAccess(id, userId, userRole);
      if (!hasAccess) {
        throw new AuthorizationError();
      }
    }

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
   * Map Prisma job to Job type with all new fields
   */
  mapToJob(
    job: {
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
    },
    stages?: Array<{
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
    }>,
    company?: { name: string; logoUrl: string | null } | null
  ): JobWithStages {
    const result: JobWithStages = {
      id: job.id,
      companyId: job.companyId,
      title: job.title,
      department: job.department,
      
      // Experience range
      experienceMin: job.experienceMin ?? undefined,
      experienceMax: job.experienceMax ?? undefined,
      
      // Salary range
      salaryMin: job.salaryMin ?? undefined,
      salaryMax: job.salaryMax ?? undefined,
      variables: job.variables ?? undefined,
      
      // Requirements
      educationQualification: job.educationQualification ?? undefined,
      ageUpTo: job.ageUpTo ?? undefined,
      skills: Array.isArray(job.skills) ? job.skills as string[] : [],
      preferredIndustry: job.preferredIndustry ?? undefined,
      
      // Work details
      workMode: (job.workMode as WorkMode) ?? undefined,
      locations: Array.isArray(job.locations) ? job.locations as string[] : [],
      priority: (job.priority as JobPriority) ?? undefined,
      jobDomain: job.jobDomain ?? undefined,
      
      // Assignment
      assignedRecruiterId: job.assignedRecruiterId ?? undefined,
      
      // Content
      description: job.description ?? '',
      status: job.status as 'active' | 'paused' | 'closed',
      openings: job.openings,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      
      // Legacy fields
      location: job.location ?? undefined,
      employmentType: job.employmentType ?? undefined,
      salaryRange: job.salaryRange ?? undefined,
    };

    // Add company info if available
    if (company) {
      result.companyName = company.name;
      result.companyLogo = company.logoUrl ?? undefined;
    }

    // Add stages if available
    if (stages) {
      result.stages = stages.map((s) => ({
        id: s.id,
        jobId: s.jobId,
        name: s.name,
        position: s.position,
        isDefault: s.isDefault,
        isMandatory: s.isMandatory,
        parentId: s.parentId ?? undefined,
        subStages: s.subStages?.map((sub) => ({
          id: sub.id,
          jobId: sub.jobId,
          name: sub.name,
          position: sub.position,
          isDefault: sub.isDefault,
          isMandatory: sub.isMandatory,
          parentId: sub.parentId ?? undefined,
        })),
      }));
    }

    return result;
  },

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
    _count?: { jobCandidates: number };
    jobCandidates?: Array<{
      currentStage?: { name: string } | null;
    }>;
  }): Job & { candidateCount: number; interviewCount: number; offerCount: number } {
    const candidateCount = job._count?.jobCandidates ?? 0;
    
    // Count candidates in interview stages
    const interviewStages = ['Interview', 'Selected'];
    const interviewCount = job.jobCandidates?.filter(
      jc => jc.currentStage && interviewStages.includes(jc.currentStage.name)
    ).length ?? 0;
    
    // Count candidates in offer stage
    const offerCount = job.jobCandidates?.filter(
      jc => jc.currentStage && jc.currentStage.name === 'Offer'
    ).length ?? 0;

    return {
      id: job.id,
      companyId: job.companyId,
      title: job.title,
      department: job.department,
      
      // Experience range
      experienceMin: job.experienceMin ?? undefined,
      experienceMax: job.experienceMax ?? undefined,
      
      // Salary range
      salaryMin: job.salaryMin ?? undefined,
      salaryMax: job.salaryMax ?? undefined,
      variables: job.variables ?? undefined,
      
      // Requirements
      educationQualification: job.educationQualification ?? undefined,
      ageUpTo: job.ageUpTo ?? undefined,
      skills: Array.isArray(job.skills) ? job.skills as string[] : [],
      preferredIndustry: job.preferredIndustry ?? undefined,
      
      // Work details
      workMode: (job.workMode as WorkMode) ?? undefined,
      locations: Array.isArray(job.locations) ? job.locations as string[] : [],
      priority: (job.priority as JobPriority) ?? undefined,
      jobDomain: job.jobDomain ?? undefined,
      
      // Assignment
      assignedRecruiterId: job.assignedRecruiterId ?? undefined,
      
      // Content
      description: job.description ?? '',
      status: job.status as 'active' | 'paused' | 'closed',
      openings: job.openings,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      
      // Legacy fields
      location: job.location ?? undefined,
      employmentType: job.employmentType ?? undefined,
      salaryRange: job.salaryRange ?? undefined,
      
      // Counts
      candidateCount,
      interviewCount,
      offerCount,
    };
  },
};

export default jobService;
