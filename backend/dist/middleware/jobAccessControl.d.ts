import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
/**
 * Middleware to validate job access for specific job operations
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
export declare function requireJobAccess(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to automatically filter job responses based on user role
 * This middleware modifies the response to only include jobs the user can access
 * Requirements: 4.1, 4.5
 */
export declare function filterJobResponses(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Middleware to check if user can create jobs
 * Requirements: 4.2
 */
export declare function requireJobCreatePermission(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Middleware to check if user can update jobs
 * Requirements: 4.3
 */
export declare function requireJobUpdatePermission(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to check if user can delete jobs
 * Requirements: 4.4
 */
export declare function requireJobDeletePermission(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
declare const _default: {
    requireJobAccess: typeof requireJobAccess;
    filterJobResponses: typeof filterJobResponses;
    requireJobCreatePermission: typeof requireJobCreatePermission;
    requireJobUpdatePermission: typeof requireJobUpdatePermission;
    requireJobDeletePermission: typeof requireJobDeletePermission;
};
export default _default;
//# sourceMappingURL=jobAccessControl.d.ts.map