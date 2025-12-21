import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import jobService from '../services/job.service.js';
import pipelineService from '../services/pipeline.service.js';
import prisma from '../lib/prisma.js';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth.js';
import { ValidationError } from '../middleware/errorHandler.js';
import { 
  requireJobAccess, 
  requireJobCreatePermission, 
  requireJobUpdatePermission, 
  requireJobDeletePermission 
} from '../middleware/jobAccessControl.js';

const router = Router();

// Sub-stage schema for pipeline configuration
const subStageSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Sub-stage name is required'),
  position: z.number().int().min(0),
});

// Pipeline stage schema for job creation/update
const pipelineStageSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Stage name is required'),
  position: z.number().int().min(0),
  isMandatory: z.boolean().default(false),
  subStages: z.array(subStageSchema).optional(),
});

// Validation schemas with all new fields (Requirements 1.1)
const createJobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  department: z.string().optional(), // Made optional - jobDomain is used instead
  
  // Experience range (Requirements 1.2)
  experienceMin: z.number().min(0).optional(),
  experienceMax: z.number().min(0).optional(),
  
  // Salary range (Requirements 1.3)
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  variables: z.string().optional(),
  
  // Requirements (Requirements 1.1)
  educationQualification: z.string().optional(),
  ageUpTo: z.number().int().min(18).max(100).optional(),
  skills: z.array(z.string()).optional(),
  preferredIndustry: z.string().optional(),
  
  // Work details (Requirements 1.4, 1.5, 1.6)
  workMode: z.enum(['Onsite', 'WFH', 'Hybrid', 'C2C', 'C2H']).optional(),
  locations: z.array(z.string()).optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  jobDomain: z.string().optional(),
  
  // Assignment (Requirements 1.1)
  assignedRecruiterId: z.string().optional(),
  
  // Content
  description: z.string().optional(),
  openings: z.number().int().positive().optional(),
  
  // Pipeline stages (Requirements 4.1)
  pipelineStages: z.array(pipelineStageSchema).optional(),
  
  // Legacy fields (kept for compatibility)
  location: z.string().optional(),
  employmentType: z.string().optional(),
  salaryRange: z.string().optional(),
});

const updateJobSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  department: z.string().nullable().optional(), // Made optional - jobDomain is used instead
  
  // Experience range
  experienceMin: z.number().min(0).nullable().optional(),
  experienceMax: z.number().min(0).nullable().optional(),
  
  // Salary range
  salaryMin: z.number().min(0).nullable().optional(),
  salaryMax: z.number().min(0).nullable().optional(),
  variables: z.string().nullable().optional(),
  
  // Requirements
  educationQualification: z.string().nullable().optional(),
  ageUpTo: z.number().int().min(18).max(100).nullable().optional(),
  skills: z.array(z.string()).optional(),
  preferredIndustry: z.string().nullable().optional(),
  
  // Work details
  workMode: z.enum(['Onsite', 'WFH', 'Hybrid', 'C2C', 'C2H']).nullable().optional(),
  locations: z.array(z.string()).optional(),
  priority: z.enum(['Low', 'Medium', 'High']).nullable().optional(),
  jobDomain: z.string().nullable().optional(),
  
  // Assignment
  assignedRecruiterId: z.string().nullable().optional(),
  
  // Content
  description: z.string().nullable().optional(),
  status: z.enum(['active', 'paused', 'closed']).optional(),
  openings: z.number().int().positive().optional(),
  
  // Pipeline stages
  pipelineStages: z.array(pipelineStageSchema).optional(),
  
  // Legacy fields
  location: z.string().nullable().optional(),
  employmentType: z.string().nullable().optional(),
  salaryRange: z.string().nullable().optional(),
});

/**
 * Helper to convert Zod errors to ValidationError format
 */
function parseZodErrors(error: z.ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  });
  return errors;
}

/**
 * GET /api/jobs
 * Get all jobs with role-based filtering
 * Requirements: 7.1, 7.2, 4.1, 4.5
 */
