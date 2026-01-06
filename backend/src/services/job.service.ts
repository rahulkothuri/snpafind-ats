import prisma from '../lib/prisma.js';
import { NotFoundError, ValidationError, AuthorizationError } from '../middleware/errorHandler.js';
import type { Job, PipelineStage, PipelineStageConfig, SubStageConfig, WorkMode, JobPriority, UserRole, MandatoryCriteria, ScreeningQuestion, AutoRejectionRules, AutoRejectionRule, LegacyAutoRejectionRules } from '../types/index.js';
import { jobAccessControlService } from './jobAccessControl.service.js';

// Mandatory stages that cannot be removed (Requirements 4.2)
const MANDATORY_STAGES = ['Screening', 'Shortlisted', 'Offer', 'Rejected'];

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
  { name: 'Rejected', position: 8, isMandatory: true },
];

/**
 * Check if rules are in legacy format
 */
function isLegacyRulesFormat(rules: unknown): rules is LegacyAutoRejectionRules {
  if (!rules || typeof rules !== 'object') return false;
  const r = rules as Record<string, unknown>;
  if (!r.rules || typeof r.rules !== 'object') return false;
  const innerRules = r.rules as Record<string, unknown>;
  // Legacy format has minExperience/maxExperience directly, not an array
  return !Array.isArray(innerRules) && (
    'minExperience' in innerRules ||
    'maxExperience' in innerRules ||
    'requiredSkills' in innerRules ||
    'requiredEducation' in innerRules
  );
}

/**
 * Validate auto-rejection rules structure (supports both legacy and new formats)
 * Requirements: 9.1, 9.5
 */
