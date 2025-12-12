/**
 * **Feature: ats-portal-phase1, Property 17: Resume upload association**
 * **Feature: ats-portal-phase1, Property 18: Resume format validation**
 * **Validates: Requirements 10.1, 10.2**
 * 
 * Property 17: For any valid resume file uploaded for a candidate, the file should be stored
 * and the candidate's profile should contain a reference to the uploaded file.
 * 
 * Property 18: For any file upload, only files with valid formats (PDF, DOC, DOCX) and size
 * under 10MB should be accepted. Invalid files should be rejected with appropriate error messages.
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
import { validateResumeFile, ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '../../routes/candidate.routes.js';

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

const validExtensionArbitrary = fc.constantFrom('.pdf', '.doc', '.docx');
const invalidExtensionArbitrary = fc.constantFrom('.txt', '.jpg', '.png', '.exe', '.zip', '.html', '.js');

const validMimeTypeArbitrary = fc.constantFrom(
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
);
const invalidMimeTypeArbitrary = fc.constantFrom(
  'text/plain',
  'image/jpeg',
  'image/png',
  'application/zip',
  'text/html',
  'application/javascript'
);

const validFileSizeArbitrary = fc.integer({ min: 1, max: MAX_FILE_SIZE });
const invalidFileSizeArbitrary = fc.integer({ min: MAX_FILE_SIZE + 1, max: MAX_FILE_SIZE * 2 });

const filenameArbitrary = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => s.trim().length > 0 && !s.includes('/') && !s.includes('\\'));

beforeEach(() => {
  vi.clearAllMocks();
});


describe('Property 17: Resume upload association', () => {
  /**
   * **Feature: ats-portal-phase1, Property 17: Resume upload association**
   * **Validates: Requirements 10.1**
   */
  it('should associate uploaded resume with candidate profile', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArbitrary,
        uuidArbitrary,
        filenameArbitrary,
        validExtensionArbitrary,
        async (candidateId, companyId, filename, ext) => {
          const now = new Date();
          const resumeUrl = `/uploads/resumes/resume-${Date.now()}${ext}`;
          
          // Mock existing candidate
          const existingCandidate = {
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
          
          // Mock findUnique to return existing candidate
          mockPrismaCandidate.findUnique.mockResolvedValueOnce(existingCandidate);
          
          // Mock update to return candidate with resume URL
          const updatedCandidate = {
            ...existingCandidate,
            resumeUrl,
            updatedAt: new Date(),
          };
          mockPrismaCandidate.update.mockResolvedValueOnce(updatedCandidate);

          // Update resume URL
          const result = await candidateService.updateResumeUrl(candidateId, resumeUrl);

          // Verify resume URL is associated with candidate
          expect(result.resumeUrl).toBe(resumeUrl);
          expect(result.id).toBe(candidateId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve other candidate fields when updating resume', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArbitrary,
        uuidArbitrary,
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.emailAddress(),
        fc.float({ min: 0, max: 30, noNaN: true }),
        validExtensionArbitrary,
        async (candidateId, companyId, name, email, experience, ext) => {
          const now = new Date();
          const resumeUrl = `/uploads/resumes/resume-${Date.now()}${ext}`;
          
          const existingCandidate = {
            id: candidateId,
            companyId,
            name: name.trim(),
            email: email.toLowerCase(),
            phone: '+1234567890',
            experienceYears: experience,
            currentCompany: 'TechCorp',
            location: 'Bangalore',
            currentCtc: '10 LPA',
            expectedCtc: '15 LPA',
            noticePeriod: '30 days',
            source: 'LinkedIn',
            availability: 'Immediate',
            skills: ['Java', 'React'],
            resumeUrl: null,
            score: 85,
            createdAt: now,
            updatedAt: now,
          };
          
          mockPrismaCandidate.findUnique.mockResolvedValueOnce(existingCandidate);
          
          const updatedCandidate = {
            ...existingCandidate,
            resumeUrl,
            updatedAt: new Date(),
          };
          mockPrismaCandidate.update.mockResolvedValueOnce(updatedCandidate);

          const result = await candidateService.updateResumeUrl(candidateId, resumeUrl);

          // Verify all other fields are preserved
          expect(result.name).toBe(name.trim());
          expect(result.email).toBe(email.toLowerCase());
          expect(result.experienceYears).toBe(experience);
          expect(result.resumeUrl).toBe(resumeUrl);
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Property 18: Resume format validation', () => {
  /**
   * **Feature: ats-portal-phase1, Property 18: Resume format validation**
   * **Validates: Requirements 10.2**
   */
  it('should accept valid file formats (PDF, DOC, DOCX)', async () => {
    await fc.assert(
      fc.asyncProperty(
        filenameArbitrary,
        validExtensionArbitrary,
        validMimeTypeArbitrary,
        validFileSizeArbitrary,
        async (filename, ext, mimetype, size) => {
          const file = {
            originalname: `${filename}${ext}`,
            mimetype,
            size,
          };

          const result = validateResumeFile(file);
          
          expect(result.valid).toBe(true);
          expect(result.error).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject invalid file extensions', async () => {
    await fc.assert(
      fc.asyncProperty(
        filenameArbitrary,
        invalidExtensionArbitrary,
        validMimeTypeArbitrary,
        validFileSizeArbitrary,
        async (filename, ext, mimetype, size) => {
          const file = {
            originalname: `${filename}${ext}`,
            mimetype,
            size,
          };

          const result = validateResumeFile(file);
          
          expect(result.valid).toBe(false);
          expect(result.error).toContain('Invalid file extension');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject invalid MIME types', async () => {
    await fc.assert(
      fc.asyncProperty(
        filenameArbitrary,
        validExtensionArbitrary,
        invalidMimeTypeArbitrary,
        validFileSizeArbitrary,
        async (filename, ext, mimetype, size) => {
          const file = {
            originalname: `${filename}${ext}`,
            mimetype,
            size,
          };

          const result = validateResumeFile(file);
          
          expect(result.valid).toBe(false);
          expect(result.error).toContain('Invalid file type');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject files exceeding 10MB', async () => {
    await fc.assert(
      fc.asyncProperty(
        filenameArbitrary,
        validExtensionArbitrary,
        validMimeTypeArbitrary,
        invalidFileSizeArbitrary,
        async (filename, ext, mimetype, size) => {
          const file = {
            originalname: `${filename}${ext}`,
            mimetype,
            size,
          };

          const result = validateResumeFile(file);
          
          expect(result.valid).toBe(false);
          expect(result.error).toContain('File size exceeds');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate all allowed extensions are in the list', () => {
    // Verify the allowed extensions match requirements
    expect(ALLOWED_EXTENSIONS).toContain('.pdf');
    expect(ALLOWED_EXTENSIONS).toContain('.doc');
    expect(ALLOWED_EXTENSIONS).toContain('.docx');
    expect(ALLOWED_EXTENSIONS.length).toBe(3);
  });

  it('should validate max file size is 10MB', () => {
    expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
  });

  it('should validate all allowed MIME types are in the list', () => {
    expect(ALLOWED_MIME_TYPES).toContain('application/pdf');
    expect(ALLOWED_MIME_TYPES).toContain('application/msword');
    expect(ALLOWED_MIME_TYPES).toContain('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(ALLOWED_MIME_TYPES.length).toBe(3);
  });
});
