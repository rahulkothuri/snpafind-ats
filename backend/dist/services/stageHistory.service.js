import prisma from '../lib/prisma.js';
import { NotFoundError } from '../middleware/errorHandler.js';
/**
 * Calculate duration in hours between two dates
 * Requirements: 2.3
 */
export function calculateDurationHours(enteredAt, exitedAt) {
    const diffMs = exitedAt.getTime() - enteredAt.getTime();
    return diffMs / (1000 * 60 * 60); // Convert milliseconds to hours
}
export const stageHistoryService = {
    /**
     * Create a new stage entry when a candidate enters a stage
     * Requirements: 2.1
     */
    async createStageEntry(data, tx) {
        const client = tx || prisma;
        // Verify job candidate exists
        const jobCandidate = await client.jobCandidate.findUnique({
            where: { id: data.jobCandidateId },
        });
        if (!jobCandidate) {
            throw new NotFoundError('Job candidate');
        }
        // Create the stage history entry
        const entry = await client.stageHistory.create({
            data: {
                jobCandidateId: data.jobCandidateId,
                stageId: data.stageId,
                stageName: data.stageName,
                enteredAt: new Date(),
                comment: data.comment,
                movedBy: data.movedBy,
            },
            include: {
                user: {
                    select: { name: true },
                },
            },
        });
        return {
            id: entry.id,
            jobCandidateId: entry.jobCandidateId,
            stageId: entry.stageId,
            stageName: entry.stageName,
            enteredAt: entry.enteredAt,
            exitedAt: entry.exitedAt ?? undefined,
            durationHours: entry.durationHours ?? undefined,
            comment: entry.comment ?? undefined,
            movedBy: entry.movedBy ?? undefined,
            movedByName: entry.user?.name,
        };
    },
    /**
     * Close a stage entry when a candidate exits a stage
     * Records exit timestamp and calculates duration
     * Requirements: 2.2, 2.3
     */
    async closeStageEntry(data, tx) {
        const client = tx || prisma;
        // Find the open stage entry (no exitedAt)
        const openEntry = await client.stageHistory.findFirst({
            where: {
                jobCandidateId: data.jobCandidateId,
                stageId: data.stageId,
                exitedAt: null,
            },
            orderBy: { enteredAt: 'desc' },
        });
        if (!openEntry) {
            // No open entry to close - this is okay, might be first stage
            return null;
        }
        const exitedAt = data.exitedAt || new Date();
        const durationHours = calculateDurationHours(openEntry.enteredAt, exitedAt);
        // Update the entry with exit time and duration
        const updatedEntry = await client.stageHistory.update({
            where: { id: openEntry.id },
            data: {
                exitedAt,
                durationHours,
            },
            include: {
                user: {
                    select: { name: true },
                },
            },
        });
        return {
            id: updatedEntry.id,
            jobCandidateId: updatedEntry.jobCandidateId,
            stageId: updatedEntry.stageId,
            stageName: updatedEntry.stageName,
            enteredAt: updatedEntry.enteredAt,
            exitedAt: updatedEntry.exitedAt ?? undefined,
            durationHours: updatedEntry.durationHours ?? undefined,
            comment: updatedEntry.comment ?? undefined,
            movedBy: updatedEntry.movedBy ?? undefined,
            movedByName: updatedEntry.user?.name,
        };
    },
    /**
     * Get stage history for a job candidate
     * Returns all stage entries with duration calculations
     * Requirements: 2.3
     */
    async getStageHistory(jobCandidateId) {
        // Verify job candidate exists
        const jobCandidate = await prisma.jobCandidate.findUnique({
            where: { id: jobCandidateId },
        });
        if (!jobCandidate) {
            throw new NotFoundError('Job candidate');
        }
        const entries = await prisma.stageHistory.findMany({
            where: { jobCandidateId },
            orderBy: { enteredAt: 'asc' },
            include: {
                user: {
                    select: { name: true },
                },
            },
        });
        return entries.map((entry) => ({
            id: entry.id,
            jobCandidateId: entry.jobCandidateId,
            stageId: entry.stageId,
            stageName: entry.stageName,
            enteredAt: entry.enteredAt,
            exitedAt: entry.exitedAt ?? undefined,
            durationHours: entry.durationHours ?? undefined,
            comment: entry.comment ?? undefined,
            movedBy: entry.movedBy ?? undefined,
            movedByName: entry.user?.name,
        }));
    },
    /**
     * Get stage history for a candidate by candidate ID
     * Returns history across all job applications
     */
    async getStageHistoryByCandidateId(candidateId) {
        // Get all job candidates for this candidate
        const jobCandidates = await prisma.jobCandidate.findMany({
            where: { candidateId },
            select: { id: true },
        });
        if (jobCandidates.length === 0) {
            return [];
        }
        const jobCandidateIds = jobCandidates.map((jc) => jc.id);
        const entries = await prisma.stageHistory.findMany({
            where: { jobCandidateId: { in: jobCandidateIds } },
            orderBy: { enteredAt: 'desc' },
            include: {
                user: {
                    select: { name: true },
                },
            },
        });
        return entries.map((entry) => ({
            id: entry.id,
            jobCandidateId: entry.jobCandidateId,
            stageId: entry.stageId,
            stageName: entry.stageName,
            enteredAt: entry.enteredAt,
            exitedAt: entry.exitedAt ?? undefined,
            durationHours: entry.durationHours ?? undefined,
            comment: entry.comment ?? undefined,
            movedBy: entry.movedBy ?? undefined,
            movedByName: entry.user?.name,
        }));
    },
    /**
     * Get the current open stage entry for a job candidate
     */
    async getCurrentStageEntry(jobCandidateId) {
        const entry = await prisma.stageHistory.findFirst({
            where: {
                jobCandidateId,
                exitedAt: null,
            },
            orderBy: { enteredAt: 'desc' },
            include: {
                user: {
                    select: { name: true },
                },
            },
        });
        if (!entry) {
            return null;
        }
        return {
            id: entry.id,
            jobCandidateId: entry.jobCandidateId,
            stageId: entry.stageId,
            stageName: entry.stageName,
            enteredAt: entry.enteredAt,
            exitedAt: entry.exitedAt ?? undefined,
            durationHours: entry.durationHours ?? undefined,
            comment: entry.comment ?? undefined,
            movedBy: entry.movedBy ?? undefined,
            movedByName: entry.user?.name,
        };
    },
};
export default stageHistoryService;
//# sourceMappingURL=stageHistory.service.js.map