import prisma from '../lib/prisma.js';
import type { AutoRejectionRules, AutoRejectionRule, LegacyAutoRejectionRules } from '../types/index.js';
type TransactionClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>;
/**
 * Result of auto-rejection evaluation
 */
export interface AutoRejectionResult {
    shouldReject: boolean;
    reason?: string;
    triggeredRule?: AutoRejectionRule;
}
/**
 * Candidate data for rule evaluation
 */
export interface CandidateData {
    experience?: number;
    location?: string;
    skills?: string[];
    education?: string;
    salaryExpectation?: number;
}
/**
 * Evaluate if a candidate should be auto-rejected based on job rules
 * Requirements: 4.6, 9.2, 9.3, 9.4, 9.5
 *
 * @param candidate - Candidate data for evaluation
 * @param rules - Auto-rejection rules from the job
 * @returns AutoRejectionResult indicating if candidate should be rejected and why
 */
export declare function evaluateAutoRejection(candidate: CandidateData, rules: AutoRejectionRules | LegacyAutoRejectionRules | null | undefined): AutoRejectionResult;
/**
 * Process auto-rejection for a candidate application
 * Requirements: 4.6, 4.7, 4.9, 9.2, 9.3, 9.5, 9.6
 *
 * @param jobCandidateId - The job candidate record ID
 * @param candidateId - The candidate ID
 * @param candidateData - Candidate data for rule evaluation
 * @param jobId - The job ID
 * @param tx - Optional transaction client
 * @returns True if candidate was auto-rejected, false otherwise
 */
export declare function processAutoRejection(jobCandidateId: string, candidateId: string, candidateData: CandidateData, jobId: string, tx?: TransactionClient): Promise<boolean>;
/**
 * Legacy function for backward compatibility
 * Converts experience-only call to new format
 */
export declare function processAutoRejectionLegacy(jobCandidateId: string, candidateId: string, candidateExperience: number, jobId: string, tx?: TransactionClient): Promise<boolean>;
export declare const autoRejectionService: {
    evaluateAutoRejection: typeof evaluateAutoRejection;
    processAutoRejection: typeof processAutoRejection;
    processAutoRejectionLegacy: typeof processAutoRejectionLegacy;
};
export default autoRejectionService;
//# sourceMappingURL=autoRejection.service.d.ts.map