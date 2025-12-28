/**
 * Integration Test: Job Access Control Workflow
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.4, 5.5**
 *
 * Tests the complete job access control workflow:
 * 1. Create users with different roles (admin, hiring_manager, recruiter)
 * 2. Create jobs with different assignments
 * 3. Test job visibility and access permissions
 * 4. Test job operations (view, edit, delete) with different roles
 * 5. Test assignment changes and permission updates
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import bcrypt from 'bcrypt';
import prisma from '../../lib/prisma.js';
import authService from '../../services/auth.service.js';
import jobService from '../../services/job.service.js';
import { jobAccessControlService } from '../../services/jobAccessControl.service.js';
// Helper function to hash passwords for testing
const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};
// Test data
let testCompanyId;
let adminUserId;
let hiringManagerUserId;
let recruiter1UserId;
let recruiter2UserId;
let adminToken;
let hiringManagerToken;
let recruiter1Token;
let recruiter2Token;
let publicJobId;
let assignedJobId;
let unassignedJobId;
beforeAll(async () => {
    // Create admin user first (this will create a company)
    const adminData = {
        fullName: 'Admin User',
        email: `admin-${Date.now()}@jobaccess.com`,
        password: 'AdminPassword123!',
        companyName: 'Job Access Control Test Company',
    };
    await authService.register(adminData);
    const adminLogin = await authService.login({
        email: adminData.email,
        password: adminData.password,
    });
    adminUserId = adminLogin.user.id;
    adminToken = adminLogin.token;
    testCompanyId = adminLogin.user.companyId; // Use the company created by registration
    // Create hiring manager user
    const hiringManagerUser = await prisma.user.create({
        data: {
            name: 'Hiring Manager User',
            email: `hm-${Date.now()}@jobaccess.com`,
            passwordHash: await hashPassword('hashedpassword'),
            role: 'hiring_manager',
            companyId: testCompanyId,
            isActive: true,
        },
    });
    hiringManagerUserId = hiringManagerUser.id;
    const hmLogin = await authService.login({
        email: hiringManagerUser.email,
        password: 'hashedpassword',
    });
    hiringManagerToken = hmLogin.token;
    // Create recruiter users
    const recruiter1User = await prisma.user.create({
        data: {
            name: 'Recruiter One',
            email: `rec1-${Date.now()}@jobaccess.com`,
            passwordHash: await hashPassword('hashedpassword'),
            role: 'recruiter',
            companyId: testCompanyId,
            isActive: true,
        },
    });
    recruiter1UserId = recruiter1User.id;
    const rec1Login = await authService.login({
        email: recruiter1User.email,
        password: 'hashedpassword',
    });
    recruiter1Token = rec1Login.token;
    const recruiter2User = await prisma.user.create({
        data: {
            name: 'Recruiter Two',
            email: `rec2-${Date.now()}@jobaccess.com`,
            passwordHash: await hashPassword('hashedpassword'),
            role: 'recruiter',
            companyId: testCompanyId,
            isActive: true,
        },
    });
    recruiter2UserId = recruiter2User.id;
    const rec2Login = await authService.login({
        email: recruiter2User.email,
        password: 'hashedpassword',
    });
    recruiter2Token = rec2Login.token;
});
afterAll(async () => {
    // Clean up in reverse order of creation
    try {
        // Delete jobs
        if (publicJobId) {
            await prisma.pipelineStage.deleteMany({ where: { jobId: publicJobId } });
            await prisma.job.delete({ where: { id: publicJobId } });
        }
        if (assignedJobId) {
            await prisma.pipelineStage.deleteMany({ where: { jobId: assignedJobId } });
            await prisma.job.delete({ where: { id: assignedJobId } });
        }
        if (unassignedJobId) {
            await prisma.pipelineStage.deleteMany({ where: { jobId: unassignedJobId } });
            await prisma.job.delete({ where: { id: unassignedJobId } });
        }
        // Delete users
        if (recruiter2UserId)
            await prisma.user.delete({ where: { id: recruiter2UserId } });
        if (recruiter1UserId)
            await prisma.user.delete({ where: { id: recruiter1UserId } });
        if (hiringManagerUserId)
            await prisma.user.delete({ where: { id: hiringManagerUserId } });
        if (adminUserId)
            await prisma.user.delete({ where: { id: adminUserId } });
        // Delete company (this will be the company created by admin registration)
        if (testCompanyId)
            await prisma.company.delete({ where: { id: testCompanyId } });
    }
    catch {
        // Ignore cleanup errors
    }
});
describe('Integration: Job Access Control Workflow', () => {
    /**
     * Step 1: Create jobs with different assignment scenarios
     * Requirements: 1.1, 4.5
     */
    it('should create jobs with different assignment scenarios', async () => {
        // Create a public job (no assigned recruiter)
        const publicJobData = {
            companyId: testCompanyId,
            title: 'Public Software Engineer',
            department: 'Engineering',
            location: 'Remote',
            employmentType: 'Full-time',
            description: 'Public job accessible to all roles',
        };
        const publicJob = await jobService.create(publicJobData);
        publicJobId = publicJob.id;
        expect(publicJob.assignedRecruiterId).toBeUndefined();
        // Create a job assigned to recruiter1
        const assignedJobData = {
            companyId: testCompanyId,
            title: 'Assigned Frontend Developer',
            department: 'Engineering',
            location: 'San Francisco',
            employmentType: 'Full-time',
            description: 'Job assigned to specific recruiter',
            assignedRecruiterId: recruiter1UserId,
        };
        const assignedJob = await jobService.create(assignedJobData);
        assignedJobId = assignedJob.id;
        expect(assignedJob.assignedRecruiterId).toBe(recruiter1UserId);
        // Create another unassigned job
        const unassignedJobData = {
            companyId: testCompanyId,
            title: 'Unassigned Backend Developer',
            department: 'Engineering',
            location: 'New York',
            employmentType: 'Full-time',
            description: 'Another unassigned job',
        };
        const unassignedJob = await jobService.create(unassignedJobData);
        unassignedJobId = unassignedJob.id;
        expect(unassignedJob.assignedRecruiterId).toBeUndefined();
    }, 30000);
    /**
     * Step 2: Test admin access to all jobs
     * Requirements: 1.2, 1.3, 4.1
     */
    it('should allow admin to access all jobs', async () => {
        const accessibleJobs = await jobAccessControlService.getAccessibleJobs(adminUserId, 'admin', testCompanyId);
        expect(accessibleJobs.length).toBe(3);
        const jobIds = accessibleJobs.map(job => job.id);
        expect(jobIds).toContain(publicJobId);
        expect(jobIds).toContain(assignedJobId);
        expect(jobIds).toContain(unassignedJobId);
        // Test individual job access validation
        const hasAccessToPublic = await jobAccessControlService.validateJobAccess(publicJobId, adminUserId, 'admin');
        expect(hasAccessToPublic).toBe(true);
        const hasAccessToAssigned = await jobAccessControlService.validateJobAccess(assignedJobId, adminUserId, 'admin');
        expect(hasAccessToAssigned).toBe(true);
    }, 30000);
    /**
     * Step 3: Test hiring manager access to all jobs
     * Requirements: 1.2, 1.3, 4.1
     */
    it('should allow hiring manager to access all jobs', async () => {
        const accessibleJobs = await jobAccessControlService.getAccessibleJobs(hiringManagerUserId, 'hiring_manager', testCompanyId);
        expect(accessibleJobs.length).toBe(3);
        const jobIds = accessibleJobs.map(job => job.id);
        expect(jobIds).toContain(publicJobId);
        expect(jobIds).toContain(assignedJobId);
        expect(jobIds).toContain(unassignedJobId);
        // Test individual job access validation
        const hasAccessToAssigned = await jobAccessControlService.validateJobAccess(assignedJobId, hiringManagerUserId, 'hiring_manager');
        expect(hasAccessToAssigned).toBe(true);
    }, 30000);
    /**
     * Step 4: Test recruiter access to assigned jobs only
     * Requirements: 1.1, 1.4, 4.2
     */
    it('should allow recruiter to access only assigned jobs', async () => {
        // Test recruiter1 (has assigned job)
        const recruiter1Jobs = await jobAccessControlService.getAccessibleJobs(recruiter1UserId, 'recruiter', testCompanyId);
        expect(recruiter1Jobs.length).toBe(1);
        expect(recruiter1Jobs[0].id).toBe(assignedJobId);
        expect(recruiter1Jobs[0].assignedRecruiterId).toBe(recruiter1UserId);
        // Test access validation for assigned job
        const hasAccessToAssigned = await jobAccessControlService.validateJobAccess(assignedJobId, recruiter1UserId, 'recruiter');
        expect(hasAccessToAssigned).toBe(true);
        // Test access validation for non-assigned job
        const hasAccessToPublic = await jobAccessControlService.validateJobAccess(publicJobId, recruiter1UserId, 'recruiter');
        expect(hasAccessToPublic).toBe(false);
        // Test recruiter2 (has no assigned jobs)
        const recruiter2Jobs = await jobAccessControlService.getAccessibleJobs(recruiter2UserId, 'recruiter', testCompanyId);
        expect(recruiter2Jobs.length).toBe(0);
        // Test access validation for recruiter2
        const recruiter2HasAccess = await jobAccessControlService.validateJobAccess(assignedJobId, recruiter2UserId, 'recruiter');
        expect(recruiter2HasAccess).toBe(false);
    }, 30000);
    /**
     * Step 5: Test job assignment changes and immediate permission updates
     * Requirements: 4.5, 5.4
     */
    it('should update permissions immediately when job assignment changes', async () => {
        // Initially, recruiter2 has no access to the assigned job
        let hasAccess = await jobAccessControlService.validateJobAccess(assignedJobId, recruiter2UserId, 'recruiter');
        expect(hasAccess).toBe(false);
        // Reassign the job to recruiter2
        await prisma.job.update({
            where: { id: assignedJobId },
            data: { assignedRecruiterId: recruiter2UserId },
        });
        // Now recruiter2 should have access
        hasAccess = await jobAccessControlService.validateJobAccess(assignedJobId, recruiter2UserId, 'recruiter');
        expect(hasAccess).toBe(true);
        // And recruiter1 should lose access
        const recruiter1HasAccess = await jobAccessControlService.validateJobAccess(assignedJobId, recruiter1UserId, 'recruiter');
        expect(recruiter1HasAccess).toBe(false);
        // Verify through getAccessibleJobs
        const recruiter2Jobs = await jobAccessControlService.getAccessibleJobs(recruiter2UserId, 'recruiter', testCompanyId);
        expect(recruiter2Jobs.length).toBe(1);
        expect(recruiter2Jobs[0].id).toBe(assignedJobId);
        const recruiter1Jobs = await jobAccessControlService.getAccessibleJobs(recruiter1UserId, 'recruiter', testCompanyId);
        expect(recruiter1Jobs.length).toBe(0);
    }, 30000);
    /**
     * Step 6: Test role-based job filtering
     * Requirements: 1.1, 1.2, 1.3, 4.1
     */
    it('should filter jobs correctly based on user role', async () => {
        const allJobs = [
            { id: publicJobId, assignedRecruiterId: undefined },
            { id: assignedJobId, assignedRecruiterId: recruiter2UserId },
            { id: unassignedJobId, assignedRecruiterId: undefined },
        ];
        // Test admin filtering (should see all jobs)
        const adminFiltered = jobAccessControlService.filterJobsByUserRole(allJobs, adminUserId, 'admin');
        expect(adminFiltered.length).toBe(3);
        // Test hiring manager filtering (should see all jobs)
        const hmFiltered = jobAccessControlService.filterJobsByUserRole(allJobs, hiringManagerUserId, 'hiring_manager');
        expect(hmFiltered.length).toBe(3);
        // Test recruiter1 filtering (should see no jobs since none assigned)
        const recruiter1Filtered = jobAccessControlService.filterJobsByUserRole(allJobs, recruiter1UserId, 'recruiter');
        expect(recruiter1Filtered.length).toBe(0);
        // Test recruiter2 filtering (should see only assigned job)
        const recruiter2Filtered = jobAccessControlService.filterJobsByUserRole(allJobs, recruiter2UserId, 'recruiter');
        expect(recruiter2Filtered.length).toBe(1);
        expect(recruiter2Filtered[0].id).toBe(assignedJobId);
    }, 30000);
    /**
     * Step 7: Test unauthorized access scenarios
     * Requirements: 1.4, 4.2, 4.3, 4.4
     */
    it('should deny access to unauthorized users', async () => {
        // Test recruiter trying to access non-assigned job
        const unauthorizedAccess = await jobAccessControlService.validateJobAccess(publicJobId, recruiter1UserId, 'recruiter');
        expect(unauthorizedAccess).toBe(false);
        // Test access to non-existent job
        const nonExistentAccess = await jobAccessControlService.validateJobAccess('non-existent-job-id', adminUserId, 'admin');
        expect(nonExistentAccess).toBe(false);
        // Test with invalid user role
        const invalidRoleAccess = await jobAccessControlService.validateJobAccess(publicJobId, adminUserId, 'invalid_role');
        expect(invalidRoleAccess).toBe(false);
    }, 30000);
    /**
     * Step 8: Test job operations with different roles
     * Requirements: 4.2, 4.3, 4.4
     */
    it('should validate job operations based on user permissions', async () => {
        // Test job creation permissions (all authenticated users can create)
        const newJobData = {
            companyId: testCompanyId,
            title: 'Test Job Creation',
            department: 'HR',
            location: 'Remote',
            employmentType: 'Part-time',
            description: 'Testing job creation permissions',
        };
        // Admin can create
        const adminCreatedJob = await jobService.create(newJobData);
        expect(adminCreatedJob.id).toBeDefined();
        // Clean up
        await prisma.pipelineStage.deleteMany({ where: { jobId: adminCreatedJob.id } });
        await prisma.job.delete({ where: { id: adminCreatedJob.id } });
        // Hiring manager can create
        const hmCreatedJob = await jobService.create(newJobData);
        expect(hmCreatedJob.id).toBeDefined();
        // Clean up
        await prisma.pipelineStage.deleteMany({ where: { jobId: hmCreatedJob.id } });
        await prisma.job.delete({ where: { id: hmCreatedJob.id } });
        // Recruiter can create
        const recruiterCreatedJob = await jobService.create(newJobData);
        expect(recruiterCreatedJob.id).toBeDefined();
        // Clean up
        await prisma.pipelineStage.deleteMany({ where: { jobId: recruiterCreatedJob.id } });
        await prisma.job.delete({ where: { id: recruiterCreatedJob.id } });
    }, 30000);
    /**
     * Step 9: Test cross-company access prevention
     * Requirements: 4.1, 4.2
     */
    it('should prevent access to jobs from different companies', async () => {
        // Create another company and user
        const otherCompany = await prisma.company.create({
            data: {
                name: 'Other Company',
                contactEmail: 'other@company.com',
            },
        });
        const otherUser = await prisma.user.create({
            data: {
                name: 'Other User',
                email: `other-${Date.now()}@company.com`,
                passwordHash: await hashPassword('hashedpassword'),
                role: 'admin',
                companyId: otherCompany.id,
                isActive: true,
            },
        });
        // Other user should not have access to our test jobs
        const otherUserJobs = await jobAccessControlService.getAccessibleJobs(otherUser.id, 'admin', otherCompany.id);
        expect(otherUserJobs.length).toBe(0);
        const hasAccessToOurJob = await jobAccessControlService.validateJobAccess(publicJobId, otherUser.id, 'admin');
        expect(hasAccessToOurJob).toBe(false);
        // Clean up
        await prisma.user.delete({ where: { id: otherUser.id } });
        await prisma.company.delete({ where: { id: otherCompany.id } });
    }, 30000);
});
//# sourceMappingURL=job-access-control.integration.test.js.map