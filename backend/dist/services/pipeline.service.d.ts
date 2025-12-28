import type { PipelineStage } from '../types/index.js';
interface PrismaStageResult {
    id: string;
    jobId: string;
    name: string;
    position: number;
    isDefault: boolean;
    isMandatory: boolean;
    parentId: string | null;
    createdAt: Date;
}
export interface CreateStageData {
    jobId: string;
    name: string;
    position: number;
}
export interface ReorderStageData {
    stageId: string;
    newPosition: number;
}
export declare const pipelineService: {
    /**
     * Get all stages for a job
     * Requirements: 6.3
     */
    getStagesByJobId(jobId: string): Promise<PipelineStage[]>;
    /**
     * Insert a custom sub-stage at a specific position
     * Requirements: 6.2
     */
    insertStage(data: CreateStageData): Promise<PipelineStage>;
    /**
     * Reorder a stage to a new position
     * Requirements: 6.4
     */
    reorderStage(data: ReorderStageData): Promise<PipelineStage[]>;
    /**
     * Delete a custom stage (cannot delete default stages)
     */
    deleteStage(stageId: string): Promise<void>;
    /**
     * Map Prisma stage to PipelineStage type
     */
    mapToStage(stage: PrismaStageResult): PipelineStage;
};
export default pipelineService;
//# sourceMappingURL=pipeline.service.d.ts.map