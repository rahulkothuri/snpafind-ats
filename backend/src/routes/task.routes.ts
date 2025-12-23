/**
 * Task Routes - Dashboard task management API
 */

import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { ValidationError } from '../middleware/errorHandler.js';
import taskService from '../services/task.service.js';

const router = Router();

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

// Validation schemas
const createTaskSchema = z.object({
  type: z.enum(['feedback', 'approval', 'reminder', 'pipeline']),
  text: z.string().min(1, 'Task description is required'),
  severity: z.enum(['high', 'medium', 'low']).optional(),
});

const updateTaskSchema = z.object({
  type: z.enum(['feedback', 'approval', 'reminder', 'pipeline']).optional(),
  text: z.string().min(1).optional(),
  severity: z.enum(['high', 'medium', 'low']).optional(),
  status: z.enum(['open', 'closed']).optional(),
});

/**
 * GET /api/tasks
 * Get all tasks for the current user
 */
router.get(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as 'open' | 'closed' | undefined;
      const tasks = await taskService.getByUserId(
        req.user!.userId,
        req.user!.companyId,
        status
      );
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/tasks/:id
 * Get a single task by ID
 */
router.get(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const task = await taskService.getById(req.params.id, req.user!.userId);
      res.json(task);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/tasks
 * Create a new task
 */
router.post(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = createTaskSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(parseZodErrors(result.error));
      }

      const task = await taskService.create(
        req.user!.userId,
        req.user!.companyId,
        result.data
      );
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/tasks/:id
 * Update a task
 */
router.put(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = updateTaskSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(parseZodErrors(result.error));
      }

      const task = await taskService.update(
        req.params.id,
        req.user!.userId,
        result.data
      );
      res.json(task);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/tasks/:id/complete
 * Mark a task as complete
 */
router.post(
  '/:id/complete',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const task = await taskService.complete(req.params.id, req.user!.userId);
      res.json(task);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/tasks/:id/reopen
 * Reopen a closed task
 */
router.post(
  '/:id/reopen',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const task = await taskService.reopen(req.params.id, req.user!.userId);
      res.json(task);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/tasks/:id
 * Delete a task
 */
router.delete(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await taskService.delete(req.params.id, req.user!.userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
