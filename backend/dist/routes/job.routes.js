import { Router } from 'express';
import { z } from 'zod';
import jobService from '../services/job.service.js';
import pipelineService from '../services/pipeline.service.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ValidationError } from '../middleware/errorHandler.js';
const router = Router();
// Validation schemas
const createJobSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    department: z.string().min(1, 'Department is required'),
    location: z.string().min(1, 'Location is required'),
    employmentType: z.string().optional(),
    salaryRange: z.string().optional(),
    description: z.string().optional(),
    openings: z.number().int().positive().optional(),
});
const updateJobSchema = z.object({
    title: z.string().min(1, 'Title is required').optional(),
    department: z.string().min(1, 'Department is required').optional(),
    location: z.string().min(1, 'Location is required').optional(),
    employmentType: z.string().optional().nullable(),
    salaryRange: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    status: z.enum(['active', 'paused', 'closed']).optional(),
    openings: z.number().int().positive().optional(),
});
/**
 * Helper to convert Zod errors to ValidationError format
 */
function parseZodErrors(error) {
    const errors = {};
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
 * Get all jobs (filtered by company for non-admin users)
 * Requirements: 7.1, 7.2
 */
router.get('/', authenticate, async (req, res, next) => {
    try {
        const { status } = req.query;
        const filters = {
            companyId: req.user.companyId,
        };
        if (status && typeof status === 'string') {
            filters.status = status;
        }
        const jobs = await jobService.getAll(filters);
        res.json(jobs);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/jobs/:id
 * Get a job by ID
 */
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const job = await jobService.getById(req.params.id);
        res.json(job);
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/jobs
 * Create a new job
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
router.post('/', authenticate, authorize('admin', 'hiring_manager', 'recruiter'), async (req, res, next) => {
    try {
        const result = createJobSchema.safeParse(req.body);
        if (!result.success) {
            throw new ValidationError(parseZodErrors(result.error));
        }
        const job = await jobService.create({
            ...result.data,
            companyId: req.user.companyId,
        });
        res.status(201).json(job);
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/jobs/:id
 * Update a job
 */
router.put('/:id', authenticate, authorize('admin', 'hiring_manager', 'recruiter'), async (req, res, next) => {
    try {
        const result = updateJobSchema.safeParse(req.body);
        if (!result.success) {
            throw new ValidationError(parseZodErrors(result.error));
        }
        const job = await jobService.update(req.params.id, result.data);
        res.json(job);
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/jobs/:id
 * Delete a job
 */
router.delete('/:id', authenticate, authorize('admin', 'hiring_manager'), async (req, res, next) => {
    try {
        await jobService.delete(req.params.id);
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
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
 * Get all pipeline stages for a job
 * Requirements: 6.3
 */
router.get('/:id/pipeline', authenticate, async (req, res, next) => {
    try {
        const stages = await pipelineService.getStagesByJobId(req.params.id);
        res.json(stages);
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/jobs/:id/pipeline/stages
 * Insert a custom sub-stage at a specific position
 * Requirements: 6.2
 */
router.post('/:id/pipeline/stages', authenticate, authorize('admin', 'hiring_manager'), async (req, res, next) => {
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
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/jobs/:id/pipeline/stages/:stageId/reorder
 * Reorder a stage to a new position
 * Requirements: 6.4
 */
router.put('/:id/pipeline/stages/:stageId/reorder', authenticate, authorize('admin', 'hiring_manager'), async (req, res, next) => {
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
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/jobs/:id/pipeline/stages/:stageId
 * Delete a custom stage
 */
router.delete('/:id/pipeline/stages/:stageId', authenticate, authorize('admin', 'hiring_manager'), async (req, res, next) => {
    try {
        await pipelineService.deleteStage(req.params.stageId);
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=job.routes.js.map