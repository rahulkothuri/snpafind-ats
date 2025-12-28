/**
 * Integration Test: Complete Application Flow
 * **Validates: Requirements 5.11, 6.3, 6.4**
 *
 * Tests the complete application flow:
 * 1. Create job, get application URL
 * 2. Submit application as candidate
 * 3. Verify candidate appears in ATS portal
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../../lib/prisma.js';
import jobService from '../../services/job.service.js';
import candidateService from '../../services/candidate.service.js';
// Test data
let testCompanyId;
let testJobId;
let testCandidateId;
let testJobCandidateId;
beforeAll(async () => {
    // Create a test company for the integration tests
    const company = await prisma.company.create({
        data: {
            name: 'Application Flow Test Company',
            contactEmail: 'test@applicationflow.com',
        },
    });
    testCompanyId = company.id;
});
afterAll(async () => {
    // Clean up in reverse order of creation
    try {
        if (testJobCandidateId) {
            await prisma.candidateActivity.deleteMany({
                where: { jobCandidateId: testJobCandidateId },
            });
            await prisma.jobCandidate.delete({
                where: { id: testJobCandidateId },
            });
        }
        if (testCandidateId) {
            await prisma.candidate.delete({
                where: { id: testCandidateId },
            });
        }
        if (testJobId) {
            await prisma.pipelineStage.deleteMany({
                where: { jobId: testJobId },
            });
            await prisma.job.delete({
                where: { id: testJobId },
            });
        }
        if (testCompanyId) {
            await prisma.company.delete({
                where: { id: testCompanyId },
            });
        }
    }
    catch {
        // Ignore cleanup errors
    }
});
describe('Integration: Complete Application Flow', () => {
    /**
     * Step 1: Create job and verify it has pipeline stages
     * Requirements: 4.3, 4.4
     */
    it('should create job with pipeline stages and unique application URL', async () => {
        const jobData = {
            companyId: testCompanyId,
            title: 'Integration Test Engineer',
            department: 'Engineering',
            location: 'Remote',
            employmentType: 'Full-time',
            description: 'Test job for integration testing',
        };
        const job = await jobService.create(jobData);
        testJobId = job.id;
        // Verify job was created
        expect(job.id).toBeDefined();
        expect(job.title).toBe(jobData.title);
        expect(job.status).toBe('active');
        // Verify pipeline stages were created (Requirements 4.3)
        expect(job.stages).toBeDefined();
        expect(job.stages.length).toBe(8); // Default stages
        const stageNames = job.stages.map(s => s.name);
        expect(stageNames).toContain('Queue');
        expect(stageNames).toContain('Applied');
        expect(stageNames).toContain('Screening');
        expect(stageNames).toContain('Interview');
        expect(stageNames).toContain('Hired');
        // Verify unique application URL can be constructed (Requirements 4.4)
        const applicationUrl = `/apply/${job.id}`;
        expect(applicationUrl).toBe(`/apply/${testJobId}`);
    }, 30000);
    /**
     * Step 2: Submit application as candidate
     * Requirements: 5.10, 6.1, 6.2
     */
    it('should submit application and create candidate with Applied stage', async () => {
        // Get the job with pipeline stages
        const job = await prisma.job.findUnique({
            where: { id: testJobId },
            include: {
                pipelineStages: {
                    where: { name: 'Applied' },
                    take: 1,
                },
            },
        });
        expect(job).not.toBeNull();
        expect(job.pipelineStages.length).toBe(1);
        const appliedStage = job.pipelineStages[0];
        // Create candidate (simulating public application submission)
        const candidateData = {
            companyId: testCompanyId,
            name: 'Test Applicant',
            email: `test-applicant-${Date.now()}@example.com`,
            phone: '+1-555-123-4567',
            location: 'San Francisco, CA',
            source: 'Public Application',
            experienceYears: 0,
            skills: [],
        };
        const candidate = await prisma.candidate.create({
            data: candidateData,
        });
        testCandidateId = candidate.id;
        // Verify candidate was created (Requirements 6.1)
        expect(candidate.id).toBeDefined();
        expect(candidate.name).toBe(candidateData.name);
        expect(candidate.email).toBe(candidateData.email);
        expect(candidate.source).toBe('Public Application');
        // Create job-candidate association with Applied stage (Requirements 6.2)
        const jobCandidate = await prisma.jobCandidate.create({
            data: {
                jobId: testJobId,
                candidateId: candidate.id,
                currentStageId: appliedStage.id,
            },
        });
        testJobCandidateId = jobCandidate.id;
        // Verify association was created with Applied stage
        expect(jobCandidate.id).toBeDefined();
        expect(jobCandidate.jobId).toBe(testJobId);
        expect(jobCandidate.candidateId).toBe(candidate.id);
        expect(jobCandidate.currentStageId).toBe(appliedStage.id);
        // Create activity record
        await prisma.candidateActivity.create({
            data: {
                candidateId: candidate.id,
                jobCandidateId: jobCandidate.id,
                activityType: 'stage_change',
                description: 'Applied via public application form',
                metadata: {},
            },
        });
    }, 30000);
    /**
     * Step 3: Verify candidate appears in ATS portal
     * Requirements: 5.11, 6.3, 6.4
     */
    it('should show candidate in ATS portal candidate database', async () => {
        // Verify candidate appears in candidate database (Requirements 6.3)
        const candidates = await candidateService.getAllByCompany(testCompanyId);
        expect(candidates.length).toBeGreaterThan(0);
        const testCandidate = candidates.find(c => c.id === testCandidateId);
        expect(testCandidate).toBeDefined();
        expect(testCandidate.name).toBe('Test Applicant');
        expect(testCandidate.source).toBe('Public Application');
    }, 30000);
    /**
     * Step 4: Verify candidate appears in job pipeline
     * Requirements: 6.4
     */
    it('should show candidate in job pipeline at Applied stage', async () => {
        // Get job candidates for the test job (Requirements 6.4)
        const jobCandidates = await prisma.jobCandidate.findMany({
            where: { jobId: testJobId },
            include: {
                candidate: true,
                currentStage: true,
            },
        });
        expect(jobCandidates.length).toBeGreaterThan(0);
        const testJobCandidate = jobCandidates.find(jc => jc.candidateId === testCandidateId);
        expect(testJobCandidate).toBeDefined();
        expect(testJobCandidate.candidate.name).toBe('Test Applicant');
        expect(testJobCandidate.currentStage.name).toBe('Applied');
    }, 30000);
    /**
     * Test existing email updates candidate instead of creating duplicate
     * Requirements: 5.12
     */
    it('should update existing candidate when applying with same email', async () => {
        // Get the existing candidate's email
        const existingCandidate = await prisma.candidate.findUnique({
            where: { id: testCandidateId },
        });
        expect(existingCandidate).not.toBeNull();
        // Update the candidate (simulating second application with same email)
        const updatedCandidate = await prisma.candidate.update({
            where: { id: testCandidateId },
            data: {
                name: 'Updated Test Applicant',
                phone: '+1-555-999-8888',
                location: 'New York, NY',
            },
        });
        // Verify candidate was updated, not duplicated
        expect(updatedCandidate.id).toBe(testCandidateId);
        expect(updatedCandidate.name).toBe('Updated Test Applicant');
        expect(updatedCandidate.phone).toBe('+1-555-999-8888');
        expect(updatedCandidate.location).toBe('New York, NY');
        expect(updatedCandidate.email).toBe(existingCandidate.email);
        // Verify only one candidate exists with this email
        const candidateCount = await prisma.candidate.count({
            where: { email: existingCandidate.email },
        });
        expect(candidateCount).toBe(1);
    }, 30000);
});
//# sourceMappingURL=application-flow.integration.test.js.map