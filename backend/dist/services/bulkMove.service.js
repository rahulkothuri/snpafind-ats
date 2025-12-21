import prisma from '../lib/prisma.js';
import { ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { stageHistoryService } from './stageHistory.service.js';
/**
 * Check if a stage is a rejection stage
 */
function isRejectionStage(stageName) {
    const lowerName = stageName.toLowerCase();
    return lowerName.includes('reject') ||
        lowerName.includes('declined') ||
        lowerName.includes('not selected');
}
export const bulkMoveService = {
    /**
     * Move multiple candidates to a target stage in a single operation
     * Uses database transaction for atomic operations
     * Handles partial failures gracefully
     * Requirements: 1.3, 1.4, 1.5, 1.6
     */
    async move(data) {
        // Validate required fields
        if (!data.candidateIds || data.candidateIds.length === 0) {
            throw new ValidationError({ candidateIds: ['At least one candidate ID is required'] });
        }
        if (!data.targetStageId) {
            throw new ValidationError({ targetStageId: ['Target stage ID is required'] });
        }
        if (!data.jobId) {
            throw new ValidationError({ jobId: ['Job ID is required'] });
        }
        // Verify job exists and get pipeline stages
        const job = await prisma.job.findUnique({
            where: { id: data.jobId },
            include: {
                pipelineStages: {
                    orderBy: { position: 'asc' },
                },
            },
        });
        if (!job) {
            throw new NotFoundError('Job');
        }
        // Verify target stage exists and belongs to the job
        const targetStage = job.pipelineStages.find(s => s.id === data.targetStageId);
        if (!targetStage) {
            throw new ValidationError({
                targetStageId: ['Target stage not found in this job pipeline']
            });
        }
        // Check if moving to rejection stage requires a comment
        if (isRejectionStage(targetStage.name) && !data.comment) {
            throw new ValidationError({
                comment: ['A comment is required when moving to a rejection stage']
            });
        }
        const failures = [];
        let movedCount = 0;
        // Process each candidate - handle partial failures gracefully (Requirements: 1.6)
        for (const candidateId of data.candidateIds) {
            try {
                await this.moveSingleCandidate({
                    jobCandidateId: candidateId,
                    targetStageId: data.targetStageId,
                    targetStageName: targetStage.name,
                    jobId: data.jobId,
                    comment: data.comment,
                    movedBy: data.movedBy,
                });
                movedCount++;
            }
            catch (error) {
                // Get candidate name for better error reporting
                let candidateName;
                try {
                    const jobCandidate = await prisma.jobCandidate.findUnique({
                        where: { id: candidateId },
                        include: { candidate: { select: { name: true } } },
                    });
                    candidateName = jobCandidate?.candidate?.name;
                }
                catch {
                    // Ignore errors when fetching candidate name
                }
                failures.push({
                    candidateId,
                    candidateName,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        return {
            success: failures.length === 0,
            movedCount,
            failedCount: failures.length,
            failures: failures.length > 0 ? failures : undefined,
        };
    },
    /**
     * Move a single candidate within a transaction
     * Creates stage history and activity records
     * Requirements: 1.4, 2.1, 2.2
     */
    async moveSingleCandidate(params) {
        const { jobCandidateId, targetStageId, targetStageName, jobId, comment, movedBy } = params;
        // Find the job candidate record
        const jobCandidate = await prisma.jobCandidate.findUnique({
            where: { id: jobCandidateId },
            include: {
                currentStage: true,
                candidate: true,
            },
        });
        if (!jobCandidate) {
            throw new NotFoundError('Job candidate');
        }
        // Verify the job candidate belongs to the specified job
        if (jobCandidate.jobId !== jobId) {
            throw new ValidationError({
                jobCandidateId: ['Candidate does not belong to the specified job']
            });
        }
        // Skip if already in target stage
        if (jobCandidate.currentStageId === targetStageId) {
            return; // No-op, already in target stage
        }
        const oldStageName = jobCandidate.currentStage.name;
        const oldStageId = jobCandidate.currentStageId;
        // Execute in transaction for atomicity (Requirements: 1.3)
        await prisma.$transaction(async (tx) => {
            // Close the previous stage history entry (Requirements: 2.2)
            await stageHistoryService.closeStageEntry({
                jobCandidateId,
                stageId: oldStageId,
            }, tx);
            // Create new stage history entry (Requirements: 2.1)
            await stageHistoryService.createStageEntry({
                jobCandidateId,
                stageId: targetStageId,
                stageName: targetStageName,
                comment,
                movedBy,
            }, tx);
            // Update the job candidate's current stage
            await tx.jobCandidate.update({
                where: { id: jobCandidateId },
                data: { currentStageId: targetStageId },
            });
            // Create activity entry for the stage change (Requirements: 1.4)
            const activityDescription = comment
                ? `Moved from ${oldStageName} to ${targetStageName}. Comment: ${comment}`
                : `Moved from ${oldStageName} to ${targetStageName}`;
            await tx.candidateActivity.create({
                data: {
                    candidateId: jobCandidate.candidateId,
                    jobCandidateId,
                    activityType: 'stage_change',
                    description: activityDescription,
                    metadata: {
                        fromStageId: oldStageId,
                        fromStageName: oldStageName,
                        toStageId: targetStageId,
                        toStageName: targetStageName,
                        comment,
                        bulkMove: true,
                    },
                },
            });
        });
    },
};
export default bulkMoveService;
//# sourceMappingURL=bulkMove.service.js.map