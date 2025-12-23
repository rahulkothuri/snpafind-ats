import prisma from '../lib/prisma.js';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';
import { notificationService } from './notification.service.js';
export const slaService = {
    /**
     * Get SLA configuration for a company
     * Requirements: 10.5
     */
    async getSLAConfig(companyId) {
        // Verify company exists
        const company = await prisma.company.findUnique({
            where: { id: companyId },
        });
        if (!company) {
            throw new NotFoundError('Company');
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const configs = await prisma.sLAConfig.findMany({
            where: { companyId },
            orderBy: { stageName: 'asc' },
        });
        return configs.map((config) => ({
            id: config.id,
            companyId: config.companyId,
            stageName: config.stageName,
            thresholdDays: config.thresholdDays,
            createdAt: config.createdAt,
            updatedAt: config.updatedAt,
        }));
    },
    /**
     * Update or create SLA configuration for a stage
     * Requirements: 10.5
     */
    async updateSLAConfig(companyId, data) {
        // Validate input
        const errors = {};
        if (!data.stageName || data.stageName.trim() === '') {
            errors.stageName = ['Stage name is required'];
        }
        if (data.thresholdDays === undefined || data.thresholdDays === null) {
            errors.thresholdDays = ['Threshold days is required'];
        }
        else if (data.thresholdDays < 1) {
            errors.thresholdDays = ['Threshold days must be at least 1'];
        }
        else if (!Number.isInteger(data.thresholdDays)) {
            errors.thresholdDays = ['Threshold days must be a whole number'];
        }
        if (Object.keys(errors).length > 0) {
            throw new ValidationError(errors);
        }
        // Verify company exists
        const company = await prisma.company.findUnique({
            where: { id: companyId },
        });
        if (!company) {
            throw new NotFoundError('Company');
        }
        // Upsert the SLA config
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const config = await prisma.sLAConfig.upsert({
            where: {
                companyId_stageName: {
                    companyId,
                    stageName: data.stageName.trim(),
                },
            },
            update: {
                thresholdDays: data.thresholdDays,
            },
            create: {
                companyId,
                stageName: data.stageName.trim(),
                thresholdDays: data.thresholdDays,
            },
        });
        return {
            id: config.id,
            companyId: config.companyId,
            stageName: config.stageName,
            thresholdDays: config.thresholdDays,
            createdAt: config.createdAt,
            updatedAt: config.updatedAt,
        };
    },
    /**
     * Update multiple SLA configurations at once
     * Requirements: 10.5
     */
    async updateSLAConfigs(companyId, configs) {
        const results = [];
        for (const config of configs) {
            const result = await this.updateSLAConfig(companyId, config);
            results.push(result);
        }
        return results;
    },
    /**
     * Delete SLA configuration for a stage
     * Requirements: 10.5
     */
    async deleteSLAConfig(companyId, stageName) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const config = await prisma.sLAConfig.findUnique({
            where: {
                companyId_stageName: {
                    companyId,
                    stageName,
                },
            },
        });
        if (!config) {
            throw new NotFoundError('SLA configuration');
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await prisma.sLAConfig.delete({
            where: { id: config.id },
        });
    },
    /**
     * Check for SLA breaches across all candidates in a company
     * Returns candidates who have exceeded the SLA threshold for their current stage
     * Requirements: 10.1
     */
    async checkSLABreaches(companyId) {
        // Get all SLA configs for the company
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const slaConfigs = await prisma.sLAConfig.findMany({
            where: { companyId },
        });
        if (slaConfigs.length === 0) {
            return [];
        }
        // Create a map of stage name to threshold
        const thresholdMap = new Map();
        for (const config of slaConfigs) {
            thresholdMap.set(config.stageName.toLowerCase(), config.thresholdDays);
        }
        // Get all active job candidates with their current stage info
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const jobCandidates = await prisma.jobCandidate.findMany({
            where: {
                job: {
                    companyId,
                    status: 'active',
                },
            },
            include: {
                candidate: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                job: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                currentStage: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                stageHistory: {
                    where: {
                        exitedAt: null,
                    },
                    orderBy: {
                        enteredAt: 'desc',
                    },
                    take: 1,
                },
            },
        });
        const breaches = [];
        const now = new Date();
        for (const jc of jobCandidates) {
            const stageName = jc.currentStage.name.toLowerCase();
            const threshold = thresholdMap.get(stageName);
            if (!threshold) {
                continue; // No SLA configured for this stage
            }
            // Get the entry time for current stage
            let enteredAt;
            if (jc.stageHistory.length > 0) {
                enteredAt = jc.stageHistory[0].enteredAt;
            }
            else {
                // Fall back to appliedAt if no stage history
                enteredAt = jc.appliedAt;
            }
            // Calculate days in stage
            const msInStage = now.getTime() - enteredAt.getTime();
            const daysInStage = msInStage / (1000 * 60 * 60 * 24);
            if (daysInStage > threshold) {
                breaches.push({
                    id: `sla-${jc.id}`,
                    candidateId: jc.candidate.id,
                    candidateName: jc.candidate.name,
                    jobId: jc.job.id,
                    jobTitle: jc.job.title,
                    stageName: jc.currentStage.name,
                    daysInStage: Math.floor(daysInStage),
                    thresholdDays: threshold,
                    daysOverdue: Math.floor(daysInStage - threshold),
                    enteredAt,
                });
            }
        }
        // Sort by days overdue (most overdue first)
        breaches.sort((a, b) => b.daysOverdue - a.daysOverdue);
        return breaches;
    },
    /**
     * Check SLA breach for a specific job candidate
     * Returns breach info if threshold exceeded, null otherwise
     * Requirements: 10.1, 2.5
     */
    async checkCandidateSLABreach(jobCandidateId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const jobCandidate = await prisma.jobCandidate.findUnique({
            where: { id: jobCandidateId },
            include: {
                candidate: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                job: {
                    select: {
                        id: true,
                        title: true,
                        companyId: true,
                    },
                },
                currentStage: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                stageHistory: {
                    where: {
                        exitedAt: null,
                    },
                    orderBy: {
                        enteredAt: 'desc',
                    },
                    take: 1,
                },
            },
        });
        if (!jobCandidate) {
            throw new NotFoundError('Job candidate');
        }
        // Get SLA config for this stage
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const slaConfig = await prisma.sLAConfig.findUnique({
            where: {
                companyId_stageName: {
                    companyId: jobCandidate.job.companyId,
                    stageName: jobCandidate.currentStage.name,
                },
            },
        });
        if (!slaConfig) {
            return null; // No SLA configured for this stage
        }
        // Get entry time
        let enteredAt;
        if (jobCandidate.stageHistory.length > 0) {
            enteredAt = jobCandidate.stageHistory[0].enteredAt;
        }
        else {
            enteredAt = jobCandidate.appliedAt;
        }
        // Calculate days in stage
        const now = new Date();
        const msInStage = now.getTime() - enteredAt.getTime();
        const daysInStage = msInStage / (1000 * 60 * 60 * 24);
        if (daysInStage > slaConfig.thresholdDays) {
            return {
                id: `sla-${jobCandidate.id}`,
                candidateId: jobCandidate.candidate.id,
                candidateName: jobCandidate.candidate.name,
                jobId: jobCandidate.job.id,
                jobTitle: jobCandidate.job.title,
                stageName: jobCandidate.currentStage.name,
                daysInStage: Math.floor(daysInStage),
                thresholdDays: slaConfig.thresholdDays,
                daysOverdue: Math.floor(daysInStage - slaConfig.thresholdDays),
                enteredAt,
            };
        }
        return null;
    },
    /**
     * Create SLA breach notification for a candidate
     * Requirements: 10.1, 8.1
     */
    async createSLABreachNotification(breach, _companyId) {
        // Get users to notify (admins, hiring managers, assigned recruiter)
        const job = await prisma.job.findUnique({
            where: { id: breach.jobId },
            include: {
                company: {
                    include: {
                        users: {
                            where: {
                                role: { in: ['admin', 'hiring_manager'] },
                                isActive: true,
                            },
                        },
                    },
                },
            },
        });
        if (!job) {
            return;
        }
        const usersToNotify = new Set();
        // Add assigned recruiter
        if (job.assignedRecruiterId) {
            usersToNotify.add(job.assignedRecruiterId);
        }
        // Add admins and hiring managers
        for (const user of job.company.users) {
            usersToNotify.add(user.id);
        }
        // Create notifications
        for (const userId of usersToNotify) {
            await notificationService.createNotification({
                userId,
                type: 'sla_breach',
                title: 'SLA Breach Alert',
                message: `${breach.candidateName} has been in ${breach.stageName} for ${breach.daysInStage} days (${breach.daysOverdue} days overdue) for ${breach.jobTitle}`,
                entityType: 'candidate',
                entityId: breach.candidateId,
            });
        }
    },
    /**
     * Get all alerts (SLA breaches and pending feedback)
     * Requirements: 10.1, 10.2, 10.3, 9.2
     */
    async getAlerts(companyId, filter = {}) {
        const { type = 'all' } = filter;
        let slaBreaches = [];
        const pendingFeedback = []; // Placeholder for future implementation
        if (type === 'all' || type === 'sla') {
            slaBreaches = await this.checkSLABreaches(companyId);
        }
        // Note: Pending feedback alerts would be implemented when interview
        // feedback tracking is added. For now, return empty array.
        return {
            slaBreaches,
            pendingFeedback,
        };
    },
    /**
     * Get default SLA thresholds
     * Returns suggested default thresholds for common stages
     */
    getDefaultThresholds() {
        return [
            { stageName: 'Applied', thresholdDays: 3 },
            { stageName: 'Screening', thresholdDays: 5 },
            { stageName: 'Interview', thresholdDays: 7 },
            { stageName: 'Technical Round', thresholdDays: 7 },
            { stageName: 'HR Round', thresholdDays: 5 },
            { stageName: 'Offer', thresholdDays: 3 },
        ];
    },
};
export default slaService;
//# sourceMappingURL=sla.service.js.map