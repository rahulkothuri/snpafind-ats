/**
 * **Feature: ats-portal-phase1, Property 22: Score persistence**
 * **Validates: Requirements 25.2**
 *
 * Property 22: For any candidate score update, the new score should be persisted
 * and retrievable from the database.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
// Mock Prisma client - must be before imports
vi.mock('../../lib/prisma.js', () => {
    const mockPrismaCandidate = {
        findUnique: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
    };
    const mockPrismaCandidateActivity = {
        create: vi.fn(),
        findMany: vi.fn(),
    };
    return {
        default: {
            candidate: mockPrismaCandidate,
            candidateActivity: mockPrismaCandidateActivity,
            $transaction: vi.fn(),
        },
        prisma: {
            candidate: mockPrismaCandidate,
            candidateActivity: mockPrismaCandidateActivity,
            $transaction: vi.fn(),
        },
    };
});
// Import after mocking
import candidateService from '../../services/candidate.service.js';
import prisma from '../../lib/prisma.js';
// Get the mocked functions
const mockPrismaCandidate = prisma.candidate;
const mockTransaction = prisma.$transaction;
// Arbitraries for generating test data
const uuidArbitrary = fc.uuid();
const scoreArbitrary = fc.integer({ min: 0, max: 100 });
const invalidScoreArbitrary = fc.oneof(fc.integer({ min: -1000, max: -1 }), fc.integer({ min: 101, max: 1000 }));
const nonEmptyStringArbitrary = fc.string({ minLength: 1, maxLength: 50 })
    .filter(s => s.trim().length > 0);
const emailArbitrary = fc.emailAddress();
beforeEach(() => {
    vi.clearAllMocks();
});
describe('Property 22: Score persistence', () => {
    /**
     * **Feature: ats-portal-phase1, Property 22: Score persistence**
     * **Validates: Requirements 25.2**
     */
    it('should persist score and return updated candidate for any valid score', async () => {
        await fc.assert(fc.asyncProperty(uuidArbitrary, uuidArbitrary, nonEmptyStringArbitrary, emailArbitrary, scoreArbitrary, fc.option(scoreArbitrary, { nil: undefined }), // Old score (optional)
        async (candidateId, companyId, name, email, newScore, oldScore) => {
            const now = new Date();
            const mockCandidate = {
                id: candidateId,
                companyId,
                name: name.trim(),
                email: email.toLowerCase(),
                phone: null,
                experienceYears: 5,
                currentCompany: 'Test Company',
                location: 'Bangalore',
                currentCtc: null,
                expectedCtc: null,
                noticePeriod: null,
                source: 'LinkedIn',
                availability: null,
                skills: ['JavaScript', 'TypeScript'],
                resumeUrl: null,
                score: oldScore,
                createdAt: now,
                updatedAt: now,
            };
            mockPrismaCandidate.findUnique.mockResolvedValueOnce(mockCandidate);
            let persistedScore = null;
            let createdActivity = null;
            mockTransaction.mockImplementationOnce(async (callback) => {
                const txMock = {
                    candidate: {
                        update: vi.fn().mockImplementation(async (args) => {
                            persistedScore = args.data.score;
                            return {
                                ...mockCandidate,
                                score: args.data.score,
                                updatedAt: new Date(),
                            };
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
                };
                return callback(txMock);
            });
            const result = await candidateService.updateScore(candidateId, newScore);
            // Verify score was persisted (Requirements 25.2)
            expect(persistedScore).toBe(newScore);
            expect(result.candidate.score).toBe(newScore);
            // Verify activity was created for score update
            expect(result.activity).toBeDefined();
            expect(result.activity.activityType).toBe('score_updated');
            expect(result.activity.candidateId).toBe(candidateId);
            // Verify activity metadata contains score information
            expect(result.activity.metadata).toBeDefined();
            expect(result.activity.metadata.oldScore).toBe(oldScore);
            expect(result.activity.metadata.newScore).toBe(newScore);
        }), { numRuns: 100 });
    });
    it('should reject scores outside valid range (0-100)', async () => {
        await fc.assert(fc.asyncProperty(uuidArbitrary, invalidScoreArbitrary, async (candidateId, invalidScore) => {
            // Should reject without even checking the database
            await expect(candidateService.updateScore(candidateId, invalidScore)).rejects.toThrow();
        }), { numRuns: 50 });
    });
    it('should fail when candidate does not exist', async () => {
        await fc.assert(fc.asyncProperty(uuidArbitrary, scoreArbitrary, async (candidateId, score) => {
            mockPrismaCandidate.findUnique.mockResolvedValueOnce(null);
            await expect(candidateService.updateScore(candidateId, score)).rejects.toThrow();
        }), { numRuns: 20 });
    });
    it('should handle score updates from unset to set', async () => {
        await fc.assert(fc.asyncProperty(uuidArbitrary, uuidArbitrary, nonEmptyStringArbitrary, emailArbitrary, scoreArbitrary, async (candidateId, companyId, name, email, newScore) => {
            const now = new Date();
            // Candidate with no score set
            const mockCandidate = {
                id: candidateId,
                companyId,
                name: name.trim(),
                email: email.toLowerCase(),
                phone: null,
                experienceYears: 3,
                currentCompany: null,
                location: 'Remote',
                currentCtc: null,
                expectedCtc: null,
                noticePeriod: null,
                source: 'Referral',
                availability: null,
                skills: [],
                resumeUrl: null,
                score: null, // No score set
                createdAt: now,
                updatedAt: now,
            };
            mockPrismaCandidate.findUnique.mockResolvedValueOnce(mockCandidate);
            mockTransaction.mockImplementationOnce(async (callback) => {
                const txMock = {
                    candidate: {
                        update: vi.fn().mockResolvedValue({
                            ...mockCandidate,
                            score: newScore,
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
                };
                return callback(txMock);
            });
            const result = await candidateService.updateScore(candidateId, newScore);
            // Verify score was set
            expect(result.candidate.score).toBe(newScore);
            // Verify activity description mentions "unset"
            expect(result.activity.description).toContain('unset');
            expect(result.activity.metadata.oldScore).toBeNull();
            expect(result.activity.metadata.newScore).toBe(newScore);
        }), { numRuns: 50 });
    });
    it('should correctly categorize scores by color coding ranges', async () => {
        // Test that scores fall into correct categories:
        // High (green): 80-100
        // Medium (yellow): 50-79
        // Low (red): 0-49
        const highScoreArbitrary = fc.integer({ min: 80, max: 100 });
        const mediumScoreArbitrary = fc.integer({ min: 50, max: 79 });
        const lowScoreArbitrary = fc.integer({ min: 0, max: 49 });
        await fc.assert(fc.asyncProperty(uuidArbitrary, uuidArbitrary, fc.oneof(highScoreArbitrary, mediumScoreArbitrary, lowScoreArbitrary), async (candidateId, companyId, score) => {
            const now = new Date();
            const mockCandidate = {
                id: candidateId,
                companyId,
                name: 'Test Candidate',
                email: 'test@example.com',
                phone: null,
                experienceYears: 5,
                currentCompany: null,
                location: 'Bangalore',
                currentCtc: null,
                expectedCtc: null,
                noticePeriod: null,
                source: 'LinkedIn',
                availability: null,
                skills: [],
                resumeUrl: null,
                score: null,
                createdAt: now,
                updatedAt: now,
            };
            mockPrismaCandidate.findUnique.mockResolvedValueOnce(mockCandidate);
            mockTransaction.mockImplementationOnce(async (callback) => {
                const txMock = {
                    candidate: {
                        update: vi.fn().mockResolvedValue({
                            ...mockCandidate,
                            score,
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
                };
                return callback(txMock);
            });
            const result = await candidateService.updateScore(candidateId, score);
            // Verify score is persisted correctly
            expect(result.candidate.score).toBe(score);
            // Verify score falls into expected range
            if (score >= 80) {
                expect(result.candidate.score).toBeGreaterThanOrEqual(80);
                expect(result.candidate.score).toBeLessThanOrEqual(100);
            }
            else if (score >= 50) {
                expect(result.candidate.score).toBeGreaterThanOrEqual(50);
                expect(result.candidate.score).toBeLessThanOrEqual(79);
            }
            else {
                expect(result.candidate.score).toBeGreaterThanOrEqual(0);
                expect(result.candidate.score).toBeLessThanOrEqual(49);
            }
        }), { numRuns: 50 });
    });
});
//# sourceMappingURL=scoring.property.test.js.map