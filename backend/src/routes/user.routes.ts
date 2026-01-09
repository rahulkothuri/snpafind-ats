import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import userService from '../services/user.service.js';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth.js';
import { ValidationError } from '../middleware/errorHandler.js';

const router = Router();

// Validation schemas
const createUserSchema = z.object({
  companyId: z.string().uuid('Invalid company ID').optional(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'hiring_manager', 'recruiter', 'vendor']),
});

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  role: z.enum(['admin', 'hiring_manager', 'recruiter', 'vendor']).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
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
 * GET /api/users
 * Get all users (admin only)
 * Requirements: 4.4
 */
router.get(
  '/',
  authenticate,
  authorize('admin'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // If user is admin, they can see all users in their company
      const users = await userService.getAllByCompany(req.user!.companyId);
      res.json(users);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/users/:id
 * Get a user by ID
 */
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getById(req.params.id);
    
    // Users can only view users in their own company (unless admin)
    if (user.companyId !== req.user!.companyId && req.user!.role !== 'admin') {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Access denied' });
    }
    
    res.json(user);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/users
 * Create a new user
 * Requirements: 4.1
 */
router.post(
  '/',
  authenticate,
  authorize('admin'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = createUserSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(parseZodErrors(result.error));
      }

      // Use the authenticated user's companyId if not provided
      const companyId = result.data.companyId || req.user!.companyId;

      // Admin can only create users in their own company
      if (companyId !== req.user!.companyId) {
        return res.status(403).json({ code: 'FORBIDDEN', message: 'Cannot create users in other companies' });
      }

      const user = await userService.create({
        ...result.data,
        companyId,
      });
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/users/:id
 * Update a user
 * Requirements: 4.2
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = updateUserSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(parseZodErrors(result.error));
      }

      // Check if user belongs to admin's company
      const existingUser = await userService.getById(req.params.id);
      if (existingUser.companyId !== req.user!.companyId) {
        return res.status(403).json({ code: 'FORBIDDEN', message: 'Cannot update users in other companies' });
      }

      const user = await userService.update(req.params.id, result.data);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/users/:id
 * Deactivate a user (soft delete)
 * Requirements: 4.3
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Check if user belongs to admin's company
      const existingUser = await userService.getById(req.params.id);
      if (existingUser.companyId !== req.user!.companyId) {
        return res.status(403).json({ code: 'FORBIDDEN', message: 'Cannot delete users in other companies' });
      }

      // Prevent admin from deleting themselves
      if (req.params.id === req.user!.userId) {
        return res.status(400).json({ code: 'BAD_REQUEST', message: 'Cannot delete your own account' });
      }

      // Soft delete (deactivate) the user
      const user = await userService.deactivate(req.params.id);
      res.json({ success: true, message: 'User deactivated', user });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
