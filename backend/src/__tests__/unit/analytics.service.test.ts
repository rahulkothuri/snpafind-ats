import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { analyticsService, AnalyticsService } from '../../services/analytics.service.js';
import prisma from '../../lib/prisma.js';

describe('Analytics Service', () => {
  let testCompanyId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create test data
    const company = await prisma.company.create({
      data: {
        name: 'Test Company',
        contactEmail: 'test@company.com'
      }
    });
    testCompanyId = company.id;

    const user = await prisma.user.create({
      data: {
        companyId: testCompanyId,
        name: 'Test Recruiter',
        email: 'recruiter@test.com',
        passwordHash: 'hashedpassword',
        role: 'recruiter'
      }
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Clean up test data in correct order to handle foreign key constraints
    await prisma.user.deleteMany({ where: { companyId: testCompanyId } });
    // Delete any remaining jobs and related data
    await prisma.jobCandidate.deleteMany({ 
      where: { 
        job: { companyId: testCompanyId } 
      } 
    });
    await prisma.job.deleteMany({ where: { companyId: testCompanyId } });
    await prisma.candidate.deleteMany({ where: { companyId: testCompanyId } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).sLAConfig.deleteMany({ where: { companyId: testCompanyId } });
    await prisma.company.delete({ where: { id: testCompanyId } });
  });

  it('should be able to import and instantiate the analytics service', () => {
    expect(analyticsService).toBeDefined();
    expect(analyticsService).toBeInstanceOf(AnalyticsService);
  });

  it('should have all required methods', () => {
    expect(typeof analyticsService.getKPIMetrics).toBe('function');
    expect(typeof analyticsService.getFunnelAnalytics).toBe('function');
    expect(typeof analyticsService.getConversionRates).toBe('function');
    expect(typeof analyticsService.getTimeToFill).toBe('function');
    expect(typeof analyticsService.getTimeInStage).toBe('function');
    expect(typeof analyticsService.getSourcePerformance).toBe('function');
    expect(typeof analyticsService.getRecruiterProductivity).toBe('function');
    expect(typeof analyticsService.getPanelPerformance).toBe('function');
    expect(typeof analyticsService.getDropOffAnalysis).toBe('function');
    expect(typeof analyticsService.getRejectionReasons).toBe('function');
    expect(typeof analyticsService.getOfferAcceptanceRate).toBe('function');
    expect(typeof analyticsService.getSLAStatus).toBe('function');
  });

  it('should return recruiter productivity data', async () => {
    const result = await analyticsService.getRecruiterProductivity(
      testCompanyId,
      testUserId,
      'admin'
    );
    
    expect(Array.isArray(result)).toBe(true);
    // With no jobs/candidates, should return empty array or recruiter with zero metrics
    if (result.length > 0) {
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('specialty');
      expect(result[0]).toHaveProperty('activeRoles');
      expect(result[0]).toHaveProperty('cvsAdded');
      expect(result[0]).toHaveProperty('interviewsScheduled');
      expect(result[0]).toHaveProperty('offersMade');
      expect(result[0]).toHaveProperty('hires');
      expect(result[0]).toHaveProperty('avgTimeToFill');
      expect(result[0]).toHaveProperty('productivityScore');
    }
  });

  it('should return panel performance data', async () => {
    const result = await analyticsService.getPanelPerformance(
      testCompanyId,
      testUserId,
      'admin'
    );
    
    expect(Array.isArray(result)).toBe(true);
    // With no interviews, should return empty array
    if (result.length > 0) {
      expect(result[0]).toHaveProperty('panelName');
      expect(result[0]).toHaveProperty('interviewRounds');
      expect(result[0]).toHaveProperty('offerPercentage');
      expect(result[0]).toHaveProperty('topRejectionReason');
      expect(result[0]).toHaveProperty('avgFeedbackTime');
    }
  });

  it('should return SLA status data with correct structure', async () => {
    const result = await analyticsService.getSLAStatus(
      testCompanyId,
      testUserId,
      'admin'
    );
    
    expect(result).toHaveProperty('summary');
    expect(result.summary).toHaveProperty('onTrack');
    expect(result.summary).toHaveProperty('atRisk');
    expect(result.summary).toHaveProperty('breached');
    expect(typeof result.summary.onTrack).toBe('number');
    expect(typeof result.summary.atRisk).toBe('number');
    expect(typeof result.summary.breached).toBe('number');
    
    expect(result).toHaveProperty('roles');
    expect(Array.isArray(result.roles)).toBe(true);
    
    // If there are roles, check their structure
    if (result.roles.length > 0) {
      const role = result.roles[0];
      expect(role).toHaveProperty('roleId');
      expect(role).toHaveProperty('roleName');
      expect(role).toHaveProperty('status');
      expect(role).toHaveProperty('daysOpen');
      expect(role).toHaveProperty('threshold');
      expect(role).toHaveProperty('candidatesBreaching');
      expect(['on_track', 'at_risk', 'breached']).toContain(role.status);
      expect(typeof role.daysOpen).toBe('number');
      expect(typeof role.threshold).toBe('number');
      expect(typeof role.candidatesBreaching).toBe('number');
    }
  });

  it('should calculate SLA status correctly with test data', async () => {
    // Create test job
    const job = await prisma.job.create({
      data: {
        companyId: testCompanyId,
        title: 'Test SLA Job',
        department: 'Engineering',
        location: 'Remote',
        status: 'active',
        assignedRecruiterId: testUserId,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      }
    });

    // Create pipeline stages
    const appliedStage = await prisma.pipelineStage.create({
      data: {
        jobId: job.id,
        name: 'Applied',
        position: 1
      }
    });

    const interviewStage = await prisma.pipelineStage.create({
      data: {
        jobId: job.id,
        name: 'Interview',
        position: 2
      }
    });

    // Create SLA config for Applied stage (2 days threshold)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const slaConfig = await (prisma as any).sLAConfig.create({
      data: {
        companyId: testCompanyId,
        stageName: 'Applied',
        thresholdDays: 2
      }
    });

    // Create test candidate
    const candidate = await prisma.candidate.create({
      data: {
        companyId: testCompanyId,
        name: 'Test Candidate',
        email: 'candidate@test.com',
        phone: '1234567890',
        location: 'Remote',
        source: 'Website'
      }
    });

    // Create job candidate that has been in Applied stage for 4 days (breached)
    const jobCandidate = await prisma.jobCandidate.create({
      data: {
        jobId: job.id,
        candidateId: candidate.id,
        currentStageId: appliedStage.id,
        appliedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
      }
    });

    // Create stage history entry
    const stageHistory = await prisma.stageHistory.create({
      data: {
        jobCandidateId: jobCandidate.id,
        stageId: appliedStage.id,
        stageName: 'Applied',
        enteredAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        exitedAt: null
      }
    });

    try {
      const result = await analyticsService.getSLAStatus(
        testCompanyId,
        testUserId,
        'admin'
      );

      // Should have 1 breached role
      expect(result.summary.breached).toBe(1);
      expect(result.summary.atRisk).toBe(0);
      expect(result.summary.onTrack).toBe(0);

      // Check role details
      expect(result.roles).toHaveLength(1);
      const role = result.roles[0];
      expect(role.roleId).toBe(job.id);
      expect(role.roleName).toBe('Test SLA Job');
      expect(role.status).toBe('breached');
      expect(role.candidatesBreaching).toBe(1);
      expect(role.daysOpen).toBe(5);

    } finally {
      // Clean up test data in correct order
      await prisma.stageHistory.delete({ where: { id: stageHistory.id } });
      await prisma.jobCandidate.delete({ where: { id: jobCandidate.id } });
      await prisma.candidate.delete({ where: { id: candidate.id } });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).sLAConfig.delete({ where: { id: slaConfig.id } });
      await prisma.pipelineStage.delete({ where: { id: appliedStage.id } });
      await prisma.pipelineStage.delete({ where: { id: interviewStage.id } });
      await prisma.job.delete({ where: { id: job.id } });
    }
  });
});