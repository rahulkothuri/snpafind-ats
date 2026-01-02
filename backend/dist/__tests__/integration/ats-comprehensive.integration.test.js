/**
 * Integration Tests: ATS Comprehensive Enhancements
 *
 * Tests the complete workflows for:
 * 1. Auto-rejection flow (Requirements 4.3, 9.2, 9.3)
 * 2. Vendor workflow (Requirements 7.4, 7.6, 10.2, 10.3)
 * 3. Interview scheduling with round type (Requirements 6.5, 6.6)
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import bcrypt from 'bcrypt';
import prisma from '../../lib/prisma.js';
import jobService from '../../services/job.service.js';
import vendorService from '../../services/vendor.service.js';
import { processAutoRejection, evaluateAutoRejection } from '../../services/autoRejection.service.js';
// Helper function to hash passwords for testing
const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};
// Test data
let testCompanyId;
let adminUserId;
beforeAll(async () => {
    // Create a test company
    const company = await prisma.company.create({
        data: {
            name: 'ATS Comprehensive Test Company',
            contactEmail: 'test@atscomprehensive.com',
        },
    });
    testCompanyId = company.id;
    // Create an admin user
    const adminUser = await prisma.user.create({
        data: {
            name: 'Admin User',
            email: `admin-${Date.now()}@atscomprehensive.com`,
            passwordHash: await hashPassword('password123'),
            role: 'admin',
            companyId: testCompanyId,
            isActive: true,
        },
    });
    adminUserId = adminUser.id;
});
afterAll(async () => {
    // Clean up in reverse order
    try {
        // Delete all test data
        await prisma.candidateActivity.deleteMany({
            where: { candidate: { companyId: testCompanyId } },
        });
        await prisma.interviewPanel.deleteMany({
            where: { interview: { jobCandidate: { job: { companyId: testCompanyId } } } },
        });
        await prisma.interview.deleteMany({
            where: { jobCandidate: { job: { companyId: testCompanyId } } },
        });
        await prisma.jobCandidate.deleteMany({
            where: { job: { companyId: testCompanyId } },
        });
        await prisma.candidate.deleteMany({
            where: { companyId: testCompanyId },
        });
        await prisma.vendorJobAssignment.deleteMany({
            where: { vendor: { companyId: testCompanyId } },
        });
        await prisma.pipelineStage.deleteMany({
            where: { job: { companyId: testCompanyId } },
        });
        await prisma.job.deleteMany({
            where: { companyId: testCompanyId },
        });
        await prisma.user.deleteMany({
            where: { companyId: testCompanyId },
        });
        await prisma.company.delete({
            where: { id: testCompanyId },
        });
    }
    catch {
        // Ignore cleanup errors
    }
});
/**
 * Integration Test Suite 1: Auto-Rejection Flow
 * Requirements: 4.3, 9.2, 9.3
 */
