type TransactionClient = any;
/**
 * Stage History Entry interface
 * Requirements: 2.1, 2.2, 2.3
 */
export interface StageHistoryEntry {
    id: string;
    jobCandidateId: string;
    stageId: string;
    stageName: string;
    enteredAt: Date;
    exitedAt?: Date;
    durationHours?: number;
    comment?: string;
    movedBy?: string;
    movedByName?: string;
}
export interface CreateStageEntryData {
    jobCandidateId: string;
    stageId: string;
    stageName: string;
    comment?: string;
    movedBy?: string;
}
export interface CloseStageEntryData {
    jobCandidateId: string;
    stageId: string;
    exitedAt?: Date;
}
/**
 * Calculate duration in hours between two dates
 * Requirements: 2.3
 */
export declare function calculateDurationHours(enteredAt: Date, exitedAt: Date): number;
export declare const stageHistoryService: {
    /**
     * Create a new stage entry when a candidate enters a stage
     * Requirements: 2.1
     */
    createStageEntry(data: CreateStageEntryData, tx?: TransactionClient): Promise<StageHistoryEntry>;
    /**
     * Close a stage entry when a candidate exits a stage
     * Records exit timestamp and calculates duration
     * Requirements: 2.2, 2.3
     */
    closeStageEntry(data: CloseStageEntryData, tx?: TransactionClient): Promise<StageHistoryEntry | null>;
    /**
     * Get stage history for a job candidate
     * Returns all stage entries with duration calculations
     * Requirements: 2.3
     */
    getStageHistory(jobCandidateId: string): Promise<StageHistoryEntry[]>;
    /**
     * Get stage history for a candidate by candidate ID
     * Returns history across all job applications
     */
    getStageHistoryByCandidateId(candidateId: string): Promise<StageHistoryEntry[]>;
    /**
     * Get the current open stage entry for a job candidate
     */
    getCurrentStageEntry(jobCandidateId: string): Promise<StageHistoryEntry | null>;
};
export default stageHistoryService;
//# sourceMappingURL=stageHistory.service.d.ts.map