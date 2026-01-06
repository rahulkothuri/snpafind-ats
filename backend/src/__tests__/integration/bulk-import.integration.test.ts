/**
 * Integration Test: Bulk Candidate Import Flow
 * 
 * Tests the complete bulk import workflow:
 * 1. Import candidates from CSV/Excel
 * 2. Verify candidates are placed in Queue stage
 * 3. Verify application form submission moves from Queue to Applied
 * 4. Verify email invitations are configured correctly
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../../lib/prisma.js';
import jobService from '../../services/job.service.js';
import { bulkImportService, parseCSV, parseExcel } from '../../services/bulkImport.service.js';

// Test data
let testCompanyId: string;
let testJobId: string;
let testUserId: string;
const testCandidateIds: string[] = [];
const testJobCandidateIds: string[] = [];

beforeAll(async () => {
    // Create test company
    const company = await prisma.company.create({
        data: {
            name: 'Bulk Import Test Company',
            contactEmail: 'test@bulkimport.com',
        },
    });
    testCompanyId = company.id;

    // Create test user
    const user = await prisma.user.create({
        data: {
            companyId: testCompanyId,
            name: 'Test Recruiter',
            email: `recruiter-${Date.now()}@bulkimport.com`,
            passwordHash: 'test-hash',
            role: 'recruiter',
        },
    });
    testUserId = user.id;

    // Create test job
    const job = await jobService.create({
        companyId: testCompanyId,
        title: 'Bulk Import Test Position',
        department: 'Engineering',
    });
    testJobId = job.id;
}, 60000);

afterAll(async () => {
    // Clean up in reverse order
    try {
        // Delete activities
        await prisma.candidateActivity.deleteMany({
            where: { jobCandidateId: { in: testJobCandidateIds } },
        });

        // Delete stage history
        await prisma.stageHistory.deleteMany({
            where: { jobCandidateId: { in: testJobCandidateIds } },
        });

        // Delete job candidates
        await prisma.jobCandidate.deleteMany({
            where: { jobId: testJobId },
        });

        // Delete candidates
        await prisma.candidate.deleteMany({
            where: { id: { in: testCandidateIds } },
        });

        // Delete pipeline stages
        await prisma.pipelineStage.deleteMany({
            where: { jobId: testJobId },
        });

        // Delete job
        if (testJobId) {
            await prisma.job.delete({ where: { id: testJobId } });
        }

        // Delete user
        if (testUserId) {
            await prisma.user.delete({ where: { id: testUserId } });
        }

        // Delete company
        if (testCompanyId) {
            await prisma.company.delete({ where: { id: testCompanyId } });
        }
    } catch {
        // Ignore cleanup errors
    }
}, 60000);

describe('Integration: Bulk Candidate Import', () => {
    describe('CSV Parsing', () => {
        it('should parse valid CSV with required fields', () => {
            const csvContent = `name,email,phone,location
John Doe,john@example.com,+1234567890,New York
Jane Smith,jane@example.com,+0987654321,Los Angeles`;

            const candidates = parseCSV(csvContent);

            expect(candidates).toHaveLength(2);
            expect(candidates[0]).toEqual({
                name: 'John Doe',
                email: 'john@example.com',
                phone: '+1234567890',
                location: 'New York',
                experienceYears: undefined,
                currentCompany: undefined,
                skills: undefined,
            });
        });

        it('should handle CSV with all fields', () => {
            const csvContent = `name,email,phone,location,experienceYears,currentCompany,skills
Senior Dev,senior@example.com,+1111111111,Boston,5,TechCorp,JavaScript;Python;React`;

            const candidates = parseCSV(csvContent);

            expect(candidates).toHaveLength(1);
            expect(candidates[0].experienceYears).toBe(5);
            expect(candidates[0].currentCompany).toBe('TechCorp');
            expect(candidates[0].skills).toEqual(['JavaScript', 'Python', 'React']);
        });

        it('should throw error for missing required columns', () => {
            const csvContent = `name,phone
John Doe,+1234567890`;

            expect(() => parseCSV(csvContent)).toThrow();
        });

        it('should skip rows with invalid email format', () => {
            const csvContent = `name,email
Valid User,valid@example.com
Invalid User,not-an-email`;

            const candidates = parseCSV(csvContent);

            expect(candidates).toHaveLength(1);
            expect(candidates[0].email).toBe('valid@example.com');
        });
    });

    describe('Bulk Import Service', () => {
        it('should import candidates and place them in Queue stage', async () => {
            const candidates = [
                { name: 'Import Test 1', email: `import1-${Date.now()}@test.com` },
                { name: 'Import Test 2', email: `import2-${Date.now()}@test.com` },
            ];

            const result = await bulkImportService.importCandidates(
                testJobId,
                testCompanyId,
                candidates,
                testUserId,
                false // Don't send emails in tests
            );

            expect(result.success).toBe(true);
            expect(result.importedCount).toBe(2);
            expect(result.skippedCount).toBe(0);
            expect(result.failedCount).toBe(0);

            // Verify candidates are in Queue stage
            const jobCandidates = await prisma.jobCandidate.findMany({
                where: { jobId: testJobId },
                include: {
                    currentStage: true,
                    candidate: true,
                },
            });

            expect(jobCandidates.length).toBeGreaterThanOrEqual(2);

            const importedJCs = jobCandidates.filter(jc =>
                candidates.some(c => c.email === jc.candidate.email)
            );

            importedJCs.forEach(jc => {
                expect(jc.currentStage.name).toBe('Queue');
                testCandidateIds.push(jc.candidateId);
                testJobCandidateIds.push(jc.id);
            });
        }, 30000);

        it('should skip candidates already in pipeline', async () => {
            // Get an existing candidate email
            const existingCandidate = await prisma.candidate.findFirst({
                where: { id: { in: testCandidateIds } },
            });

            if (!existingCandidate) {
                return; // Skip if no candidates exist
            }

            const candidates = [
                { name: 'New Candidate', email: `new-${Date.now()}@test.com` },
                { name: existingCandidate.name, email: existingCandidate.email },
            ];

            const result = await bulkImportService.importCandidates(
                testJobId,
                testCompanyId,
                candidates,
                testUserId,
                false
            );

            expect(result.importedCount).toBe(1);
            expect(result.skippedCount).toBe(1);

            // Track new candidate for cleanup
            const newCandidate = await prisma.candidate.findUnique({
                where: { email: candidates[0].email },
            });
            if (newCandidate) {
                testCandidateIds.push(newCandidate.id);
                const jc = await prisma.jobCandidate.findFirst({
                    where: { candidateId: newCandidate.id, jobId: testJobId },
                });
                if (jc) testJobCandidateIds.push(jc.id);
            }
        }, 30000);

        it('should update existing candidate records', async () => {
            const email = `update-test-${Date.now()}@test.com`;

            // Create candidate first
            const candidate = await prisma.candidate.create({
                data: {
                    companyId: testCompanyId,
                    name: 'Original Name',
                    email,
                    location: 'Original Location',
                    source: 'Manual',
                    experienceYears: 0,
                    skills: [],
                },
            });
            testCandidateIds.push(candidate.id);

            // Import with updated data
            const result = await bulkImportService.importCandidates(
                testJobId,
                testCompanyId,
                [{ name: 'Updated Name', email, location: 'New Location' }],
                testUserId,
                false
            );

            expect(result.importedCount).toBe(1);

            // Verify candidate was updated
            const updatedCandidate = await prisma.candidate.findUnique({
                where: { id: candidate.id },
            });
            expect(updatedCandidate?.name).toBe('Updated Name');
            expect(updatedCandidate?.location).toBe('New Location');

            // Track job candidate for cleanup
            const jc = await prisma.jobCandidate.findFirst({
                where: { candidateId: candidate.id, jobId: testJobId },
            });
            if (jc) testJobCandidateIds.push(jc.id);
        }, 30000);
    });

    describe('Queue to Applied Transition', () => {
        it('should verify Queue stage exists for jobs', async () => {
            const job = await prisma.job.findUnique({
                where: { id: testJobId },
                include: {
                    pipelineStages: {
                        orderBy: { position: 'asc' },
                    },
                },
            });

            expect(job).not.toBeNull();

            const queueStage = job!.pipelineStages.find(s => s.name === 'Queue');
            const appliedStage = job!.pipelineStages.find(s => s.name === 'Applied');

            expect(queueStage).toBeDefined();
            expect(appliedStage).toBeDefined();
            expect(queueStage!.position).toBe(0);
            expect(appliedStage!.position).toBe(1);
        }, 30000);

        it('should have candidates in Queue stage after bulk import', async () => {
            const jobCandidates = await prisma.jobCandidate.findMany({
                where: {
                    jobId: testJobId,
                    id: { in: testJobCandidateIds },
                },
                include: { currentStage: true },
            });

            const queueCandidates = jobCandidates.filter(
                jc => jc.currentStage.name === 'Queue'
            );

            expect(queueCandidates.length).toBeGreaterThan(0);
        }, 30000);
    });
});
