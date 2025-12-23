/**
 * Stage Metric interface
 * Requirements: 2.4, 4.1
 */
export interface StageMetric {
    stageId: string;
    stageName: string;
    candidateCount: number;
    avgDaysInStage: number;
    slaBreachCount: number;
}
/**
 * Pipeline Analytics interface
 * Requirements: 2.4, 4.1
 */
export interface PipelineAnalytics {
    stageMetrics: StageMetric[];
    overallTAT: number;
}
export declare const pipelineAnalyticsService: {
    /**
     * Get stage metrics for a job's pipeline
     * Calculates candidate counts, average TAT, and SLA breach counts per stage
     * Requirements: 2.4, 4.1
     */
    getStageMetrics(jobId: string): Promise<PipelineAnalytics>;
    /**
     * Calculate overall TAT for a job
     * This is the average total time candidates spend in the pipeline
     * Requirements: 2.4
     */
    calculateOverallTAT(jobId: string): Promise<number>;
};
export default pipelineAnalyticsService;
//# sourceMappingURL=pipelineAnalytics.service.d.ts.map