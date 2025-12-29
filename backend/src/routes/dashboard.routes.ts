import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AnalyticsService } from '../services/analytics.service.js';
import prisma from '../lib/prisma.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { ValidationError } from '../middleware/errorHandler.js';

const router = Router();
const analyticsService = new AnalyticsService();

// Validation schemas
const dashboardFiltersSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  departmentId: z.string().optional(),
  locationId: z.string().optional(),
  jobId: z.string().optional(),
  recruiterId: z.string().optional(),
});

const interviewPeriodSchema = z.object({
  period: z.enum(['today', 'week']).default('today'),
});

/**
 * GET /api/dashboard
 * Get aggregated dashboard data including KPIs, pipeline, and activity
 * Requirements: 1.1, 3.1, 4.1, 20.1
 */
router.get(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const filtersResult = dashboardFiltersSchema.safeParse(req.query);
      if (!filtersResult.success) {
        throw new ValidationError({
          filters: filtersResult.error.issues.map(issue => issue.message)
        });
      }

      const filters = {
        ...filtersResult.data,
        startDate: filtersResult.data.startDate ? new Date(filtersResult.data.startDate) : undefined,
        endDate: filtersResult.data.endDate ? new Date(filtersResult.data.endDate) : undefined,
      };

      // Get KPI metrics with role-based filtering
      const kpis = await analyticsService.getKPIMetrics(
        req.user!.companyId,
        req.user!.userId,
        req.user!.role,
        filters
      );

      // Get role pipeline data (top 7 roles)
      const rolePipeline = await getRolePipelineData(
        req.user!.companyId,
        req.user!.userId,
        req.user!.role,
        7
      );

      // Get upcoming interviews (today, limit 5)
      const upcomingInterviews = await getUpcomingInterviews(
        req.user!.companyId,
        req.user!.userId,
        'today',
        5
      );

      // Get activity feed (limit 10)
      const activityFeed = await getActivityFeed(
        req.user!.companyId,
        10
      );

      // Get funnel data
      const funnelData = await analyticsService.getFunnelAnalytics(
        req.user!.companyId,
        req.user!.userId,
        req.user!.role,
        filters
      );

      // Get source performance data
      const sourceData = await analyticsService.getSourcePerformance(
        req.user!.companyId,
        req.user!.userId,
        req.user!.role,
        filters
      );

      // Get recruiter load data
      const recruiterData = await analyticsService.getRecruiterProductivity(
        req.user!.companyId,
        req.user!.userId,
        req.user!.role,
        filters
      );

      // Transform data to match frontend expectations
      const dashboardData = {
        metrics: {
          openRoles: kpis.activeRoles,
          activeCandidates: kpis.activeCandidates,
          interviewsToday: kpis.interviewsToday,
          interviewsThisWeek: kpis.interviewsThisWeek,
          offersPending: kpis.offersPending,
          totalHires: kpis.totalHires,
          timeToFillMedian: Math.round(kpis.avgTimeToFill),
          offerAcceptanceRate: Math.round(kpis.offerAcceptanceRate),
          rolesOnTrack: kpis.rolesOnTrack,
          rolesAtRisk: kpis.rolesAtRisk,
          rolesBreached: kpis.rolesBreached,
        },
        rolePipeline: rolePipeline.map(role => ({
          id: role.id,
          role: role.roleName,
          location: role.location,
          applicants: role.applicantCount,
          interview: role.interviewCount,
          offer: role.offerCount,
          age: role.age,
          sla: role.slaStatus,
          priority: role.priority,
        })),
        interviews: upcomingInterviews.map(interview => ({
          id: interview.id,
          time: new Date(interview.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          candidateName: interview.candidateName,
          role: interview.roleName,
          panelMembers: interview.panelMembers,
          meetingType: interview.meetingType === 'in_person' ? 'In-person' : 
                      interview.meetingType === 'google_meet' ? 'Google Meet' :
                      interview.meetingType === 'microsoft_teams' ? 'Microsoft Teams' :
                      interview.meetingType === 'custom_url' ? 'Custom Link' : 'In-person',
          meetingLink: interview.meetingLink,
        })),
        funnel: funnelData.stages.map(stage => ({
          name: stage.name,
          count: stage.count,
          percentage: stage.percentage,
        })),
        sources: sourceData.map(source => ({
          source: source.source,
          percentage: source.percentage,
        })),
        recruiterLoad: recruiterData.map(recruiter => ({
          name: recruiter.name,
          specialty: recruiter.specialty,
          activeRoles: recruiter.activeRoles,
          candidates: recruiter.cvsAdded,
        })),
        activities: activityFeed.map(activity => ({
          id: activity.id,
          timestamp: activity.timestamp,
          description: activity.description,
          entityType: activity.entityType,
          entityId: activity.entityId,
          entityName: activity.metadata?.candidateName || activity.metadata?.jobTitle || 'Unknown',
          activityType: activity.type,
        })),
        lastUpdated: new Date().toISOString(),
      };

      res.json(dashboardData);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/dashboard/kpis
 * Get KPI metrics with role-based filtering
 * Requirements: 1.1, 1.2, 1.3
 */
router.get(
  '/kpis',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const filtersResult = dashboardFiltersSchema.safeParse(req.query);
      if (!filtersResult.success) {
        throw new ValidationError({
          filters: filtersResult.error.issues.map(issue => issue.message)
        });
      }

      const filters = {
        ...filtersResult.data,
        startDate: filtersResult.data.startDate ? new Date(filtersResult.data.startDate) : undefined,
        endDate: filtersResult.data.endDate ? new Date(filtersResult.data.endDate) : undefined,
      };

      const kpis = await analyticsService.getKPIMetrics(
        req.user!.companyId,
        req.user!.userId,
        req.user!.role,
        filters
      );

      res.json(kpis);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/dashboard/pipeline
 * Get role pipeline data with SLA status and sorting
 * Requirements: 3.1, 3.2, 3.3, 3.5, 3.6
 */
router.get(
  '/pipeline',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { limit = '7', sortBy = 'priority', sortOrder = 'desc' } = req.query;
      
      const rolePipeline = await getRolePipelineData(
        req.user!.companyId,
        req.user!.userId,
        req.user!.role,
        parseInt(limit as string),
        sortBy as string,
        sortOrder as 'asc' | 'desc'
      );

      res.json(rolePipeline);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/dashboard/interviews
 * Get upcoming interviews with period filtering
 * Requirements: 4.1, 4.2, 4.4, 4.6
 */
router.get(
  '/interviews',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const periodResult = interviewPeriodSchema.safeParse(req.query);
      if (!periodResult.success) {
        throw new ValidationError({
          period: periodResult.error.issues.map(issue => issue.message)
        });
      }

      const { limit = '5' } = req.query;
      const { period } = periodResult.data;

      const interviews = await getUpcomingInterviews(
        req.user!.companyId,
        req.user!.userId,
        period,
        parseInt(limit as string)
      );

      res.json(interviews);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/dashboard/activity
 * Get recent activity feed
 * Requirements: 20.1, 20.2, 20.3, 20.4
 */
router.get(
  '/activity',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { limit = '10', type } = req.query;

      const activityFeed = await getActivityFeed(
        req.user!.companyId,
        parseInt(limit as string),
        type as string
      );

      res.json(activityFeed);
    } catch (error) {
      next(error);
    }
  }
);

// Helper functions

/**
 * Get role pipeline data with SLA status calculation
 */
async function getRolePipelineData(
  companyId: string,
  userId: string,
  userRole: string,
  limit: number = 7,
  sortBy: string = 'priority',
  sortOrder: 'asc' | 'desc' = 'desc'
) {
  // Build where clause for role-based filtering
  const whereClause: any = {
    companyId,
    status: 'active',
  };

  // Apply role-based filtering
  if (userRole === 'recruiter') {
    whereClause.assignedRecruiterId = userId;
  }

  // Get active jobs with candidate counts
  const jobs = await prisma.job.findMany({
    where: whereClause,
    include: {
      _count: {
        select: {
          jobCandidates: true,
        }
      },
      jobCandidates: {
        include: {
          candidate: true,
          interviews: true,
        }
      }
    },
    orderBy: sortBy === 'age' ? { createdAt: 'asc' } : 
              sortBy === 'priority' ? { priority: sortOrder } :
              { [sortBy]: sortOrder },
  });

  // Calculate pipeline data for each job
  const pipelineData = jobs.map(job => {
    const now = new Date();
    const ageInDays = Math.floor((now.getTime() - job.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate offer count (candidates in offer stages)
    const offerCount = job.jobCandidates.filter(jc => 
      jc.currentStageId && jc.currentStageId.includes('offer')
    ).length;

    // Calculate interview count from job candidates
    const interviewCount = job.jobCandidates.reduce((count, jc) => 
      count + jc.interviews.length, 0
    );

    // Simple SLA calculation (30 days threshold)
    const slaThreshold = 30;
    let slaStatus: 'On track' | 'At risk' | 'Breached' = 'On track';
    
    if (ageInDays > slaThreshold) {
      slaStatus = 'Breached';
    } else if (ageInDays > slaThreshold - 3) {
      slaStatus = 'At risk';
    }

    return {
      id: job.id,
      roleName: job.title,
      location: Array.isArray(job.locations) ? (job.locations as string[])[0] : job.location || 'Not specified',
      applicantCount: job._count.jobCandidates,
      interviewCount,
      offerCount,
      age: ageInDays,
      slaStatus,
      priority: job.priority || 'Medium',
    };
  });

  // Sort by relevance (priority and SLA status)
  const sortedData = pipelineData.sort((a, b) => {
    // First sort by SLA status (Breached > At risk > On track)
    const slaOrder = { 'Breached': 3, 'At risk': 2, 'On track': 1 };
    const slaDiff = slaOrder[b.slaStatus] - slaOrder[a.slaStatus];
    if (slaDiff !== 0) return slaDiff;

    // Then by priority (High > Medium > Low)
    const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
    return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
  });

  return sortedData.slice(0, limit);
}

/**
 * Get upcoming interviews with period filtering
 */
async function getUpcomingInterviews(
  companyId: string,
  userId: string,
  period: 'today' | 'week',
  limit: number = 5
) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const dateRange = period === 'today' 
    ? { gte: startOfToday, lt: endOfToday }
    : { gte: startOfWeek, lt: endOfWeek };

  const interviews = await prisma.interview.findMany({
    where: {
      jobCandidate: {
        job: {
          companyId,
        }
      },
      scheduledAt: dateRange,
      status: { not: 'cancelled' },
    },
    include: {
      jobCandidate: {
        include: {
          candidate: {
            select: {
              id: true,
              name: true,
            }
          },
          job: {
            select: {
              id: true,
              title: true,
            }
          }
        }
      },
      panelMembers: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      }
    },
    orderBy: { scheduledAt: 'asc' },
    take: limit,
  });

  return interviews.map(interview => ({
    id: interview.id,
    time: interview.scheduledAt,
    candidateName: interview.jobCandidate?.candidate?.name || 'Unknown',
    roleName: interview.jobCandidate?.job?.title || 'Unknown',
    panelMembers: interview.panelMembers.map(p => p.user.name),
    meetingType: interview.mode || 'in_person',
    meetingLink: interview.meetingLink,
    status: interview.status,
  }));
}

/**
 * Get activity feed with type filtering
 */
async function getActivityFeed(
  companyId: string,
  limit: number = 10,
  type?: string
) {
  // For now, we'll create a simple activity feed from recent stage changes
  // In a real implementation, you'd have a dedicated activity/audit log table
  
  const recentStageChanges = await prisma.stageHistory.findMany({
    where: {
      jobCandidate: {
        job: {
          companyId,
        }
      }
    },
    include: {
      jobCandidate: {
        include: {
          candidate: {
            select: {
              id: true,
              name: true,
            }
          },
          job: {
            select: {
              id: true,
              title: true,
            }
          }
        }
      }
    },
    orderBy: { enteredAt: 'desc' },
    take: limit,
  });

  return recentStageChanges.map(change => ({
    id: change.id,
    timestamp: change.enteredAt,
    description: `${change.jobCandidate.candidate?.name || 'Unknown candidate'} moved to ${change.stageName || 'Unknown stage'}`,
    type: 'stage_change',
    entityType: 'candidate',
    entityId: change.jobCandidate.candidateId,
    relatedEntityType: 'job',
    relatedEntityId: change.jobCandidate.jobId,
    metadata: {
      candidateName: change.jobCandidate.candidate?.name,
      jobTitle: change.jobCandidate.job?.title,
      stageName: change.stageName,
    }
  }));
}

export default router;