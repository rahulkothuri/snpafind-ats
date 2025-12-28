/**
 * Bulk move request interface
 * Requirements: 1.3
 */
export interface BulkMoveRequest {
    candidateIds: string[];
    targetStageId: string;
    jobId: string;
    comment?: string;
    movedBy?: string;
}
/**
 * Individual failure details
 * Requirements: 1.6
 */
export interface BulkMoveFailure {
    candidateId: string;
    candidateName?: string;
    error: string;
}
/**
 * Bulk move result interface
 * Requirements: 1.5, 1.6
 */
export interface BulkMoveResult {
    success: boolean;
    movedCount: number;
    failedCount: number;
    failures?: BulkMoveFailure[];
}
export declare const bulkMoveService: {
    /**
     * Move multiple candidates to a target stage in a single operation
     * Uses database transaction for atomic operations
     * Handles partial failures gracefully
     * Requirements: 1.3, 1.4, 1.5, 1.6
     */
    move(data: BulkMoveRequest): Promise<BulkMoveResult>;
    /**
     * Move a single candidate within a transaction
     * Creates stage history and activity records
     * Requirements: 1.4, 2.1, 2.2
     */
    moveSingleCandidate(params: {
        jobCandidateId: string;
        targetStageId: string;
        targetStageName: string;
        jobId: string;
        comment?: string;
        movedBy?: string;
    }): Promise<void>;
};
export default bulkMoveService;
//# sourceMappingURL=bulkMove.service.d.ts.map