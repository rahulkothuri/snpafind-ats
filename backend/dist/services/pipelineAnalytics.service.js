import prisma from '../lib/prisma.js';
import { NotFoundError } from '../middleware/errorHandler.js';
export const pipelineAnalyticsService = {
    /**
     * Get stage metrics for a job's pipeline
     * Calculates candidate counts, average TAT, and SLA breach counts per stage
     * Requirements: 2.4, 4.1
     */
    async getStageMetrics(jobId) {
        // Verify job exists and get company ID for SLA config
        const job = await prisma.job.findUnique({
            where: { id: jobId },
            select: { id: true, companyId: true },
        });
        if (!job) {
            throw new NotFoundError('Job');
        }
        // Get all pipeline stages for the job
        const stages = await prisma.pipelineStage.findMany({
            where: { jobId },
            orderBy: { position: 'asc' },
            select: {
                id: true,
                name: true,
                position: true,
            },
        });
        if (stages.length === 0) {
            return {
                stageMetrics: [],
                overallTAT: 0,
            };
        }
        // Get candidate counts per stage
        const candidateCounts = await prisma.jobCandidate.groupBy({
            by: ['currentStageId'],
            where: { jobId },
            _count: { id: true },
        });
        // Create a map of stage ID to candidate count
        const countMap = new Map();
        for (const count of candidateCounts) {
            countMap.set(count.currentStageId, count._count.id);
        }
        // Get average duration per stage from stage history
        const stageIds = stages.map((s) => s.id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const avgDurations = await prisma.stageHistory.groupBy({
            by: ['stageId'],
            where: {
                stageId: { in: stageIds },
                durationHours: { not: null },
            },
            _avg: { durationHours: true },
        });
        // Create a map of stage ID to average duration in days
        const avgDurationMap = new Map();
        for (const agg of avgDurations) {
            if (agg._avg.durationHours !== null) {
                // Convert hours to days
                avgDurationMap.set(agg.stageId, agg._avg.durationHours / 24);
            }
        }
        // Get SLA configurations for the company
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const slaConfigs = await prisma.sLAConfig.findMany({
            where: { companyId: job.companyId },
            select: { stageName: true, thresholdDays: true },
        });
        // Create a map of stage name (lowercase) to threshold days
        const slaThresholdMap = new Map();
        for (const config of slaConfigs) {
            slaThresholdMap.set(config.stageName.toLowerCase(), config.thresholdDays);
        }
        // Calculate SLA breach counts per stage
        const now = new Date();
        const slaBreachCounts = new Map();
        // Get all job candidates with their current stage entry time
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const jobCandidates = await prisma.jobCandidate.findMany({
            where: { jobId },
            include: {
                currentStage: {
                    select: { name: true },
                },
                stageHistory: {
                    where: { exitedAt: null },
                    orderBy: { enteredAt: 'desc' },
                    take: 1,
                },
            },
        });
        for (const jc of jobCandidates) {
            const stageName = jc.currentStage.name.toLowerCase();
            const threshold = slaThresholdMap.get(stageName);
            if (!threshold) {
                continue; // No SLA configured for this stage
            }
            // Get entry time for current stage
            const enteredAt = jc.stageHistory.length > 0
                ? jc.stageHistory[0].enteredAt
                : jc.appliedAt;
            // Calculate days in stage
            const msInStage = now.getTime() - enteredAt.getTime();
            const daysInStage = msInStage / (1000 * 60 * 60 * 24);
            if (daysInStage > threshold) {
                const currentCount = slaBreachCounts.get(jc.currentStageId) || 0;
                slaBreachCounts.set(jc.currentStageId, currentCount + 1);
            }
        }
        // Build stage metrics
        const stageMetrics = stages.map((stage) => ({
            stageId: stage.id,
            stageName: stage.name,
            candidateCount: countMap.get(stage.id) || 0,
            avgDaysInStage: Math.round((avgDurationMap.get(stage.id) || 0) * 100) / 100,
            slaBreachCount: slaBreachCounts.get(stage.id) || 0,
        }));
        // Calculate overall TAT (average time from first stage to last completed stage)
        const overallTAT = await this.calculateOverallTAT(jobId);
        return {
            stageMetrics,
            overallTAT,
        };
    },
    /**
     * Calculate overall TAT for a job
     * This is the average total time candidates spend in the pipeline
     * Requirements: 2.4
     */
    async calculateOverallTAT(jobId) {
        // Get all completed stage histories for this job's candidates
        const jobCandidates = await prisma.jobCandidate.findMany({
            where: { jobId },
            select: { id: true },
        });
        if (jobCandidates.length === 0) {
            return 0;
        }
        const jobCandidateIds = jobCandidates.map((jc) => jc.id);
        // Sum up total duration for each candidate
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const totalDurations = await prisma.stageHistory.groupBy({
            by: ['jobCandidateId'],
            where: {
                jobCandidateId: { in: jobCandidateIds },
                durationHours: { not: null },
            },
            _sum: { durationHours: true },
        });
        if (totalDurations.length === 0) {
            return 0;
        }
        // Calculate average total duration across all candidates
        let totalHours = 0;
        let candidatesWithHistory = 0;
        for (const duration of totalDurations) {
            if (duration._sum.durationHours !== null) {
                totalHours += duration._sum.durationHours;
                candidatesWithHistory++;
            }
        }
        if (candidatesWithHistory === 0) {
            return 0;
        }
        // Return average TAT in days, rounded to 2 decimal places
        const avgHours = totalHours / candidatesWithHistory;
        return Math.round((avgHours / 24) * 100) / 100;
    },
};
export default pipelineAnalyticsService;
//# sourceMappingURL=pipelineAnalytics.service.js.map