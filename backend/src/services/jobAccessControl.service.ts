import prisma from '../lib/prisma.js';
import { AuthorizationError } from '../middleware/errorHandler.js';
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
export const jobAccessControlService: JobAccessControlService = {
  /**
   * Filter jobs based on user role and assignments
   * Requirements: 1.1, 1.2, 1.3
   */
  filterJobsByUserRole(jobs: Job[], userId: string, userRole: UserRole): Job[] {
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
  async validateJobAccess(jobId: string, userId: string, userRole: UserRole): Promise<boolean> {
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
    } catch (error) {
      console.error('Error validating job access:', error);
      return false;
    }
  },

  /**
   * Get all jobs accessible to a user based on their role
   * Requirements: 4.1, 4.5
   */
  async getAccessibleJobs(userId: string, userRole: UserRole, companyId: string): Promise<Job[]> {
    const baseQuery = {
      where: { companyId },
      orderBy: { createdAt: 'desc' as const },
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

    let jobs: any[];

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
    return jobs.map((j: any) => ({
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
      skills: Array.isArray(j.skills) ? j.skills as string[] : [],
      preferredIndustry: j.preferredIndustry ?? undefined,
      
      // Work details
      workMode: j.workMode as any ?? undefined,
      locations: Array.isArray(j.locations) ? j.locations as string[] : [],
      priority: j.priority as any ?? undefined,
      jobDomain: j.jobDomain ?? undefined,
      
      // Assignment
      assignedRecruiterId: j.assignedRecruiterId ?? undefined,
      
      // Content
      description: j.description ?? '',
      status: j.status as 'active' | 'paused' | 'closed',
      openings: j.openings,
      createdAt: j.createdAt,
      updatedAt: j.updatedAt,
      
      // Legacy fields
      location: j.location ?? undefined,
      employmentType: j.employmentType ?? undefined,
      salaryRange: j.salaryRange ?? undefined,
    }));
  },
};

/**
 * Middleware helper to check job access and throw error if unauthorized
 * Requirements: 4.2, 4.3, 4.4
 */
export async function requireJobAccess(jobId: string, userId: string, userRole: UserRole): Promise<void> {
  const hasAccess = await jobAccessControlService.validateJobAccess(jobId, userId, userRole);
  if (!hasAccess) {
    throw new AuthorizationError();
  }
}

export default jobAccessControlService;