/**
 * Company Role Routes
 * 
 * API endpoints for managing custom company roles
 */

import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import companyRoleService from '../services/companyRole.service.js';
import { ValidationError } from '../middleware/errorHandler.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const createRoleSchema = z.object({
    name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
    description: z.string().max(255, 'Description too long').optional(),
    permissions: z.array(z.string()).optional(),
});

const updateRoleSchema = z.object({
    name: z.string().min(1).max(50).optional(),
    description: z.string().max(255).optional(),
    permissions: z.array(z.string()).optional(),
});

// Helper to validate request body
function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
    const result = schema.safeParse(body);
    if (!result.success) {
        const errors: Record<string, string[]> = {};
        result.error.issues.forEach((issue) => {
            const path = issue.path.join('.');
            if (!errors[path]) {
                errors[path] = [];
            }
            errors[path].push(issue.message);
        });
        throw new ValidationError(errors);
    }
    return result.data;
}

/**
 * GET /api/roles
 * Get all roles for the authenticated user's company
 */
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Company ID not found' });
        }

        const roles = await companyRoleService.getAll(companyId);
        return res.json(roles);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/roles/:id
 * Get a role by ID
 */
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = await companyRoleService.getById(req.params.id);
        return res.json(role);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/roles
 * Create a new custom role
 */
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Company ID not found' });
        }

        // Only admins can create roles
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ code: 'FORBIDDEN', message: 'Only admins can create roles' });
        }

        const data = validateBody(createRoleSchema, req.body);
        const role = await companyRoleService.create({
            ...data,
            companyId,
        });

        return res.status(201).json(role);
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/roles/:id
 * Update a role
 */
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        // Only admins can update roles
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ code: 'FORBIDDEN', message: 'Only admins can update roles' });
        }

        const data = validateBody(updateRoleSchema, req.body);
        const role = await companyRoleService.update(req.params.id, data);

        return res.json(role);
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/roles/:id
 * Delete a role
 */
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        // Only admins can delete roles
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ code: 'FORBIDDEN', message: 'Only admins can delete roles' });
        }

        await companyRoleService.delete(req.params.id);
        return res.status(204).send();
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/roles/initialize
 * Initialize default roles for a company
 */
router.post('/initialize', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Company ID not found' });
        }

        const roles = await companyRoleService.initializeDefaultRoles(companyId);
        return res.json(roles);
    } catch (error) {
        next(error);
    }
});

export default router;
