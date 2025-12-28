import prisma from '../lib/prisma.js';
import { AuthorizationError } from '../middleware/errorHandler.js';
/**
 * Job Access Control Service
 * Implements role-based access control for job visibility and operations
 * Requirements: 1.1, 1.4, 4.1, 4.2
 */
export const jobAccessControlService = {
    /**
     * Filter jobs based on user role and assignments
     * Requirements: 1.1, 1.2, 1.3
     */
    filterJobsByUserRole(jobs, userId, userRole) {
        switch (userRole) {
            case 'admin':
            case 'hiring_manager':
                // Admins and hiring managers can see all jobs
                return jobs;
            case 'recruiter':
                // Recruiters can only see jobs assigned to them
                return jobs.filter(job => job.assignedRecruiterId === userId);
            default:
                return [];
        }
    },
    /**
     * Validate if a user has access to a specific job
     * Requirements: 4.2, 4.3, 4.4
     */
    async validateJobAccess(jobId, userId, userRole) {
        try {
            const job = await prisma.job.findUnique({
                where: { id: jobId },
                select: {
                    id: true,
                    assignedRecruiterId: true,
                    companyId: true,
                },
            });
            if (!job) {
                return false;
            }
            // Get user's company to verify they belong to the same company as the job
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { companyId: true },
            });
            if (!user || user.companyId !== job.companyId) {
                return false;
            }
            // Check role-based access
            switch (userRole) {
                case 'admin':
                case 'hiring_manager':
                    // Admins and hiring managers have access to all jobs in their company
                    return true;
                case 'recruiter':
                    // Recruiters only have access to jobs assigned to them
                    return job.assignedRecruiterId === userId;
                default:
                    return false;
            }
        }
        catch (error) {
            console.error('Error validating job access:', error);
            return false;
        }
    },
    /**
     * Get all jobs accessible to a user based on their role
     * Requirements: 4.1, 4.5
     */
    async getAccessibleJobs(userId, userRole, companyId) {
        const baseQuery = {
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { jobCandidates: true }
                },
                jobCandidates: {
                    include: {
                        currentStage: true
                    }
                }
            }
        };
        let jobs;
        switch (userRole) {
            case 'admin':
            case 'hiring_manager':
                // Get all jobs in the company
                jobs = await prisma.job.findMany(baseQuery);
                break;
            case 'recruiter':
                // Get only jobs assigned to this recruiter
                jobs = await prisma.job.findMany({
                    ...baseQuery,
                    where: {
                        ...baseQuery.where,
                        assignedRecruiterId: userId,
                    },
                });
                break;
            default:
                jobs = [];
        }
        // Map to Job type with counts
        return jobs.map((j) => {
            const candidateCount = j._count?.jobCandidates ?? 0;
            // Count candidates in interview stages
            const interviewStages = ['Interview', 'Selected'];
            const interviewCount = j.jobCandidates?.filter((jc) => jc.currentStage && interviewStages.includes(jc.currentStage.name)).length ?? 0;
            // Count candidates in offer stage
            const offerCount = j.jobCandidates?.filter((jc) => jc.currentStage && jc.currentStage.name === 'Offer').length ?? 0;
            return {
                id: j.id,
                companyId: j.companyId,
                title: j.title,
                department: j.department,
                // Experience range
                experienceMin: j.experienceMin ?? undefined,
                experienceMax: j.experienceMax ?? undefined,
                // Salary range
                salaryMin: j.salaryMin ?? undefined,
                salaryMax: j.salaryMax ?? undefined,
                variables: j.variables ?? undefined,
                // Requirements
                educationQualification: j.educationQualification ?? undefined,
                ageUpTo: j.ageUpTo ?? undefined,
                skills: Array.isArray(j.skills) ? j.skills : [],
                preferredIndustry: j.preferredIndustry ?? undefined,
                // Work details
                workMode: j.workMode ?? undefined,
                locations: Array.isArray(j.locations) ? j.locations : [],
                priority: j.priority ?? undefined,
                jobDomain: j.jobDomain ?? undefined,
                // Assignment
                assignedRecruiterId: j.assignedRecruiterId ?? undefined,
                // Content
                description: j.description ?? '',
                status: j.status,
                openings: j.openings,
                createdAt: j.createdAt,
                updatedAt: j.updatedAt,
                // Legacy fields
                location: j.location ?? undefined,
                employmentType: j.employmentType ?? undefined,
                salaryRange: j.salaryRange ?? undefined,
                // Counts - these were missing!
                candidateCount,
                interviewCount,
                offerCount,
            };
        });
    },
};
/**
 * Middleware helper to check job access and throw error if unauthorized
 * Requirements: 4.2, 4.3, 4.4
 */
export async function requireJobAccess(jobId, userId, userRole) {
    const hasAccess = await jobAccessControlService.validateJobAccess(jobId, userId, userRole);
    if (!hasAccess) {
        throw new AuthorizationError();
    }
}
export default jobAccessControlService;
//# sourceMappingURL=jobAccessControl.service.js.map