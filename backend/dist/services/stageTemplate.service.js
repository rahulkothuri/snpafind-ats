import prisma from '../lib/prisma.js';
import { NotFoundError, ValidationError, AuthorizationError } from '../middleware/errorHandler.js';
export const stageTemplateService = {
    /**
     * Create a new stage template
     * Requirements: 3.1, 3.2
     */
    async create(data) {
        // Validate required fields
        const errors = {};
        if (!data.name || data.name.trim() === '') {
            errors.name = ['Template name is required'];
        }
        if (!data.stages || data.stages.length === 0) {
            errors.stages = ['At least one stage is required'];
        }
        if (Object.keys(errors).length > 0) {
            throw new ValidationError(errors);
        }
        // Check for duplicate template names within the company
        const existingTemplate = await prisma.pipelineStageTemplate.findFirst({
            where: {
                name: data.name.trim(),
                companyId: data.companyId,
            },
        });
        if (existingTemplate) {
            throw new ValidationError({ name: ['Template name already exists'] });
        }
        // Create the template
        const template = await prisma.pipelineStageTemplate.create({
            data: {
                name: data.name.trim(),
                description: data.description || '',
                stages: JSON.stringify(data.stages),
                isPublic: data.isPublic || false,
                companyId: data.companyId,
                createdBy: data.createdBy,
            },
        });
        return this.mapToStageTemplate(template);
    },
    /**
     * Get all stage templates accessible to a user
     * Requirements: 3.1, 3.2
     */
    async getAccessibleTemplates(userId, userRole, companyId) {
        // Get user's company templates and public templates
        const templates = await prisma.pipelineStageTemplate.findMany({
            where: {
                OR: [
                    { companyId, isPublic: true },
                    { companyId, createdBy: userId },
                    // Admins and hiring managers can see all company templates
                    ...(userRole === 'admin' || userRole === 'hiring_manager'
                        ? [{ companyId }]
                        : []),
                ],
            },
            orderBy: [
                { isPublic: 'desc' },
                { createdAt: 'desc' },
            ],
            include: {
                creator: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });
        return templates.map(template => ({
            ...this.mapToStageTemplate(template),
            creatorName: template.creator.name,
            creatorEmail: template.creator.email,
        }));
    },
    /**
     * Get a stage template by ID with access validation
     * Requirements: 3.1, 3.2
     */
    async getById(id, userId, userRole, companyId) {
        const template = await prisma.pipelineStageTemplate.findUnique({
            where: { id },
            include: {
                creator: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });
        if (!template) {
            throw new NotFoundError('Stage template');
        }
        // Check access permissions
        const hasAccess = template.companyId === companyId && (template.isPublic ||
            template.createdBy === userId ||
            userRole === 'admin' ||
            userRole === 'hiring_manager');
        if (!hasAccess) {
            throw new AuthorizationError();
        }
        return {
            ...this.mapToStageTemplate(template),
            creatorName: template.creator.name,
            creatorEmail: template.creator.email,
        };
    },
    /**
     * Update a stage template
     * Requirements: 3.2
     */
    async update(id, data, userId, userRole) {
        const existing = await prisma.pipelineStageTemplate.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new NotFoundError('Stage template');
        }
        // Check permissions - only creator or admin can update
        if (existing.createdBy !== userId && userRole !== 'admin') {
            throw new AuthorizationError();
        }
        // Validate name uniqueness if name is being changed
        if (data.name && data.name !== existing.name) {
            const duplicateTemplate = await prisma.pipelineStageTemplate.findFirst({
                where: {
                    name: data.name.trim(),
                    companyId: existing.companyId,
                    id: { not: id },
                },
            });
            if (duplicateTemplate) {
                throw new ValidationError({ name: ['Template name already exists'] });
            }
        }
        const template = await prisma.pipelineStageTemplate.update({
            where: { id },
            data: {
                name: data.name?.trim(),
                description: data.description,
                stages: data.stages ? JSON.stringify(data.stages) : undefined,
                isPublic: data.isPublic,
            },
        });
        return this.mapToStageTemplate(template);
    },
    /**
     * Delete a stage template
     * Requirements: 3.2
     */
    async delete(id, userId, userRole) {
        const existing = await prisma.pipelineStageTemplate.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new NotFoundError('Stage template');
        }
        // Check permissions - only creator or admin can delete
        if (existing.createdBy !== userId && userRole !== 'admin') {
            throw new AuthorizationError();
        }
        await prisma.pipelineStageTemplate.delete({
            where: { id },
        });
    },
    /**
     * Get stage templates from existing jobs for import
     * Requirements: 3.1, 3.3
     */
    async getJobStageTemplates(userId, userRole, companyId) {
        // Get jobs accessible to the user with their pipeline stages
        const jobs = await prisma.job.findMany({
            where: {
                companyId,
                // Apply role-based filtering
                ...(userRole === 'recruiter'
                    ? { assignedRecruiterId: userId }
                    : {}),
            },
            select: {
                id: true,
                title: true,
                createdAt: true,
                pipelineStages: {
                    where: { parentId: null }, // Only top-level stages
                    orderBy: { position: 'asc' },
                    include: {
                        subStages: {
                            orderBy: { position: 'asc' },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 50, // Limit to recent jobs
        });
        return jobs
            .filter(job => job.pipelineStages.length > 0) // Only jobs with stages
            .map(job => ({
            jobId: job.id,
            jobTitle: job.title,
            createdAt: job.createdAt,
            stages: job.pipelineStages.map(stage => ({
                id: stage.id,
                name: stage.name,
                position: stage.position,
                isMandatory: stage.isMandatory,
                subStages: stage.subStages.map(sub => ({
                    id: sub.id,
                    name: sub.name,
                    position: sub.position,
                })),
            })),
        }));
    },
    /**
     * Import stages from a job and create a new template
     * Requirements: 3.3, 3.4
     */
    async importFromJob(jobId, templateName, templateDescription, userId, userRole, companyId) {
        // Get the source job with stages
        const job = await prisma.job.findUnique({
            where: { id: jobId },
            include: {
                pipelineStages: {
                    where: { parentId: null },
                    orderBy: { position: 'asc' },
                    include: {
                        subStages: {
                            orderBy: { position: 'asc' },
                        },
                    },
                },
            },
        });
        if (!job) {
            throw new NotFoundError('Job');
        }
        // Check access to the source job
        if (job.companyId !== companyId) {
            throw new AuthorizationError();
        }
        if (userRole === 'recruiter' && job.assignedRecruiterId !== userId) {
            throw new AuthorizationError();
        }
        if (job.pipelineStages.length === 0) {
            throw new ValidationError({ stages: ['Job has no pipeline stages to import'] });
        }
        // Convert stages to template format
        const stages = job.pipelineStages.map(stage => ({
            name: stage.name,
            position: stage.position,
            isMandatory: stage.isMandatory,
            subStages: stage.subStages.map(sub => ({
                name: sub.name,
                position: sub.position,
            })),
        }));
        // Create the template
        return this.create({
            name: templateName,
            description: templateDescription || `Imported from job: ${job.title}`,
            stages,
            isPublic: false,
            companyId,
            createdBy: userId,
        });
    },
    /**
     * Map Prisma stage template to StageTemplate type
     */
    mapToStageTemplate(template) {
        let stages = [];
        try {
            if (typeof template.stages === 'string') {
                stages = JSON.parse(template.stages);
            }
            else if (Array.isArray(template.stages)) {
                stages = template.stages;
            }
        }
        catch (error) {
            console.error('Failed to parse stage template stages:', error);
            stages = [];
        }
        return {
            id: template.id,
            name: template.name,
            description: template.description,
            stages,
            isPublic: template.isPublic,
            companyId: template.companyId,
            createdBy: template.createdBy,
            createdAt: template.createdAt,
            updatedAt: template.updatedAt,
        };
    },
};
export default stageTemplateService;
//# sourceMappingURL=stageTemplate.service.js.map