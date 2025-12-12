import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import authService from '../services/auth.service.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { ValidationError } from '../middleware/errorHandler.js';

const router = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
  companyName: z.string().min(1, 'Company name is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 * Requirements: 1.1, 1.2
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const result = loginSchema.safeParse(req.body);
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

    // Attempt login
    const authResponse = await authService.login(result.data);
    
    res.json(authResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/register
 * Register a new admin user with a new company
 * Requirements: 1.2, 1.3, 1.4
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const result = registerSchema.safeParse(req.body);
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

    // Register user
    const response = await authService.register({
      fullName: result.data.fullName,
      email: result.data.email,
      password: result.data.password,
      companyName: result.data.companyName,
    });

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Invalidate the current JWT token
 * Requirements: 1.4
 */
router.post('/logout', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      authService.logout(token);
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user info
 * Requirements: 1.5
 */
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
    }

    res.json({
      userId: req.user.userId,
      companyId: req.user.companyId,
      role: req.user.role,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
