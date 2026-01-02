import { AuthorizationError } from './errorHandler.js';
import { jobAccessControlService } from '../services/jobAccessControl.service.js';
/**
 * Middleware to validate job access for specific job operations
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
export function requireJobAccess() {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return next(new AuthorizationError());
            }
            const jobId = req.params.id;
            if (!jobId) {
                return next(new AuthorizationError());
            }
            const hasAccess = await jobAccessControlService.validateJobAccess(jobId, req.user.userId, req.user.role);
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
 * Middleware to automatically filter job responses based on user role
 * This middleware modifies the response to only include jobs the user can access
 * Requirements: 4.1, 4.5
 */
export function filterJobResponses() {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AuthorizationError());
        }
        // Store original json method
        const originalJson = res.json.bind(res);
        // Override json method to filter job data
        res.json = function (data) {
            // If the response contains job data, filter it
            if (Array.isArray(data)) {
                // Filter array of jobs
                const filteredData = jobAccessControlService.filterJobsByUserRole(data, req.user.userId, req.user.role);
                return originalJson(filteredData);
            }
            else if (data && typeof data === 'object' && data.id && data.title) {
                // Single job object - validate access
                jobAccessControlService.validateJobAccess(data.id, req.user.userId, req.user.role).then(hasAccess => {
                    if (hasAccess) {
                        return originalJson(data);
                    }
                    else {
                        return originalJson({ error: 'Unauthorized access to job' });
                    }
                }).catch(() => {
                    return originalJson({ error: 'Unauthorized access to job' });
                });
                return res;
            }
            // For non-job data, return as-is
            return originalJson(data);
        };
        next();
    };
}
/**
 * Middleware to check if user can create jobs
 * Requirements: 4.2
 */
export function requireJobCreatePermission() {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AuthorizationError());
        }
        // All authenticated users can create jobs, but they must be in the same company
        // Vendors cannot create jobs
        const { role } = req.user;
        if (!['admin', 'hiring_manager', 'recruiter'].includes(role)) {
            return next(new AuthorizationError());
        }
        next();
    };
}
/**
 * Middleware to check if user can update jobs
 * Requirements: 4.3
 */
export function requireJobUpdatePermission() {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return next(new AuthorizationError());
            }
            const jobId = req.params.id;
            if (!jobId) {
                return next(new AuthorizationError());
            }
            // Check if user has access to this specific job
            const hasAccess = await jobAccessControlService.validateJobAccess(jobId, req.user.userId, req.user.role);
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
 * Middleware to check if user can delete jobs
 * Requirements: 4.4
 */
export function requireJobDeletePermission() {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return next(new AuthorizationError());
            }
            const jobId = req.params.id;
            if (!jobId) {
                return next(new AuthorizationError());
            }
            // Only admins and hiring managers can delete jobs
            if (!['admin', 'hiring_manager'].includes(req.user.role)) {
                return next(new AuthorizationError());
            }
            // Check if user has access to this specific job
            const hasAccess = await jobAccessControlService.validateJobAccess(jobId, req.user.userId, req.user.role);
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
export default {
    requireJobAccess,
    filterJobResponses,
    requireJobCreatePermission,
    requireJobUpdatePermission,
    requireJobDeletePermission,
};
//# sourceMappingURL=jobAccessControl.js.map