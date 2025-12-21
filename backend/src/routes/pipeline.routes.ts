import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { ValidationError } from '../middleware/errorHandler.js';
import bulkMoveService from '../services/bulkMove.service.js';

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

// Validation schema for bulk move request
const bulkMoveSchema = z.object({
  candidateIds: z.array(z.string().uuid('Invalid candidate ID format')).min(1, 'At least one candidate ID is required'),
  targetStageId: z.string().uuid('Invalid target stage ID format'),
  jobId: z.string().uuid('Invalid job ID format'),
  comment: z.string().optional(),
});

/**
 * POST /api/pipeline/bulk-move
 * Move multiple candidates to a target stage in a single operation
 * Requirements: 1.3, 1.4, 1.5, 1.6
 */
router.post(
  '/bulk-move',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = bulkMoveSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(parseZodErrors(result.error));
      }

      const bulkMoveResult = await bulkMoveService.move({
        ...result.data,
        movedBy: req.user!.userId,
      });

      // Return appropriate status based on result
      // 200 for full success, 207 for partial success (multi-status)
      const statusCode = bulkMoveResult.failedCount > 0 && bulkMoveResult.movedCount > 0 ? 207 : 200;
      
      res.status(statusCode).json(bulkMoveResult);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
