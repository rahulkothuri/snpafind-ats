import type { Job, UserRole } from '../types/index.js';
export interface JobAccessControlService {
    filterJobsByUserRole(jobs: Job[], userId: string, userRole: UserRole): Job[];
    validateJobAccess(jobId: string, userId: string, userRole: UserRole): Promise<boolean>;
    getAccessibleJobs(userId: string, userRole: UserRole, companyId: string): Promise<Job[]>;
}
/**
 * Job Access Control Service
 * Implements role-based access control for job visibility and operations
 * Requirements: 1.1, 1.4, 4.1, 4.2
 */
export declare const jobAccessControlService: JobAccessControlService;
/**
 * Middleware helper to check job access and throw error if unauthorized
 * Requirements: 4.2, 4.3, 4.4
 */
export declare function requireJobAccess(jobId: string, userId: string, userRole: UserRole): Promise<void>;
export default jobAccessControlService;
//# sourceMappingURL=jobAccessControl.service.d.ts.map