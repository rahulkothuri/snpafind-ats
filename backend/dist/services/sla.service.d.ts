/**
 * SLA Configuration interface
 * Requirements: 10.5
 */
export interface SLAConfig {
    id: string;
    companyId: string;
    stageName: string;
    thresholdDays: number;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * SLA Breach Alert interface
 * Requirements: 10.1, 10.2, 10.3
 */
export interface SLABreachAlert {
    id: string;
    candidateId: string;
    candidateName: string;
    jobId: string;
    jobTitle: string;
    stageName: string;
    daysInStage: number;
    thresholdDays: number;
    daysOverdue: number;
    enteredAt: Date;
}
export interface UpdateSLAConfigData {
    stageName: string;
    thresholdDays: number;
}
export interface AlertsFilter {
    type?: 'sla' | 'feedback' | 'all';
}
export declare const slaService: {
    /**
     * Get SLA configuration for a company
     * Requirements: 10.5
     */
    getSLAConfig(companyId: string): Promise<SLAConfig[]>;
    /**
     * Update or create SLA configuration for a stage
     * Requirements: 10.5
     */
    updateSLAConfig(companyId: string, data: UpdateSLAConfigData): Promise<SLAConfig>;
    /**
     * Update multiple SLA configurations at once
     * Requirements: 10.5
     */
    updateSLAConfigs(companyId: string, configs: UpdateSLAConfigData[]): Promise<SLAConfig[]>;
    /**
     * Delete SLA configuration for a stage
     * Requirements: 10.5
     */
    deleteSLAConfig(companyId: string, stageName: string): Promise<void>;
    /**
     * Check for SLA breaches across all candidates in a company
     * Returns candidates who have exceeded the SLA threshold for their current stage
     * Requirements: 10.1
     */
    checkSLABreaches(companyId: string): Promise<SLABreachAlert[]>;
    /**
     * Check SLA breach for a specific job candidate
     * Returns breach info if threshold exceeded, null otherwise
     * Requirements: 10.1, 2.5
     */
    checkCandidateSLABreach(jobCandidateId: string): Promise<SLABreachAlert | null>;
    /**
     * Create SLA breach notification for a candidate
     * Requirements: 10.1, 8.1
     */
    createSLABreachNotification(breach: SLABreachAlert, _companyId: string): Promise<void>;
    /**
     * Get all alerts (SLA breaches and pending feedback)
     * Requirements: 10.1, 10.2, 10.3, 9.2
     */
    getAlerts(companyId: string, filter?: AlertsFilter): Promise<{
        slaBreaches: SLABreachAlert[];
        pendingFeedback: unknown[];
    }>;
    /**
     * Get default SLA thresholds
     * Returns suggested default thresholds for common stages
     */
    getDefaultThresholds(): {
        stageName: string;
        thresholdDays: number;
    }[];
};
export default slaService;
//# sourceMappingURL=sla.service.d.ts.map