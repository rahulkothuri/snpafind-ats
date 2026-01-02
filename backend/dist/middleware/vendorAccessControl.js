import { AuthorizationError } from './errorHandler.js';
import vendorService from '../services/vendor.service.js';
import prisma from '../lib/prisma.js';
/**
 * Vendor Access Control Middleware
 * Implements access control for vendor users to filter jobs and candidates
 * Requirements: 7.4, 7.6, 7.9, 10.2, 10.3
 */
/**
 * Middleware to check if a vendor has access to a specific job
 * Requirements: 7.4, 10.2
 */
export function requireVendorJobAccess() {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return next(new AuthorizationError());
            }
            // Only apply to vendor users
            if (req.user.role !== 'vendor') {
                return next();
            }
            const jobId = req.params.id || req.params.jobId;
            if (!jobId) {
                return next(new AuthorizationError());
            }
            const hasAccess = await vendorService.hasJobAccess(req.user.userId, jobId);
            if (!hasAccess) {
                return next(new AuthorizationError());
            }
            next();
        }
        catch (error) {
            next(new AuthorizationError());
        }
    };
}
/**
 * Middleware to filter job queries for vendor users
 * Adds vendor job IDs to the request for use in service layer
 * Requirements: 7.6, 10.2
 */
export function filterVendorJobs() {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return next(new AuthorizationError());
            }
            // Only apply to vendor users
            if (req.user.role !== 'vendor') {
                return next();
            }
            // Get vendor's assigned job IDs
            const vendorJobIds = await vendorService.getVendorJobIds(req.user.userId);
            // Attach to request for use in service layer
            req.vendorJobIds = vendorJobIds;
            next();
        }
        catch (error) {
            next(new AuthorizationError());
        }
    };
}
/**
 * Middleware to filter candidate queries for vendor users
 * Only allows access to candidates in jobs assigned to the vendor
 * Requirements: 7.9, 10.3
 */
export function filterVendorCandidates() {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return next(new AuthorizationError());
            }
            // Only apply to vendor users
            if (req.user.role !== 'vendor') {
                return next();
            }
            // Get vendor's assigned job IDs
            const vendorJobIds = await vendorService.getVendorJobIds(req.user.userId);
            // Attach to request for use in service layer
            req.vendorJobIds = vendorJobIds;
            next();
        }
        catch (error) {
            next(new AuthorizationError());
        }
    };
}
/**
 * Middleware to validate vendor access to a candidate
 * Checks if the candidate is in a job assigned to the vendor
 * Requirements: 7.9, 10.3
 */
export function requireVendorCandidateAccess() {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return next(new AuthorizationError());
            }
            // Only apply to vendor users
            if (req.user.role !== 'vendor') {
                return next();
            }
            const candidateId = req.params.id || req.params.candidateId;
            if (!candidateId) {
                return next(new AuthorizationError());
            }
            // Get vendor's assigned job IDs
            const vendorJobIds = await vendorService.getVendorJobIds(req.user.userId);
            // Check if candidate is in any of the vendor's assigned jobs
            const jobCandidate = await prisma.jobCandidate.findFirst({
                where: {
                    candidateId,
                    jobId: { in: vendorJobIds },
                },
            });
            if (!jobCandidate) {
                return next(new AuthorizationError());
            }
            next();
        }
        catch (error) {
            next(new AuthorizationError());
        }
    };
}
/**
 * Helper function to check if user is a vendor
 */
export function isVendor(req) {
    return req.user?.role === 'vendor';
}
/**
 * Helper function to get vendor job IDs from request
 */
export function getVendorJobIds(req) {
    return req.vendorJobIds;
}
export default {
    requireVendorJobAccess,
    filterVendorJobs,
    filterVendorCandidates,
    requireVendorCandidateAccess,
    isVendor,
    getVendorJobIds,
};
//# sourceMappingURL=vendorAccessControl.js.map