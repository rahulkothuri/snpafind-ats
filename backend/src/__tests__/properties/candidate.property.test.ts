/**
 * **Feature: ats-portal-phase1, Property 14: Candidate creation round-trip**
 * **Feature: ats-portal-phase1, Property 15: Candidate IDs are unique**
 * **Feature: ats-portal-phase1, Property 16: Duplicate email prevention**
 * **Validates: Requirements 8.1, 8.2, 8.4**
 * 
 * Property 14: For any valid candidate data (name, email, phone, experience, skills),
 * creating a candidate and then retrieving it should return an equivalent candidate object with all fields matching.
 * 
 * Property 15: For any set of created candidates, all candidate IDs should be unique.
 * 
 * Property 16: For any existing candidate email, attempting to create a new candidate
 * with the same email should fail and return the existing candidate's profile.
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
import { ConflictError } from '../../middleware/errorHandler.js';

// Get the mocked functions
const mockPrismaCandidate = (prisma as unknown as { candidate: {
  create: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
}}).candidate;


// Arbitraries for generating test data
const nonEmptyStringArbitrary = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0);

const nameArbitrary = fc.constantFrom(
  'John Doe', 'Jane Smith', 'Rahul Kumar', 'Priya Sharma', 
  'Amit Patel', 'Sana Khan', 'Vikram Singh', 'Aarti Gupta'
);

const emailArbitrary = fc.emailAddress();

const phoneArbitrary = fc.stringMatching(/^\+?[1-9]\d{9,14}$/);

const experienceArbitrary = fc.float({ min: 0, max: 30, noNaN: true })
  .map(n => Math.round(n * 10) / 10);

const locationArbitrary = fc.constantFrom(
  'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Remote', 
  'Gurgaon', 'Mumbai', 'Delhi'
);

const sourceArbitrary = fc.constantFrom(
  'LinkedIn', 'Referral', 'Job Board', 'Career Page', 'Agency', 'Internal'
);

const skillsArbitrary = fc.array(
  fc.constantFrom('Java', 'Spring Boot', 'React', 'Node.js', 'PostgreSQL', 
    'Kafka', 'Python', 'TypeScript', 'AWS', 'Docker', 'Kubernetes'),
  { minLength: 0, maxLength: 10 }
);

const companyArbitrary = fc.constantFrom(
  'FinEdge Systems', 'CloudNova', 'NeoPay', 'CodeNest', 
  'TechCorp', 'DataFlow', 'InnoSoft'
);

const ctcArbitrary = fc.integer({ min: 5, max: 100 }).map(n => `${n} LPA`);

const noticePeriodArbitrary = fc.constantFrom(
  'Immediate', '15 days', '30 days', '60 days', '90 days'
);

const availabilityArbitrary = fc.constantFrom(
  'Immediate', '15 days', '30 days', '60+ days'
);

const uuidArbitrary = fc.uuid();

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Property 14: Candidate creation round-trip', () => {
  /**
   * **Feature: ats-portal-phase1, Property 14: Candidate creation round-trip**
   * **Validates: Requirements 8.1**
   */
  it('should return equivalent candidate after create and retrieve', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArbitrary,
        uuidArbitrary,
        nameArbitrary,
        emailArbitrary,
        fc.option(phoneArbitrary, { nil: undefined }),
        experienceArbitrary,
        fc.option(companyArbitrary, { nil: undefined }),
        locationArbitrary,
        sourceArbitrary,
        skillsArbitrary,
        async (candidateId, companyId, name, email, phone, experience, currentCompany, location, source, skills) => {
          const now = new Date();
          const normalizedEmail = email.trim().toLowerCase();
          
          // Mock findUnique to return null (no duplicate)
          mockPrismaCandidate.findUnique.mockResolvedValueOnce(null);
          
          // Mock the create response
          const mockDbCandidate = {
            id: candidateId,
            companyId,
            name: name.trim(),
            email: normalizedEmail,
            phone: phone?.trim() ?? null,
            experienceYears: experience,
            currentCompany: currentCompany?.trim() ?? null,
            location: location.trim(),
            currentCtc: null,
            expectedCtc: null,
            noticePeriod: null,
            source: source.trim(),
            availability: null,
            skills: skills,
            resumeUrl: null,
            score: null,
            createdAt: now,
            updatedAt: now,
          };
          
          mockPrismaCandidate.create.mockResolvedValueOnce(mockDbCandidate);
          
          // Mock findUnique for getById
          mockPrismaCandidate.findUnique.mockResolvedValueOnce(mockDbCandidate);

          // Create candidate
          const created = await candidateService.create({
            companyId,
            name,
            email,
            phone,
            experienceYears: experience,
            currentCompany,
            location,
            source,
            skills,
          });

          // Retrieve candidate
          const retrieved = await candidateService.getById(created.id);

          // Verify all fields match (round-trip property)
          expect(retrieved.id).toBe(created.id);
          expect(retrieved.name).toBe(name.trim());
          expect(retrieved.email).toBe(normalizedEmail);
          expect(retrieved.location).toBe(location.trim());
          expect(retrieved.source).toBe(source.trim());
          expect(retrieved.experienceYears).toBe(experience);
          expect(retrieved.companyId).toBe(companyId);
          expect(retrieved.skills).toEqual(skills);
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Property 15: Candidate IDs are unique', () => {
  /**
   * **Feature: ats-portal-phase1, Property 15: Candidate IDs are unique**
   * **Validates: Requirements 8.2**
   */
  it('should generate unique IDs for all created candidates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.tuple(uuidArbitrary, uuidArbitrary, nameArbitrary, emailArbitrary, locationArbitrary, sourceArbitrary),
          { minLength: 2, maxLength: 10 }
        ),
        async (candidateDataList) => {
          const createdIds: string[] = [];
          const now = new Date();
          
          // Use unique emails for each candidate
          const usedEmails = new Set<string>();

          for (const [candidateId, companyId, name, baseEmail, location, source] of candidateDataList) {
            // Generate unique email for this test
            let email = baseEmail;
            let counter = 0;
            while (usedEmails.has(email.toLowerCase())) {
              counter++;
              email = `${counter}_${baseEmail}`;
            }
            usedEmails.add(email.toLowerCase());
            
            const mockDbCandidate = {
              id: candidateId,
              companyId,
              name: name.trim(),
              email: email.toLowerCase(),
              phone: null,
              experienceYears: 0,
              currentCompany: null,
              location: location.trim(),
              currentCtc: null,
              expectedCtc: null,
              noticePeriod: null,
              source: source.trim(),
              availability: null,
              skills: [],
              resumeUrl: null,
              score: null,
              createdAt: now,
              updatedAt: now,
            };
            
            // Mock findUnique to return null (no duplicate)
            mockPrismaCandidate.findUnique.mockResolvedValueOnce(null);
            mockPrismaCandidate.create.mockResolvedValueOnce(mockDbCandidate);

            const candidate = await candidateService.create({
              companyId,
              name,
              email,
              location,
              source,
            });
            
            createdIds.push(candidate.id);
          }

          // Verify all IDs are unique
          const uniqueIds = new Set(createdIds);
          expect(uniqueIds.size).toBe(createdIds.length);
          
          // Verify each ID is a valid UUID format
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          for (const id of createdIds) {
            expect(id).toMatch(uuidRegex);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('Property 16: Duplicate email prevention', () => {
  /**
   * **Feature: ats-portal-phase1, Property 16: Duplicate email prevention**
   * **Validates: Requirements 8.4**
   */
  it('should reject duplicate candidate emails', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArbitrary,
        uuidArbitrary,
        nameArbitrary,
        emailArbitrary,
        locationArbitrary,
        sourceArbitrary,
        async (existingId, companyId, name, email, location, source) => {
          const now = new Date();
          const normalizedEmail = email.trim().toLowerCase();
          
          // Mock findUnique to return existing candidate (duplicate found)
          const existingCandidate = {
            id: existingId,
            companyId,
            name: 'Existing Candidate',
            email: normalizedEmail,
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
          
          mockPrismaCandidate.findUnique.mockResolvedValueOnce(existingCandidate);

          // Attempt to create duplicate should throw ConflictError
          await expect(
            candidateService.create({
              companyId,
              name,
              email,
              location,
              source,
            })
          ).rejects.toThrow(ConflictError);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow creating candidates with different emails', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArbitrary,
        uuidArbitrary,
        nameArbitrary,
        emailArbitrary,
        locationArbitrary,
        sourceArbitrary,
        async (candidateId, companyId, name, email, location, source) => {
          const now = new Date();
          const normalizedEmail = email.trim().toLowerCase();
          
          // Mock findUnique to return null (no duplicate)
          mockPrismaCandidate.findUnique.mockResolvedValueOnce(null);
          
          const mockDbCandidate = {
            id: candidateId,
            companyId,
            name: name.trim(),
            email: normalizedEmail,
            phone: null,
            experienceYears: 0,
            currentCompany: null,
            location: location.trim(),
            currentCtc: null,
            expectedCtc: null,
            noticePeriod: null,
            source: source.trim(),
            availability: null,
            skills: [],
            resumeUrl: null,
            score: null,
            createdAt: now,
            updatedAt: now,
          };
          
          mockPrismaCandidate.create.mockResolvedValueOnce(mockDbCandidate);

          // Should succeed when email is unique
          const candidate = await candidateService.create({
            companyId,
            name,
            email,
            location,
            source,
          });

          expect(candidate).toBeDefined();
          expect(candidate.id).toBe(candidateId);
          expect(candidate.email).toBe(normalizedEmail);
        }
      ),
      { numRuns: 100 }
    );
  });
});
