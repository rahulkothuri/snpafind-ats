import prisma from '../lib/prisma.js';
import type { UserRole } from '../types/index.js';

// Analytics Filter Interface
export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  departmentId?: string;
  locationId?: string;
  jobId?: string;
  recruiterId?: string;
}

// KPI Metrics Interface (Requirements 1.1, 1.4)
export interface KPIMetrics {
  activeRoles: number;
  activeCandidates: number;
  interviewsToday: number;
  interviewsThisWeek: number;
  offersPending: number;
  totalHires: number;
  avgTimeToFill: number;
  offerAcceptanceRate: number;
  rolesOnTrack: number;
  rolesAtRisk: number;
  rolesBreached: number;
}

// Funnel Data Interface (Requirements 2.1, 2.2, 2.5)
export interface FunnelStage {
  id: string;
  name: string;
  count: number;
  percentage: number;
  conversionToNext: number;
  avgDaysInStage: number;
}

export interface FunnelData {
  stages: FunnelStage[];
  totalApplicants: number;
  totalHired: number;
  overallConversionRate: number;
}

export interface ConversionData {
  stages: {
    fromStage: string;
    toStage: string;
    conversionRate: number;
    dropOffCount: number;
  }[];
}

// Time Analytics Interfaces (Requirements 6.1, 6.2, 6.3, 7.1, 7.2)
export interface TimeToFillData {
  overall: {
    average: number;
    median: number;
    target: number;
  };
  byDepartment: {
    department: string;
    average: number;
    count: number;
  }[];
  byRole: {
    roleId: string;
    roleName: string;
    average: number;
    isOverTarget: boolean;
  }[];
}

export interface TimeInStageData {
  stages: {
    stageName: string;
    avgDays: number;
    isBottleneck: boolean;
  }[];
  bottleneckStage: string;
  suggestion: string;
}

// Source Analytics Interface (Requirements 5.1, 5.2, 5.4)
export interface SourceData {
  source: string;
  candidateCount: number;
  percentage: number;
  hireCount: number;
  hireRate: number;
  avgTimeToHire: number;
}

// Team Performance Interfaces (Requirements 11.1, 11.2, 12.1, 12.2)
export interface RecruiterData {
  id: string;
  name: string;
  specialty: string;
  activeRoles: number;
  cvsAdded: number;
  interviewsScheduled: number;
  offersMade: number;
  hires: number;
  avgTimeToFill: number;
  productivityScore: number;
}

export interface PanelData {
  panelName: string;
  interviewRounds: number;
  offerPercentage: number;
  topRejectionReason: string;
  avgFeedbackTime: number;
}

// Drop-off Analysis Interfaces (Requirements 10.1, 10.2, 10.3)
export interface DropOffData {
  byStage: {
    stageName: string;
    dropOffCount: number;
    dropOffPercentage: number;
  }[];
  highestDropOffStage: string;
}

export interface RejectionData {
  reasons: {
    reason: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  topStageForRejection: string;
}

// Offer Analytics Interface (Requirements 8.1, 8.2, 8.3)
export interface OfferData {
  overall: {
    acceptanceRate: number;
    totalOffers: number;
    acceptedOffers: number;
  };
  byDepartment: {
    department: string;
    acceptanceRate: number;
    totalOffers: number;
    acceptedOffers: number;
  }[];
  byRole: {
    roleId: string;
    roleName: string;
    acceptanceRate: number;
    totalOffers: number;
    acceptedOffers: number;
    isUnderThreshold: boolean;
  }[];
}

// SLA Analytics Interface (Requirements 19.1, 19.2)
export interface SLAStatusData {
  summary: {
    onTrack: number;
    atRisk: number;
    breached: number;
  };
  roles: {
    roleId: string;
    roleName: string;
    status: 'on_track' | 'at_risk' | 'breached';
    daysOpen: number;
    threshold: number;
    candidatesBreaching: number;
  }[];
}

// Analytics Service Class
export class AnalyticsService {
  
  /**
   * Get KPI metrics for dashboard (Requirements 1.1, 1.2, 1.3)
   */
  async getKPIMetrics(companyId: string, userId: string, userRole: UserRole, filters: AnalyticsFilters = {}): Promise<KPIMetrics> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());

    // Build base where clause for role-based filtering
    const baseJobWhere = this.buildJobWhereClause(companyId, userId, userRole, filters);

    // Active roles count
    const activeRoles = await prisma.job.count({
      where: {
        ...baseJobWhere,
        status: 'active'
      }
    });

    // Active candidates count (candidates in active jobs)
    const activeCandidates = await prisma.jobCandidate.count({
      where: {
        job: baseJobWhere
      }
    });