router.get(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { status } = req.query;
      const filters: { companyId?: string; status?: string } = {
        companyId: req.user!.companyId,
      };
      if (status && typeof status === 'string') {
        filters.status = status;
      }
      
      // Use role-based filtering
      const jobs = await jobService.getAll(filters, req.user!.userId, req.user!.role);
      res.json(jobs);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/jobs/:id
 * Get a job by ID with access control validation
 * Requirements: 7.3, 8.3, 4.2
 */
router.get(
  '/:id',
  authenticate,
  requireJobAccess(),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const job = await jobService.getById(req.params.id, req.user!.userId, req.user!.role);
      res.json(job);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/jobs/:id/candidates
 * Get all candidates who applied to a specific job with access control
 * Requirements: 4.2
 */
router.get(
  '/:id/candidates',
  authenticate,
  requireJobAccess(),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const jobId = req.params.id;
      
      // Get all job candidates with their candidate details and current stage
      const jobCandidates = await prisma.jobCandidate.findMany({
        where: { jobId },
        include: {
          candidate: true,
          currentStage: true,
        },
        orderBy: { appliedAt: 'desc' },
      });

      // Map to response format
      const result = jobCandidates.map((jc) => ({
        id: jc.id,
        jobId: jc.jobId,
        candidateId: jc.candidateId,
        currentStageId: jc.currentStageId,
        appliedAt: jc.appliedAt,
        updatedAt: jc.updatedAt,
        stageName: jc.currentStage?.name || 'Applied',
        candidate: jc.candidate ? {
          id: jc.candidate.id,
          companyId: jc.candidate.companyId,
          name: jc.candidate.name,
          email: jc.candidate.email,
          phone: jc.candidate.phone,
          experienceYears: jc.candidate.experienceYears,
          currentCompany: jc.candidate.currentCompany,
          location: jc.candidate.location,
          currentCtc: jc.candidate.currentCtc,
          expectedCtc: jc.candidate.expectedCtc,
          noticePeriod: jc.candidate.noticePeriod,
          source: jc.candidate.source,
          availability: jc.candidate.availability,
          skills: jc.candidate.skills,
          resumeUrl: jc.candidate.resumeUrl,
          score: jc.candidate.score,
          createdAt: jc.candidate.createdAt,
          updatedAt: jc.candidate.updatedAt,
        } : null,
      }));

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/jobs
 * Create a new job with access control
 * Requirements: 1.1, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4
 */
router.post(
  '/',
  authenticate,
  requireJobCreatePermission(),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = createJobSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(parseZodErrors(result.error));
      }

      const job = await jobService.create({
        ...result.data,
        companyId: req.user!.companyId,
      });
      res.status(201).json(job);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/jobs/:id
 * Update a job with access control validation
 * Requirements: 8.3, 4.3
 */
router.put(
  '/:id',
  authenticate,
  requireJobUpdatePermission(),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = updateJobSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(parseZodErrors(result.error));
      }

      const job = await jobService.update(req.params.id, result.data, req.user!.userId, req.user!.role);
      res.json(job);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/jobs/:id
 * Delete a job with access control validation
 * Requirements: 4.4
 */
router.delete(
  '/:id',
  authenticate,
  requireJobDeletePermission(),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await jobService.delete(req.params.id, req.user!.userId, req.user!.role);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

// Pipeline Stage Routes

// Validation schemas for pipeline stages
const insertStageSchema = z.object({
  name: z.string().min(1, 'Stage name is required'),
  position: z.number().int().min(0, 'Position must be non-negative'),
});

const reorderStageSchema = z.object({
  newPosition: z.number().int().min(0, 'Position must be non-negative'),
});

/**
 * GET /api/jobs/:id/pipeline
 * Get all pipeline stages for a job with access control
 * Requirements: 6.3, 4.2
 */
router.get(
  '/:id/pipeline',
  authenticate,
  requireJobAccess(),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const stages = await pipelineService.getStagesByJobId(req.params.id);
      res.json(stages);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/jobs/:id/pipeline/stages
 * Insert a custom sub-stage at a specific position with access control
 * Requirements: 6.2, 4.3
 */
router.post(
  '/:id/pipeline/stages',
  authenticate,
  requireJobUpdatePermission(),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = insertStageSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(parseZodErrors(result.error));
      }

      const stage = await pipelineService.insertStage({
        jobId: req.params.id,
        ...result.data,
      });
      res.status(201).json(stage);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/jobs/:id/pipeline/stages/:stageId/reorder
 * Reorder a stage to a new position with access control
 * Requirements: 6.4, 4.3
 */
router.put(
  '/:id/pipeline/stages/:stageId/reorder',
  authenticate,
  requireJobUpdatePermission(),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = reorderStageSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(parseZodErrors(result.error));
      }

      const stages = await pipelineService.reorderStage({
        stageId: req.params.stageId,
        newPosition: result.data.newPosition,
      });
      res.json(stages);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/jobs/:id/pipeline/stages/:stageId
 * Delete a custom stage with access control
 * Requirements: 4.3
 */
router.delete(
  '/:id/pipeline/stages/:stageId',
  authenticate,
  requireJobUpdatePermission(),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await pipelineService.deleteStage(req.params.stageId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/jobs/:id/import-stages
 * Import stages from another job with access control validation
 * Requirements: 3.3, 3.4, 3.5
 */
router.post(
  '/:id/import-stages',
  authenticate,
  requireJobUpdatePermission(),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { sourceJobId } = req.body;
      
      if (!sourceJobId) {
        throw new ValidationError({ sourceJobId: ['Source job ID is required'] });
      }

      // Import stages using the stage template service
      const { stageTemplateService } = await import('../services/stageTemplate.service.js');
      
      // Get stages from source job
      const sourceJob = await jobService.getById(sourceJobId, req.user!.userId, req.user!.role);
      if (!sourceJob.stages || sourceJob.stages.length === 0) {
        throw new ValidationError({ stages: ['Source job has no pipeline stages to import'] });
      }

      // Convert stages to PipelineStageConfig format
      const stagesToImport = sourceJob.stages.map(stage => ({
        name: stage.name,
        position: stage.position,
        isMandatory: stage.isMandatory || false,
        subStages: stage.subStages?.map(sub => ({
          name: sub.name,
          position: sub.position,
        })) || [],
      }));

      // Update the target job with imported stages
      const updatedJob = await jobService.update(
        req.params.id, 
        { pipelineStages: stagesToImport },
        req.user!.userId,
        req.user!.role
      );

      res.json({
        success: true,
        message: `Successfully imported ${stagesToImport.length} stages from job "${sourceJob.title}"`,
        job: updatedJob,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
