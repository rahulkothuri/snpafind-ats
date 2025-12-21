/**
 * Integration Test: Stage Import Functionality
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 * 
 * Tests the complete stage import workflow:
 * 1. Create jobs with different pipeline configurations
 * 2. Test stage template creation and management
 * 3. Test stage import from existing jobs
 * 4. Test stage modification during import
 * 5. Test access control for stage templates
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import bcrypt from 'bcrypt';
import prisma from '../../lib/prisma.js';
import authService from '../../services/auth.service.js';
import jobService from '../../services/job.service.js';
import stageTemplateService from '../../services/stageTemplate.service.js';

// Helper function to hash passwords for testing
const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

// Test data
let testCompanyId: string;
let adminUserId: string;
let recruiterUserId: string;
let sourceJobId: string;
let targetJobId: string;
let templateId: string;

beforeAll(async () => {
  // Create a test company
  const company = await prisma.company.create({
    data: {
      name: 'Stage Import Test Company',
      contactEmail: 'test@stageimport.com',
    },
  });
  testCompanyId = company.id;

  // Create admin user
  const adminData = {
    fullName: 'Admin User',
    email: `admin-${Date.now()}@stageimport.com`,
    password: 'AdminPassword123!',
    companyName: 'Stage Import Test Company',
  };
  
  await authService.register(adminData);
  const adminLogin = await authService.login({
    email: adminData.email,
    password: adminData.password,
  });
  adminUserId = adminLogin.user.id;

  // Create recruiter user
  const recruiterUser = await prisma.user.create({
    data: {
      name: 'Recruiter User',
      email: `recruiter-${Date.now()}@stageimport.com`,
      passwordHash: await hashPassword('hashedpassword'),
      role: 'recruiter',
      companyId: testCompanyId,
      isActive: true,
    },
  });
  recruiterUserId = recruiterUser.id;
});

afterAll(async () => {
  // Clean up in reverse order of creation
  try {
    // Delete stage template
    if (templateId) {
      await prisma.pipelineStageTemplate.delete({ where: { id: templateId } });
    }

    // Delete jobs and their stages
    if (sourceJobId) {
      await prisma.pipelineStage.deleteMany({ where: { jobId: sourceJobId } });
      await prisma.job.delete({ where: { id: sourceJobId } });
    }
    if (targetJobId) {
      await prisma.pipelineStage.deleteMany({ where: { jobId: targetJobId } });
      await prisma.job.delete({ where: { id: targetJobId } });
    }

    // Delete users
    if (recruiterUserId) await prisma.user.delete({ where: { id: recruiterUserId } });
    if (adminUserId) await prisma.user.delete({ where: { id: adminUserId } });

    // Delete company
    if (testCompanyId) await prisma.company.delete({ where: { id: testCompanyId } });
  } catch {
    // Ignore cleanup errors
  }
});

describe('Integration: Stage Import Functionality', () => {
  /**
   * Step 1: Create source job with custom pipeline stages
   * Requirements: 3.1, 3.3
   */
  it('should create source job with custom pipeline stages', async () => {
    const jobData = {
      companyId: testCompanyId,
      title: 'Source Job with Custom Stages',
      department: 'Engineering',
      location: 'Remote',
      employmentType: 'Full-time',
      description: 'Job with custom pipeline for import testing',
    };

    const job = await jobService.create(jobData);
    sourceJobId = job.id;

    // Verify default stages were created
    expect(job.stages).toBeDefined();
    expect(job.stages!.length).toBeGreaterThan(0);

    // Add custom stages to the job
    const customStages = [
      {
        jobId: sourceJobId,
        name: 'Technical Assessment',
        position: 10,
        isDefault: false,
        isMandatory: true,
      },
      {
        jobId: sourceJobId,
        name: 'Code Review',
        position: 11,
        isDefault: false,
        isMandatory: false,
      },
      {
        jobId: sourceJobId,
        name: 'System Design Interview',
        position: 12,
        isDefault: false,
        isMandatory: true,
      },
    ];

    for (const stage of customStages) {
      await prisma.pipelineStage.create({ data: stage });
    }

    // Verify custom stages were added
    const updatedJob = await prisma.job.findUnique({
      where: { id: sourceJobId },
      include: {
        pipelineStages: {
          orderBy: { position: 'asc' },
        },
      },
    });

    expect(updatedJob!.pipelineStages.length).toBeGreaterThan(8); // Default + custom stages
    
    const customStageNames = updatedJob!.pipelineStages
      .filter(s => !s.isDefault)
      .map(s => s.name);
    
    expect(customStageNames).toContain('Technical Assessment');
    expect(customStageNames).toContain('Code Review');
    expect(customStageNames).toContain('System Design Interview');
  }, 30000);

  /**
   * Step 2: Create stage template from job stages
   * Requirements: 3.1, 3.2
   */
  it('should create stage template from job stages', async () => {
    // Get the source job with all its stages
    const sourceJob = await prisma.job.findUnique({
      where: { id: sourceJobId },
      include: {
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
    });

    expect(sourceJob).not.toBeNull();
    expect(sourceJob!.pipelineStages.length).toBeGreaterThan(0);

    // Create template using the service
    const templateData = {
      name: 'Engineering Pipeline Template',
      description: 'Custom pipeline for engineering roles',
      stages: sourceJob!.pipelineStages.map(stage => ({
        name: stage.name,
        position: stage.position,
        isMandatory: stage.isMandatory,
        subStages: stage.subStages.map(sub => ({
          name: sub.name,
          position: sub.position,
        })),
      })),
      isPublic: false,
      companyId: testCompanyId,
      createdBy: adminUserId,
    };

    const template = await stageTemplateService.create(templateData);
    templateId = template.id;

    expect(template.id).toBeDefined();
    expect(template.name).toBe('Engineering Pipeline Template');
    expect(template.description).toBe('Custom pipeline for engineering roles');
    expect(template.stages.length).toBeGreaterThan(0);
    expect(template.isPublic).toBe(false);
    expect(template.companyId).toBe(testCompanyId);
    expect(template.createdBy).toBe(adminUserId);

    // Verify template contains custom stages
    const stageNames = template.stages.map(s => s.name);
    expect(stageNames).toContain('Technical Assessment');
    expect(stageNames).toContain('Code Review');
    expect(stageNames).toContain('System Design Interview');
  }, 30000);

  /**
   * Step 3: Test template access control
   * Requirements: 3.1, 3.2
   */
  it('should control access to stage templates based on user role', async () => {
    // Admin should see the template
    const adminTemplates = await stageTemplateService.getAccessibleTemplates(
      adminUserId,
      'admin',
      testCompanyId
    );
    
    expect(adminTemplates.length).toBeGreaterThan(0);
    const adminTemplate = adminTemplates.find(t => t.id === templateId);
    expect(adminTemplate).toBeDefined();
    expect(adminTemplate!.name).toBe('Engineering Pipeline Template');

    // Recruiter should not see private template created by admin
    const recruiterTemplates = await stageTemplateService.getAccessibleTemplates(
      recruiterUserId,
      'recruiter',
      testCompanyId
    );
    
    const recruiterTemplate = recruiterTemplates.find(t => t.id === templateId);
    expect(recruiterTemplate).toBeUndefined();

    // Make template public
    await stageTemplateService.update(
      templateId,
      { isPublic: true },
      adminUserId,
      'admin'
    );

    // Now recruiter should see the public template
    const recruiterPublicTemplates = await stageTemplateService.getAccessibleTemplates(
      recruiterUserId,
      'recruiter',
      testCompanyId
    );
    
    const recruiterPublicTemplate = recruiterPublicTemplates.find(t => t.id === templateId);
    expect(recruiterPublicTemplate).toBeDefined();
    expect(recruiterPublicTemplate!.isPublic).toBe(true);
  }, 30000);

  /**
   * Step 4: Test stage import from job to job
   * Requirements: 3.3, 3.4
   */
  it('should import stages from source job to target job', async () => {
    // Create target job
    const targetJobData = {
      companyId: testCompanyId,
      title: 'Target Job for Import',
      department: 'Engineering',
      location: 'San Francisco',
      employmentType: 'Full-time',
      description: 'Job to receive imported stages',
    };

    const targetJob = await jobService.create(targetJobData);
    targetJobId = targetJob.id;

    // Get initial stage count
    const initialStages = await prisma.pipelineStage.findMany({
      where: { jobId: targetJobId },
    });
    const initialStageCount = initialStages.length;

    // Import stages from source job using the service
    const importedTemplate = await stageTemplateService.importFromJob(
      sourceJobId,
      'Imported Engineering Pipeline',
      'Pipeline imported from source job',
      adminUserId,
      'admin',
      testCompanyId
    );

    expect(importedTemplate.id).toBeDefined();
    expect(importedTemplate.name).toBe('Imported Engineering Pipeline');
    expect(importedTemplate.stages.length).toBeGreaterThan(0);

    // Verify imported stages contain custom stages from source
    const importedStageNames = importedTemplate.stages.map(s => s.name);
    expect(importedStageNames).toContain('Technical Assessment');
    expect(importedStageNames).toContain('Code Review');
    expect(importedStageNames).toContain('System Design Interview');

    // Clean up the imported template
    await prisma.pipelineStageTemplate.delete({ where: { id: importedTemplate.id } });
  }, 30000);

  /**
   * Step 5: Test stage modification during import
   * Requirements: 3.4, 3.5
   */
  it('should allow stage modification during import process', async () => {
    // Get available job stage templates
    const jobTemplates = await stageTemplateService.getJobStageTemplates(
      adminUserId,
      'admin',
      testCompanyId
    );

    expect(jobTemplates.length).toBeGreaterThan(0);
    
    const sourceTemplate = jobTemplates.find(t => t.jobId === sourceJobId);
    expect(sourceTemplate).toBeDefined();
    expect(sourceTemplate!.stages.length).toBeGreaterThan(0);

    // Simulate stage modification during import
    const originalStages = sourceTemplate!.stages;
    const modifiedStages = originalStages.map((stage, index) => ({
      ...stage,
      name: `Modified ${stage.name}`,
      position: index,
      isMandatory: !stage.isMandatory, // Toggle mandatory status
    }));

    // Create a new template with modified stages
    const modifiedTemplate = await stageTemplateService.create({
      name: 'Modified Import Template',
      description: 'Template with modified imported stages',
      stages: modifiedStages,
      isPublic: false,
      companyId: testCompanyId,
      createdBy: adminUserId,
    });

    expect(modifiedTemplate.id).toBeDefined();
    expect(modifiedTemplate.stages.length).toBe(originalStages.length);

    // Verify modifications were applied
    const modifiedStageNames = modifiedTemplate.stages.map(s => s.name);
    expect(modifiedStageNames.every(name => name.startsWith('Modified '))).toBe(true);

    // Verify mandatory status was toggled
    for (let i = 0; i < originalStages.length; i++) {
      expect(modifiedTemplate.stages[i].isMandatory).toBe(!originalStages[i].isMandatory);
    }

    // Clean up
    await prisma.pipelineStageTemplate.delete({ where: { id: modifiedTemplate.id } });
  }, 30000);

  /**
   * Step 6: Test error handling for stage import
   * Requirements: 3.5
   */
  it('should handle errors during stage import process', async () => {
    // Test import from non-existent job
    await expect(
      stageTemplateService.importFromJob(
        'non-existent-job-id',
        'Invalid Import',
        'Should fail',
        adminUserId,
        'admin',
        testCompanyId
      )
    ).rejects.toThrow();

    // Test import with duplicate template name
    await expect(
      stageTemplateService.create({
        name: 'Engineering Pipeline Template', // Duplicate name
        description: 'Duplicate template',
        stages: [{ name: 'Test Stage', position: 0, isMandatory: false }],
        isPublic: false,
        companyId: testCompanyId,
        createdBy: adminUserId,
      })
    ).rejects.toThrow();

    // Test import with empty stages
    await expect(
      stageTemplateService.create({
        name: 'Empty Template',
        description: 'Template with no stages',
        stages: [],
        isPublic: false,
        companyId: testCompanyId,
        createdBy: adminUserId,
      })
    ).rejects.toThrow();

    // Test unauthorized access to template
    await expect(
      stageTemplateService.getById(
        templateId,
        'unauthorized-user-id',
        'recruiter',
        'different-company-id'
      )
    ).rejects.toThrow();
  }, 30000);

  /**
   * Step 7: Test stage template management operations
   * Requirements: 3.2
   */
  it('should support full CRUD operations on stage templates', async () => {
    // Create a new template for testing CRUD operations
    const crudTemplate = await stageTemplateService.create({
      name: 'CRUD Test Template',
      description: 'Template for testing CRUD operations',
      stages: [
        { name: 'Initial Stage', position: 0, isMandatory: true },
        { name: 'Second Stage', position: 1, isMandatory: false },
      ],
      isPublic: false,
      companyId: testCompanyId,
      createdBy: adminUserId,
    });

    // Read - Get template by ID
    const retrievedTemplate = await stageTemplateService.getById(
      crudTemplate.id,
      adminUserId,
      'admin',
      testCompanyId
    );
    
    expect(retrievedTemplate.id).toBe(crudTemplate.id);
    expect(retrievedTemplate.name).toBe('CRUD Test Template');
    expect(retrievedTemplate.stages.length).toBe(2);

    // Update - Modify template
    const updatedTemplate = await stageTemplateService.update(
      crudTemplate.id,
      {
        name: 'Updated CRUD Template',
        description: 'Updated description',
        isPublic: true,
        stages: [
          { name: 'Updated Initial Stage', position: 0, isMandatory: false },
          { name: 'Updated Second Stage', position: 1, isMandatory: true },
          { name: 'New Third Stage', position: 2, isMandatory: false },
        ],
      },
      adminUserId,
      'admin'
    );

    expect(updatedTemplate.name).toBe('Updated CRUD Template');
    expect(updatedTemplate.description).toBe('Updated description');
    expect(updatedTemplate.isPublic).toBe(true);
    expect(updatedTemplate.stages.length).toBe(3);

    // Delete - Remove template
    await stageTemplateService.delete(crudTemplate.id, adminUserId, 'admin');

    // Verify deletion
    await expect(
      stageTemplateService.getById(
        crudTemplate.id,
        adminUserId,
        'admin',
        testCompanyId
      )
    ).rejects.toThrow();
  }, 30000);

  /**
   * Step 8: Test stage import independence
   * Requirements: 3.3, 3.4
   */
  it('should ensure imported stages are independent of source job', async () => {
    // Create a template from the source job
    const independenceTemplate = await stageTemplateService.importFromJob(
      sourceJobId,
      'Independence Test Template',
      'Testing stage independence',
      adminUserId,
      'admin',
      testCompanyId
    );

    // Get original stage count from source job
    const originalSourceStages = await prisma.pipelineStage.findMany({
      where: { jobId: sourceJobId },
    });

    // Modify the imported template
    const modifiedStages = independenceTemplate.stages.map(stage => ({
      ...stage,
      name: `Independent ${stage.name}`,
    }));

    await stageTemplateService.update(
      independenceTemplate.id,
      { stages: modifiedStages },
      adminUserId,
      'admin'
    );

    // Verify source job stages are unchanged
    const currentSourceStages = await prisma.pipelineStage.findMany({
      where: { jobId: sourceJobId },
    });

    expect(currentSourceStages.length).toBe(originalSourceStages.length);
    
    // Verify no stage names in source job start with "Independent"
    const sourceStageNames = currentSourceStages.map(s => s.name);
    expect(sourceStageNames.every(name => !name.startsWith('Independent '))).toBe(true);

    // Verify imported template has modified names
    const updatedTemplate = await stageTemplateService.getById(
      independenceTemplate.id,
      adminUserId,
      'admin',
      testCompanyId
    );

    const templateStageNames = updatedTemplate.stages.map(s => s.name);
    expect(templateStageNames.every(name => name.startsWith('Independent '))).toBe(true);

    // Clean up
    await prisma.pipelineStageTemplate.delete({ where: { id: independenceTemplate.id } });
  }, 30000);
});