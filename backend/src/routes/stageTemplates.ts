import { Router } from 'express';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';
import { stageTemplateService } from '../services/stageTemplate.service.js';
import type { CreateStageTemplateData, UpdateStageTemplateData } from '../services/stageTemplate.service.js';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * GET /stage-templates
 * Get all stage templates accessible to the current user
 * Requirements: 3.1, 3.2
 */
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { userId, role, companyId } = req.user!;
    
    const templates = await stageTemplateService.getAccessibleTemplates(userId, role, companyId);
    
    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /stage-templates/from-jobs
 * Get stage templates from existing jobs for import
 * Requirements: 3.1, 3.3
 */
router.get('/from-jobs', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { userId, role, companyId } = req.user!;
    
    const jobTemplates = await stageTemplateService.getJobStageTemplates(userId, role, companyId);
    
    res.json({
      success: true,
      data: jobTemplates,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /stage-templates/:id
 * Get a specific stage template by ID
 * Requirements: 3.1, 3.2
 */
router.get('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const { userId, role, companyId } = req.user!;
    
    const template = await stageTemplateService.getById(id, userId, role, companyId);
    
    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /stage-templates
 * Create a new stage template
 * Requirements: 3.1, 3.2
 */
router.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { userId, companyId } = req.user!;
    const { name, description, stages, isPublic } = req.body;
    
    const templateData: CreateStageTemplateData = {
      name,
      description,
      stages,
      isPublic,
      companyId,
      createdBy: userId,
    };
    
    const template = await stageTemplateService.create(templateData);
    
    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /stage-templates/import-from-job
 * Import stages from a job and create a new template
 * Requirements: 3.3, 3.4
 */
router.post('/import-from-job', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { userId, role, companyId } = req.user!;
    const { jobId, templateName, templateDescription } = req.body;
    
    if (!jobId || !templateName) {
      return res.status(400).json({
        success: false,
        message: 'Job ID and template name are required',
      });
    }
    
    const template = await stageTemplateService.importFromJob(
      jobId,
      templateName,
      templateDescription || '',
      userId,
      role,
      companyId
    );
    
    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /stage-templates/:id
 * Update a stage template
 * Requirements: 3.2
 */
router.put('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user!;
    const { name, description, stages, isPublic } = req.body;
    
    const updateData: UpdateStageTemplateData = {
      name,
      description,
      stages,
      isPublic,
    };
    
    const template = await stageTemplateService.update(id, updateData, userId, role);
    
    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /stage-templates/:id
 * Delete a stage template
 * Requirements: 3.2
 */
router.delete('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user!;
    
    await stageTemplateService.delete(id, userId, role);
    
    res.json({
      success: true,
      message: 'Stage template deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;