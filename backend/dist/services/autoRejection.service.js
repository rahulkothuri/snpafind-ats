import prisma from '../lib/prisma.js';
/**
 * Evaluate if a candidate should be auto-rejected based on job rules
 * Requirements: 4.3, 9.2
 *
 * @param candidateExperience - Candidate's years of experience
 * @param rules - Auto-rejection rules from the job
 * @returns AutoRejectionResult indicating if candidate should be rejected and why
 */
export function evaluateAutoRejection(candidateExperience, rules) {
    // If no rules or rules not enabled, don't reject (Requirements 4.7)
    if (!rules || !rules.enabled) {
        return { shouldReject: false };
    }
    // Check minimum experience threshold (Requirements 4.3)
    if (rules.rules.minExperience !== undefined && rules.rules.minExperience !== null) {
        if (candidateExperience < rules.rules.minExperience) {
            return {
                shouldReject: true,
                reason: `Auto-rejected: Does not meet minimum experience requirement (${rules.rules.minExperience} years required, candidate has ${candidateExperience} years)`,
            };
        }
    }
    // Check maximum experience threshold (if configured)
    if (rules.rules.maxExperience !== undefined && rules.rules.maxExperience !== null) {
        if (candidateExperience > rules.rules.maxExperience) {
            return {
                shouldReject: true,
                reason: `Auto-rejected: Exceeds maximum experience requirement (${rules.rules.maxExperience} years maximum, candidate has ${candidateExperience} years)`,
            };
        }
    }
    return { shouldReject: false };
}
/**
 * Process auto-rejection for a candidate application
 * Requirements: 4.3, 4.4, 4.6, 9.2, 9.3, 9.4
 *
 * @param jobCandidateId - The job candidate record ID
 * @param candidateId - The candidate ID
 * @param candidateExperience - Candidate's years of experience
 * @param jobId - The job ID
 * @param tx - Optional transaction client
 * @returns True if candidate was auto-rejected, false otherwise
 */
export async function processAutoRejection(jobCandidateId, candidateId, candidateExperience, jobId, tx) {
    const client = tx || prisma;
    // Get job with auto-rejection rules
    const job = await client.job.findUnique({
        where: { id: jobId },
        select: {
            autoRejectionRules: true,
            pipelineStages: {
                where: {
                    name: 'Rejected',
                    parentId: null,
                },
                take: 1,
            },
        },
    });
    if (!job) {
        return false;
    }
    const rules = job.autoRejectionRules;
    const evaluation = evaluateAutoRejection(candidateExperience, rules);
    if (!evaluation.shouldReject) {
        return false;
    }
    // Find the Rejected stage
    const rejectedStage = job.pipelineStages[0];
    if (!rejectedStage) {
        console.warn(`No Rejected stage found for job ${jobId}, skipping auto-rejection`);
        return false;
    }
    // Move candidate to Rejected stage (Requirements 9.3)
    await client.jobCandidate.update({
        where: { id: jobCandidateId },
        data: { currentStageId: rejectedStage.id },
    });
    // Create activity log entry (Requirements 4.4, 4.6, 9.4)
    await client.candidateActivity.create({
        data: {
            candidateId,
            jobCandidateId,
            activityType: 'stage_change',
            description: evaluation.reason || 'Auto-rejected: Does not meet minimum requirements',
            metadata: {
                fromStageName: 'Applied',
                toStageName: 'Rejected',
                toStageId: rejectedStage.id,
                autoRejected: true,
                rejectionReason: evaluation.reason,
            },
        },
    });
    return true;
}
export const autoRejectionService = {
    evaluateAutoRejection,
    processAutoRejection,
};
export default autoRejectionService;
//# sourceMappingURL=autoRejection.service.js.map