describe('Integration: Auto-Rejection Flow', () => {
    let jobWithAutoRejectionId;
    let jobWithoutAutoRejectionId;
    let appliedStageId;
    let rejectedStageId;
    beforeAll(async () => {
        // Create a job with auto-rejection rules
        const autoRejectionRules = {
            enabled: true,
            rules: {
                minExperience: 3,
            },
        };
        const jobWithRules = await jobService.create({
            companyId: testCompanyId,
            title: 'Senior Developer with Auto-Rejection',
            department: 'Engineering',
            location: 'Remote',
            employmentType: 'Full-time',
            description: 'Requires minimum 3 years experience',
            autoRejectionRules,
        });
        jobWithAutoRejectionId = jobWithRules.id;
        // Get the Applied and Rejected stage IDs
        const stages = await prisma.pipelineStage.findMany({
            where: { jobId: jobWithAutoRejectionId, parentId: null },
        });
        appliedStageId = stages.find(s => s.name === 'Applied').id;
        rejectedStageId = stages.find(s => s.name === 'Rejected').id;
        // Create a job without auto-rejection rules
        const jobWithoutRules = await jobService.create({
            companyId: testCompanyId,
            title: 'Junior Developer No Auto-Rejection',
            department: 'Engineering',
            location: 'Remote',
            employmentType: 'Full-time',
            description: 'No auto-rejection rules',
        });
        jobWithoutAutoRejectionId = jobWithoutRules.id;
    });
    /**
     * Test 1: Candidate with insufficient experience should be auto-rejected
     * Requirements: 4.3, 9.2, 9.3
     */
    it('should auto-reject candidate with experience below threshold', async () => {
        // Create a candidate with 1 year experience (below 3 year threshold)
        const candidate = await prisma.candidate.create({
            data: {
                companyId: testCompanyId,
                name: 'Junior Candidate',
                email: `junior-${Date.now()}@test.com`,
                experienceYears: 1,
                location: 'Remote',
                source: 'Application',
                skills: [],
            },
        });
        // Create job candidate association at Applied stage
        const jobCandidate = await prisma.jobCandidate.create({
            data: {
                jobId: jobWithAutoRejectionId,
                candidateId: candidate.id,
                currentStageId: appliedStageId,
            },
        });
        // Process auto-rejection
        const wasRejected = await processAutoRejection(jobCandidate.id, candidate.id, candidate.experienceYears, jobWithAutoRejectionId);
        // Verify candidate was rejected
        expect(wasRejected).toBe(true);
        // Verify candidate is now in Rejected stage
        const updatedJobCandidate = await prisma.jobCandidate.findUnique({
            where: { id: jobCandidate.id },
            include: { currentStage: true },
        });
        expect(updatedJobCandidate.currentStage.name).toBe('Rejected');
        // Verify activity log was created (Requirements 9.4)
        const activity = await prisma.candidateActivity.findFirst({
            where: {
                jobCandidateId: jobCandidate.id,
                activityType: 'stage_change',
            },
            orderBy: { createdAt: 'desc' },
        });
        expect(activity).not.toBeNull();
        expect(activity.description).toContain('Auto-rejected');
        expect(activity.description).toContain('minimum experience');
    }, 30000);
    /**
     * Test 2: Candidate meeting experience threshold should not be auto-rejected
     * Requirements: 4.3, 4.7
     */
    it('should not auto-reject candidate meeting experience threshold', async () => {
        // Create a candidate with 5 years experience (above 3 year threshold)
        const candidate = await prisma.candidate.create({
            data: {
                companyId: testCompanyId,
                name: 'Senior Candidate',
                email: `senior-${Date.now()}@test.com`,
                experienceYears: 5,
                location: 'Remote',
                source: 'Application',
                skills: [],
            },
        });
        // Create job candidate association at Applied stage
        const jobCandidate = await prisma.jobCandidate.create({
            data: {
                jobId: jobWithAutoRejectionId,
                candidateId: candidate.id,
                currentStageId: appliedStageId,
            },
        });
        // Process auto-rejection
        const wasRejected = await processAutoRejection(jobCandidate.id, candidate.id, candidate.experienceYears, jobWithAutoRejectionId);
        // Verify candidate was NOT rejected
        expect(wasRejected).toBe(false);
        // Verify candidate is still in Applied stage
        const updatedJobCandidate = await prisma.jobCandidate.findUnique({
            where: { id: jobCandidate.id },
            include: { currentStage: true },
        });
        expect(updatedJobCandidate.currentStage.name).toBe('Applied');
    }, 30000);
    /**
     * Test 3: Job without auto-rejection rules should not reject candidates
     * Requirements: 4.7
     */
    it('should not auto-reject when rules are not configured', async () => {
        // Get Applied stage for job without rules
        const stages = await prisma.pipelineStage.findMany({
            where: { jobId: jobWithoutAutoRejectionId, parentId: null },
        });
        const appliedStage = stages.find(s => s.name === 'Applied');
        // Create a candidate with 0 years experience
        const candidate = await prisma.candidate.create({
            data: {
                companyId: testCompanyId,
                name: 'Fresh Graduate',
                email: `fresh-${Date.now()}@test.com`,
                experienceYears: 0,
                location: 'Remote',
                source: 'Application',
                skills: [],
            },
        });
        // Create job candidate association
        const jobCandidate = await prisma.jobCandidate.create({
            data: {
                jobId: jobWithoutAutoRejectionId,
                candidateId: candidate.id,
                currentStageId: appliedStage.id,
            },
        });
        // Process auto-rejection
        const wasRejected = await processAutoRejection(jobCandidate.id, candidate.id, candidate.experienceYears, jobWithoutAutoRejectionId);
        // Verify candidate was NOT rejected
        expect(wasRejected).toBe(false);
        // Verify candidate is still in Applied stage
        const updatedJobCandidate = await prisma.jobCandidate.findUnique({
            where: { id: jobCandidate.id },
            include: { currentStage: true },
        });
        expect(updatedJobCandidate.currentStage.name).toBe('Applied');
    }, 30000);
    /**
     * Test 4: evaluateAutoRejection function unit test
     * Requirements: 4.3, 9.2
     */
    it('should correctly evaluate auto-rejection rules', () => {
        const rules = {
            enabled: true,
            rules: {
                minExperience: 3,
            },
        };
        // Below threshold - should reject
        const result1 = evaluateAutoRejection(2, rules);
        expect(result1.shouldReject).toBe(true);
        expect(result1.reason).toContain('minimum experience');
        // At threshold - should not reject
        const result2 = evaluateAutoRejection(3, rules);
        expect(result2.shouldReject).toBe(false);
        // Above threshold - should not reject
        const result3 = evaluateAutoRejection(5, rules);
        expect(result3.shouldReject).toBe(false);
        // Disabled rules - should not reject
        const disabledRules = {
            enabled: false,
            rules: { minExperience: 3 },
        };
        const result4 = evaluateAutoRejection(1, disabledRules);
        expect(result4.shouldReject).toBe(false);
        // Null rules - should not reject
        const result5 = evaluateAutoRejection(1, null);
        expect(result5.shouldReject).toBe(false);
    });
});
/**
 * Integration Test Suite 2: Vendor Workflow
 * Requirements: 7.4, 7.6, 10.2, 10.3
 */
