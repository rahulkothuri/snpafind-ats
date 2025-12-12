import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import companyService from '../services/company.service.js';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth.js';
import { ValidationError } from '../middleware/errorHandler.js';

const router = Router();

// Validation schemas
const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  logoUrl: z.string().url('Invalid logo URL').optional(),
  contactEmail: z.string().email('Invalid email format'),
  address: z.string().optional(),
});

const updateCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').optional(),
  logoUrl: z.string().url('Invalid logo URL').optional().nullable(),
  contactEmail: z.string().email('Invalid email format').optional(),
  address: z.string().optional().nullable(),
  // Enhanced company profile fields - Requirements 2.2-2.6, 7.1, 7.2
  website: z.string().url('Invalid website URL').optional().nullable().or(z.literal('')),
  companySize: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').optional().nullable().or(z.literal('')),
  twitterUrl: z.string().url('Invalid Twitter URL').optional().nullable().or(z.literal('')),
  facebookUrl: z.string().url('Invalid Facebook URL').optional().nullable().or(z.literal('')),
  careersPageUrl: z.string().url('Invalid careers page URL').optional().nullable().or(z.literal('')),
  brandColor: z.string().optional().nullable(),
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
 * GET /api/companies/current
 * Get the current user's company
 * Requirements: 2.1, 2.8
 */
router.get('/current', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.companyId) {
      throw new ValidationError({ company: ['User is not associated with a company'] });
    }
    const company = await companyService.getById(req.user.companyId);
    res.json(company);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/companies/current
 * Update the current user's company
 * Requirements: 2.7
 */
router.put(
  '/current',
  authenticate,
  authorize('admin'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.companyId) {
        throw new ValidationError({ company: ['User is not associated with a company'] });
      }
      const result = updateCompanySchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(parseZodErrors(result.error));
      }

      const company = await companyService.update(req.user.companyId, result.data);
      res.json(company);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/companies/:id
 * Get a company by ID
 * Requirements: 2.4
 */
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const company = await companyService.getById(req.params.id);
    res.json(company);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/companies
 * Create a new company
 * Requirements: 2.1, 2.3
 */
router.post(
  '/',
  authenticate,
  authorize('admin'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = createCompanySchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(parseZodErrors(result.error));
      }

      const company = await companyService.create(result.data);
      res.status(201).json(company);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/companies/:id
 * Update a company
 * Requirements: 2.2
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = updateCompanySchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(parseZodErrors(result.error));
      }

      const company = await companyService.update(req.params.id, result.data);
      res.json(company);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/companies
 * Get all companies (admin only)
 */
router.get(
  '/',
  authenticate,
  authorize('admin'),
  async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const companies = await companyService.getAll();
      res.json(companies);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
