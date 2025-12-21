import type { PipelineStageConfig, UserRole } from '../types/index.js';
export interface StageTemplate {
    id: string;
    name: string;
    description: string;
    stages: PipelineStageConfig[];
    createdBy: string;
    isPublic: boolean;
    companyId: string;
    createdAt: Date;
    updatedAt: Date;
    creatorName?: string;
    creatorEmail?: string;
}
export interface CreateStageTemplateData {
    name: string;
    description?: string;
    stages: PipelineStageConfig[];
    isPublic?: boolean;
    companyId: string;
    createdBy: string;
}
export interface UpdateStageTemplateData {
    name?: string;
    description?: string;
    stages?: PipelineStageConfig[];
    isPublic?: boolean;
}
export declare const stageTemplateService: {
    /**
     * Create a new stage template
     * Requirements: 3.1, 3.2
     */
    create(data: CreateStageTemplateData): Promise<StageTemplate>;
    /**
     * Get all stage templates accessible to a user
     * Requirements: 3.1, 3.2
     */
    getAccessibleTemplates(userId: string, userRole: UserRole, companyId: string): Promise<StageTemplate[]>;
    /**
     * Get a stage template by ID with access validation
     * Requirements: 3.1, 3.2
     */
    getById(id: string, userId: string, userRole: UserRole, companyId: string): Promise<StageTemplate>;
    /**
     * Update a stage template
     * Requirements: 3.2
     */
    update(id: string, data: UpdateStageTemplateData, userId: string, userRole: UserRole): Promise<StageTemplate>;
    /**
     * Delete a stage template
     * Requirements: 3.2
     */
    delete(id: string, userId: string, userRole: UserRole): Promise<void>;
    /**
     * Get stage templates from existing jobs for import
     * Requirements: 3.1, 3.3
     */
    getJobStageTemplates(userId: string, userRole: UserRole, companyId: string): Promise<Array<{
        jobId: string;
        jobTitle: string;
        stages: PipelineStageConfig[];
        createdAt: Date;
    }>>;
    /**
     * Import stages from a job and create a new template
     * Requirements: 3.3, 3.4
     */
    importFromJob(jobId: string, templateName: string, templateDescription: string, userId: string, userRole: UserRole, companyId: string): Promise<StageTemplate>;
    /**
     * Map Prisma stage template to StageTemplate type
     */
    mapToStageTemplate(template: {
        id: string;
        name: string;
        description: string;
        stages: any;
        isPublic: boolean;
        companyId: string;
        createdBy: string;
        createdAt: Date;
        updatedAt: Date;
    }): StageTemplate;
};
export default stageTemplateService;
//# sourceMappingURL=stageTemplate.service.d.ts.map