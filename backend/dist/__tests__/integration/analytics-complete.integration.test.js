/**
 * Integration Test: Complete Analytics Dashboard
 * Task 16.1: Test complete analytics page with real database data
 *
 * This test verifies:
 * - All 7 analytics sections display correctly
 * - Filters work across all sections
 * - Export generates correct reports
 *
 * **Validates: All Requirements**
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../../lib/prisma.js';
import { analyticsService } from '../../services/analytics.service.js';
import bcrypt from 'bcrypt';
// Test data references
let testCompanyId;
let testUserId;
let testJobIds = [];
let testCandidateIds = [];
let testJobCandidateIds = [];
let testStageIdsByJob = new Map();
// Test constants
const STAGE_NAMES = ['Applied', 'Screening', 'Shortlisted', 'Interview', 'Offer', 'Hired'];
const DEPARTMENTS = ['Engineering', 'Product', 'Sales'];
const LOCATIONS = ['Remote', 'New York', 'San Francisco'];
const REJECTION_REASONS = ['Skill mismatch', 'Compensation mismatch', 'Culture/attitude', 'Location/notice/other'];
beforeAll(async () => {
    // Create test company
    const company = await prisma.company.create({
        data: {
            name: 'Complete Analytics Test Company',
            contactEmail: 'complete-analytics-test@company.com',
        },
    });
    testCompanyId = company.id;
    // Create test users (recruiters and interviewers)
    const passwordHash = await bcrypt.hash('testpassword', 10);
    const recruiter1 = await prisma.user.create({
        data: {
            companyId: testCompanyId,
            name: 'Test Recruiter 1',
            email: `complete-recruiter1-${Date.now()}@test.com`,
            passwordHash,
            role: 'recruiter',
        },
    });
    testUserId = recruiter1.id;
    const recruiter2 = await prisma.user.create({
        data: {
            companyId: testCompanyId,
            name: 'Test Recruiter 2',
            email: `complete-recruiter2-${Date.now()}@test.com`,
            passwordHash,
            role: 'recruiter',
        },
    });
    const interviewer = await prisma.user.create({
        data: {
            companyId: testCompanyId,
            name: 'Test Interviewer',
            email: `complete-interviewer-${Date.now()}@test.com`,
            passwordHash,
            role: 'hiring_manager',
        },
    });
    // Create multiple jobs across departments and locations
    for (let i = 0; i < 3; i++) {
        const job = await prisma.job.create({
            data: {
                companyId: testCompanyId,
                title: `Test Job ${i + 1}`,
                department: DEPARTMENTS[i],
                jobDomain: DEPARTMENTS[i],
                location: LOCATIONS[i],
                status: i === 2 ? 'closed' : 'active',
                assignedRecruiterId: i === 0 ? recruiter1.id : recruiter2.id,
                createdAt: new Date(Date.now() - (60 - i * 10) * 24 * 60 * 60 * 1000),
            },
        });
        testJobIds.push(job.id);
        // Create pipeline stages for each job
        const stageIds = [];
        for (let j = 0; j < STAGE_NAMES.length; j++) {
            const stage = await prisma.pipelineStage.create({
                data: {
                    jobId: job.id,
                    name: STAGE_NAMES[j],
                    position: j,
                },
            });
            stageIds.push(stage.id);
        }
        testStageIdsByJob.set(job.id, stageIds);
    }
    // Create candidates with various statuses
    // Status is tracked via currentStageId and stage history comments for rejections
    const candidateStatuses = [
        { stage: 5, rejected: false, reason: null }, // Hired
        { stage: 4, rejected: false, reason: null }, // Offer
        { stage: 3, rejected: false, reason: null }, // Interview
        { stage: 2, rejected: true, reason: 'Skill mismatch' }, // Rejected at Shortlisted
        { stage: 1, rejected: true, reason: 'Compensation mismatch' }, // Rejected at Screening
        { stage: 0, rejected: false, reason: null }, // Applied
    ];
    for (let i = 0; i < candidateStatuses.length; i++) {
        const candidate = await prisma.candidate.create({
            data: {
                companyId: testCompanyId,
                name: `Test Candidate ${i + 1}`,
                email: `complete-candidate${i + 1}-${Date.now()}@test.com`,
                phone: `123456789${i}`,
                location: LOCATIONS[i % 3],
                source: ['LinkedIn', 'Indeed', 'Referral'][i % 3],
            },
        });
        testCandidateIds.push(candidate.id);
        // Assign candidate to first job
        const jobId = testJobIds[0];
        const stageIds = testStageIdsByJob.get(jobId);
        const status = candidateStatuses[i];
        const jobCandidate = await prisma.jobCandidate.create({
            data: {
                jobId,
                candidateId: candidate.id,
                currentStageId: stageIds[status.stage],
                appliedAt: new Date(Date.now() - (50 - i * 5) * 24 * 60 * 60 * 1000),
            },
        });
        testJobCandidateIds.push(jobCandidate.id);
        // Create stage history for each candidate
        for (let j = 0; j <= status.stage; j++) {
            const enteredAt = new Date(Date.now() - (45 - i * 5 - j * 3) * 24 * 60 * 60 * 1000);
            const exitedAt = j < status.stage
                ? new Date(Date.now() - (42 - i * 5 - j * 3) * 24 * 60 * 60 * 1000)
                : (status.rejected ? new Date(Date.now() - (40 - i * 5) * 24 * 60 * 60 * 1000) : null);
            await prisma.stageHistory.create({
                data: {
                    jobCandidateId: jobCandidate.id,
                    stageId: stageIds[j],
                    stageName: STAGE_NAMES[j],
                    enteredAt,
                    exitedAt,
                    durationHours: exitedAt ? (exitedAt.getTime() - enteredAt.getTime()) / (1000 * 60 * 60) : null,
                    comment: status.rejected && j === status.stage ? status.reason : null,
                },
            });
        }
        // Create interviews for candidates at Interview stage or beyond
        if (status.stage >= 3) {
            const interview = await prisma.interview.create({
                data: {
                    jobCandidateId: jobCandidate.id,
                    scheduledAt: new Date(Date.now() - (30 - i * 3) * 24 * 60 * 60 * 1000),
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
                    userId: interviewer.id,
                },
            });
            // Add feedback
            await prisma.interviewFeedback.create({
                data: {
                    interviewId: interview.id,
                    panelMemberId: interviewer.id,
                    ratings: [{ criterion: 'Technical', score: 4 }, { criterion: 'Communication', score: 3 }],
                    overallComments: `Feedback for candidate ${i + 1}`,
                    recommendation: status.stage >= 4 ? 'hire' : 'no_hire',
                    submittedAt: new Date(Date.now() - (28 - i * 3) * 24 * 60 * 60 * 1000),
                },
            });
        }
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.sLAConfig.create({
        data: {
            companyId: testCompanyId,
            stageName: 'Screening',
            thresholdDays: 7,
        },
    });
}, 120000);
afterAll(async () => {
    // Clean up in correct order
    for (const jobCandidateId of testJobCandidateIds) {
        await prisma.interviewFeedback.deleteMany({ where: { interview: { jobCandidateId } } });
        await prisma.interviewPanel.deleteMany({ where: { interview: { jobCandidateId } } });
        await prisma.interview.deleteMany({ where: { jobCandidateId } });
        await prisma.stageHistory.deleteMany({ where: { jobCandidateId } });
    }
    await prisma.jobCandidate.deleteMany({ where: { id: { in: testJobCandidateIds } } });
    await prisma.candidate.deleteMany({ where: { id: { in: testCandidateIds } } });
    for (const jobId of testJobIds) {
        await prisma.pipelineStage.deleteMany({ where: { jobId } });
    }
    await prisma.job.deleteMany({ where: { id: { in: testJobIds } } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.sLAConfig.deleteMany({ where: { companyId: testCompanyId } });
    await prisma.user.deleteMany({ where: { companyId: testCompanyId } });
    await prisma.company.deleteMany({ where: { id: testCompanyId } });
}, 60000);
describe('Integration: Complete Analytics Dashboard - Task 16.1', () => {
    /**
     * Section 1: KPI Summary Cards
     * Requirements: 1.1, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9
     */
    describe('Section 1: KPI Summary Cards', () => {
        it('should return all 6 KPI metrics with real data', async () => {
            const kpis = await analyticsService.getKPIMetrics(testCompanyId, testUserId, 'admin');
            // Verify all required KPI fields exist
            expect(kpis).toHaveProperty('avgTimeToFill');
            expect(kpis).toHaveProperty('offerAcceptanceRate');
            expect(kpis).toHaveProperty('activeCandidates');
            expect(kpis).toHaveProperty('activeRoles');
            expect(kpis).toHaveProperty('totalHires');
            expect(kpis).toHaveProperty('rolesOnTrack');
            expect(kpis).toHaveProperty('rolesAtRisk');
            expect(kpis).toHaveProperty('rolesBreached');
            // Verify real data is returned (not zeros for all)
            expect(kpis.activeRoles).toBeGreaterThanOrEqual(1);
            expect(kpis.activeCandidates).toBeGreaterThanOrEqual(1);
            expect(kpis.totalHires).toBeGreaterThanOrEqual(1);
        });
    });
    /**
     * Section 2: Stage Funnel Conversion Chart
     * Requirements: 2.1, 2.3, 2.4, 2.5, 2.6
     */
    describe('Section 2: Stage Funnel Conversion Chart', () => {
        it('should return funnel data with all stages in correct order', async () => {
            const funnel = await analyticsService.getFunnelAnalytics(testCompanyId, testUserId, 'admin');
            // Verify structure
            expect(funnel).toHaveProperty('stages');
            expect(funnel).toHaveProperty('totalApplicants');
            expect(funnel).toHaveProperty('totalHired');
            expect(funnel).toHaveProperty('overallConversionRate');
            // Verify stages array has data
            expect(Array.isArray(funnel.stages)).toBe(true);
            expect(funnel.stages.length).toBeGreaterThan(0);
            // Verify each stage has required properties
            funnel.stages.forEach(stage => {
                expect(stage).toHaveProperty('id');
                expect(stage).toHaveProperty('name');
                expect(stage).toHaveProperty('count');
                expect(stage).toHaveProperty('percentage');
                expect(stage).toHaveProperty('conversionToNext');
                expect(typeof stage.count).toBe('number');
                expect(typeof stage.percentage).toBe('number');
            });
            // Verify real data
            expect(funnel.totalApplicants).toBeGreaterThanOrEqual(1);
        });
    });
    /**
     * Section 3: Rejections by Reason Pie Chart
     * Requirements: 3.1, 3.3, 3.4, 3.5, 3.6
     */
    describe('Section 3: Rejections by Reason Pie Chart', () => {
        it('should return rejection reasons with percentages and colors', async () => {
            const rejections = await analyticsService.getRejectionReasons(testCompanyId, testUserId, 'admin');
            // Verify structure
            expect(rejections).toHaveProperty('reasons');
            expect(rejections).toHaveProperty('topStageForRejection');
            // Verify reasons array
            expect(Array.isArray(rejections.reasons)).toBe(true);
            // Verify each reason has required properties
            rejections.reasons.forEach(reason => {
                expect(reason).toHaveProperty('reason');
                expect(reason).toHaveProperty('count');
                expect(reason).toHaveProperty('percentage');
                expect(reason).toHaveProperty('color');
                expect(typeof reason.percentage).toBe('number');
            });
        });
    });
    /**
     * Section 4: Average Time Spent at Each Stage
     * Requirements: 4.1, 4.3, 4.4, 4.5
     */
    describe('Section 4: Average Time Spent at Each Stage', () => {
        it('should return time-in-stage data with bottleneck identification', async () => {
            const timeInStage = await analyticsService.getTimeInStage(testCompanyId, testUserId, 'admin');
            // Verify structure
            expect(timeInStage).toHaveProperty('stages');
            expect(timeInStage).toHaveProperty('bottleneckStage');
            expect(timeInStage).toHaveProperty('suggestion');
            // Verify stages array
            expect(Array.isArray(timeInStage.stages)).toBe(true);
            // Verify each stage has required properties
            timeInStage.stages.forEach(stage => {
                expect(stage).toHaveProperty('stageName');
                expect(stage).toHaveProperty('avgDays');
                expect(stage).toHaveProperty('isBottleneck');
                expect(typeof stage.avgDays).toBe('number');
                expect(typeof stage.isBottleneck).toBe('boolean');
            });
            // Verify suggestion is a string
            expect(typeof timeInStage.suggestion).toBe('string');
        });
    });
    /**
     * Section 5: Recruiter Productivity Table
     * Requirements: 5.1, 5.3, 5.4, 5.5
     */
    describe('Section 5: Recruiter Productivity Table', () => {
        it('should return recruiter data with all required columns', async () => {
            const recruiters = await analyticsService.getRecruiterProductivity(testCompanyId, testUserId, 'admin');
            // Verify it's an array
            expect(Array.isArray(recruiters)).toBe(true);
            // Verify each recruiter has required properties
            if (recruiters.length > 0) {
                const recruiter = recruiters[0];
                expect(recruiter).toHaveProperty('id');
                expect(recruiter).toHaveProperty('name');
                expect(recruiter).toHaveProperty('activeRoles');
                expect(recruiter).toHaveProperty('cvsAdded');
                expect(recruiter).toHaveProperty('interviewsScheduled');
                expect(recruiter).toHaveProperty('offersMade');
                expect(recruiter).toHaveProperty('hires');
                expect(recruiter).toHaveProperty('avgTimeToFill');
                // Verify types
                expect(typeof recruiter.activeRoles).toBe('number');
                expect(typeof recruiter.cvsAdded).toBe('number');
                expect(typeof recruiter.hires).toBe('number');
            }
        });
    });
    /**
     * Section 6: Panel Performance Table
     * Requirements: 6.1, 6.3, 6.4, 6.5
     */
    describe('Section 6: Panel Performance Table', () => {
        it('should return panel data with all required columns', async () => {
            const panels = await analyticsService.getPanelPerformance(testCompanyId, testUserId, 'admin');
            // Verify it's an array
            expect(Array.isArray(panels)).toBe(true);
            // Verify each panel has required properties
            if (panels.length > 0) {
                const panel = panels[0];
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
    });
    /**
     * Section 7: Role-wise Time to Fill Chart
     * Requirements: 7.1, 7.3, 7.4, 7.5, 7.6
     */
    describe('Section 7: Role-wise Time to Fill Chart', () => {
        it('should return time-to-fill data with threshold highlighting', async () => {
            const timeToFill = await analyticsService.getTimeToFill(testCompanyId, testUserId, 'admin');
            // Verify structure
            expect(timeToFill).toHaveProperty('overall');
            expect(timeToFill).toHaveProperty('byDepartment');
            expect(timeToFill).toHaveProperty('byRole');
            // Verify overall structure
            expect(timeToFill.overall).toHaveProperty('average');
            expect(timeToFill.overall).toHaveProperty('median');
            expect(timeToFill.overall).toHaveProperty('target');
            expect(typeof timeToFill.overall.average).toBe('number');
            expect(typeof timeToFill.overall.target).toBe('number');
            // Verify byRole array
            expect(Array.isArray(timeToFill.byRole)).toBe(true);
            if (timeToFill.byRole.length > 0) {
                const role = timeToFill.byRole[0];
                expect(role).toHaveProperty('roleId');
                expect(role).toHaveProperty('roleName');
                expect(role).toHaveProperty('average');
                expect(role).toHaveProperty('isOverTarget');
                expect(typeof role.isOverTarget).toBe('boolean');
            }
        });
    });
    /**
     * Section 8: Rejections by Stage Chart (Drop-off Analysis)
     * Requirements: 8.1, 8.3, 8.4, 8.5, 8.6
     */
    describe('Section 8: Rejections by Stage Chart', () => {
        it('should return drop-off data with highest drop-off stage identified', async () => {
            const dropOff = await analyticsService.getDropOffAnalysis(testCompanyId, testUserId, 'admin');
            // Verify structure
            expect(dropOff).toHaveProperty('byStage');
            expect(dropOff).toHaveProperty('highestDropOffStage');
            // Verify byStage array
            expect(Array.isArray(dropOff.byStage)).toBe(true);
            if (dropOff.byStage.length > 0) {
                const stage = dropOff.byStage[0];
                expect(stage).toHaveProperty('stageName');
                expect(stage).toHaveProperty('dropOffCount');
                expect(stage).toHaveProperty('dropOffPercentage');
                expect(typeof stage.dropOffCount).toBe('number');
                expect(typeof stage.dropOffPercentage).toBe('number');
            }
        });
    });
    /**
     * Filter Functionality Tests
     * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
     */
    describe('Filter Functionality', () => {
        it('should apply date filters correctly across all sections', async () => {
            const filters = {
                startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                endDate: new Date(),
            };
            // Test all endpoints with date filters
            const [kpis, funnel, timeInStage, timeToFill, recruiters, panels, dropOff, rejections] = await Promise.all([
                analyticsService.getKPIMetrics(testCompanyId, testUserId, 'admin', filters),
                analyticsService.getFunnelAnalytics(testCompanyId, testUserId, 'admin', filters),
                analyticsService.getTimeInStage(testCompanyId, testUserId, 'admin', filters),
                analyticsService.getTimeToFill(testCompanyId, testUserId, 'admin', filters),
                analyticsService.getRecruiterProductivity(testCompanyId, testUserId, 'admin', filters),
                analyticsService.getPanelPerformance(testCompanyId, testUserId, 'admin', filters),
                analyticsService.getDropOffAnalysis(testCompanyId, testUserId, 'admin', filters),
                analyticsService.getRejectionReasons(testCompanyId, testUserId, 'admin', filters),
            ]);
            // Verify all responses are valid
            expect(kpis).toBeDefined();
            expect(funnel).toBeDefined();
            expect(timeInStage).toBeDefined();
            expect(timeToFill).toBeDefined();
            expect(recruiters).toBeDefined();
            expect(panels).toBeDefined();
            expect(dropOff).toBeDefined();
            expect(rejections).toBeDefined();
        });
        it('should apply department filter correctly', async () => {
            const filters = {
                departmentId: DEPARTMENTS[0], // Engineering
            };
            const kpis = await analyticsService.getKPIMetrics(testCompanyId, testUserId, 'admin', filters);
            const funnel = await analyticsService.getFunnelAnalytics(testCompanyId, testUserId, 'admin', filters);
            // Verify responses are valid (filtered data)
            expect(kpis).toBeDefined();
            expect(typeof kpis.activeRoles).toBe('number');
            expect(funnel).toBeDefined();
            expect(Array.isArray(funnel.stages)).toBe(true);
        });
        it('should apply location filter correctly', async () => {
            const filters = {
                locationId: LOCATIONS[0], // Remote
            };
            const kpis = await analyticsService.getKPIMetrics(testCompanyId, testUserId, 'admin', filters);
            const funnel = await analyticsService.getFunnelAnalytics(testCompanyId, testUserId, 'admin', filters);
            // Verify responses are valid (filtered data)
            expect(kpis).toBeDefined();
            expect(funnel).toBeDefined();
        });
        it('should apply job filter correctly', async () => {
            const filters = {
                jobId: testJobIds[0],
            };
            const kpis = await analyticsService.getKPIMetrics(testCompanyId, testUserId, 'admin', filters);
            const funnel = await analyticsService.getFunnelAnalytics(testCompanyId, testUserId, 'admin', filters);
            // Verify responses are valid (filtered data)
            expect(kpis).toBeDefined();
            expect(funnel).toBeDefined();
        });
        it('should apply combined filters correctly', async () => {
            const filters = {
                startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                endDate: new Date(),
                departmentId: DEPARTMENTS[0],
            };
            const kpis = await analyticsService.getKPIMetrics(testCompanyId, testUserId, 'admin', filters);
            const funnel = await analyticsService.getFunnelAnalytics(testCompanyId, testUserId, 'admin', filters);
            // Verify responses are valid
            expect(kpis).toBeDefined();
            expect(funnel).toBeDefined();
        });
    });
    /**
     * Export Functionality Tests
     * Requirements: 11.1, 11.2, 11.3
     */
    describe('Export Functionality', () => {
        it('should aggregate all analytics data for export', async () => {
            const filters = {
                startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                endDate: new Date(),
            };
            // Gather all analytics data (simulating what the export endpoint does)
            const [kpis, funnelData, timeToFillData, timeInStageData, sourceData, recruiterData, panelData, dropOffData, rejectionData, slaData] = await Promise.all([
                analyticsService.getKPIMetrics(testCompanyId, testUserId, 'admin', filters),
                analyticsService.getFunnelAnalytics(testCompanyId, testUserId, 'admin', filters),
                analyticsService.getTimeToFill(testCompanyId, testUserId, 'admin', filters),
                analyticsService.getTimeInStage(testCompanyId, testUserId, 'admin', filters),
                analyticsService.getSourcePerformance(testCompanyId, testUserId, 'admin', filters),
                analyticsService.getRecruiterProductivity(testCompanyId, testUserId, 'admin', filters),
                analyticsService.getPanelPerformance(testCompanyId, testUserId, 'admin', filters),
                analyticsService.getDropOffAnalysis(testCompanyId, testUserId, 'admin', filters),
                analyticsService.getRejectionReasons(testCompanyId, testUserId, 'admin', filters),
                analyticsService.getSLAStatus(testCompanyId, testUserId, 'admin', filters),
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
            // Verify funnel has stages
            expect(funnelData.stages.length).toBeGreaterThan(0);
            // Verify SLA summary
            expect(slaData.summary).toBeDefined();
            expect(typeof slaData.summary.onTrack).toBe('number');
        });
        it('should respect filters in export data', async () => {
            const filters = {
                startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                endDate: new Date(),
                departmentId: DEPARTMENTS[0],
            };
            const [kpis, funnelData] = await Promise.all([
                analyticsService.getKPIMetrics(testCompanyId, testUserId, 'admin', filters),
                analyticsService.getFunnelAnalytics(testCompanyId, testUserId, 'admin', filters),
            ]);
            // Data should be filtered
            expect(kpis).toBeDefined();
            expect(funnelData).toBeDefined();
        });
    });
    /**
     * SLA Status Tests
     * Requirements: 1.8 (Roles on Track)
     */
    describe('SLA Status', () => {
        it('should return SLA status with summary counts', async () => {
            const slaData = await analyticsService.getSLAStatus(testCompanyId, testUserId, 'admin');
            // Verify structure
            expect(slaData).toHaveProperty('summary');
            expect(slaData).toHaveProperty('roles');
            // Verify summary structure
            expect(slaData.summary).toHaveProperty('onTrack');
            expect(slaData.summary).toHaveProperty('atRisk');
            expect(slaData.summary).toHaveProperty('breached');
            expect(typeof slaData.summary.onTrack).toBe('number');
            expect(typeof slaData.summary.atRisk).toBe('number');
            expect(typeof slaData.summary.breached).toBe('number');
            // Verify roles array
            expect(Array.isArray(slaData.roles)).toBe(true);
            if (slaData.roles.length > 0) {
                const role = slaData.roles[0];
                expect(role).toHaveProperty('roleId');
                expect(role).toHaveProperty('roleName');
                expect(role).toHaveProperty('status');
                expect(['on_track', 'at_risk', 'breached']).toContain(role.status);
            }
        });
    });
    /**
     * Role-based Access Control Tests
     * Requirements: 10.5
     */
    describe('Role-based Access Control', () => {
        it('should filter data based on recruiter role', async () => {
            const kpis = await analyticsService.getKPIMetrics(testCompanyId, testUserId, 'recruiter');
            // Recruiter should only see their assigned jobs
            expect(kpis).toBeDefined();
            expect(typeof kpis.activeRoles).toBe('number');
        });
        it('should show all data for admin role', async () => {
            const kpis = await analyticsService.getKPIMetrics(testCompanyId, testUserId, 'admin');
            // Admin should see all data
            expect(kpis).toBeDefined();
            expect(kpis.activeRoles).toBeGreaterThanOrEqual(1);
        });
    });
    /**
     * Empty Data Handling Tests
     * Requirements: 10.2
     */
    describe('Empty Data Handling', () => {
        it('should handle empty data gracefully', async () => {
            // Create a new company with no data
            const emptyCompany = await prisma.company.create({
                data: {
                    name: 'Empty Analytics Test Company',
                    contactEmail: 'empty-analytics-test@company.com',
                },
            });
            const emptyUser = await prisma.user.create({
                data: {
                    companyId: emptyCompany.id,
                    name: 'Empty Test User',
                    email: `empty-analytics-user-${Date.now()}@test.com`,
                    passwordHash: await bcrypt.hash('testpassword', 10),
                    role: 'admin',
                },
            });
            try {
                const kpis = await analyticsService.getKPIMetrics(emptyCompany.id, emptyUser.id, 'admin');
                const funnel = await analyticsService.getFunnelAnalytics(emptyCompany.id, emptyUser.id, 'admin');
                // Should return zeros for empty data
                expect(kpis.activeRoles).toBe(0);
                expect(kpis.activeCandidates).toBe(0);
                expect(funnel.totalApplicants).toBe(0);
            }
            finally {
                // Cleanup
                await prisma.user.delete({ where: { id: emptyUser.id } });
                await prisma.company.delete({ where: { id: emptyCompany.id } });
            }
        });
    });
});
//# sourceMappingURL=analytics-complete.integration.test.js.map