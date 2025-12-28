/**
 * **Feature: ats-portal-phase1, Property 21: Stage change updates timestamp and creates activity**
 * **Validates: Requirements 24.1, 24.2**
 *
 * Property 21: For any candidate stage change, the candidate's current stage should be updated,
 * a timestamp should be recorded, and an activity entry should be added to the timeline.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
// Default pipeline stages
const DEFAULT_STAGES = [
    'Queue', 'Applied', 'Screening', 'Shortlisted',
    'Interview', 'Selected', 'Offer', 'Hired', 'Rejected'
];
// Mock Prisma client - must be before imports
vi.mock('../../lib/prisma.js', () => {
    const mockPrismaJobCandidate = {
        findUnique: vi.fn(),
        update: vi.fn(),
    };
    const mockPrismaCandidate = {
        findUnique: vi.fn(),
        update: vi.fn(),
    };
    const mockPrismaCandidateActivity = {
        create: vi.fn(),
        findMany: vi.fn(),
    };
    const mockPrismaStageHistory = {
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
    };
    return {
        default: {
            jobCandidate: mockPrismaJobCandidate,
            candidate: mockPrismaCandidate,
            candidateActivity: mockPrismaCandidateActivity,
            stageHistory: mockPrismaStageHistory,
            $transaction: vi.fn(),
        },
        prisma: {
            jobCandidate: mockPrismaJobCandidate,
            candidate: mockPrismaCandidate,
            candidateActivity: mockPrismaCandidateActivity,
            stageHistory: mockPrismaStageHistory,
            $transaction: vi.fn(),
        },
    };
});
// Import after mocking
import candidateService from '../../services/candidate.service.js';
import prisma from '../../lib/prisma.js';
// Get the mocked functions
const mockPrismaJobCandidate = prisma.jobCandidate;
const mockTransaction = prisma.$transaction;
// Arbitraries for generating test data
const uuidArbitrary = fc.uuid();
const nonEmptyStringArbitrary = fc.string({ minLength: 1, maxLength: 50 })
    .filter(s => s.trim().length > 0);
const stageIndexArbitrary = fc.integer({ min: 0, max: DEFAULT_STAGES.length - 2 }); // Exclude Rejected for normal moves
const rejectionReasonArbitrary = fc.string({ minLength: 5, maxLength: 200 })
    .filter(s => s.trim().length >= 5);
beforeEach(() => {
    vi.clearAllMocks();
});
describe('Property 21: Stage change updates timestamp and creates activity', () => {
    /**
     * **Feature: ats-portal-phase1, Property 21: Stage change updates timestamp and creates activity**
     * **Validates: Requirements 24.1, 24.2**
     */
    it('should update stage and create activity entry for any valid stage change', async () => {
        await fc.assert(fc.asyncProperty(uuidArbitrary, // jobCandidateId
        uuidArbitrary, // candidateId
        uuidArbitrary, // jobId
        stageIndexArbitrary, // fromStageIndex
        stageIndexArbitrary, // toStageIndex
        async (jobCandidateId, candidateId, jobId, fromStageIndex, toStageIndex) => {
            // Ensure we're moving to a different stage
            const actualToIndex = fromStageIndex === toStageIndex
                ? (toStageIndex + 1) % (DEFAULT_STAGES.length - 1)
                : toStageIndex;
            const now = new Date();
            const fromStageId = `stage-${jobId}-${fromStageIndex}`;
            const toStageId = `stage-${jobId}-${actualToIndex}`;
            const fromStageName = DEFAULT_STAGES[fromStageIndex];
            const toStageName = DEFAULT_STAGES[actualToIndex];
            // Create mock pipeline stages
            const mockStages = DEFAULT_STAGES.map((name, index) => ({
                id: `stage-${jobId}-${index}`,
                jobId,
                name,
                position: index,
                isDefault: true,
                createdAt: now,
            }));
            // Mock job candidate with current stage and job
            const mockJobCandidate = {
                id: jobCandidateId,
                jobId,
                candidateId,
                currentStageId: fromStageId,
                appliedAt: now,
                updatedAt: now,
                currentStage: mockStages[fromStageIndex],
                candidate: {
                    id: candidateId,
                    name: 'Test Candidate',
                    email: 'test@example.com',
                },
                job: {
                    id: jobId,
                    title: 'Test Job',
                    pipelineStages: mockStages,
                },
            };
            mockPrismaJobCandidate.findUnique.mockResolvedValueOnce(mockJobCandidate);
            // Track what was created in the transaction
            let createdActivity = null;
            let updatedJobCandidate = null;
            mockTransaction.mockImplementationOnce(async (callback) => {
                const txMock = {
                    jobCandidate: {
                        findUnique: vi.fn().mockResolvedValue(mockJobCandidate),
                        update: vi.fn().mockImplementation(async (args) => {
                            updatedJobCandidate = {
                                ...mockJobCandidate,
                                currentStageId: args.data.currentStageId,
                                updatedAt: new Date(),
                            };
                            return updatedJobCandidate;
                        }),
                    },
                    candidateActivity: {
                        create: vi.fn().mockImplementation(async (args) => {
                            createdActivity = {
                                id: 'activity-1',
                                ...args.data,
                                createdAt: new Date(),
                            };
                            return createdActivity;
                        }),
                    },
                    stageHistory: {
                        findFirst: vi.fn().mockResolvedValue(null), // No previous stage history entry
                        create: vi.fn().mockImplementation(async (args) => ({
                            id: 'stage-history-1',
                            ...args.data,
                            user: null,
                        })),
                        update: vi.fn().mockResolvedValue(null),
                    },
                };
                return callback(txMock);
            });
            const result = await candidateService.changeStage({
                jobCandidateId,
                newStageId: toStageId,
            });
            // Verify stage was updated (Requirements 24.1)
            expect(result.jobCandidate.currentStageId).toBe(toStageId);
            // Verify activity was created (Requirements 24.2)
            expect(result.activity).toBeDefined();
            expect(result.activity.activityType).toBe('stage_change');
            expect(result.activity.candidateId).toBe(candidateId);
            expect(result.activity.jobCandidateId).toBe(jobCandidateId);
            // Verify activity description contains stage names
            expect(result.activity.description).toContain(fromStageName);
            expect(result.activity.description).toContain(toStageName);
            // Verify activity metadata contains stage information
            expect(result.activity.metadata).toBeDefined();
            expect(result.activity.metadata.fromStageId).toBe(fromStageId);
            expect(result.activity.metadata.toStageId).toBe(toStageId);
            expect(result.activity.metadata.fromStageName).toBe(fromStageName);
            expect(result.activity.metadata.toStageName).toBe(toStageName);
            // Verify timestamp was recorded
            expect(result.activity.createdAt).toBeDefined();
        }), { numRuns: 100 });
    });
    it('should require rejection reason when moving to Rejected stage', async () => {
        await fc.assert(fc.asyncProperty(uuidArbitrary, uuidArbitrary, uuidArbitrary, stageIndexArbitrary, async (jobCandidateId, candidateId, jobId, fromStageIndex) => {
            const now = new Date();
            const fromStageId = `stage-${jobId}-${fromStageIndex}`;
            const rejectedStageIndex = DEFAULT_STAGES.indexOf('Rejected');
            const rejectedStageId = `stage-${jobId}-${rejectedStageIndex}`;
            const mockStages = DEFAULT_STAGES.map((name, index) => ({
                id: `stage-${jobId}-${index}`,
                jobId,
                name,
                position: index,
                isDefault: true,
                createdAt: now,
            }));
            const mockJobCandidate = {
                id: jobCandidateId,
                jobId,
                candidateId,
                currentStageId: fromStageId,
                appliedAt: now,
                updatedAt: now,
                currentStage: mockStages[fromStageIndex],
                candidate: {
                    id: candidateId,
                    name: 'Test Candidate',
                    email: 'test@example.com',
                },
                job: {
                    id: jobId,
                    title: 'Test Job',
                    pipelineStages: mockStages,
                },
            };
            mockPrismaJobCandidate.findUnique.mockResolvedValueOnce(mockJobCandidate);
            // Attempt to move to Rejected without reason should fail
            await expect(candidateService.changeStage({
                jobCandidateId,
                newStageId: rejectedStageId,
            })).rejects.toThrow();
        }), { numRuns: 50 });
    });
    it('should accept rejection reason and include it in activity when moving to Rejected', async () => {
        await fc.assert(fc.asyncProperty(uuidArbitrary, uuidArbitrary, uuidArbitrary, stageIndexArbitrary, rejectionReasonArbitrary, async (jobCandidateId, candidateId, jobId, fromStageIndex, rejectionReason) => {
            const now = new Date();
            const fromStageId = `stage-${jobId}-${fromStageIndex}`;
            const rejectedStageIndex = DEFAULT_STAGES.indexOf('Rejected');
            const rejectedStageId = `stage-${jobId}-${rejectedStageIndex}`;
            const fromStageName = DEFAULT_STAGES[fromStageIndex];
            const mockStages = DEFAULT_STAGES.map((name, index) => ({
                id: `stage-${jobId}-${index}`,
                jobId,
                name,
                position: index,
                isDefault: true,
                createdAt: now,
            }));
            const mockJobCandidate = {
                id: jobCandidateId,
                jobId,
                candidateId,
                currentStageId: fromStageId,
                appliedAt: now,
                updatedAt: now,
                currentStage: mockStages[fromStageIndex],
                candidate: {
                    id: candidateId,
                    name: 'Test Candidate',
                    email: 'test@example.com',
                },
                job: {
                    id: jobId,
                    title: 'Test Job',
                    pipelineStages: mockStages,
                },
            };
            mockPrismaJobCandidate.findUnique.mockResolvedValueOnce(mockJobCandidate);
            mockTransaction.mockImplementationOnce(async (callback) => {
                const txMock = {
                    jobCandidate: {
                        findUnique: vi.fn().mockResolvedValue(mockJobCandidate),
                        update: vi.fn().mockResolvedValue({
                            ...mockJobCandidate,
                            currentStageId: rejectedStageId,
                            updatedAt: new Date(),
                        }),
                    },
                    candidateActivity: {
                        create: vi.fn().mockImplementation(async (args) => ({
                            id: 'activity-1',
                            ...args.data,
                            createdAt: new Date(),
                        })),
                    },
                    stageHistory: {
                        findFirst: vi.fn().mockResolvedValue(null),
                        create: vi.fn().mockImplementation(async (args) => ({
                            id: 'stage-history-1',
                            ...args.data,
                            user: null,
                        })),
                        update: vi.fn().mockResolvedValue(null),
                    },
                };
                return callback(txMock);
            });
            const result = await candidateService.changeStage({
                jobCandidateId,
                newStageId: rejectedStageId,
                rejectionReason,
            });
            // Verify stage was updated to Rejected
            expect(result.jobCandidate.currentStageId).toBe(rejectedStageId);
            // Verify activity contains rejection reason
            expect(result.activity.description).toContain(rejectionReason);
            expect(result.activity.metadata.rejectionReason).toBe(rejectionReason);
        }), { numRuns: 50 });
    });
    it('should fail when job candidate does not exist', async () => {
        await fc.assert(fc.asyncProperty(uuidArbitrary, uuidArbitrary, async (jobCandidateId, newStageId) => {
            mockPrismaJobCandidate.findUnique.mockResolvedValueOnce(null);
            await expect(candidateService.changeStage({
                jobCandidateId,
                newStageId,
            })).rejects.toThrow();
        }), { numRuns: 20 });
    });
    it('should fail when new stage does not belong to the job pipeline', async () => {
        await fc.assert(fc.asyncProperty(uuidArbitrary, uuidArbitrary, uuidArbitrary, uuidArbitrary, // Invalid stage ID
        stageIndexArbitrary, async (jobCandidateId, candidateId, jobId, invalidStageId, fromStageIndex) => {
            const now = new Date();
            const fromStageId = `stage-${jobId}-${fromStageIndex}`;
            const mockStages = DEFAULT_STAGES.map((name, index) => ({
                id: `stage-${jobId}-${index}`,
                jobId,
                name,
                position: index,
                isDefault: true,
                createdAt: now,
            }));
            const mockJobCandidate = {
                id: jobCandidateId,
                jobId,
                candidateId,
                currentStageId: fromStageId,
                appliedAt: now,
                updatedAt: now,
                currentStage: mockStages[fromStageIndex],
                candidate: {
                    id: candidateId,
                    name: 'Test Candidate',
                    email: 'test@example.com',
                },
                job: {
                    id: jobId,
                    title: 'Test Job',
                    pipelineStages: mockStages,
                },
            };
            mockPrismaJobCandidate.findUnique.mockResolvedValueOnce(mockJobCandidate);
            // Using an invalid stage ID that doesn't exist in the pipeline
            await expect(candidateService.changeStage({
                jobCandidateId,
                newStageId: invalidStageId,
            })).rejects.toThrow();
        }), { numRuns: 20 });
    });
});
//# sourceMappingURL=stage-movement.property.test.js.map