    // Interviews today
    const interviewsToday = await prisma.interview.count({
      where: {
        scheduledAt: {
          gte: startOfToday,
          lt: new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)
        },
        jobCandidate: {
          job: baseJobWhere
        }
      }
    });

    // Interviews this week
    const interviewsThisWeek = await prisma.interview.count({
      where: {
        scheduledAt: {
          gte: startOfWeek,
          lt: new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)
        },
        jobCandidate: {
          job: baseJobWhere
        }
      }
    });

    // Offers pending (candidates in "Offer" stage)
    const offerStages = await prisma.pipelineStage.findMany({
      where: {
        job: baseJobWhere,
        name: 'Offer'
      },
      select: { id: true }
    });

    const offersPending = await prisma.jobCandidate.count({
      where: {
        currentStageId: {
          in: offerStages.map(stage => stage.id)
        },
        job: baseJobWhere
      }
    });

    // Total hires (candidates in "Hired" stage within date range)
    const hiredStages = await prisma.pipelineStage.findMany({
      where: {
        job: baseJobWhere,
        name: 'Hired'
      },
      select: { id: true }
    });

    const dateFilter = this.buildDateFilter(filters);
    const totalHires = await prisma.jobCandidate.count({
      where: {
        currentStageId: {
          in: hiredStages.map(stage => stage.id)
        },
        job: baseJobWhere,
        updatedAt: dateFilter
      }
    });

    // Average time-to-fill calculation
    const avgTimeToFill = await this.calculateAverageTimeToFill(companyId, userId, userRole, filters);

    // Offer acceptance rate calculation
    const offerAcceptanceRate = await this.calculateOfferAcceptanceRate(companyId, userId, userRole, filters);

    // SLA status counts
    const slaStatus = await this.getSLAStatusSummary(companyId, userId, userRole, filters);

    return {
      activeRoles,
      activeCandidates,
      interviewsToday,
      interviewsThisWeek,
      offersPending,
      totalHires,
      avgTimeToFill,
      offerAcceptanceRate,
      rolesOnTrack: slaStatus.summary.onTrack,
      rolesAtRisk: slaStatus.summary.atRisk,
      rolesBreached: slaStatus.summary.breached
    };
  }

  /**
   * Get funnel analytics (Requirements 2.1, 2.2, 2.3)
   */
  async getFunnelAnalytics(companyId: string, userId: string, userRole: UserRole, filters: AnalyticsFilters = {}): Promise<FunnelData> {
    const baseJobWhere = this.buildJobWhereClause(companyId, userId, userRole, filters);
    const dateFilter = this.buildDateFilter(filters);

    // Get all pipeline stages for jobs in scope, ordered by position
    const stages = await prisma.pipelineStage.findMany({
      where: {
        job: baseJobWhere
      },
      select: {
        id: true,
        name: true,
        position: true,
        jobId: true
      },
      orderBy: [
        { position: 'asc' }
      ]
    });

    // Get job candidates with date filtering if specified
    const candidateWhere: any = {
      job: baseJobWhere
    };

    if (dateFilter) {
      candidateWhere.appliedAt = dateFilter;
    }

    const jobCandidates = await prisma.jobCandidate.findMany({
      where: candidateWhere,
      select: {
        id: true,
        currentStageId: true,
        appliedAt: true
      }
    });

    // Group stages by name and position to handle multiple jobs
    const stageGroups = new Map<string, { position: number; stageIds: string[]; count: number }>();
    
    stages.forEach(stage => {
      const existing = stageGroups.get(stage.name);
      if (!existing) {
        stageGroups.set(stage.name, {
          position: stage.position,
          stageIds: [stage.id],
          count: 0
        });
      } else {
        existing.stageIds.push(stage.id);
      }
    });

    // Count candidates in each stage group
    jobCandidates.forEach(candidate => {
      for (const [stageName, stageGroup] of Array.from(stageGroups.entries())) {
        if (stageGroup.stageIds.includes(candidate.currentStageId)) {
          stageGroup.count++;
          break;
        }
      }
    });

    // Calculate stage history for time-in-stage (only for completed stages)
    const stageHistoryWhere: any = {
      jobCandidate: {
        job: baseJobWhere
      },
      exitedAt: {
        not: null
      }
    };

    if (dateFilter) {
      stageHistoryWhere.enteredAt = dateFilter;
    }

    const stageHistory = await prisma.stageHistory.groupBy({
      by: ['stageName'],
      where: stageHistoryWhere,
      _avg: {
        durationHours: true
      }
    });

    const stageTimeMap = new Map<string, number>();
    stageHistory.forEach(history => {
      if (history._avg.durationHours) {
        stageTimeMap.set(history.stageName, Math.round(history._avg.durationHours / 24 * 10) / 10); // Convert to days, round to 1 decimal
      }
    });

    // Sort stage groups by position and build funnel stages
    const sortedStageGroups = Array.from(stageGroups.entries())
      .sort(([, a], [, b]) => a.position - b.position);

    const totalApplicants = jobCandidates.length;
    const funnelStages: FunnelStage[] = [];

    sortedStageGroups.forEach(([stageName, stageGroup], index) => {
      const count = stageGroup.count;
      const percentage = totalApplicants > 0 ? Math.round((count / totalApplicants) * 100 * 10) / 10 : 0;
      
      // Calculate conversion to next stage
      let conversionToNext = 0;
      if (index < sortedStageGroups.length - 1) {
        const nextStageGroup = sortedStageGroups[index + 1][1];
        conversionToNext = count > 0 ? Math.round((nextStageGroup.count / count) * 100 * 10) / 10 : 0;
      }

      funnelStages.push({
        id: stageGroup.stageIds[0], // Use first stage ID as representative
        name: stageName,
        count,
        percentage,
        conversionToNext,
        avgDaysInStage: stageTimeMap.get(stageName) || 0
      });
    });

    // Calculate total hired and overall conversion rate
    const hiredStage = funnelStages.find(stage => stage.name.toLowerCase() === 'hired');
    const totalHired = hiredStage?.count || 0;
    const overallConversionRate = totalApplicants > 0 ? Math.round((totalHired / totalApplicants) * 100 * 10) / 10 : 0;

    return {
      stages: funnelStages,
      totalApplicants,
      totalHired,
      overallConversionRate
    };
  }

  /**
   * Get conversion rates between stages (Requirements 9.1, 9.2)
   */
  async getConversionRates(companyId: string, userId: string, userRole: UserRole, filters: AnalyticsFilters = {}): Promise<ConversionData> {
    // This will be implemented in a later task
    return {
      stages: []
    };
  }

  /**
   * Get time-to-fill analytics (Requirements 6.1, 6.2, 6.3, 6.4, 6.6)
   */
  async getTimeToFill(companyId: string, userId: string, userRole: UserRole, filters: AnalyticsFilters = {}): Promise<TimeToFillData> {
    const baseJobWhere = this.buildJobWhereClause(companyId, userId, userRole, filters);
    const dateFilter = this.buildDateFilter(filters);
    
    // Default target threshold (30 days)
    const defaultTarget = 30;

    // Get hired candidates with their job creation dates and hire dates
    const candidateWhere: any = {
      job: baseJobWhere,
      currentStage: {
        name: 'Hired'
      }
    };

    if (dateFilter) {
      candidateWhere.updatedAt = dateFilter;
    }

    const hiredCandidates = await prisma.jobCandidate.findMany({
      where: candidateWhere,
      select: {
        id: true,
        updatedAt: true, // When they were moved to hired stage
        job: {
          select: {
            id: true,
            title: true,
            department: true,
            createdAt: true
          }
        }
      }
    });

    if (hiredCandidates.length === 0) {
      return {
        overall: {
          average: 0,
          median: 0,
          target: defaultTarget
        },
        byDepartment: [],
        byRole: []
      };
    }

    // Calculate time-to-fill for each hired candidate
    const timeToFillData = hiredCandidates.map(candidate => {
      const timeDiff = candidate.updatedAt.getTime() - candidate.job.createdAt.getTime();
      const days = Math.round(timeDiff / (1000 * 60 * 60 * 24));
      return {
        candidateId: candidate.id,
        jobId: candidate.job.id,
        jobTitle: candidate.job.title,
        department: candidate.job.department,
        days: Math.max(0, days) // Ensure non-negative
      };
    });

    // Calculate overall metrics
    const allDays = timeToFillData.map(d => d.days);
    const average = Math.round(allDays.reduce((sum, days) => sum + days, 0) / allDays.length);
    
    // Calculate median
    const sortedDays = [...allDays].sort((a, b) => a - b);
    const median = sortedDays.length % 2 === 0
      ? Math.round((sortedDays[sortedDays.length / 2 - 1] + sortedDays[sortedDays.length / 2]) / 2)
      : sortedDays[Math.floor(sortedDays.length / 2)];

    // Group by department
    const departmentGroups = new Map<string, number[]>();
    timeToFillData.forEach(data => {
      if (!departmentGroups.has(data.department)) {
        departmentGroups.set(data.department, []);
      }
      departmentGroups.get(data.department)!.push(data.days);
    });

    const byDepartment = Array.from(departmentGroups.entries()).map(([department, days]) => ({
      department,
      average: Math.round(days.reduce((sum, d) => sum + d, 0) / days.length),
      count: days.length
    }));

    // Group by role (job)
    const roleGroups = new Map<string, { title: string; days: number[] }>();
    timeToFillData.forEach(data => {
      if (!roleGroups.has(data.jobId)) {
        roleGroups.set(data.jobId, { title: data.jobTitle, days: [] });
      }
      roleGroups.get(data.jobId)!.days.push(data.days);
    });

    const byRole = Array.from(roleGroups.entries()).map(([roleId, roleData]) => {
      const roleAverage = Math.round(roleData.days.reduce((sum, d) => sum + d, 0) / roleData.days.length);
      return {
        roleId,
        roleName: roleData.title,
        average: roleAverage,
        isOverTarget: roleAverage > defaultTarget
      };
    });

    return {
      overall: {
        average,
        median,
        target: defaultTarget
      },
      byDepartment,
      byRole
    };
  }

  /**
   * Get time-in-stage analytics (Requirements 7.1, 7.2, 7.3, 7.4, 7.6)
   */
  async getTimeInStage(companyId: string, userId: string, userRole: UserRole, filters: AnalyticsFilters = {}): Promise<TimeInStageData> {
    const baseJobWhere = this.buildJobWhereClause(companyId, userId, userRole, filters);
    const dateFilter = this.buildDateFilter(filters);

    // Get stage history for completed stages (exitedAt is not null)
    const stageHistoryWhere: any = {
      jobCandidate: {
        job: baseJobWhere
      },
      exitedAt: {
        not: null
      },
      durationHours: {
        not: null
      }
    };

    if (dateFilter) {
      stageHistoryWhere.enteredAt = dateFilter;
    }

    const stageHistory = await prisma.stageHistory.groupBy({
      by: ['stageName'],
      where: stageHistoryWhere,
      _avg: {
        durationHours: true
      },
      _count: {
        id: true
      }
    });

    if (stageHistory.length === 0) {
      return {
        stages: [],
        bottleneckStage: '',
        suggestion: 'No stage history data available for the selected criteria.'
      };
    }

    // Convert to days and build stage data
    const stages = stageHistory.map(history => {
      const avgDays = history._avg.durationHours 
        ? Math.round((history._avg.durationHours / 24) * 10) / 10 // Convert hours to days, round to 1 decimal
        : 0;
      
      return {
        stageName: history.stageName,
        avgDays,
        isBottleneck: false, // Will be set below
        count: history._count.id
      };
    }).filter(stage => stage.avgDays > 0); // Only include stages with positive duration

    if (stages.length === 0) {
      return {
        stages: [],
        bottleneckStage: '',
        suggestion: 'No completed stage transitions found for the selected criteria.'
      };
    }

    // Find bottleneck stage (longest average time)
    const bottleneckStage = stages.reduce((max, current) => 
      current.avgDays > max.avgDays ? current : max
    );

    // Mark bottleneck stage
    stages.forEach(stage => {
      stage.isBottleneck = stage.stageName === bottleneckStage.stageName;
    });

    // Generate actionable suggestion based on bottleneck
    let suggestion = '';
    const bottleneckDays = bottleneckStage.avgDays;
    
    if (bottleneckDays > 14) {
      suggestion = `The "${bottleneckStage.stageName}" stage is taking ${bottleneckDays} days on average, which is significantly longer than other stages. Consider streamlining this process or adding more resources to reduce delays.`;
    } else if (bottleneckDays > 7) {
      suggestion = `The "${bottleneckStage.stageName}" stage is taking ${bottleneckDays} days on average. This could be optimized by setting clearer timelines or improving communication with stakeholders.`;
    } else if (bottleneckDays > 3) {
      suggestion = `The "${bottleneckStage.stageName}" stage is taking ${bottleneckDays} days on average. Consider if this timeline can be reduced while maintaining quality.`;
    } else {
      suggestion = `Your pipeline stages are moving efficiently. The longest stage "${bottleneckStage.stageName}" takes only ${bottleneckDays} days on average.`;
    }

    // Sort stages by average days (descending) for better visualization
    stages.sort((a, b) => b.avgDays - a.avgDays);

    return {
      stages: stages.map(({ count, ...stage }) => stage), // Remove count from final output
      bottleneckStage: bottleneckStage.stageName,
      suggestion
    };
  }

  /**
   * Get source performance analytics (Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6)
   */
  async getSourcePerformance(companyId: string, userId: string, userRole: UserRole, filters: AnalyticsFilters = {}): Promise<SourceData[]> {
    const baseJobWhere = this.buildJobWhereClause(companyId, userId, userRole, filters);
    const dateFilter = this.buildDateFilter(filters);

    // Get all candidates with their sources
    const candidateWhere: any = {
      job: baseJobWhere
    };

    if (dateFilter) {
      candidateWhere.appliedAt = dateFilter;
    }

    const candidates = await prisma.jobCandidate.findMany({
      where: candidateWhere,
      select: {
        id: true,
        appliedAt: true,
        updatedAt: true,
        candidate: {
          select: {
            source: true
          }
        },
        currentStage: {
          select: {
            name: true
          }
        },
        job: {
          select: {
            createdAt: true
          }
        }
      }
    });

    if (candidates.length === 0) {
      return [];
    }

    // Group candidates by source
    const sourceGroups = new Map<string, {
      candidates: typeof candidates;
      hiredCandidates: typeof candidates;
    }>();

    candidates.forEach(candidate => {
      const source = candidate.candidate.source || 'Unknown';
      
      if (!sourceGroups.has(source)) {
        sourceGroups.set(source, {
          candidates: [],
          hiredCandidates: []
        });
      }

      const group = sourceGroups.get(source)!;
      group.candidates.push(candidate);

      // Check if candidate is hired
      if (candidate.currentStage?.name === 'Hired') {
        group.hiredCandidates.push(candidate);
      }
    });

    // Calculate metrics for each source
    const sourceData: SourceData[] = [];
    const totalCandidates = candidates.length;

    for (const [source, group] of Array.from(sourceGroups.entries())) {
      const candidateCount = group.candidates.length;
      const hireCount = group.hiredCandidates.length;
      
      // Exclude sources with zero candidates (Requirements 5.5)
      if (candidateCount === 0) {
        continue;
      }

      const percentage = Math.round((candidateCount / totalCandidates) * 100 * 10) / 10;
      const hireRate = Math.round((hireCount / candidateCount) * 100 * 10) / 10;

      // Calculate average time to hire for hired candidates from this source
      let avgTimeToHire = 0;
      if (group.hiredCandidates.length > 0) {
        const totalTimeToHire = group.hiredCandidates.reduce((sum, candidate) => {
          const timeDiff = candidate.updatedAt.getTime() - candidate.job.createdAt.getTime();
          const days = Math.max(0, timeDiff / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0);
        avgTimeToHire = Math.round(totalTimeToHire / group.hiredCandidates.length);
      }

      sourceData.push({
        source,
        candidateCount,
        percentage,
        hireCount,
        hireRate,
        avgTimeToHire
      });
    }

    // Rank sources by effectiveness (hire rate) - Requirements 5.4
    sourceData.sort((a, b) => b.hireRate - a.hireRate);

    return sourceData;
  }

  /**
   * Get recruiter productivity analytics (Requirements 11.1, 11.2, 11.3)
   */
  async getRecruiterProductivity(companyId: string, userId: string, userRole: UserRole, filters: AnalyticsFilters = {}): Promise<RecruiterData[]> {
    // This will be implemented in a later task
    return [];
  }

  /**
   * Get panel performance analytics (Requirements 12.1, 12.2, 12.3)
   */
  async getPanelPerformance(companyId: string, userId: string, userRole: UserRole, filters: AnalyticsFilters = {}): Promise<PanelData[]> {
    // This will be implemented in a later task
    return [];
  }

  /**
   * Get drop-off analysis (Requirements 10.1, 10.2, 10.3)
   */
  async getDropOffAnalysis(companyId: string, userId: string, userRole: UserRole, filters: AnalyticsFilters = {}): Promise<DropOffData> {
    const baseJobWhere = this.buildJobWhereClause(companyId, userId, userRole, filters);
    const dateFilter = this.buildDateFilter(filters);

    // Get all pipeline stages for jobs in scope, ordered by position
    const stages = await prisma.pipelineStage.findMany({
      where: {
        job: baseJobWhere
      },
      select: {
        id: true,
        name: true,
        position: true
      },
      orderBy: {
        position: 'asc'
      }
    });

    // Group stages by name and position
    const stageGroups = new Map<string, { position: number; stageIds: string[] }>();
    stages.forEach(stage => {
      const existing = stageGroups.get(stage.name);
      if (!existing) {
        stageGroups.set(stage.name, {
          position: stage.position,
          stageIds: [stage.id]
        });
      } else {
        existing.stageIds.push(stage.id);
      }
    });

    // Get stage history for candidates who exited stages (drop-offs)
    const stageHistoryWhere: any = {
      jobCandidate: {
        job: baseJobWhere
      },
      exitedAt: {
        not: null
      }
    };

    if (dateFilter) {
      stageHistoryWhere.enteredAt = dateFilter;
    }

    const stageHistory = await prisma.stageHistory.findMany({
      where: stageHistoryWhere,
      select: {
        stageName: true,
        jobCandidateId: true,
        comment: true
      }
    });

    // Get current candidates to calculate total who reached each stage
    const candidateWhere: any = {
      job: baseJobWhere
    };

    if (dateFilter) {
      candidateWhere.appliedAt = dateFilter;
    }

    const currentCandidates = await prisma.jobCandidate.findMany({
      where: candidateWhere,
      select: {
        id: true,
        currentStageId: true
      }
    });

    // Calculate candidates who reached each stage (historical + current)
    const stageReachCounts = new Map<string, Set<string>>();
    
    // Add historical candidates
    stageHistory.forEach(history => {
      if (!stageReachCounts.has(history.stageName)) {
        stageReachCounts.set(history.stageName, new Set());
      }
      stageReachCounts.get(history.stageName)!.add(history.jobCandidateId);
    });

    // Add current candidates
    currentCandidates.forEach(candidate => {
      for (const [stageName, stageGroup] of Array.from(stageGroups.entries())) {
        if (stageGroup.stageIds.includes(candidate.currentStageId)) {
          if (!stageReachCounts.has(stageName)) {
            stageReachCounts.set(stageName, new Set());
          }
          stageReachCounts.get(stageName)!.add(candidate.id);
          break;
        }
      }
    });

    // Calculate drop-offs by stage
    const dropOffsByStage = new Map<string, number>();
    stageHistory.forEach(history => {
      const current = dropOffsByStage.get(history.stageName) || 0;
      dropOffsByStage.set(history.stageName, current + 1);
    });

    // Build drop-off analysis
    const sortedStageGroups = Array.from(stageGroups.entries())
      .sort(([, a], [, b]) => a.position - b.position);

    const byStage = sortedStageGroups.map(([stageName, stageGroup]) => {
      const dropOffCount = dropOffsByStage.get(stageName) || 0;
      const totalReached = stageReachCounts.get(stageName)?.size || 0;
      const dropOffPercentage = totalReached > 0 ? Math.round((dropOffCount / totalReached) * 100 * 10) / 10 : 0;

      return {
        stageName,
        dropOffCount,
        dropOffPercentage
      };
    });

    // Find stage with highest drop-off percentage
    const highestDropOffStage = byStage.reduce((max, current) => 
      current.dropOffPercentage > max.dropOffPercentage ? current : max,
      byStage[0] || { stageName: '', dropOffPercentage: 0 }
    ).stageName;

    return {
      byStage,
      highestDropOffStage
    };
  }

  /**
   * Get rejection reasons analysis (Requirements 10.2, 10.5)
   */
  async getRejectionReasons(companyId: string, userId: string, userRole: UserRole, filters: AnalyticsFilters = {}): Promise<RejectionData> {
    const baseJobWhere = this.buildJobWhereClause(companyId, userId, userRole, filters);
    const dateFilter = this.buildDateFilter(filters);

    // Get stage history with rejection comments
    const stageHistoryWhere: any = {
      jobCandidate: {
        job: baseJobWhere
      },
      exitedAt: {
        not: null
      },
      comment: {
        not: null
      }
    };

    if (dateFilter) {
      stageHistoryWhere.enteredAt = dateFilter;
    }

    const rejectionHistory = await prisma.stageHistory.findMany({
      where: stageHistoryWhere,
      select: {
        stageName: true,
        comment: true
      }
    });

    // Categorize rejection reasons (Requirements 10.5)
    const reasonCategories = {
      'Skill mismatch': ['skill', 'technical', 'experience', 'qualification', 'competency', 'ability'],
      'Compensation mismatch': ['salary', 'compensation', 'pay', 'package', 'benefits', 'ctc'],
      'Culture fit': ['culture', 'fit', 'attitude', 'personality', 'team', 'values'],
      'Location/notice/other': ['location', 'notice', 'availability', 'other', 'personal', 'family']
    };

    const categorizedReasons = new Map<string, number>();
    const stageRejectionCounts = new Map<string, number>();

    // Initialize categories
    Object.keys(reasonCategories).forEach(category => {
      categorizedReasons.set(category, 0);
    });

    // Process each rejection
    rejectionHistory.forEach(rejection => {
      const comment = rejection.comment?.toLowerCase() || '';
      let categorized = false;

      // Count rejections by stage
      const currentCount = stageRejectionCounts.get(rejection.stageName) || 0;
      stageRejectionCounts.set(rejection.stageName, currentCount + 1);

      // Categorize the rejection reason
      for (const [category, keywords] of Object.entries(reasonCategories)) {
        if (keywords.some(keyword => comment.includes(keyword))) {
          const current = categorizedReasons.get(category) || 0;
          categorizedReasons.set(category, current + 1);
          categorized = true;
          break;
        }
      }

      // If not categorized, put in "Location/notice/other"
      if (!categorized) {
        const current = categorizedReasons.get('Location/notice/other') || 0;
        categorizedReasons.set('Location/notice/other', current + 1);
      }
    });

    // Calculate total rejections
    const totalRejections = Array.from(categorizedReasons.values()).reduce((sum, count) => sum + count, 0);

    // Build reasons array with colors
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
    const reasons = Array.from(categorizedReasons.entries()).map(([reason, count], index) => ({
      reason,
      count,
      percentage: totalRejections > 0 ? Math.round((count / totalRejections) * 100 * 10) / 10 : 0,
      color: colors[index % colors.length]
    }));

    // Find stage with most rejections
    const topStageForRejection = Array.from(stageRejectionCounts.entries())
      .reduce((max, [stage, count]) => 
        count > max.count ? { stage, count } : max,
        { stage: '', count: 0 }
      ).stage;

    return {
      reasons,
      topStageForRejection
    };
  }

  /**
   * Get offer acceptance rate analytics (Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6)
   */
  async getOfferAcceptanceRate(companyId: string, userId: string, userRole: UserRole, filters: AnalyticsFilters = {}): Promise<OfferData> {
    const baseJobWhere = this.buildJobWhereClause(companyId, userId, userRole, filters);
    const dateFilter = this.buildDateFilter(filters);

    // Get offer and hired stages
    const offerStages = await prisma.pipelineStage.findMany({
      where: {
        job: baseJobWhere,
        name: 'Offer'
      },
      select: { id: true, jobId: true }
    });

    const hiredStages = await prisma.pipelineStage.findMany({
      where: {
        job: baseJobWhere,
        name: 'Hired'
      },
      select: { id: true, jobId: true }
    });

    const allOfferStageIds = [...offerStages.map(s => s.id), ...hiredStages.map(s => s.id)];
    const hiredStageIds = hiredStages.map(s => s.id);

    if (allOfferStageIds.length === 0) {
      return {
        overall: {
          acceptanceRate: 0,
          totalOffers: 0,
          acceptedOffers: 0
        },
        byDepartment: [],
        byRole: []
      };
    }

    // Get candidates in offer or hired stages with date filtering
    const candidateWhere: any = {
      currentStageId: {
        in: allOfferStageIds
      },
      job: baseJobWhere
    };

    if (dateFilter) {
      candidateWhere.updatedAt = dateFilter;
    }

    const offerCandidates = await prisma.jobCandidate.findMany({
      where: candidateWhere,
      select: {
        id: true,
        currentStageId: true,
        job: {
          select: {
            id: true,
            title: true,
            department: true
          }
        }
      }
    });

    if (offerCandidates.length === 0) {
      return {
        overall: {
          acceptanceRate: 0,
          totalOffers: 0,
          acceptedOffers: 0
        },
        byDepartment: [],
        byRole: []
      };
    }

    // Calculate overall metrics
    const totalOffers = offerCandidates.length;
    const acceptedOffers = offerCandidates.filter(candidate => 
      hiredStageIds.includes(candidate.currentStageId)
    ).length;
    const overallAcceptanceRate = Math.round((acceptedOffers / totalOffers) * 100 * 10) / 10;

    // Group by department (Requirements 8.2)
    const departmentGroups = new Map<string, { total: number; accepted: number }>();
    
    offerCandidates.forEach(candidate => {
      const department = candidate.job.department;
      
      if (!departmentGroups.has(department)) {
        departmentGroups.set(department, { total: 0, accepted: 0 });
      }

      const group = departmentGroups.get(department)!;
      group.total++;
      
      if (hiredStageIds.includes(candidate.currentStageId)) {
        group.accepted++;
      }
    });

    const byDepartment = Array.from(departmentGroups.entries()).map(([department, data]) => ({
      department,
      acceptanceRate: Math.round((data.accepted / data.total) * 100 * 10) / 10,
      totalOffers: data.total,
      acceptedOffers: data.accepted
    }));

    // Group by role (Requirements 8.3)
    const roleGroups = new Map<string, { 
      title: string; 
      total: number; 
      accepted: number; 
    }>();

    offerCandidates.forEach(candidate => {
      const roleId = candidate.job.id;
      const roleTitle = candidate.job.title;
      
      if (!roleGroups.has(roleId)) {
        roleGroups.set(roleId, { 
          title: roleTitle, 
          total: 0, 
          accepted: 0 
        });
      }

      const group = roleGroups.get(roleId)!;
      group.total++;
      
      if (hiredStageIds.includes(candidate.currentStageId)) {
        group.accepted++;
      }
    });

    const byRole = Array.from(roleGroups.entries()).map(([roleId, data]) => {
      const acceptanceRate = Math.round((data.accepted / data.total) * 100 * 10) / 10;
      
      return {
        roleId,
        roleName: data.title,
        acceptanceRate,
        totalOffers: data.total,
        acceptedOffers: data.accepted,
        isUnderThreshold: acceptanceRate < 70 // Flag rates below 70% threshold (Requirements 8.5)
      };
    });

    return {
      overall: {
        acceptanceRate: overallAcceptanceRate,
        totalOffers,
        acceptedOffers
      },
      byDepartment,
      byRole
    };
  }

  /**
   * Get SLA status analytics (Requirements 19.1, 19.2)
   */
  async getSLAStatus(companyId: string, userId: string, userRole: UserRole, filters: AnalyticsFilters = {}): Promise<SLAStatusData> {
    return this.getSLAStatusSummary(companyId, userId, userRole, filters);
  }

  // Private helper methods

  /**
   * Build job where clause for role-based filtering (Requirements 1.2, 1.3)
   */
  private buildJobWhereClause(companyId: string, userId: string, userRole: UserRole, filters: AnalyticsFilters) {
    const baseWhere: any = {
      companyId
    };

    // Role-based filtering
    if (userRole === 'recruiter') {
      baseWhere.assignedRecruiterId = userId;
    }

    // Apply additional filters
    if (filters.jobId) {
      baseWhere.id = filters.jobId;
    }

    if (filters.departmentId) {
      baseWhere.department = filters.departmentId;
    }

    if (filters.locationId) {
      // Location can be stored in either location field or locations JSON array
      baseWhere.OR = [
        { location: filters.locationId },
        { locations: { path: '$', array_contains: filters.locationId } }
      ];
    }

    if (filters.recruiterId && userRole !== 'recruiter') {
      baseWhere.assignedRecruiterId = filters.recruiterId;
    }

    return baseWhere;
  }

  /**
   * Build date filter for queries
   */
  private buildDateFilter(filters: AnalyticsFilters) {
    const dateFilter: any = {};

    if (filters.startDate) {
      dateFilter.gte = filters.startDate;
    }

    if (filters.endDate) {
      dateFilter.lte = filters.endDate;
    }

    return Object.keys(dateFilter).length > 0 ? dateFilter : undefined;
  }

  /**
   * Calculate average time-to-fill
   */
  private async calculateAverageTimeToFill(companyId: string, userId: string, userRole: UserRole, filters: AnalyticsFilters): Promise<number> {
    const baseJobWhere = this.buildJobWhereClause(companyId, userId, userRole, filters);
    
    // Get hired candidates with their job creation dates
    const hiredCandidates = await prisma.jobCandidate.findMany({
      where: {
        job: baseJobWhere,
        currentStage: {
          name: 'Hired'
        }
      },
      select: {
        updatedAt: true,
        job: {
          select: {
            createdAt: true
          }
        }
      }
    });

    if (hiredCandidates.length === 0) {
      return 0;
    }

    const totalDays = hiredCandidates.reduce((sum, candidate) => {
      const timeDiff = candidate.updatedAt.getTime() - candidate.job.createdAt.getTime();
      const days = timeDiff / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);

    return Math.round(totalDays / hiredCandidates.length);
  }

  /**
   * Calculate offer acceptance rate
   */
  private async calculateOfferAcceptanceRate(companyId: string, userId: string, userRole: UserRole, filters: AnalyticsFilters): Promise<number> {
    const baseJobWhere = this.buildJobWhereClause(companyId, userId, userRole, filters);

    // Get offer and hired stage counts
    const offerStages = await prisma.pipelineStage.findMany({
      where: {
        job: baseJobWhere,
        name: 'Offer'
      },
      select: { id: true }
    });

    const hiredStages = await prisma.pipelineStage.findMany({
      where: {
        job: baseJobWhere,
        name: 'Hired'
      },
      select: { id: true }
    });

    const totalOffers = await prisma.jobCandidate.count({
      where: {
        currentStageId: {
          in: [...offerStages.map(s => s.id), ...hiredStages.map(s => s.id)]
        },
        job: baseJobWhere
      }
    });

    const acceptedOffers = await prisma.jobCandidate.count({
      where: {
        currentStageId: {
          in: hiredStages.map(s => s.id)
        },
        job: baseJobWhere
      }
    });

    return totalOffers > 0 ? Math.round((acceptedOffers / totalOffers) * 100) : 0;
  }

  /**
   * Get SLA status summary
   */
  private async getSLAStatusSummary(companyId: string, userId: string, userRole: UserRole, filters: AnalyticsFilters): Promise<SLAStatusData> {
    const baseJobWhere = this.buildJobWhereClause(companyId, userId, userRole, filters);
    
    // Get active jobs with their age
    const jobs = await prisma.job.findMany({
      where: {
        ...baseJobWhere,
        status: 'active'
      },
      select: {
        id: true,
        title: true,
        createdAt: true
      }
    });

    // Default SLA threshold (30 days)
    const defaultThreshold = 30;
    const now = new Date();

    const roles: SLAStatusData['roles'] = [];
    let onTrack = 0;
    let atRisk = 0;
    let breached = 0;

    jobs.forEach(job => {
      const daysOpen = Math.floor((now.getTime() - job.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      let status: 'on_track' | 'at_risk' | 'breached';

      if (daysOpen > defaultThreshold) {
        status = 'breached';
        breached++;
      } else if (daysOpen > defaultThreshold - 3) {
        status = 'at_risk';
        atRisk++;
      } else {
        status = 'on_track';
        onTrack++;
      }

      roles.push({
        roleId: job.id,
        roleName: job.title,
        status,
        daysOpen,
        threshold: defaultThreshold,
        candidatesBreaching: 0 // Will be calculated in later implementation
      });
    });

    return {
      summary: {
        onTrack,
        atRisk,
        breached
      },
      roles
    };
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();