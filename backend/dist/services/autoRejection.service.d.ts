import prisma from '../lib/prisma.js';
import type { AutoRejectionRules } from '../types/index.js';
type TransactionClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>;
/**
 * Result of auto-rejection evaluation
 */
export interface AutoRejectionResult {
    shouldReject: boolean;
    reason?: string;
}
/**
 * Evaluate if a candidate should be auto-rejected based on job rules
 * Requirements: 4.3, 9.2
 *
 * @param candidateExperience - Candidate's years of experience
 * @param rules - Auto-rejection rules from the job
 * @returns AutoRejectionResult indicating if candidate should be rejected and why
 */
export declare function evaluateAutoRejection(candidateExperience: number, rules: AutoRejectionRules | null | undefined): AutoRejectionResult;
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
export declare function processAutoRejection(jobCandidateId: string, candidateId: string, candidateExperience: number, jobId: string, tx?: TransactionClient): Promise<boolean>;
export declare const autoRejectionService: {
    evaluateAutoRejection: typeof evaluateAutoRejection;
    processAutoRejection: typeof processAutoRejection;
};
export default autoRejectionService;
//# sourceMappingURL=autoRejection.service.d.ts.map