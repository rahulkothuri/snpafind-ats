import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
/**
 * Vendor Access Control Middleware
 * Implements access control for vendor users to filter jobs and candidates
 * Requirements: 7.4, 7.6, 7.9, 10.2, 10.3
 */
/**
 * Middleware to check if a vendor has access to a specific job
 * Requirements: 7.4, 10.2
 */
export declare function requireVendorJobAccess(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to filter job queries for vendor users
 * Adds vendor job IDs to the request for use in service layer
 * Requirements: 7.6, 10.2
 */
export declare function filterVendorJobs(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to filter candidate queries for vendor users
 * Only allows access to candidates in jobs assigned to the vendor
 * Requirements: 7.9, 10.3
 */
export declare function filterVendorCandidates(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to validate vendor access to a candidate
 * Checks if the candidate is in a job assigned to the vendor
 * Requirements: 7.9, 10.3
 */
export declare function requireVendorCandidateAccess(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Helper function to check if user is a vendor
 */
export declare function isVendor(req: AuthenticatedRequest): boolean;
/**
 * Helper function to get vendor job IDs from request
 */
export declare function getVendorJobIds(req: AuthenticatedRequest): string[] | undefined;
declare const _default: {
    requireVendorJobAccess: typeof requireVendorJobAccess;
    filterVendorJobs: typeof filterVendorJobs;
    filterVendorCandidates: typeof filterVendorCandidates;
    requireVendorCandidateAccess: typeof requireVendorCandidateAccess;
    isVendor: typeof isVendor;
    getVendorJobIds: typeof getVendorJobIds;
};
export default _default;
//# sourceMappingURL=vendorAccessControl.d.ts.map