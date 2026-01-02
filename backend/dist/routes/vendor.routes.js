import { Router } from 'express';
import { z } from 'zod';
import vendorService from '../services/vendor.service.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ValidationError } from '../middleware/errorHandler.js';
const router = Router();
// Validation schemas
const createVendorSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    assignedJobIds: z.array(z.string().uuid('Invalid job ID')).optional().default([]),
});
const updateVendorSchema = z.object({
    name: z.string().min(1, 'Name is required').optional(),
    email: z.string().email('Invalid email format').optional(),
    isActive: z.boolean().optional(),
    assignedJobIds: z.array(z.string().uuid('Invalid job ID')).optional(),
});
const assignJobsSchema = z.object({
    jobIds: z.array(z.string().uuid('Invalid job ID')).min(1, 'At least one job ID is required'),
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
 * GET /api/vendors
 * Get all vendors for the company
 * Requirements: 7.2
 */
router.get('/', authenticate, authorize('admin'), async (req, res, next) => {
    try {
        const vendors = await vendorService.getVendors(req.user.companyId);
        res.json(vendors);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/vendors/:id
 * Get a vendor by ID
 */
router.get('/:id', authenticate, authorize('admin'), async (req, res, next) => {
    try {
        const vendor = await vendorService.getVendorById(req.params.id, req.user.companyId);
        res.json(vendor);
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/vendors
 * Create a new vendor
 * Requirements: 7.3
 */
router.post('/', authenticate, authorize('admin'), async (req, res, next) => {
    try {
        const result = createVendorSchema.safeParse(req.body);
        if (!result.success) {
            throw new ValidationError(parseZodErrors(result.error));
        }
        const vendor = await vendorService.createVendor({
            companyId: req.user.companyId,
            name: result.data.name,
            email: result.data.email,
            password: result.data.password,
            assignedJobIds: result.data.assignedJobIds,
        });
        res.status(201).json(vendor);
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/vendors/:id
 * Update a vendor
 * Requirements: 7.7
 */
router.put('/:id', authenticate, authorize('admin'), async (req, res, next) => {
    try {
        const result = updateVendorSchema.safeParse(req.body);
        if (!result.success) {
            throw new ValidationError(parseZodErrors(result.error));
        }
        const vendor = await vendorService.updateVendor(req.params.id, req.user.companyId, result.data);
        res.json(vendor);
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/vendors/:id
 * Delete a vendor
 * Requirements: 7.7
 */
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
    try {
        await vendorService.deleteVendor(req.params.id, req.user.companyId);
        res.json({ success: true, message: 'Vendor deleted successfully' });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/vendors/:id/deactivate
 * Deactivate a vendor (soft delete)
 * Requirements: 7.8
 */
router.post('/:id/deactivate', authenticate, authorize('admin'), async (req, res, next) => {
    try {
        const vendor = await vendorService.deactivateVendor(req.params.id, req.user.companyId);
        res.json({ success: true, message: 'Vendor deactivated', vendor });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/vendors/:id/jobs
 * Assign jobs to a vendor
 * Requirements: 10.4
 */
router.post('/:id/jobs', authenticate, authorize('admin'), async (req, res, next) => {
    try {
        const result = assignJobsSchema.safeParse(req.body);
        if (!result.success) {
            throw new ValidationError(parseZodErrors(result.error));
        }
        const vendor = await vendorService.assignJobsToVendor(req.params.id, req.user.companyId, result.data.jobIds);
        res.json(vendor);
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/vendors/:id/jobs/:jobId
 * Remove a job assignment from a vendor
 */
router.delete('/:id/jobs/:jobId', authenticate, authorize('admin'), async (req, res, next) => {
    try {
        const vendor = await vendorService.removeJobAssignment(req.params.id, req.user.companyId, req.params.jobId);
        res.json(vendor);
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=vendor.routes.js.map