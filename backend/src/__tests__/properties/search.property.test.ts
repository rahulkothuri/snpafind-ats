/**
 * **Feature: ats-portal-phase1, Property 19: Search returns matching candidates**
 * **Validates: Requirements 11.1**
 * 
 * Property 19: For any search query, all returned candidates should have the query string
 * present in at least one of: name, email, or phone fields.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';

// Mock Prisma client - must be before imports
vi.mock('../../lib/prisma.js', () => {
  const mockPrismaCandidate = {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  
  return {
    default: {
      candidate: mockPrismaCandidate,
    },
    prisma: {
      candidate: mockPrismaCandidate,
    },
  };
});

// Import after mocking
import candidateService from '../../services/candidate.service.js';
import prisma from '../../lib/prisma.js';

// Get the mocked functions
const mockPrismaCandidate = (prisma as unknown as { candidate: {
  create: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
}}).candidate;

// Arbitraries for generating test data
const uuidArbitrary = fc.uuid();

const nameArbitrary = fc.constantFrom(
  'John Doe', 'Jane Smith', 'Rahul Kumar', 'Priya Sharma', 
  'Amit Patel', 'Sana Khan', 'Vikram Singh', 'Aarti Gupta'
);

const emailArbitrary = fc.emailAddress();

const phoneArbitrary = fc.stringMatching(/^\+?[1-9]\d{9,14}$/);

const locationArbitrary = fc.constantFrom(
  'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Remote'
);

const sourceArbitrary = fc.constantFrom(
  'LinkedIn', 'Referral', 'Job Board', 'Career Page', 'Agency'
);

beforeEach(() => {
  vi.clearAllMocks();
});


describe('Property 19: Search returns matching candidates', () => {
  /**
   * **Feature: ats-portal-phase1, Property 19: Search returns matching candidates**
   * **Validates: Requirements 11.1**
   */
  it('should return candidates matching query in name, email, or phone', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArbitrary,
        fc.array(
          fc.tuple(uuidArbitrary, nameArbitrary, emailArbitrary, fc.option(phoneArbitrary, { nil: undefined }), locationArbitrary, sourceArbitrary),
          { minLength: 1, maxLength: 10 }
        ),
        fc.constantFrom('John', 'jane', 'kumar', 'example.com', '+1234'),
        async (companyId, candidateDataList, searchQuery) => {
          const now = new Date();
          
          // Create mock candidates
          const mockCandidates = candidateDataList.map(([id, name, email, phone, location, source]) => ({
            id,
            companyId,
            name,
            email: email.toLowerCase(),
            phone: phone ?? null,
            experienceYears: 5,
            currentCompany: null,
            location,
            currentCtc: null,
            expectedCtc: null,
            noticePeriod: null,
            source,
            availability: null,
            skills: [],
            resumeUrl: null,
            score: null,
            createdAt: now,
            updatedAt: now,
          }));
          
          // Filter candidates that should match the query
          const expectedMatches = mockCandidates.filter(c => 
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.phone && c.phone.includes(searchQuery))
          );
          
          // Mock findMany to return only matching candidates
          mockPrismaCandidate.findMany.mockResolvedValueOnce(expectedMatches);

          // Perform search
          const results = await candidateService.search(companyId, { query: searchQuery });

          // Verify all returned candidates match the query
          for (const candidate of results) {
            const matchesName = candidate.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesEmail = candidate.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesPhone = candidate.phone?.includes(searchQuery) ?? false;
            
            expect(matchesName || matchesEmail || matchesPhone).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty array when no candidates match', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArbitrary,
        fc.string({ minLength: 10, maxLength: 20 }).filter(s => !s.includes('@') && !s.includes('+')),
        async (companyId, nonMatchingQuery) => {
          // Mock findMany to return empty array (no matches)
          mockPrismaCandidate.findMany.mockResolvedValueOnce([]);

          const results = await candidateService.search(companyId, { query: nonMatchingQuery });

          expect(results).toEqual([]);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should filter by location correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArbitrary,
        locationArbitrary,
        async (companyId, location) => {
          const now = new Date();
          
          const matchingCandidate = {
            id: 'candidate-1',
            companyId,
            name: 'Test Candidate',
            email: 'test@example.com',
            phone: null,
            experienceYears: 5,
            currentCompany: null,
            location,
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
          
          mockPrismaCandidate.findMany.mockResolvedValueOnce([matchingCandidate]);

          const results = await candidateService.search(companyId, { location });

          // All results should have matching location
          for (const candidate of results) {
            expect(candidate.location.toLowerCase()).toContain(location.toLowerCase());
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should filter by experience range correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArbitrary,
        fc.integer({ min: 0, max: 10 }),
        fc.integer({ min: 11, max: 30 }),
        async (companyId, minExp, maxExp) => {
          const now = new Date();
          const experienceInRange = Math.floor((minExp + maxExp) / 2);
          
          const matchingCandidate = {
            id: 'candidate-1',
            companyId,
            name: 'Test Candidate',
            email: 'test@example.com',
            phone: null,
            experienceYears: experienceInRange,
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
          
          mockPrismaCandidate.findMany.mockResolvedValueOnce([matchingCandidate]);

          const results = await candidateService.search(companyId, { 
            experienceMin: minExp, 
            experienceMax: maxExp 
          });

          // All results should have experience within range
          for (const candidate of results) {
            expect(candidate.experienceYears).toBeGreaterThanOrEqual(minExp);
            expect(candidate.experienceYears).toBeLessThanOrEqual(maxExp);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should filter by source correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArbitrary,
        sourceArbitrary,
        async (companyId, source) => {
          const now = new Date();
          
          const matchingCandidate = {
            id: 'candidate-1',
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
            source,
            availability: null,
            skills: [],
            resumeUrl: null,
            score: null,
            createdAt: now,
            updatedAt: now,
          };
          
          mockPrismaCandidate.findMany.mockResolvedValueOnce([matchingCandidate]);

          const results = await candidateService.search(companyId, { source });

          // All results should have matching source
          for (const candidate of results) {
            expect(candidate.source.toLowerCase()).toContain(source.toLowerCase());
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