function validateAutoRejectionRules(rules: AutoRejectionRules | LegacyAutoRejectionRules | null | undefined): { valid: boolean; errors: Record<string, string[]> } {
  const errors: Record<string, string[]> = {};

  if (!rules) {
    return { valid: true, errors };
  }

  // Validate enabled flag
  if (typeof rules.enabled !== 'boolean') {
    errors.autoRejectionRules = ['enabled must be a boolean'];
    return { valid: false, errors };
  }

  // If not enabled, no further validation needed
  if (!rules.enabled) {
    return { valid: true, errors };
  }

  // Validate rules exist
  if (!rules.rules) {
    errors.autoRejectionRules = ['rules must be defined when enabled'];
    return { valid: false, errors };
  }

  // Check if legacy format
  if (isLegacyRulesFormat(rules)) {
    const legacyRules = rules as LegacyAutoRejectionRules;

    // Validate minExperience
    if (legacyRules.rules.minExperience !== undefined) {
      if (typeof legacyRules.rules.minExperience !== 'number' || legacyRules.rules.minExperience < 0) {
        errors['autoRejectionRules.minExperience'] = ['minExperience must be a non-negative number'];
      }
    }

    // Validate maxExperience
    if (legacyRules.rules.maxExperience !== undefined) {
      if (typeof legacyRules.rules.maxExperience !== 'number' || legacyRules.rules.maxExperience < 0) {
        errors['autoRejectionRules.maxExperience'] = ['maxExperience must be a non-negative number'];
      }
    }

    // Validate experience range
    if (legacyRules.rules.minExperience !== undefined && legacyRules.rules.maxExperience !== undefined) {
      if (legacyRules.rules.minExperience > legacyRules.rules.maxExperience) {
        errors['autoRejectionRules.minExperience'] = ['minExperience cannot be greater than maxExperience'];
      }
    }

    // Validate requiredSkills
    if (legacyRules.rules.requiredSkills !== undefined) {
      if (!Array.isArray(legacyRules.rules.requiredSkills)) {
        errors['autoRejectionRules.requiredSkills'] = ['requiredSkills must be an array'];
      } else if (!legacyRules.rules.requiredSkills.every(s => typeof s === 'string')) {
        errors['autoRejectionRules.requiredSkills'] = ['requiredSkills must be an array of strings'];
      }
    }

    // Validate requiredEducation
    if (legacyRules.rules.requiredEducation !== undefined) {
      if (!Array.isArray(legacyRules.rules.requiredEducation)) {
        errors['autoRejectionRules.requiredEducation'] = ['requiredEducation must be an array'];
      } else if (!legacyRules.rules.requiredEducation.every(s => typeof s === 'string')) {
        errors['autoRejectionRules.requiredEducation'] = ['requiredEducation must be an array of strings'];
      }
    }
  } else {
    // New array format - validate rules array
    const newRules = rules as AutoRejectionRules;
    if (!Array.isArray(newRules.rules)) {
      errors.autoRejectionRules = ['rules must be an array of rule objects'];
      return { valid: false, errors };
    }

    // Validate each rule in the array
    for (let i = 0; i < newRules.rules.length; i++) {
      const rule = newRules.rules[i];
      if (!rule.id || typeof rule.id !== 'string') {
        errors[`autoRejectionRules.rules[${i}].id`] = ['rule id is required'];
      }
      if (!rule.field || !['experience', 'location', 'skills', 'education', 'salary_expectation'].includes(rule.field)) {
        errors[`autoRejectionRules.rules[${i}].field`] = ['invalid rule field'];
      }
      if (!rule.operator) {
        errors[`autoRejectionRules.rules[${i}].operator`] = ['rule operator is required'];
      }
      if (rule.value === undefined) {
        errors[`autoRejectionRules.rules[${i}].value`] = ['rule value is required'];
      }
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export interface CreateJobData {
  companyId: string;
  title: string;
  department?: string; // Made optional - jobDomain is used instead

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

  // Mandatory criteria - editable screening criteria
  mandatoryCriteria?: MandatoryCriteria;

  // Screening questions - questions candidates must answer before applying
  screeningQuestions?: ScreeningQuestion[];

  // Auto-rejection rules (Requirements 9.1) - supports both new and legacy formats
  autoRejectionRules?: AutoRejectionRules | LegacyAutoRejectionRules;

  // Pipeline stages configuration (Requirements 4.1)
  pipelineStages?: PipelineStageConfig[];

  // Legacy fields (kept for compatibility)
  location?: string;
  employmentType?: string;
  salaryRange?: string;
}

export interface UpdateJobData {
  title?: string;
  department?: string | null; // Made optional - jobDomain is used instead

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

  // Mandatory criteria - editable screening criteria
  mandatoryCriteria?: MandatoryCriteria | null;

  // Screening questions - questions candidates must answer before applying
  screeningQuestions?: ScreeningQuestion[] | null;

  // Auto-rejection rules (Requirements 9.1) - supports both new and legacy formats
  autoRejectionRules?: AutoRejectionRules | LegacyAutoRejectionRules | null;

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
   * Requirements: 1.1, 4.1, 4.2, 4.5, 5.1, 5.2, 6.1, 9.1
   */
  async create(data: CreateJobData): Promise<JobWithStages> {
    // Validate required fields (Requirements 1.7)
    const errors: Record<string, string[]> = {};
    if (!data.title || data.title.trim() === '') {
      errors.title = ['Title is required'];
    }
    // Department is optional - jobDomain is used as the primary field

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

    // Validate auto-rejection rules (Requirements 9.1)
    if (data.autoRejectionRules) {
      const rulesValidation = validateAutoRejectionRules(data.autoRejectionRules);
      if (!rulesValidation.valid) {
        Object.assign(errors, rulesValidation.errors);
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
      // Create the job (Requirements 5.1, 5.2, 9.1 - unique ID and active status)
      const newJob = await tx.job.create({
        data: {
          companyId: data.companyId,
          title: data.title.trim(),
          department: data.department?.trim() || data.jobDomain || 'General', // Use jobDomain as fallback

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

          // Mandatory criteria
          mandatoryCriteria: data.mandatoryCriteria || {},

          // Screening questions
          screeningQuestions: data.screeningQuestions || [],

          // Auto-rejection rules (Requirements 9.1)
          autoRejectionRules: data.autoRejectionRules || { enabled: false, rules: {} },

          // Legacy fields
          location: data.location || (data.locations && data.locations.length > 0 ? data.locations[0] : ''),
          employmentType: data.employmentType,
          salaryRange: data.salaryRange,
        },
      });

      // Create pipeline stages (Requirements 4.1, 4.5)
      // Track the next available position for sub-stages to avoid unique constraint violations
      let nextSubStagePosition = stagesToCreate.length * 100; // Start sub-stages at a high position offset

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
                position: nextSubStagePosition++, // Use unique position for sub-stages
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

    // Sort stages by position and re-normalize positions to avoid duplicates
    const sortedStages = stages.sort((a, b) => a.position - b.position);

    // Re-assign positions sequentially to avoid unique constraint violations
    return sortedStages.map((stage, index) => ({
      ...stage,
      position: index,
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
   * Requirements: 8.3, 4.3, 9.1, 9.5
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

    // Validate auto-rejection rules if provided (Requirements 9.1)
    if (data.autoRejectionRules !== undefined && data.autoRejectionRules !== null) {
      const rulesValidation = validateAutoRejectionRules(data.autoRejectionRules);
      if (!rulesValidation.valid) {
        throw new ValidationError(rulesValidation.errors);
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

          // Mandatory criteria
          mandatoryCriteria: data.mandatoryCriteria,

          // Screening questions
          screeningQuestions: data.screeningQuestions,

          // Auto-rejection rules (Requirements 9.1, 9.5)
          autoRejectionRules: data.autoRejectionRules,

          // Legacy fields
          location: data.location,
          employmentType: data.employmentType,
          salaryRange: data.salaryRange,
        },
      });

      // Update pipeline stages if provided (Requirements 8.3)
      if (data.pipelineStages && data.pipelineStages.length > 0) {
        // Instead of deleting all stages, we'll update existing ones and add new ones
        // This prevents foreign key constraint violations when candidates are assigned to stages

        const stagesToCreate = this.validateAndNormalizePipelineStages(data.pipelineStages);

        // Get existing stages
        const existingStages = await tx.pipelineStage.findMany({
          where: { jobId: id, parentId: null },
          orderBy: { position: 'asc' },
        });

        // Check if any candidates are assigned to this job
        const candidatesCount = await tx.jobCandidate.count({
          where: { jobId: id }
        });

        if (candidatesCount > 0) {
          // If there are candidates assigned to this job, we need to be more careful
          // For now, we'll skip updating pipeline stages and just update the job data
          console.log(`Skipping pipeline stage update for job ${id} - ${candidatesCount} candidates are assigned to this job`);
        } else {
          // Safe to delete and recreate stages since no candidates are assigned
          await tx.pipelineStage.deleteMany({
            where: { jobId: id },
          });

          // Create new stages
          let nextSubStagePosition = stagesToCreate.length * 100;

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
                    position: nextSubStagePosition++,
                    isDefault: false,
                    isMandatory: false,
                    parentId: createdStage.id,
                  },
                });
              }
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
   * Toggle job status between active and closed
   */
  async toggleStatus(id: string, userId?: string, userRole?: UserRole): Promise<JobWithStages> {
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

    // Toggle between active and closed
    const newStatus = existing.status === 'closed' ? 'active' : 'closed';

    const job = await prisma.job.update({
      where: { id },
      data: { status: newStatus },
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
      },
    });

    return this.mapToJob(job, job.pipelineStages, job.company);
  },

  /**
   * Duplicate a job (copies all job data but not candidates)
   */
  async duplicate(id: string, userId?: string, userRole?: UserRole): Promise<JobWithStages> {
    // Validate access if user info is provided
    if (userId && userRole) {
      const hasAccess = await this.validateJobAccess(id, userId, userRole);
      if (!hasAccess) {
        throw new AuthorizationError();
      }
    }

    const existing = await prisma.job.findUnique({
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
      },
    });

    if (!existing) {
      throw new NotFoundError('Job');
    }

    // Create duplicated job with "Copy of" prefix
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await prisma.$transaction(async (tx: any) => {
      const newJob = await tx.job.create({
        data: {
          companyId: existing.companyId,
          title: `Copy of ${existing.title}`,
          department: existing.department,

          // Experience range
          experienceMin: existing.experienceMin,
          experienceMax: existing.experienceMax,

          // Salary range
          salaryMin: existing.salaryMin,
          salaryMax: existing.salaryMax,
          variables: existing.variables,

          // Requirements
          educationQualification: existing.educationQualification,
          ageUpTo: existing.ageUpTo,
          skills: existing.skills as string[],
          preferredIndustry: existing.preferredIndustry,

          // Work details
          workMode: existing.workMode,
          locations: existing.locations as string[],
          priority: existing.priority,
          jobDomain: existing.jobDomain,

          // Assignment
          assignedRecruiterId: existing.assignedRecruiterId,

          // Content
          description: existing.description,
          openings: existing.openings,
          status: 'active', // New job starts as active

          // Mandatory criteria
          mandatoryCriteria: existing.mandatoryCriteria || {},

          // Screening questions
          screeningQuestions: existing.screeningQuestions || [],

          // Auto-rejection rules
          autoRejectionRules: existing.autoRejectionRules || { enabled: false, rules: {} },

          // Legacy fields
          location: existing.location,
          employmentType: existing.employmentType,
          salaryRange: existing.salaryRange,
        },
      });

      // Duplicate pipeline stages
      let nextSubStagePosition = existing.pipelineStages.length * 100;

      for (const stage of existing.pipelineStages) {
        const createdStage = await tx.pipelineStage.create({
          data: {
            jobId: newJob.id,
            name: stage.name,
            position: stage.position,
            isDefault: stage.isDefault,
            isMandatory: stage.isMandatory,
          },
        });

        // Create sub-stages if any
        if (stage.subStages && stage.subStages.length > 0) {
          for (const subStage of stage.subStages) {
            await tx.pipelineStage.create({
              data: {
                jobId: newJob.id,
                name: subStage.name,
                position: nextSubStagePosition++,
                isDefault: subStage.isDefault,
                isMandatory: subStage.isMandatory,
                parentId: createdStage.id,
              },
            });
          }
        }
      }

      // Fetch the created stages
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
      mandatoryCriteria?: unknown;
      screeningQuestions?: unknown;
      autoRejectionRules?: unknown;
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

      // Mandatory criteria
      mandatoryCriteria: job.mandatoryCriteria as MandatoryCriteria | undefined,

      // Screening questions
      screeningQuestions: job.screeningQuestions as ScreeningQuestion[] | undefined,

      // Auto-rejection rules (Requirements 9.5)
      autoRejectionRules: job.autoRejectionRules as AutoRejectionRules | undefined,

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
