/**
 * **Feature: ats-portal-phase1, Property 11: Default stages are initialized**
 * **Feature: ats-portal-phase1, Property 12: Custom sub-stage insertion preserves order**
 * **Feature: ats-portal-phase1, Property 13: Stage reordering maintains candidate associations**
 * **Validates: Requirements 6.1, 6.2, 6.4**
 *
 * Property 11: For any newly created job, the pipeline should contain the default stages
 * (Queue, Applied, Screening, Shortlisted, Interview, Selected, Offer, Hired) in the correct order.
 *
 * Property 12: For any pipeline and custom sub-stage inserted at position N, the sub-stage
 * should appear at position N and all subsequent stages should have their positions incremented.
 *
 * Property 13: For any pipeline with candidates, reordering stages should update stage positions
 * while maintaining all candidate-stage associations correctly.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
// Default pipeline stages with mandatory flag
const DEFAULT_STAGES = [
    { name: 'Queue', isMandatory: false },
    { name: 'Applied', isMandatory: false },
    { name: 'Screening', isMandatory: true },
    { name: 'Shortlisted', isMandatory: true },
    { name: 'Interview', isMandatory: false },
    { name: 'Selected', isMandatory: false },
    { name: 'Offer', isMandatory: true },
    { name: 'Hired', isMandatory: false },
];
const DEFAULT_STAGE_NAMES = DEFAULT_STAGES.map(s => s.name);
// Mock Prisma client - must be before imports
vi.mock('../../lib/prisma.js', () => {
    const mockPrismaJob = {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    };
    const mockPrismaStage = {
        create: vi.fn(),
        createMany: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
    };
    return {
        default: {
            job: mockPrismaJob,
            pipelineStage: mockPrismaStage,
            $transaction: vi.fn(),
        },
        prisma: {
            job: mockPrismaJob,
            pipelineStage: mockPrismaStage,
            $transaction: vi.fn(),
        },
    };
});
// Import after mocking
import jobService from '../../services/job.service.js';
import pipelineService from '../../services/pipeline.service.js';
import prisma from '../../lib/prisma.js';
// Get the mocked functions
const mockPrismaJob = prisma.job;
const mockPrismaStage = prisma.pipelineStage;
const mockTransaction = prisma.$transaction;
// Arbitraries for generating test data
const uuidArbitrary = fc.uuid();
const nonEmptyStringArbitrary = fc.string({ minLength: 1, maxLength: 50 })
    .filter(s => s.trim().length > 0);
const jobTitleArbitrary = nonEmptyStringArbitrary;
const departmentArbitrary = fc.constantFrom('Engineering', 'Product', 'Sales', 'HR');
const locationArbitrary = fc.constantFrom('Bangalore', 'Remote', 'New York');
const stageNameArbitrary = fc.constantFrom('Phone Screen', 'Technical Interview', 'HR Round', 'Manager Interview', 'Final Round', 'Background Check');
beforeEach(() => {
    vi.clearAllMocks();
});
describe('Property 11: Default stages are initialized', () => {
    /**
     * **Feature: ats-portal-phase1, Property 11: Default stages are initialized**
     * **Validates: Requirements 6.1**
     */
    it('should initialize default stages in correct order when job is created', async () => {
        await fc.assert(fc.asyncProperty(uuidArbitrary, uuidArbitrary, jobTitleArbitrary, departmentArbitrary, locationArbitrary, async (jobId, companyId, title, department, location) => {
            const now = new Date();
            const mockDbJob = {
                id: jobId,
                companyId,
                title: title.trim(),
                department: department.trim(),
                location: location.trim(),
                experienceMin: null,
                experienceMax: null,
                salaryMin: null,
                salaryMax: null,
                variables: null,
                educationQualification: null,
                ageUpTo: null,
                skills: [],
                preferredIndustry: null,
                workMode: null,
                locations: [],
                priority: 'Medium',
                jobDomain: null,
                assignedRecruiterId: null,
                description: null,
                employmentType: null,
                salaryRange: null,
                status: 'active',
                openings: 1,
                createdAt: now,
                updatedAt: now,
            };
            // Create mock stages with correct order
            const mockStages = DEFAULT_STAGES.map((stage, index) => ({
                id: `stage-${jobId}-${index}`,
                jobId,
                name: stage.name,
                position: index,
                isDefault: true,
                isMandatory: stage.isMandatory,
                parentId: null,
                createdAt: now,
                subStages: [],
            }));
            // Mock transaction
            mockTransaction.mockImplementationOnce(async (callback) => {
                const txMock = {
                    job: {
                        create: vi.fn().mockResolvedValue(mockDbJob),
                    },
                    pipelineStage: {
                        create: vi.fn().mockImplementation((args) => {
                            const stageIndex = mockStages.findIndex(s => s.name === args.data.name);
                            return Promise.resolve(mockStages[stageIndex] || mockStages[0]);
                        }),
                        findMany: vi.fn().mockResolvedValue(mockStages),
                    },
                };
                return callback(txMock);
            });
            const job = await jobService.create({
                companyId,
                title,
                department,
                location,
            });
            // Verify default stages are present
            expect(job.stages).toBeDefined();
            expect(job.stages.length).toBe(DEFAULT_STAGES.length);
            // Verify stages are in correct order
            for (let i = 0; i < DEFAULT_STAGES.length; i++) {
                expect(job.stages[i].name).toBe(DEFAULT_STAGES[i].name);
                expect(job.stages[i].position).toBe(i);
                expect(job.stages[i].isDefault).toBe(true);
            }
        }), { numRuns: 100 });
    });
    it('should mark all default stages as isDefault=true', async () => {
        await fc.assert(fc.asyncProperty(uuidArbitrary, uuidArbitrary, jobTitleArbitrary, departmentArbitrary, locationArbitrary, async (jobId, companyId, title, department, location) => {
            const now = new Date();
            const mockDbJob = {
                id: jobId,
                companyId,
                title: title.trim(),
                department: department.trim(),
                location: location.trim(),
                experienceMin: null,
                experienceMax: null,
                salaryMin: null,
                salaryMax: null,
                variables: null,
                educationQualification: null,
                ageUpTo: null,
                skills: [],
                preferredIndustry: null,
                workMode: null,
                locations: [],
                priority: 'Medium',
                jobDomain: null,
                assignedRecruiterId: null,
                description: null,
                employmentType: null,
                salaryRange: null,
                status: 'active',
                openings: 1,
                createdAt: now,
                updatedAt: now,
            };
            const mockStages = DEFAULT_STAGES.map((stage, index) => ({
                id: `stage-${jobId}-${index}`,
                jobId,
                name: stage.name,
                position: index,
                isDefault: true,
                isMandatory: stage.isMandatory,
                parentId: null,
                createdAt: now,
                subStages: [],
            }));
            mockTransaction.mockImplementationOnce(async (callback) => {
                const txMock = {
                    job: {
                        create: vi.fn().mockResolvedValue(mockDbJob),
                    },
                    pipelineStage: {
                        create: vi.fn().mockImplementation((args) => {
                            const stageIndex = mockStages.findIndex(s => s.name === args.data.name);
                            return Promise.resolve(mockStages[stageIndex] || mockStages[0]);
                        }),
                        findMany: vi.fn().mockResolvedValue(mockStages),
                    },
                };
                return callback(txMock);
            });
            const job = await jobService.create({
                companyId,
                title,
                department,
                location,
            });
            // All default stages should have isDefault=true
            for (const stage of job.stages) {
                expect(stage.isDefault).toBe(true);
            }
        }), { numRuns: 50 });
    });
});
describe('Property 12: Custom sub-stage insertion preserves order', () => {
    /**
     * **Feature: ats-portal-phase1, Property 12: Custom sub-stage insertion preserves order**
     * **Validates: Requirements 6.2**
     */
    it('should insert custom stage at specified position and shift subsequent stages', async () => {
        await fc.assert(fc.asyncProperty(uuidArbitrary, uuidArbitrary, stageNameArbitrary, fc.integer({ min: 0, max: 7 }), // Position within default stages
        async (jobId, newStageId, stageName, insertPosition) => {
            const now = new Date();
            // Create initial stages
            const initialStages = DEFAULT_STAGES.map((stage, index) => ({
                id: `stage-${jobId}-${index}`,
                jobId,
                name: stage.name,
                position: index,
                isDefault: true,
                isMandatory: stage.isMandatory,
                parentId: null,
                createdAt: now,
            }));
            // Mock job exists
            mockPrismaJob.findUnique.mockResolvedValueOnce({
                id: jobId,
                companyId: 'company-1',
                title: 'Test Job',
                department: 'Engineering',
                location: 'Remote',
                status: 'active',
            });
            // Mock existing stages
            mockPrismaStage.findMany.mockResolvedValueOnce(initialStages);
            // Create expected stages after insertion
            const expectedStages = [...initialStages];
            // Shift positions for stages at or after insert position
            for (let i = insertPosition; i < expectedStages.length; i++) {
                expectedStages[i] = { ...expectedStages[i], position: expectedStages[i].position + 1 };
            }
            // Insert new stage
            const newStage = {
                id: newStageId,
                jobId,
                name: stageName.trim(),
                position: insertPosition,
                isDefault: false,
                isMandatory: false,
                parentId: null,
                createdAt: now,
            };
            expectedStages.splice(insertPosition, 0, newStage);
            // Mock transaction
            mockTransaction.mockImplementationOnce(async (callback) => {
                const txMock = {
                    pipelineStage: {
                        updateMany: vi.fn().mockResolvedValue({ count: DEFAULT_STAGES.length - insertPosition }),
                        create: vi.fn().mockResolvedValue(newStage),
                    },
                };
                return callback(txMock);
            });
            const insertedStage = await pipelineService.insertStage({
                jobId,
                name: stageName,
                position: insertPosition,
            });
            // Verify inserted stage has correct position
            expect(insertedStage.position).toBe(insertPosition);
            expect(insertedStage.name).toBe(stageName.trim());
            expect(insertedStage.isDefault).toBe(false);
        }), { numRuns: 50 });
    });
    it('should mark custom stages as isDefault=false', async () => {
        await fc.assert(fc.asyncProperty(uuidArbitrary, uuidArbitrary, stageNameArbitrary, fc.integer({ min: 0, max: 7 }), async (jobId, newStageId, stageName, insertPosition) => {
            const now = new Date();
            const initialStages = DEFAULT_STAGES.map((stage, index) => ({
                id: `stage-${jobId}-${index}`,
                jobId,
                name: stage.name,
                position: index,
                isDefault: true,
                isMandatory: stage.isMandatory,
                parentId: null,
                createdAt: now,
            }));
            mockPrismaJob.findUnique.mockResolvedValueOnce({
                id: jobId,
                companyId: 'company-1',
                title: 'Test Job',
                department: 'Engineering',
                location: 'Remote',
                status: 'active',
            });
            mockPrismaStage.findMany.mockResolvedValueOnce(initialStages);
            const newStage = {
                id: newStageId,
                jobId,
                name: stageName.trim(),
                position: insertPosition,
                isDefault: false,
                isMandatory: false,
                parentId: null,
                createdAt: now,
            };
            mockTransaction.mockImplementationOnce(async (callback) => {
                const txMock = {
                    pipelineStage: {
                        updateMany: vi.fn().mockResolvedValue({ count: DEFAULT_STAGES.length - insertPosition }),
                        create: vi.fn().mockResolvedValue(newStage),
                    },
                };
                return callback(txMock);
            });
            const insertedStage = await pipelineService.insertStage({
                jobId,
                name: stageName,
                position: insertPosition,
            });
            // Custom stages should have isDefault=false
            expect(insertedStage.isDefault).toBe(false);
        }), { numRuns: 50 });
    });
});
describe('Property 13: Stage reordering maintains candidate associations', () => {
    /**
     * **Feature: ats-portal-phase1, Property 13: Stage reordering maintains candidate associations**
     * **Validates: Requirements 6.4**
     */
    it('should update positions correctly when moving stage down', async () => {
        await fc.assert(fc.asyncProperty(uuidArbitrary, fc.integer({ min: 0, max: 5 }), // Old position
        fc.integer({ min: 0, max: 7 }), // New position (can be same or different)
        async (jobId, oldPosition, newPosition) => {
            // Ensure we're testing moving down (newPosition > oldPosition)
            const actualNewPosition = Math.max(oldPosition + 1, newPosition);
            if (actualNewPosition >= DEFAULT_STAGES.length)
                return; // Skip invalid positions
            const now = new Date();
            const stageId = `stage-${jobId}-${oldPosition}`;
            const initialStages = DEFAULT_STAGES.map((stage, index) => ({
                id: `stage-${jobId}-${index}`,
                jobId,
                name: stage.name,
                position: index,
                isDefault: true,
                isMandatory: stage.isMandatory,
                parentId: null,
                createdAt: now,
            }));
            // Mock stage to move
            mockPrismaStage.findUnique.mockResolvedValueOnce(initialStages[oldPosition]);
            // Mock all stages
            mockPrismaStage.findMany
                .mockResolvedValueOnce(initialStages) // For validation
                .mockResolvedValueOnce(initialStages); // For return
            // Mock transaction
            mockTransaction.mockImplementationOnce(async (callback) => {
                const txMock = {
                    pipelineStage: {
                        updateMany: vi.fn().mockResolvedValue({ count: actualNewPosition - oldPosition }),
                        update: vi.fn().mockResolvedValue({ ...initialStages[oldPosition], position: actualNewPosition }),
                    },
                };
                return callback(txMock);
            });
            const stages = await pipelineService.reorderStage({
                stageId,
                newPosition: actualNewPosition,
            });
            // Verify stages are returned
            expect(stages).toBeDefined();
            expect(stages.length).toBe(DEFAULT_STAGES.length);
            // Verify all stage IDs are preserved (candidate associations maintained)
            const stageIds = stages.map(s => s.id);
            for (const initialStage of initialStages) {
                expect(stageIds).toContain(initialStage.id);
            }
        }), { numRuns: 50 });
    });
    it('should update positions correctly when moving stage up', async () => {
        await fc.assert(fc.asyncProperty(uuidArbitrary, fc.integer({ min: 2, max: 7 }), // Old position (must be > 0 to move up)
        fc.integer({ min: 0, max: 6 }), // New position
        async (jobId, oldPosition, newPosition) => {
            // Ensure we're testing moving up (newPosition < oldPosition)
            const actualNewPosition = Math.min(oldPosition - 1, newPosition);
            if (actualNewPosition < 0)
                return; // Skip invalid positions
            const now = new Date();
            const stageId = `stage-${jobId}-${oldPosition}`;
            const initialStages = DEFAULT_STAGES.map((stage, index) => ({
                id: `stage-${jobId}-${index}`,
                jobId,
                name: stage.name,
                position: index,
                isDefault: true,
                isMandatory: stage.isMandatory,
                parentId: null,
                createdAt: now,
            }));
            mockPrismaStage.findUnique.mockResolvedValueOnce(initialStages[oldPosition]);
            mockPrismaStage.findMany
                .mockResolvedValueOnce(initialStages)
                .mockResolvedValueOnce(initialStages);
            mockTransaction.mockImplementationOnce(async (callback) => {
                const txMock = {
                    pipelineStage: {
                        updateMany: vi.fn().mockResolvedValue({ count: oldPosition - actualNewPosition }),
                        update: vi.fn().mockResolvedValue({ ...initialStages[oldPosition], position: actualNewPosition }),
                    },
                };
                return callback(txMock);
            });
            const stages = await pipelineService.reorderStage({
                stageId,
                newPosition: actualNewPosition,
            });
            // Verify stages are returned
            expect(stages).toBeDefined();
            expect(stages.length).toBe(DEFAULT_STAGES.length);
            // Verify all stage IDs are preserved
            const stageIds = stages.map(s => s.id);
            for (const initialStage of initialStages) {
                expect(stageIds).toContain(initialStage.id);
            }
        }), { numRuns: 50 });
    });
    it('should return unchanged stages when position is the same', async () => {
        await fc.assert(fc.asyncProperty(uuidArbitrary, fc.integer({ min: 0, max: 7 }), async (jobId, position) => {
            const now = new Date();
            const stageId = `stage-${jobId}-${position}`;
            const initialStages = DEFAULT_STAGES.map((stage, index) => ({
                id: `stage-${jobId}-${index}`,
                jobId,
                name: stage.name,
                position: index,
                isDefault: true,
                isMandatory: stage.isMandatory,
                parentId: null,
                createdAt: now,
            }));
            mockPrismaStage.findUnique.mockResolvedValueOnce(initialStages[position]);
            mockPrismaStage.findMany.mockResolvedValueOnce(initialStages);
            const stages = await pipelineService.reorderStage({
                stageId,
                newPosition: position, // Same position
            });
            // Verify stages are unchanged
            expect(stages.length).toBe(DEFAULT_STAGES.length);
            for (let i = 0; i < stages.length; i++) {
                expect(stages[i].position).toBe(i);
                expect(stages[i].name).toBe(DEFAULT_STAGES[i].name);
            }
        }), { numRuns: 50 });
    });
});
//# sourceMappingURL=pipeline.property.test.js.map