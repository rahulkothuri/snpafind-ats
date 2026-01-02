import prisma from '../lib/prisma.js';
// Analytics Service Class
export class AnalyticsService {
    /**
     * Get KPI metrics for dashboard (Requirements 1.1, 1.2, 1.3)
     */
    async getKPIMetrics(companyId, userId, userRole, filters = {}) {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
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
        // New candidates this month (candidates applied this month)
        const newCandidatesThisMonth = await prisma.jobCandidate.count({
            where: {
                job: baseJobWhere,
                appliedAt: {
                    gte: startOfMonth
                }
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
        // Total offers (candidates who reached Offer or Hired stage)
        const totalOffers = await prisma.jobCandidate.count({
            where: {
                currentStageId: {
                    in: [...offerStages.map(stage => stage.id), ...hiredStages.map(stage => stage.id)]
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
            newCandidatesThisMonth,
            interviewsToday,
            interviewsThisWeek,
            offersPending,
            totalHires,
            totalOffers,
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
    async getFunnelAnalytics(companyId, userId, userRole, filters = {}) {
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
        const candidateWhere = {
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
        const stageGroups = new Map();
        stages.forEach(stage => {
            const existing = stageGroups.get(stage.name);
            if (!existing) {
                stageGroups.set(stage.name, {
                    position: stage.position,
                    stageIds: [stage.id],
                    count: 0
                });
            }
            else {
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
        const stageHistoryWhere = {
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
        const stageTimeMap = new Map();
        stageHistory.forEach(history => {
            if (history._avg.durationHours) {
                stageTimeMap.set(history.stageName, Math.round(history._avg.durationHours / 24 * 10) / 10); // Convert to days, round to 1 decimal
            }
        });
        // Sort stage groups by position and build funnel stages
        const sortedStageGroups = Array.from(stageGroups.entries())
            .sort(([, a], [, b]) => a.position - b.position);
        const totalApplicants = jobCandidates.length;
        const funnelStages = [];
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
    async getConversionRates(companyId, userId, userRole, filters = {}) {
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
        const stageGroups = new Map();
        stages.forEach(stage => {
            const existing = stageGroups.get(stage.name);
            if (!existing) {
                stageGroups.set(stage.name, {
                    position: stage.position,
                    stageIds: [stage.id]
                });
            }
            else {
                existing.stageIds.push(stage.id);
            }
        });
        // Get candidates with date filtering if specified
        const candidateWhere = {
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
                stageHistory: {
                    where: {
                        exitedAt: {
                            not: null
                        }
                    },
                    orderBy: {
                        enteredAt: 'asc'
                    },
                    select: {
                        stageName: true,
                        enteredAt: true,
                        exitedAt: true
                    }
                }
            }
        });
        // Calculate conversions between consecutive stages
        const sortedStageGroups = Array.from(stageGroups.entries())
            .sort(([, a], [, b]) => a.position - b.position);
        const conversionStages = [];
        for (let i = 0; i < sortedStageGroups.length - 1; i++) {
            const [fromStageName] = sortedStageGroups[i];
            const [toStageName] = sortedStageGroups[i + 1];
            // Count candidates who reached the from stage
            let fromStageCount = 0;
            let toStageCount = 0;
            jobCandidates.forEach(candidate => {
                const stageSequence = candidate.stageHistory.map(h => h.stageName);
                // Check if candidate reached the from stage
                if (stageSequence.includes(fromStageName)) {
                    fromStageCount++;
                    // Check if they also reached the to stage after the from stage
                    const fromIndex = stageSequence.indexOf(fromStageName);
                    const toIndex = stageSequence.indexOf(toStageName);
                    if (toIndex > fromIndex) {
                        toStageCount++;
                    }
                }
            });
            const conversionRate = fromStageCount > 0
                ? Math.round((toStageCount / fromStageCount) * 100 * 10) / 10
                : 0;
            const dropOffCount = fromStageCount - toStageCount;
            conversionStages.push({
                fromStage: fromStageName,
                toStage: toStageName,
                conversionRate,
                dropOffCount: Math.max(0, dropOffCount)
            });
        }
        return {
            stages: conversionStages
        };
    }
    /**
     * Get time-to-fill analytics (Requirements 6.1, 6.2, 6.3, 6.4, 6.6)
     */
    async getTimeToFill(companyId, userId, userRole, filters = {}) {
        const baseJobWhere = this.buildJobWhereClause(companyId, userId, userRole, filters);
        const dateFilter = this.buildDateFilter(filters);
        // Default target threshold (30 days)
        const defaultTarget = 30;
        // Get hired candidates with their job creation dates and hire dates
        const candidateWhere = {
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
        const departmentGroups = new Map();
        timeToFillData.forEach(data => {
            if (!departmentGroups.has(data.department)) {
                departmentGroups.set(data.department, []);
            }
            departmentGroups.get(data.department).push(data.days);
        });
        const byDepartment = Array.from(departmentGroups.entries()).map(([department, days]) => ({
            department,
            average: Math.round(days.reduce((sum, d) => sum + d, 0) / days.length),
            count: days.length
        }));
        // Group by role (job)
        const roleGroups = new Map();
        timeToFillData.forEach(data => {
            if (!roleGroups.has(data.jobId)) {
                roleGroups.set(data.jobId, { title: data.jobTitle, days: [] });
            }
            roleGroups.get(data.jobId).days.push(data.days);
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
    async getTimeInStage(companyId, userId, userRole, filters = {}) {
        const baseJobWhere = this.buildJobWhereClause(companyId, userId, userRole, filters);
        const dateFilter = this.buildDateFilter(filters);
        // Get stage history for completed stages (exitedAt is not null)
        const stageHistoryWhere = {
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
        const bottleneckStage = stages.reduce((max, current) => current.avgDays > max.avgDays ? current : max);
        // Mark bottleneck stage
        stages.forEach(stage => {
            stage.isBottleneck = stage.stageName === bottleneckStage.stageName;
        });
        // Generate actionable suggestion based on bottleneck
        let suggestion = '';
        const bottleneckDays = bottleneckStage.avgDays;
        if (bottleneckDays > 14) {
            suggestion = `The "${bottleneckStage.stageName}" stage is taking ${bottleneckDays} days on average, which is significantly longer than other stages. Consider streamlining this process or adding more resources to reduce delays.`;
        }
        else if (bottleneckDays > 7) {
            suggestion = `The "${bottleneckStage.stageName}" stage is taking ${bottleneckDays} days on average. This could be optimized by setting clearer timelines or improving communication with stakeholders.`;
        }
        else if (bottleneckDays > 3) {
            suggestion = `The "${bottleneckStage.stageName}" stage is taking ${bottleneckDays} days on average. Consider if this timeline can be reduced while maintaining quality.`;
        }
        else {
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
    async getSourcePerformance(companyId, userId, userRole, filters = {}) {
        const baseJobWhere = this.buildJobWhereClause(companyId, userId, userRole, filters);
        const dateFilter = this.buildDateFilter(filters);
        // Get all candidates with their sources
        const candidateWhere = {
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
        const sourceGroups = new Map();
        candidates.forEach(candidate => {
            const source = candidate.candidate.source || 'Unknown';
            if (!sourceGroups.has(source)) {
                sourceGroups.set(source, {
                    candidates: [],
                    hiredCandidates: []
                });
            }
            const group = sourceGroups.get(source);
            group.candidates.push(candidate);
            // Check if candidate is hired
            if (candidate.currentStage?.name === 'Hired') {
                group.hiredCandidates.push(candidate);
            }
        });
        // Calculate metrics for each source
        const sourceData = [];
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
     * Get recruiter productivity analytics (Requirements 11.1, 11.2, 11.3, 11.4, 11.5)
     */
    async getRecruiterProductivity(companyId, userId, userRole, filters = {}) {
        const dateFilter = this.buildDateFilter(filters);
        // Role-based filtering: recruiters see only their own data (Requirements 11.5)
        let recruiterWhere = {
            companyId,
            role: 'recruiter'
        };
        if (userRole === 'recruiter') {
            recruiterWhere.id = userId;
        }
        // Get all recruiters in the company
        const recruiters = await prisma.user.findMany({
            where: recruiterWhere,
            select: {
                id: true,
                name: true,
                assignedJobs: {
                    select: {
                        id: true,
                        title: true,
                        department: true,
                        status: true,
                        createdAt: true,
                        jobCandidates: {
                            select: {
                                id: true,
                                appliedAt: true,
                                updatedAt: true,
                                currentStage: {
                                    select: {
                                        name: true
                                    }
                                },
                                interviews: {
                                    select: {
                                        id: true,
                                        scheduledAt: true,
                                        status: true
                                    }
                                }
                            },
                            where: dateFilter ? { appliedAt: dateFilter } : undefined
                        }
                    },
                    where: filters.jobId ? { id: filters.jobId } : undefined
                }
            }
        });
        const recruiterData = [];
        for (const recruiter of recruiters) {
            // Calculate active roles count
            const activeRoles = recruiter.assignedJobs.filter(job => job.status === 'active').length;
            // Calculate CVs added (candidates applied to recruiter's jobs)
            const allCandidates = recruiter.assignedJobs.flatMap(job => job.jobCandidates);
            const cvsAdded = allCandidates.length;
            // Calculate interviews scheduled
            const allInterviews = allCandidates.flatMap(candidate => candidate.interviews);
            const interviewsScheduled = allInterviews.filter(interview => interview.status === 'scheduled' || interview.status === 'completed').length;
            // Calculate offers made (candidates in "Offer" stage)
            const offersMade = allCandidates.filter(candidate => candidate.currentStage.name === 'Offer').length;
            // Calculate hires (candidates in "Hired" stage)
            const hires = allCandidates.filter(candidate => candidate.currentStage.name === 'Hired').length;
            // Calculate average time-to-fill for this recruiter's hires
            const hiredCandidates = allCandidates.filter(candidate => candidate.currentStage.name === 'Hired');
            let avgTimeToFill = 0;
            if (hiredCandidates.length > 0) {
                const totalTimeToFill = hiredCandidates.reduce((sum, candidate) => {
                    // Find the job this candidate belongs to
                    const job = recruiter.assignedJobs.find(job => job.jobCandidates.some(jc => jc.id === candidate.id));
                    if (job) {
                        const timeDiff = candidate.updatedAt.getTime() - job.createdAt.getTime();
                        const days = Math.max(0, timeDiff / (1000 * 60 * 60 * 24));
                        return sum + days;
                    }
                    return sum;
                }, 0);
                avgTimeToFill = Math.round(totalTimeToFill / hiredCandidates.length);
            }
            // Calculate composite productivity score (Requirements 11.3)
            // Score based on: hires (40%), interviews/CVs ratio (30%), time-to-fill efficiency (30%)
            let productivityScore = 0;
            // Hires component (40% weight)
            const hiresScore = Math.min(hires * 10, 40); // Max 40 points for 4+ hires
            // Interview efficiency component (30% weight)
            const interviewEfficiency = cvsAdded > 0 ? (interviewsScheduled / cvsAdded) : 0;
            const interviewScore = Math.min(interviewEfficiency * 30, 30); // Max 30 points for 100% interview rate
            // Time-to-fill efficiency component (30% weight)
            const timeEfficiencyScore = avgTimeToFill > 0 ? Math.max(30 - (avgTimeToFill - 30) * 0.5, 0) : 0;
            productivityScore = Math.round(hiresScore + interviewScore + timeEfficiencyScore);
            // Determine specialty based on department focus
            const departmentCounts = new Map();
            recruiter.assignedJobs.forEach(job => {
                const current = departmentCounts.get(job.department) || 0;
                departmentCounts.set(job.department, current + 1);
            });
            const topDepartment = Array.from(departmentCounts.entries())
                .sort(([, a], [, b]) => b - a)[0];
            const specialty = topDepartment ? topDepartment[0] : 'General';
            recruiterData.push({
                id: recruiter.id,
                name: recruiter.name,
                specialty,
                activeRoles,
                cvsAdded,
                interviewsScheduled,
                offersMade,
                hires,
                avgTimeToFill,
                productivityScore
            });
        }
        // Sort by productivity score descending (Requirements 11.3)
        recruiterData.sort((a, b) => b.productivityScore - a.productivityScore);
        return recruiterData;
    }
    /**
     * Get panel performance analytics (Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6)
     */
    async getPanelPerformance(companyId, userId, userRole, filters = {}) {
        const baseJobWhere = this.buildJobWhereClause(companyId, userId, userRole, filters);
        const dateFilter = this.buildDateFilter(filters);
        // Get interviews with panel members and feedback
        const interviewWhere = {
            jobCandidate: {
                job: baseJobWhere
            }
        };
        if (dateFilter) {
            interviewWhere.scheduledAt = dateFilter;
        }
        const interviews = await prisma.interview.findMany({
            where: interviewWhere,
            select: {
                id: true,
                scheduledAt: true,
                status: true,
                panelMembers: {
                    select: {
                        user: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                feedback: {
                    select: {
                        id: true,
                        panelMemberId: true,
                        recommendation: true,
                        submittedAt: true
                    }
                },
                jobCandidate: {
                    select: {
                        id: true,
                        currentStage: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });
        // Group interviews by panel member
        const panelMemberStats = new Map();
        interviews.forEach(interview => {
            interview.panelMembers.forEach(panelMember => {
                const panelMemberId = panelMember.user.id;
                const panelMemberName = panelMember.user.name;
                if (!panelMemberStats.has(panelMemberId)) {
                    panelMemberStats.set(panelMemberId, {
                        name: panelMemberName,
                        interviewRounds: 0,
                        offerCount: 0,
                        feedbackTimes: [],
                        rejectionReasons: new Map()
                    });
                }
                const stats = panelMemberStats.get(panelMemberId);
                // Count interview rounds conducted (Requirements 12.1)
                if (interview.status === 'completed') {
                    stats.interviewRounds++;
                }
                // Count offers (candidates who reached "Offer" or "Hired" stage after this interview)
                if (interview.jobCandidate.currentStage.name === 'Offer' ||
                    interview.jobCandidate.currentStage.name === 'Hired') {
                    stats.offerCount++;
                }
                // Calculate feedback submission time (Requirements 12.4)
                const panelFeedback = interview.feedback.find(f => f.panelMemberId === panelMemberId);
                if (panelFeedback) {
                    const feedbackTime = panelFeedback.submittedAt.getTime() - interview.scheduledAt.getTime();
                    const feedbackHours = feedbackTime / (1000 * 60 * 60);
                    stats.feedbackTimes.push(feedbackHours);
                    // Track rejection reasons (Requirements 12.3)
                    if (panelFeedback.recommendation === 'no_hire' || panelFeedback.recommendation === 'strong_no_hire') {
                        // For now, we'll categorize by recommendation type
                        // In a real implementation, this could be extracted from feedback comments
                        const reason = panelFeedback.recommendation === 'strong_no_hire' ? 'Strong No Hire' : 'No Hire';
                        const currentCount = stats.rejectionReasons.get(reason) || 0;
                        stats.rejectionReasons.set(reason, currentCount + 1);
                    }
                }
            });
        });
        // Convert to PanelData array
        const panelData = [];
        for (const [panelMemberId, stats] of Array.from(panelMemberStats.entries())) {
            // Calculate offer percentage (Requirements 12.2)
            const offerPercentage = stats.interviewRounds > 0
                ? Math.round((stats.offerCount / stats.interviewRounds) * 100 * 10) / 10
                : 0;
            // Find top rejection reason (Requirements 12.3)
            const topRejectionReason = Array.from(stats.rejectionReasons.entries())
                .sort(([, a], [, b]) => b - a)[0]?.[0] || 'No rejections';
            // Calculate average feedback time (Requirements 12.4)
            const avgFeedbackTime = stats.feedbackTimes.length > 0
                ? Math.round(stats.feedbackTimes.reduce((sum, time) => sum + time, 0) / stats.feedbackTimes.length * 10) / 10
                : 0;
            panelData.push({
                panelName: stats.name,
                interviewRounds: stats.interviewRounds,
                offerPercentage,
                topRejectionReason,
                avgFeedbackTime
            });
        }
        // Sort by offer percentage descending to identify top performers (Requirements 12.5)
        panelData.sort((a, b) => b.offerPercentage - a.offerPercentage);
        return panelData;
    }
    /**
     * Get drop-off analysis (Requirements 10.1, 10.2, 10.3)
     */
    async getDropOffAnalysis(companyId, userId, userRole, filters = {}) {
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
        const stageGroups = new Map();
        stages.forEach(stage => {
            const existing = stageGroups.get(stage.name);
            if (!existing) {
                stageGroups.set(stage.name, {
                    position: stage.position,
                    stageIds: [stage.id]
                });
            }
            else {
                existing.stageIds.push(stage.id);
            }
        });
        // Get stage history for candidates who exited stages (drop-offs)
        const stageHistoryWhere = {
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
        const candidateWhere = {
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
        const stageReachCounts = new Map();
        // Add historical candidates
        stageHistory.forEach(history => {
            if (!stageReachCounts.has(history.stageName)) {
                stageReachCounts.set(history.stageName, new Set());
            }
            stageReachCounts.get(history.stageName).add(history.jobCandidateId);
        });
        // Add current candidates
        currentCandidates.forEach(candidate => {
            for (const [stageName, stageGroup] of Array.from(stageGroups.entries())) {
                if (stageGroup.stageIds.includes(candidate.currentStageId)) {
                    if (!stageReachCounts.has(stageName)) {
                        stageReachCounts.set(stageName, new Set());
                    }
                    stageReachCounts.get(stageName).add(candidate.id);
                    break;
                }
            }
        });
        // Calculate drop-offs by stage
        const dropOffsByStage = new Map();
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
        const highestDropOffStage = byStage.reduce((max, current) => current.dropOffPercentage > max.dropOffPercentage ? current : max, byStage[0] || { stageName: '', dropOffPercentage: 0 }).stageName;
        return {
            byStage,
            highestDropOffStage
        };
    }
    /**
     * Get rejection reasons analysis (Requirements 10.2, 10.5)
     */
    async getRejectionReasons(companyId, userId, userRole, filters = {}) {
        const baseJobWhere = this.buildJobWhereClause(companyId, userId, userRole, filters);
        const dateFilter = this.buildDateFilter(filters);
        // Get stage history with rejection comments
        const stageHistoryWhere = {
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
        const categorizedReasons = new Map();
        const stageRejectionCounts = new Map();
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
        // Build reasons array with colors (Requirements 3.4: red, orange, blue, green)
        const colors = ['#ef4444', '#f97316', '#3b82f6', '#22c55e'];
        const reasons = Array.from(categorizedReasons.entries()).map(([reason, count], index) => ({
            reason,
            count,
            percentage: totalRejections > 0 ? Math.round((count / totalRejections) * 100 * 10) / 10 : 0,
            color: colors[index % colors.length]
        }));
        // Find stage with most rejections
        const topStageForRejection = Array.from(stageRejectionCounts.entries())
            .reduce((max, [stage, count]) => count > max.count ? { stage, count } : max, { stage: '', count: 0 }).stage;
        return {
            reasons,
            topStageForRejection
        };
    }
    /**
     * Get offer acceptance rate analytics (Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6)
     */
    async getOfferAcceptanceRate(companyId, userId, userRole, filters = {}) {
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
        const candidateWhere = {
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
        const acceptedOffers = offerCandidates.filter(candidate => hiredStageIds.includes(candidate.currentStageId)).length;
        const overallAcceptanceRate = Math.round((acceptedOffers / totalOffers) * 100 * 10) / 10;
        // Group by department (Requirements 8.2)
        const departmentGroups = new Map();
        offerCandidates.forEach(candidate => {
            const department = candidate.job.department;
            if (!departmentGroups.has(department)) {
                departmentGroups.set(department, { total: 0, accepted: 0 });
            }
            const group = departmentGroups.get(department);
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
        const roleGroups = new Map();
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
            const group = roleGroups.get(roleId);
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
     * Get SLA status analytics (Requirements 19.1, 19.2, 19.3, 19.4, 19.5, 19.6)
     */
    async getSLAStatus(companyId, userId, userRole, filters = {}) {
        // Get the comprehensive SLA status summary
        const slaStatus = await this.getSLAStatusSummary(companyId, userId, userRole, filters);
        // Additional processing could be added here for specific SLA analytics
        // For example, trend analysis, historical SLA performance, etc.
        return slaStatus;
    }
    // Private helper methods
    /**
     * Build job where clause for role-based filtering (Requirements 1.2, 1.3)
     */
    buildJobWhereClause(companyId, userId, userRole, filters) {
        const baseWhere = {
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
                { locations: { path: ['$'], array_contains: filters.locationId } }
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
    buildDateFilter(filters) {
        const dateFilter = {};
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
    async calculateAverageTimeToFill(companyId, userId, userRole, filters) {
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
    async calculateOfferAcceptanceRate(companyId, userId, userRole, filters) {
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
     * Get SLA status summary (Requirements 19.1, 19.2, 19.3, 19.4, 19.5, 19.6)
     */
    async getSLAStatusSummary(companyId, userId, userRole, filters) {
        const baseJobWhere = this.buildJobWhereClause(companyId, userId, userRole, filters);
        // Get company-specific SLA configurations
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const slaConfigs = await prisma.sLAConfig.findMany({
            where: { companyId },
            select: { stageName: true, thresholdDays: true }
        });
        // Create a map of stage name to threshold days
        const slaThresholdMap = new Map();
        for (const config of slaConfigs) {
            slaThresholdMap.set(config.stageName.toLowerCase(), config.thresholdDays);
        }
        // Default threshold for stages without specific SLA config (30 days)
        const defaultThreshold = 30;
        // Get active jobs with their candidates and stage information
        const jobs = await prisma.job.findMany({
            where: {
                ...baseJobWhere,
                status: 'active'
            },
            select: {
                id: true,
                title: true,
                createdAt: true,
                jobCandidates: {
                    select: {
                        id: true,
                        appliedAt: true,
                        currentStage: {
                            select: {
                                id: true,
                                name: true
                            }
                        },
                        stageHistory: {
                            where: {
                                exitedAt: null
                            },
                            orderBy: {
                                enteredAt: 'desc'
                            },
                            take: 1,
                            select: {
                                enteredAt: true
                            }
                        }
                    }
                }
            }
        });
        const now = new Date();
        const roles = [];
        let onTrack = 0;
        let atRisk = 0;
        let breached = 0;
        for (const job of jobs) {
            const daysOpen = Math.floor((now.getTime() - job.createdAt.getTime()) / (1000 * 60 * 60 * 24));
            // Calculate candidates causing SLA breaches for this job
            let candidatesBreaching = 0;
            let jobHasAtRiskCandidates = false;
            let jobHasBreachedCandidates = false;
            for (const candidate of job.jobCandidates) {
                const stageName = candidate.currentStage.name.toLowerCase();
                const stageThreshold = slaThresholdMap.get(stageName) || defaultThreshold;
                // Get the entry time for current stage
                let enteredAt;
                if (candidate.stageHistory.length > 0) {
                    enteredAt = candidate.stageHistory[0].enteredAt;
                }
                else {
                    // Fall back to appliedAt if no stage history
                    enteredAt = candidate.appliedAt;
                }
                // Calculate days in current stage
                const msInStage = now.getTime() - enteredAt.getTime();
                const daysInStage = Math.floor(msInStage / (1000 * 60 * 60 * 24));
                // Check SLA status for this candidate
                if (daysInStage > stageThreshold) {
                    // Candidate has breached SLA
                    candidatesBreaching++;
                    jobHasBreachedCandidates = true;
                }
                else if (daysInStage > stageThreshold - 3) {
                    // Candidate is at risk (within 3 days of breach)
                    jobHasAtRiskCandidates = true;
                }
            }
            // Determine overall job SLA status based on candidates
            let status;
            let threshold;
            if (jobHasBreachedCandidates) {
                status = 'breached';
                breached++;
                // Use the most restrictive threshold for display
                threshold = Math.min(...Array.from(slaThresholdMap.values()), defaultThreshold);
            }
            else if (jobHasAtRiskCandidates) {
                status = 'at_risk';
                atRisk++;
                threshold = Math.min(...Array.from(slaThresholdMap.values()), defaultThreshold);
            }
            else {
                status = 'on_track';
                onTrack++;
                threshold = defaultThreshold;
            }
            roles.push({
                roleId: job.id,
                roleName: job.title,
                status,
                daysOpen,
                threshold,
                candidatesBreaching
            });
        }
        // Sort roles by status priority (breached first, then at risk, then on track)
        // Within each status group, sort by days open (descending)
        roles.sort((a, b) => {
            const statusPriority = { 'breached': 0, 'at_risk': 1, 'on_track': 2 };
            const aPriority = statusPriority[a.status];
            const bPriority = statusPriority[b.status];
            if (aPriority !== bPriority) {
                return aPriority - bPriority;
            }
            // Same status, sort by days open (descending)
            return b.daysOpen - a.daysOpen;
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
//# sourceMappingURL=analytics.service.js.map