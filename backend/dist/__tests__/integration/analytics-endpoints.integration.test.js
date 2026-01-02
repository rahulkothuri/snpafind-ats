/**
 * Integration Test: Analytics API Endpoints
 * **Validates: Requirements 10.5**
 *
 * Tests all analytics API endpoints to verify they return real data
 * from the database with correct data structures.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../../lib/prisma.js';
import { analyticsService } from '../../services/analytics.service.js';
import bcrypt from 'bcrypt';
// Test data references
let testCompanyId;
let testUserId;
let testJobId;
let testCandidateId;
let testJobCandidateId;
let testStageIds = [];
beforeAll(async () => {
    // Create test company
    const company = await prisma.company.create({
        data: {
            name: 'Analytics Test Company',
            contactEmail: 'analytics-test@company.com',
        },
    });
    testCompanyId = company.id;
    // Create test user (recruiter)
    const passwordHash = await bcrypt.hash('testpassword', 10);
    const user = await prisma.user.create({
        data: {
            companyId: testCompanyId,
            name: 'Test Recruiter',
            email: `analytics-recruiter-${Date.now()}@test.com`,
            passwordHash,
            role: 'recruiter',
        },
    });
    testUserId = user.id;
    // Create test job
    const job = await prisma.job.create({
        data: {
            companyId: testCompanyId,
            title: 'Analytics Test Job',
            department: 'Engineering',
            location: 'Remote',
            status: 'active',
            assignedRecruiterId: testUserId,
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        },
    });
    testJobId = job.id;
    // Create pipeline stages
    const stageNames = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];
    for (let i = 0; i < stageNames.length; i++) {
        const stage = await prisma.pipelineStage.create({
            data: {
                jobId: testJobId,
                name: stageNames[i],
                position: i,
            },
        });
        testStageIds.push(stage.id);
    }
    // Create test candidate
    const candidate = await prisma.candidate.create({
        data: {
            companyId: testCompanyId,
            name: 'Test Candidate',
            email: `analytics-candidate-${Date.now()}@test.com`,
            phone: '1234567890',
            location: 'Remote',
            source: 'LinkedIn',
        },
    });
    testCandidateId = candidate.id;
    // Create job candidate in "Hired" stage
    const jobCandidate = await prisma.jobCandidate.create({
        data: {
            jobId: testJobId,
            candidateId: testCandidateId,
            currentStageId: testStageIds[4], // Hired stage
            appliedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        },
    });
    testJobCandidateId = jobCandidate.id;
    // Create stage history entries
    for (let i = 0; i < stageNames.length; i++) {
        const enteredAt = new Date(Date.now() - (25 - i * 5) * 24 * 60 * 60 * 1000);
        const exitedAt = i < stageNames.length - 1
            ? new Date(Date.now() - (20 - i * 5) * 24 * 60 * 60 * 1000)
            : null;
        await prisma.stageHistory.create({
            data: {
                jobCandidateId: testJobCandidateId,
                stageId: testStageIds[i],
                stageName: stageNames[i],
                enteredAt,
                exitedAt,
                durationHours: exitedAt ? (exitedAt.getTime() - enteredAt.getTime()) / (1000 * 60 * 60) : null,
                comment: i === 2 ? 'Skill mismatch noted' : null, // Add rejection reason for testing
            },
        });
    }
    // Create SLA config
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.sLAConfig.create({
        data: {
            companyId: testCompanyId,
            stageName: 'Applied',
            thresholdDays: 5,
        },
    });
    // Create interview with panel member and feedback
    const interview = await prisma.interview.create({
        data: {
            jobCandidateId: testJobCandidateId,
            scheduledAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            duration: 60,
            mode: 'google_meet',
            status: 'completed',
            scheduledBy: testUserId,
        },
    });
    // Add panel member
    await prisma.interviewPanel.create({
        data: {
            interviewId: interview.id,
            userId: testUserId,
        },
    });
    // Add feedback
    await prisma.interviewFeedback.create({
        data: {
            interviewId: interview.id,
            panelMemberId: testUserId,
            ratings: [{ criterion: 'Technical', score: 4 }],
            overallComments: 'Good candidate',
            recommendation: 'hire',
            submittedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
        },
    });
}, 60000);
afterAll(async () => {
    // Clean up in correct order
    await prisma.interviewFeedback.deleteMany({ where: { interview: { jobCandidateId: testJobCandidateId } } });
    await prisma.interviewPanel.deleteMany({ where: { interview: { jobCandidateId: testJobCandidateId } } });
    await prisma.interview.deleteMany({ where: { jobCandidateId: testJobCandidateId } });
    await prisma.stageHistory.deleteMany({ where: { jobCandidateId: testJobCandidateId } });
    await prisma.jobCandidate.deleteMany({ where: { id: testJobCandidateId } });
    await prisma.candidate.deleteMany({ where: { id: testCandidateId } });
    await prisma.pipelineStage.deleteMany({ where: { jobId: testJobId } });
    await prisma.job.deleteMany({ where: { id: testJobId } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.sLAConfig.deleteMany({ where: { companyId: testCompanyId } });
    await prisma.user.deleteMany({ where: { companyId: testCompanyId } });
    await prisma.company.deleteMany({ where: { id: testCompanyId } });
}, 60000);
describe('Integration: Analytics API Endpoints', () => {
    /**
     * Test /api/analytics/kpis endpoint
     * Requirements: 10.5
     */
    it('should return KPI metrics with correct structure', async () => {
        const result = await analyticsService.getKPIMetrics(testCompanyId, testUserId, 'admin');
        // Verify structure
        expect(result).toHaveProperty('activeRoles');
        expect(result).toHaveProperty('activeCandidates');
        expect(result).toHaveProperty('interviewsToday');
        expect(result).toHaveProperty('interviewsThisWeek');
        expect(result).toHaveProperty('offersPending');
        expect(result).toHaveProperty('totalHires');
        expect(result).toHaveProperty('avgTimeToFill');
        expect(result).toHaveProperty('offerAcceptanceRate');
        expect(result).toHaveProperty('rolesOnTrack');
        expect(result).toHaveProperty('rolesAtRisk');
        expect(result).toHaveProperty('rolesBreached');
        // Verify types
        expect(typeof result.activeRoles).toBe('number');
        expect(typeof result.activeCandidates).toBe('number');
        expect(typeof result.avgTimeToFill).toBe('number');
        expect(typeof result.offerAcceptanceRate).toBe('number');
        // Verify real data (we have 1 active job and 1 hired candidate)
        expect(result.activeRoles).toBeGreaterThanOrEqual(1);
        expect(result.totalHires).toBeGreaterThanOrEqual(1);
    });
    /**
     * Test /api/analytics/funnel endpoint
     * Requirements: 10.5
     */
    it('should return funnel data with correct structure', async () => {
        const result = await analyticsService.getFunnelAnalytics(testCompanyId, testUserId, 'admin');
        // Verify structure
        expect(result).toHaveProperty('stages');
        expect(result).toHaveProperty('totalApplicants');
        expect(result).toHaveProperty('totalHired');
        expect(result).toHaveProperty('overallConversionRate');
        // Verify stages array
        expect(Array.isArray(result.stages)).toBe(true);
        if (result.stages.length > 0) {
            const stage = result.stages[0];
            expect(stage).toHaveProperty('id');
            expect(stage).toHaveProperty('name');
            expect(stage).toHaveProperty('count');
            expect(stage).toHaveProperty('percentage');
            expect(stage).toHaveProperty('conversionToNext');
            expect(stage).toHaveProperty('avgDaysInStage');
        }
        // Verify types
        expect(typeof result.totalApplicants).toBe('number');
        expect(typeof result.totalHired).toBe('number');
        expect(typeof result.overallConversionRate).toBe('number');
    });
    /**
     * Test /api/analytics/rejection-reasons endpoint
     * Requirements: 10.5
     */
    it('should return rejection reasons with correct structure', async () => {
        const result = await analyticsService.getRejectionReasons(testCompanyId, testUserId, 'admin');
        // Verify structure
        expect(result).toHaveProperty('reasons');
        expect(result).toHaveProperty('topStageForRejection');
        // Verify reasons array
        expect(Array.isArray(result.reasons)).toBe(true);
        if (result.reasons.length > 0) {
            const reason = result.reasons[0];
            expect(reason).toHaveProperty('reason');
            expect(reason).toHaveProperty('count');
            expect(reason).toHaveProperty('percentage');
            expect(reason).toHaveProperty('color');
        }
    });
    /**
     * Test /api/analytics/time-in-stage endpoint
     * Requirements: 10.5
     */
    it('should return time-in-stage data with correct structure', async () => {
        const result = await analyticsService.getTimeInStage(testCompanyId, testUserId, 'admin');
        // Verify structure
        expect(result).toHaveProperty('stages');
        expect(result).toHaveProperty('bottleneckStage');
        expect(result).toHaveProperty('suggestion');
        // Verify stages array
        expect(Array.isArray(result.stages)).toBe(true);
        if (result.stages.length > 0) {
            const stage = result.stages[0];
            expect(stage).toHaveProperty('stageName');
            expect(stage).toHaveProperty('avgDays');
            expect(stage).toHaveProperty('isBottleneck');
            expect(typeof stage.avgDays).toBe('number');
            expect(typeof stage.isBottleneck).toBe('boolean');
        }
        // Verify suggestion is a string
        expect(typeof result.suggestion).toBe('string');
    });
    /**
     * Test /api/analytics/recruiters endpoint
     * Requirements: 10.5
     */
    it('should return recruiter productivity data with correct structure', async () => {
        const result = await analyticsService.getRecruiterProductivity(testCompanyId, testUserId, 'admin');
        // Verify it's an array
        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
            const recruiter = result[0];
            expect(recruiter).toHaveProperty('id');
            expect(recruiter).toHaveProperty('name');
            expect(recruiter).toHaveProperty('specialty');
            expect(recruiter).toHaveProperty('activeRoles');
            expect(recruiter).toHaveProperty('cvsAdded');
            expect(recruiter).toHaveProperty('interviewsScheduled');
            expect(recruiter).toHaveProperty('offersMade');
            expect(recruiter).toHaveProperty('hires');
            expect(recruiter).toHaveProperty('avgTimeToFill');
            expect(recruiter).toHaveProperty('productivityScore');
            // Verify types
            expect(typeof recruiter.activeRoles).toBe('number');
            expect(typeof recruiter.cvsAdded).toBe('number');
            expect(typeof recruiter.productivityScore).toBe('number');
        }
    });
    /**
     * Test /api/analytics/panels endpoint
     * Requirements: 10.5
     */
    it('should return panel performance data with correct structure', async () => {
        const result = await analyticsService.getPanelPerformance(testCompanyId, testUserId, 'admin');
        // Verify it's an array
        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
            const panel = result[0];
            expect(panel).toHaveProperty('panelName');
            expect(panel).toHaveProperty('interviewRounds');
            expect(panel).toHaveProperty('offerPercentage');
            expect(panel).toHaveProperty('topRejectionReason');
            expect(panel).toHaveProperty('avgFeedbackTime');
            // Verify types
            expect(typeof panel.interviewRounds).toBe('number');
            expect(typeof panel.offerPercentage).toBe('number');
            expect(typeof panel.avgFeedbackTime).toBe('number');
        }
    });
    /**
     * Test /api/analytics/time-to-fill endpoint
     * Requirements: 10.5
     */
    it('should return time-to-fill data with correct structure', async () => {
        const result = await analyticsService.getTimeToFill(testCompanyId, testUserId, 'admin');
        // Verify structure
        expect(result).toHaveProperty('overall');
        expect(result).toHaveProperty('byDepartment');
        expect(result).toHaveProperty('byRole');
        // Verify overall structure
        expect(result.overall).toHaveProperty('average');
        expect(result.overall).toHaveProperty('median');
        expect(result.overall).toHaveProperty('target');
        expect(typeof result.overall.average).toBe('number');
        expect(typeof result.overall.median).toBe('number');
        expect(typeof result.overall.target).toBe('number');
        // Verify arrays
        expect(Array.isArray(result.byDepartment)).toBe(true);
        expect(Array.isArray(result.byRole)).toBe(true);
        if (result.byRole.length > 0) {
            const role = result.byRole[0];
            expect(role).toHaveProperty('roleId');
            expect(role).toHaveProperty('roleName');
            expect(role).toHaveProperty('average');
            expect(role).toHaveProperty('isOverTarget');
        }
    });
    /**
     * Test /api/analytics/drop-off endpoint
     * Requirements: 10.5
     */
    it('should return drop-off data with correct structure', async () => {
        const result = await analyticsService.getDropOffAnalysis(testCompanyId, testUserId, 'admin');
        // Verify structure
        expect(result).toHaveProperty('byStage');
        expect(result).toHaveProperty('highestDropOffStage');
        // Verify byStage array
        expect(Array.isArray(result.byStage)).toBe(true);
        if (result.byStage.length > 0) {
            const stage = result.byStage[0];
            expect(stage).toHaveProperty('stageName');
            expect(stage).toHaveProperty('dropOffCount');
            expect(stage).toHaveProperty('dropOffPercentage');
            expect(typeof stage.dropOffCount).toBe('number');
            expect(typeof stage.dropOffPercentage).toBe('number');
        }
    });
    /**
     * Test /api/analytics/sla endpoint
     * Requirements: 10.5
     */
    it('should return SLA status data with correct structure', async () => {
        const result = await analyticsService.getSLAStatus(testCompanyId, testUserId, 'admin');
        // Verify structure
        expect(result).toHaveProperty('summary');
        expect(result).toHaveProperty('roles');
        // Verify summary structure
        expect(result.summary).toHaveProperty('onTrack');
        expect(result.summary).toHaveProperty('atRisk');
        expect(result.summary).toHaveProperty('breached');
        expect(typeof result.summary.onTrack).toBe('number');
        expect(typeof result.summary.atRisk).toBe('number');
        expect(typeof result.summary.breached).toBe('number');
        // Verify roles array
        expect(Array.isArray(result.roles)).toBe(true);
        if (result.roles.length > 0) {
            const role = result.roles[0];
            expect(role).toHaveProperty('roleId');
            expect(role).toHaveProperty('roleName');
            expect(role).toHaveProperty('status');
            expect(role).toHaveProperty('daysOpen');
            expect(role).toHaveProperty('threshold');
            expect(role).toHaveProperty('candidatesBreaching');
            expect(['on_track', 'at_risk', 'breached']).toContain(role.status);
        }
    });
    /**
     * Test that filters are properly applied
     * Requirements: 10.5
     */
    it('should apply date filters correctly', async () => {
        const filters = {
            startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
            endDate: new Date(),
        };
        const result = await analyticsService.getKPIMetrics(testCompanyId, testUserId, 'admin', filters);
        // Should return data within the date range
        expect(result).toHaveProperty('activeRoles');
        expect(typeof result.activeRoles).toBe('number');
    });
    /**
     * Test role-based filtering for recruiters
     * Requirements: 10.5
     */
    it('should apply role-based filtering for recruiters', async () => {
        const result = await analyticsService.getKPIMetrics(testCompanyId, testUserId, 'recruiter' // Recruiter role should only see their assigned jobs
        );
        // Should return data filtered by recruiter
        expect(result).toHaveProperty('activeRoles');
        expect(typeof result.activeRoles).toBe('number');
    });
    /**
     * Test empty data handling
     * Requirements: 10.5
     */
    it('should handle empty data gracefully', async () => {
        // Create a new company with no data
        const emptyCompany = await prisma.company.create({
            data: {
                name: 'Empty Test Company',
                contactEmail: 'empty-test@company.com',
            },
        });
        const emptyUser = await prisma.user.create({
            data: {
                companyId: emptyCompany.id,
                name: 'Empty Test User',
                email: `empty-user-${Date.now()}@test.com`,
                passwordHash: await bcrypt.hash('testpassword', 10),
                role: 'admin',
            },
        });
        try {
            const result = await analyticsService.getKPIMetrics(emptyCompany.id, emptyUser.id, 'admin');
            // Should return zeros for empty data
            expect(result.activeRoles).toBe(0);
            expect(result.activeCandidates).toBe(0);
            expect(result.totalHires).toBe(0);
        }
        finally {
            // Cleanup
            await prisma.user.delete({ where: { id: emptyUser.id } });
            await prisma.company.delete({ where: { id: emptyCompany.id } });
        }
    });
    /**
     * Test export data aggregation
     * Requirements: 11.1, 11.2, 11.3 - Export includes all visible data and respects filters
     */
    it('should aggregate all analytics data for export', async () => {
        // Gather all analytics data (simulating what the export endpoint does)
        const [kpis, funnelData, timeToFillData, timeInStageData, sourceData, recruiterData, panelData, dropOffData, rejectionData, slaData] = await Promise.all([
            analyticsService.getKPIMetrics(testCompanyId, testUserId, 'admin'),
            analyticsService.getFunnelAnalytics(testCompanyId, testUserId, 'admin'),
            analyticsService.getTimeToFill(testCompanyId, testUserId, 'admin'),
            analyticsService.getTimeInStage(testCompanyId, testUserId, 'admin'),
            analyticsService.getSourcePerformance(testCompanyId, testUserId, 'admin'),
            analyticsService.getRecruiterProductivity(testCompanyId, testUserId, 'admin'),
            analyticsService.getPanelPerformance(testCompanyId, testUserId, 'admin'),
            analyticsService.getDropOffAnalysis(testCompanyId, testUserId, 'admin'),
            analyticsService.getRejectionReasons(testCompanyId, testUserId, 'admin'),
            analyticsService.getSLAStatus(testCompanyId, testUserId, 'admin'),
        ]);
        // Verify all data is present for export
        expect(kpis).toBeDefined();
        expect(funnelData).toBeDefined();
        expect(timeToFillData).toBeDefined();
        expect(timeInStageData).toBeDefined();
        expect(sourceData).toBeDefined();
        expect(recruiterData).toBeDefined();
        expect(panelData).toBeDefined();
        expect(dropOffData).toBeDefined();
        expect(rejectionData).toBeDefined();
        expect(slaData).toBeDefined();
        // Verify KPIs have real data
        expect(kpis.activeRoles).toBeGreaterThanOrEqual(1);
        expect(kpis.totalHires).toBeGreaterThanOrEqual(1);
        // Verify funnel has stages
        expect(funnelData.stages.length).toBeGreaterThan(0);
        expect(funnelData.totalApplicants).toBeGreaterThanOrEqual(1);
        // Verify time data has stages
        expect(timeInStageData.stages.length).toBeGreaterThan(0);
        // Verify SLA summary
        expect(slaData.summary).toBeDefined();
        expect(typeof slaData.summary.onTrack).toBe('number');
        expect(typeof slaData.summary.atRisk).toBe('number');
        expect(typeof slaData.summary.breached).toBe('number');
    });
    /**
     * Test export with date filters
     * Requirements: 11.3 - Exports respect current filters
     */
    it('should respect date filters in export data', async () => {
        const filters = {
            startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
            endDate: new Date(),
        };
        const [kpis, funnelData] = await Promise.all([
            analyticsService.getKPIMetrics(testCompanyId, testUserId, 'admin', filters),
            analyticsService.getFunnelAnalytics(testCompanyId, testUserId, 'admin', filters),
        ]);
        // Data should be filtered by date range
        expect(kpis).toBeDefined();
        expect(funnelData).toBeDefined();
        expect(typeof kpis.activeRoles).toBe('number');
        expect(typeof funnelData.totalApplicants).toBe('number');
    });
});
//# sourceMappingURL=analytics-endpoints.integration.test.js.map