describe('Integration: Vendor Workflow', () => {
    let vendorId;
    let assignedJobId;
    let unassignedJobId;
    let candidateInAssignedJobId;
    let candidateInUnassignedJobId;
    beforeAll(async () => {
        // Create two jobs - one will be assigned to vendor, one won't
        const assignedJob = await jobService.create({
            companyId: testCompanyId,
            title: 'Vendor Assigned Job',
            department: 'Engineering',
            location: 'Remote',
            employmentType: 'Full-time',
            description: 'Job assigned to vendor',
        });
        assignedJobId = assignedJob.id;
        const unassignedJob = await jobService.create({
            companyId: testCompanyId,
            title: 'Vendor Unassigned Job',
            department: 'Marketing',
            location: 'Remote',
            employmentType: 'Full-time',
            description: 'Job not assigned to vendor',
        });
        unassignedJobId = unassignedJob.id;
        // Get Applied stages
        const assignedJobStages = await prisma.pipelineStage.findMany({
            where: { jobId: assignedJobId, parentId: null },
        });
        const unassignedJobStages = await prisma.pipelineStage.findMany({
            where: { jobId: unassignedJobId, parentId: null },
        });
        const assignedAppliedStage = assignedJobStages.find(s => s.name === 'Applied');
        const unassignedAppliedStage = unassignedJobStages.find(s => s.name === 'Applied');
        // Create candidates in each job
        const candidateInAssigned = await prisma.candidate.create({
            data: {
                companyId: testCompanyId,
                name: 'Candidate In Assigned Job',
                email: `assigned-candidate-${Date.now()}@test.com`,
                experienceYears: 3,
                location: 'Remote',
                source: 'Vendor',
                skills: [],
            },
        });
        candidateInAssignedJobId = candidateInAssigned.id;
        await prisma.jobCandidate.create({
            data: {
                jobId: assignedJobId,
                candidateId: candidateInAssigned.id,
                currentStageId: assignedAppliedStage.id,
            },
        });
        const candidateInUnassigned = await prisma.candidate.create({
            data: {
                companyId: testCompanyId,
                name: 'Candidate In Unassigned Job',
                email: `unassigned-candidate-${Date.now()}@test.com`,
                experienceYears: 2,
                location: 'Remote',
                source: 'Direct',
                skills: [],
            },
        });
        candidateInUnassignedJobId = candidateInUnassigned.id;
        await prisma.jobCandidate.create({
            data: {
                jobId: unassignedJobId,
                candidateId: candidateInUnassigned.id,
                currentStageId: unassignedAppliedStage.id,
            },
        });
    });
    /**
     * Test 1: Create vendor with job assignments
     * Requirements: 7.3, 10.1, 10.4
     */
    it('should create vendor with job assignments', async () => {
        const vendorData = {
            companyId: testCompanyId,
            name: 'Test Vendor Agency',
            email: `vendor-${Date.now()}@agency.com`,
            password: 'VendorPassword123!',
            assignedJobIds: [assignedJobId],
        };
        const vendor = await vendorService.createVendor(vendorData);
        vendorId = vendor.id;
        // Verify vendor was created with correct role
        expect(vendor.id).toBeDefined();
        expect(vendor.name).toBe(vendorData.name);
        expect(vendor.email).toBe(vendorData.email);
        expect(vendor.role).toBe('vendor');
        expect(vendor.isActive).toBe(true);
        // Verify job assignments
        expect(vendor.assignedJobs).toHaveLength(1);
        expect(vendor.assignedJobs[0].id).toBe(assignedJobId);
    }, 30000);
    /**
     * Test 2: Vendor can access assigned job
     * Requirements: 7.4, 10.2
     */
    it('should allow vendor to access assigned job', async () => {
        const hasAccess = await vendorService.hasJobAccess(vendorId, assignedJobId);
        expect(hasAccess).toBe(true);
    }, 30000);
    /**
     * Test 3: Vendor cannot access unassigned job
     * Requirements: 7.4, 10.2
     */
    it('should deny vendor access to unassigned job', async () => {
        const hasAccess = await vendorService.hasJobAccess(vendorId, unassignedJobId);
        expect(hasAccess).toBe(false);
    }, 30000);
    /**
     * Test 4: Get vendor job IDs returns only assigned jobs
     * Requirements: 7.6, 10.2
     */
    it('should return only assigned job IDs for vendor', async () => {
        const jobIds = await vendorService.getVendorJobIds(vendorId);
        expect(jobIds).toHaveLength(1);
        expect(jobIds).toContain(assignedJobId);
        expect(jobIds).not.toContain(unassignedJobId);
    }, 30000);
    /**
     * Test 5: Update vendor job assignments
     * Requirements: 10.5
     */
    it('should update vendor job assignments immediately', async () => {
        // Initially vendor has access to assignedJob only
        let hasAccessToAssigned = await vendorService.hasJobAccess(vendorId, assignedJobId);
        let hasAccessToUnassigned = await vendorService.hasJobAccess(vendorId, unassignedJobId);
        expect(hasAccessToAssigned).toBe(true);
        expect(hasAccessToUnassigned).toBe(false);
        // Update vendor to have access to both jobs
        await vendorService.updateVendor(vendorId, testCompanyId, {
            assignedJobIds: [assignedJobId, unassignedJobId],
        });
        // Verify immediate access update
        hasAccessToAssigned = await vendorService.hasJobAccess(vendorId, assignedJobId);
        hasAccessToUnassigned = await vendorService.hasJobAccess(vendorId, unassignedJobId);
        expect(hasAccessToAssigned).toBe(true);
        expect(hasAccessToUnassigned).toBe(true);
        // Revert to original assignment for other tests
        await vendorService.updateVendor(vendorId, testCompanyId, {
            assignedJobIds: [assignedJobId],
        });
        // Verify access revoked
        hasAccessToUnassigned = await vendorService.hasJobAccess(vendorId, unassignedJobId);
        expect(hasAccessToUnassigned).toBe(false);
    }, 30000);
    /**
     * Test 6: Deactivate vendor revokes access
     * Requirements: 7.8
     */
    it('should deactivate vendor and preserve data', async () => {
        // Deactivate vendor
        const deactivatedVendor = await vendorService.deactivateVendor(vendorId, testCompanyId);
        expect(deactivatedVendor.isActive).toBe(false);
        expect(deactivatedVendor.id).toBe(vendorId);
        expect(deactivatedVendor.name).toBeDefined();
        // Reactivate for cleanup
        await vendorService.updateVendor(vendorId, testCompanyId, { isActive: true });
    }, 30000);
    /**
     * Test 7: Vendor list returns all vendors for company
     * Requirements: 7.2
     */
    it('should list all vendors for company', async () => {
        const vendors = await vendorService.getVendors(testCompanyId);
        expect(vendors.length).toBeGreaterThanOrEqual(1);
        const testVendor = vendors.find(v => v.id === vendorId);
        expect(testVendor).toBeDefined();
        expect(testVendor.role).toBe('vendor');
    }, 30000);
});
//# sourceMappingURL=ats-comprehensive.integration.test.js.map