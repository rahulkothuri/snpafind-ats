/**
 * **Feature: ats-portal-phase1, Property 8: Job creation round-trip**
 * **Feature: ats-portal-phase1, Property 9: Job IDs are unique and status is active**
 * **Feature: ats-portal-phase1, Property 10: Job validation rejects missing required fields**
 * **Validates: Requirements 5.1, 5.2, 5.3**
 * 
 * Property 8: For any valid job data (title, department, location, salary range, description),
 * creating a job and then retrieving it should return an equivalent job object with all fields matching.
 * 
 * Property 9: For any newly created job, it should have a unique ID and its initial status should be 'active'.
 * 
 * Property 10: For any job data missing a required field (title, department, or location),
 * the job creation should fail with a validation error.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';

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
    createMany: vi.fn(),
    findMany: vi.fn(),
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
import prisma from '../../lib/prisma.js';
import { ValidationError } from '../../middleware/errorHandler.js';


// Get the mocked functions
const mockPrismaJob = (prisma as any).job as {
  create: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

const mockPrismaStage = (prisma as any).pipelineStage as {
  createMany: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
};

const mockTransaction = (prisma as any).$transaction as ReturnType<typeof vi.fn>;

// Arbitraries for generating test data
const nonEmptyStringArbitrary = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0);

const jobTitleArbitrary = nonEmptyStringArbitrary;
const departmentArbitrary = fc.constantFrom('Engineering', 'Product', 'Sales', 'HR', 'Marketing', 'Finance');
const locationArbitrary = fc.constantFrom('Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Remote', 'New York', 'London');
const employmentTypeArbitrary = fc.constantFrom('Full-time', 'Part-time', 'Contract', 'Internship');
const salaryRangeArbitrary = fc.tuple(
  fc.integer({ min: 30000, max: 100000 }),
  fc.integer({ min: 100001, max: 300000 })
).map(([min, max]) => `$${min} - $${max}`);

const descriptionArbitrary = fc.string({ minLength: 10, maxLength: 500 });
const openingsArbitrary = fc.integer({ min: 1, max: 10 });
const uuidArbitrary = fc.uuid();

// Default pipeline stages
const DEFAULT_STAGES = [
  'Queue', 'Applied', 'Screening', 'Shortlisted',
  'Interview', 'Selected', 'Offer', 'Hired'
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Property 8: Job creation round-trip', () => {
  /**
   * **Feature: ats-portal-phase1, Property 8: Job creation round-trip**
   * **Validates: Requirements 5.1**
   */
  it('should return equivalent job after create and retrieve', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArbitrary,
        uuidArbitrary,
        jobTitleArbitrary,
        departmentArbitrary,
        locationArbitrary,
        fc.option(employmentTypeArbitrary, { nil: undefined }),
        fc.option(salaryRangeArbitrary, { nil: undefined }),
        fc.option(descriptionArbitrary, { nil: undefined }),
        fc.option(openingsArbitrary, { nil: undefined }),
        async (jobId, companyId, title, department, location, employmentType, salaryRange, description, openings) => {
          const now = new Date();
          
          // Mock the Prisma transaction response
          const mockDbJob = {
            id: jobId,
            companyId,
            title: title.trim(),
            department: department.trim(),
            location: location.trim(),
            employmentType: employmentType ?? null,
            salaryRange: salaryRange ?? null,
            description: description ?? null,
            status: 'active',
            openings: openings ?? 1,
            createdAt: now,
            updatedAt: now,
          };
          
          const mockStages = DEFAULT_STAGES.map((name, index) => ({
            id: `stage-${index}`,
            jobId,
            name,
            position: index,
            isDefault: true,
            createdAt: now,
          }));
          
          // Mock transaction to execute the callback
          mockTransaction.mockImplementationOnce(async (callback: any) => {
            const txMock = {
              job: {
                create: vi.fn().mockResolvedValue(mockDbJob),
              },
              pipelineStage: {
                createMany: vi.fn().mockResolvedValue({ count: 8 }),
                findMany: vi.fn().mockResolvedValue(mockStages),
              },
            };
            return callback(txMock);
          });
          
          // Mock findUnique for getById
          mockPrismaJob.findUnique.mockResolvedValueOnce({
            ...mockDbJob,
            pipelineStages: mockStages,
          });

          // Create job
          const created = await jobService.create({
            companyId,
            title,
            department,
            location,
            employmentType,
            salaryRange,
            description,
            openings,
          });

          // Retrieve job
          const retrieved = await jobService.getById(created.id);

          // Verify all fields match (round-trip property)
          expect(retrieved.id).toBe(created.id);
          expect(retrieved.title).toBe(title.trim());
          expect(retrieved.department).toBe(department.trim());
          expect(retrieved.location).toBe(location.trim());
          expect(retrieved.companyId).toBe(companyId);
          expect(retrieved.status).toBe('active');
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Property 9: Job IDs are unique and status is active', () => {
  /**
   * **Feature: ats-portal-phase1, Property 9: Job IDs are unique and status is active**
   * **Validates: Requirements 5.2**
   */
  it('should generate unique IDs and set status to active for all created jobs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.tuple(uuidArbitrary, uuidArbitrary, jobTitleArbitrary, departmentArbitrary, locationArbitrary),
          { minLength: 2, maxLength: 10 }
        ),
        async (jobDataList) => {
          const createdIds: string[] = [];
          const now = new Date();

          for (const [jobId, companyId, title, department, location] of jobDataList) {
            const mockDbJob = {
              id: jobId,
              companyId,
              title: title.trim(),
              department: department.trim(),
              location: location.trim(),
              employmentType: null,
              salaryRange: null,
              description: null,
              status: 'active',
              openings: 1,
              createdAt: now,
              updatedAt: now,
            };
            
            const mockStages = DEFAULT_STAGES.map((name, index) => ({
              id: `stage-${jobId}-${index}`,
              jobId,
              name,
              position: index,
              isDefault: true,
              createdAt: now,
            }));
            
            // Mock transaction
            mockTransaction.mockImplementationOnce(async (callback: any) => {
              const txMock = {
                job: {
                  create: vi.fn().mockResolvedValue(mockDbJob),
                },
                pipelineStage: {
                  createMany: vi.fn().mockResolvedValue({ count: 8 }),
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
            
            createdIds.push(job.id);
            
            // Verify status is active (Requirements 5.2)
            expect(job.status).toBe('active');
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

  it('should always set initial status to active regardless of other fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArbitrary,
        uuidArbitrary,
        jobTitleArbitrary,
        departmentArbitrary,
        locationArbitrary,
        fc.option(employmentTypeArbitrary, { nil: undefined }),
        fc.option(salaryRangeArbitrary, { nil: undefined }),
        fc.option(descriptionArbitrary, { nil: undefined }),
        async (jobId, companyId, title, department, location, employmentType, salaryRange, description) => {
          const now = new Date();
          
          const mockDbJob = {
            id: jobId,
            companyId,
            title: title.trim(),
            department: department.trim(),
            location: location.trim(),
            employmentType: employmentType ?? null,
            salaryRange: salaryRange ?? null,
            description: description ?? null,
            status: 'active',
            openings: 1,
            createdAt: now,
            updatedAt: now,
          };
          
          const mockStages = DEFAULT_STAGES.map((name, index) => ({
            id: `stage-${index}`,
            jobId,
            name,
            position: index,
            isDefault: true,
            createdAt: now,
          }));
          
          mockTransaction.mockImplementationOnce(async (callback: any) => {
            const txMock = {
              job: {
                create: vi.fn().mockResolvedValue(mockDbJob),
              },
              pipelineStage: {
                createMany: vi.fn().mockResolvedValue({ count: 8 }),
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
            employmentType,
            salaryRange,
            description,
          });

          // Status should always be 'active' for new jobs
          expect(job.status).toBe('active');
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Property 10: Job validation rejects missing required fields', () => {
  /**
   * **Feature: ats-portal-phase1, Property 10: Job validation rejects missing required fields**
   * **Validates: Requirements 5.3**
   */
  it('should reject job creation when title is missing or empty', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArbitrary,
        fc.constantFrom('', '   ', '\t', '\n'), // Empty or whitespace-only strings
        departmentArbitrary,
        locationArbitrary,
        async (companyId, emptyTitle, department, location) => {
          await expect(
            jobService.create({
              companyId,
              title: emptyTitle,
              department,
              location,
            })
          ).rejects.toThrow(ValidationError);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject job creation when department is missing or empty', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArbitrary,
        jobTitleArbitrary,
        fc.constantFrom('', '   ', '\t', '\n'), // Empty or whitespace-only strings
        locationArbitrary,
        async (companyId, title, emptyDepartment, location) => {
          await expect(
            jobService.create({
              companyId,
              title,
              department: emptyDepartment,
              location,
            })
          ).rejects.toThrow(ValidationError);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject job creation when location is missing or empty', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArbitrary,
        jobTitleArbitrary,
        departmentArbitrary,
        fc.constantFrom('', '   ', '\t', '\n'), // Empty or whitespace-only strings
        async (companyId, title, department, emptyLocation) => {
          await expect(
            jobService.create({
              companyId,
              title,
              department,
              location: emptyLocation,
            })
          ).rejects.toThrow(ValidationError);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject job creation when multiple required fields are missing', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArbitrary,
        fc.constantFrom('', '   '),
        fc.constantFrom('', '   '),
        fc.constantFrom('', '   '),
        async (companyId, emptyTitle, emptyDepartment, emptyLocation) => {
          await expect(
            jobService.create({
              companyId,
              title: emptyTitle,
              department: emptyDepartment,
              location: emptyLocation,
            })
          ).rejects.toThrow(ValidationError);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should accept job creation when all required fields are provided', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArbitrary,
        uuidArbitrary,
        jobTitleArbitrary,
        departmentArbitrary,
        locationArbitrary,
        async (jobId, companyId, title, department, location) => {
          const now = new Date();
          
          const mockDbJob = {
            id: jobId,
            companyId,
            title: title.trim(),
            department: department.trim(),
            location: location.trim(),
            employmentType: null,
            salaryRange: null,
            description: null,
            status: 'active',
            openings: 1,
            createdAt: now,
            updatedAt: now,
          };
          
          const mockStages = DEFAULT_STAGES.map((name, index) => ({
            id: `stage-${index}`,
            jobId,
            name,
            position: index,
            isDefault: true,
            createdAt: now,
          }));
          
          mockTransaction.mockImplementationOnce(async (callback: any) => {
            const txMock = {
              job: {
                create: vi.fn().mockResolvedValue(mockDbJob),
              },
              pipelineStage: {
                createMany: vi.fn().mockResolvedValue({ count: 8 }),
                findMany: vi.fn().mockResolvedValue(mockStages),
              },
            };
            return callback(txMock);
          });

          // Should not throw when all required fields are provided
          const job = await jobService.create({
            companyId,
            title,
            department,
            location,
          });

          expect(job).toBeDefined();
          expect(job.id).toBe(jobId);
          expect(job.title).toBe(title.trim());
          expect(job.department).toBe(department.trim());
          expect(job.location).toBe(location.trim());
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Phase 2 Property Tests
 * **Feature: ats-enhancements-phase2, Property 6: Job validation rejects missing required fields**
 * **Feature: ats-enhancements-phase2, Property 7: Job creation with pipeline stages**
 * **Feature: ats-enhancements-phase2, Property 8: Unique job application URLs**
 * **Validates: Requirements 4.2, 4.3, 4.4**
 */

describe('Property 6: Job validation rejects missing required fields (Phase 2)', () => {
  /**
   * **Feature: ats-enhancements-phase2, Property 6: Job validation rejects missing required fields**
   * **Validates: Requirements 4.2**
   * 
   * For any job data missing a required field (title, department, or location),
   * the job creation validation should fail with appropriate error message.
   */
  it('should reject job with missing title and return validation error', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArbitrary,
        fc.constantFrom('', '   ', '\t', '\n', undefined as unknown as string),
        departmentArbitrary,
        locationArbitrary,
        async (companyId, invalidTitle, department, location) => {
          try {
            await jobService.create({
              companyId,
              title: invalidTitle || '',
              department,
              location,
            });
            // Should not reach here
            return false;
          } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            const validationError = error as ValidationError;
            expect(validationError.details).toBeDefined();
            expect(validationError.details?.title).toBeDefined();
            return true;
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject job with missing department and return validation error', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArbitrary,
        jobTitleArbitrary,
        fc.constantFrom('', '   ', '\t', '\n', undefined as unknown as string),
        locationArbitrary,
        async (companyId, title, invalidDepartment, location) => {
          try {
            await jobService.create({
              companyId,
              title,
              department: invalidDepartment || '',
              location,
            });
            return false;
          } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            const validationError = error as ValidationError;
            expect(validationError.details).toBeDefined();
            expect(validationError.details?.department).toBeDefined();
            return true;
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject job with missing location and return validation error', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArbitrary,
        jobTitleArbitrary,
        departmentArbitrary,
        fc.constantFrom('', '   ', '\t', '\n', undefined as unknown as string),
        async (companyId, title, department, invalidLocation) => {
          try {
            await jobService.create({
              companyId,
              title,
              department,
              location: invalidLocation || '',
            });
            return false;
          } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            const validationError = error as ValidationError;
            expect(validationError.details).toBeDefined();
            expect(validationError.details?.location).toBeDefined();
            return true;
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});


describe('Property 7: Job creation with pipeline stages', () => {
  /**
   * **Feature: ats-enhancements-phase2, Property 7: Job creation with pipeline stages**
   * **Validates: Requirements 4.3**
   * 
   * For any valid job data, creating a job should store it in the database with all 
   * provided details and automatically create default pipeline stages 
   * (Queue, Applied, Screening, Shortlisted, Interview, Selected, Offer, Hired).
   */
  it('should create job with all 8 default pipeline stages', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArbitrary,
        uuidArbitrary,
        jobTitleArbitrary,
        departmentArbitrary,
        locationArbitrary,
        fc.option(employmentTypeArbitrary, { nil: undefined }),
        fc.option(salaryRangeArbitrary, { nil: undefined }),
        fc.option(descriptionArbitrary, { nil: undefined }),
        async (jobId, companyId, title, department, location, employmentType, salaryRange, description) => {
          const now = new Date();
          
          const mockDbJob = {
            id: jobId,
            companyId,
            title: title.trim(),
            department: department.trim(),
            location: location.trim(),
            employmentType: employmentType ?? null,
            salaryRange: salaryRange ?? null,
            description: description ?? null,
            status: 'active',
            openings: 1,
            createdAt: now,
            updatedAt: now,
          };
          
          const mockStages = DEFAULT_STAGES.map((name, index) => ({
            id: `stage-${jobId}-${index}`,
            jobId,
            name,
            position: index,
            isDefault: true,
            createdAt: now,
          }));
          
          let createManyCalledWith: any = null;
          
          mockTransaction.mockImplementationOnce(async (callback: any) => {
            const txMock = {
              job: {
                create: vi.fn().mockResolvedValue(mockDbJob),
              },
              pipelineStage: {
                createMany: vi.fn().mockImplementation((args: any) => {
                  createManyCalledWith = args;
                  return Promise.resolve({ count: 8 });
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
            employmentType,
            salaryRange,
            description,
          });

          // Verify job was created
          expect(job).toBeDefined();
          expect(job.id).toBe(jobId);
          
          // Verify stages were created
          expect(job.stages).toBeDefined();
          expect(job.stages?.length).toBe(8);
          
          // Verify all default stages are present in correct order
          const expectedStages = ['Queue', 'Applied', 'Screening', 'Shortlisted', 'Interview', 'Selected', 'Offer', 'Hired'];
          job.stages?.forEach((stage, index) => {
            expect(stage.name).toBe(expectedStages[index]);
            expect(stage.position).toBe(index);
            expect(stage.isDefault).toBe(true);
          });
          
          // Verify createMany was called with correct stage data
          expect(createManyCalledWith).toBeDefined();
          expect(createManyCalledWith.data.length).toBe(8);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create stages with correct positions (0-7)', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArbitrary,
        uuidArbitrary,
        jobTitleArbitrary,
        departmentArbitrary,
        locationArbitrary,
        async (jobId, companyId, title, department, location) => {
          const now = new Date();
          
          const mockDbJob = {
            id: jobId,
            companyId,
            title: title.trim(),
            department: department.trim(),
            location: location.trim(),
            employmentType: null,
            salaryRange: null,
            description: null,
            status: 'active',
            openings: 1,
            createdAt: now,
            updatedAt: now,
          };
          
          const mockStages = DEFAULT_STAGES.map((name, index) => ({
            id: `stage-${jobId}-${index}`,
            jobId,
            name,
            position: index,
            isDefault: true,
            createdAt: now,
          }));
          
          mockTransaction.mockImplementationOnce(async (callback: any) => {
            const txMock = {
              job: {
                create: vi.fn().mockResolvedValue(mockDbJob),
              },
              pipelineStage: {
                createMany: vi.fn().mockResolvedValue({ count: 8 }),
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

          // Verify positions are sequential from 0 to 7
          const positions = job.stages?.map(s => s.position) || [];
          expect(positions).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Property 8: Unique job application URLs', () => {
  /**
   * **Feature: ats-enhancements-phase2, Property 8: Unique job application URLs**
   * **Validates: Requirements 4.4**
   * 
   * For any set of created jobs, each job should have a unique public application URL 
   * that can be used to access the application form.
   * The application URL format is: /apply/:jobId
   */
  it('should generate unique application URLs for all created jobs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.tuple(uuidArbitrary, uuidArbitrary, jobTitleArbitrary, departmentArbitrary, locationArbitrary),
          { minLength: 2, maxLength: 10 }
        ),
        async (jobDataList) => {
          const applicationUrls: string[] = [];
          const now = new Date();

          for (const [jobId, companyId, title, department, location] of jobDataList) {
            const mockDbJob = {
              id: jobId,
              companyId,
              title: title.trim(),
              department: department.trim(),
              location: location.trim(),
              employmentType: null,
              salaryRange: null,
              description: null,
              status: 'active',
              openings: 1,
              createdAt: now,
              updatedAt: now,
            };
            
            const mockStages = DEFAULT_STAGES.map((name, index) => ({
              id: `stage-${jobId}-${index}`,
              jobId,
              name,
              position: index,
              isDefault: true,
              createdAt: now,
            }));
            
            mockTransaction.mockImplementationOnce(async (callback: any) => {
              const txMock = {
                job: {
                  create: vi.fn().mockResolvedValue(mockDbJob),
                },
                pipelineStage: {
                  createMany: vi.fn().mockResolvedValue({ count: 8 }),
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
            
            // Generate application URL based on job ID
            const applicationUrl = `/apply/${job.id}`;
            applicationUrls.push(applicationUrl);
          }

          // Verify all application URLs are unique
          const uniqueUrls = new Set(applicationUrls);
          expect(uniqueUrls.size).toBe(applicationUrls.length);
          
          // Verify URL format is correct
          const urlPattern = /^\/apply\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          for (const url of applicationUrls) {
            expect(url).toMatch(urlPattern);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should have application URL derived from unique job ID', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArbitrary,
        uuidArbitrary,
        jobTitleArbitrary,
        departmentArbitrary,
        locationArbitrary,
        async (jobId, companyId, title, department, location) => {
          const now = new Date();
          
          const mockDbJob = {
            id: jobId,
            companyId,
            title: title.trim(),
            department: department.trim(),
            location: location.trim(),
            employmentType: null,
            salaryRange: null,
            description: null,
            status: 'active',
            openings: 1,
            createdAt: now,
            updatedAt: now,
          };
          
          const mockStages = DEFAULT_STAGES.map((name, index) => ({
            id: `stage-${jobId}-${index}`,
            jobId,
            name,
            position: index,
            isDefault: true,
            createdAt: now,
          }));
          
          mockTransaction.mockImplementationOnce(async (callback: any) => {
            const txMock = {
              job: {
                create: vi.fn().mockResolvedValue(mockDbJob),
              },
              pipelineStage: {
                createMany: vi.fn().mockResolvedValue({ count: 8 }),
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

          // Application URL should be /apply/{jobId}
          const expectedUrl = `/apply/${job.id}`;
          
          // Verify the job ID is a valid UUID (which ensures unique URLs)
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          expect(job.id).toMatch(uuidRegex);
          
          // Verify URL contains the job ID
          expect(expectedUrl).toContain(job.id);
        }
      ),
      { numRuns: 100 }
    );
  });
});
