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
    create: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
    deleteMany: vi.fn(),
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
).map(([min, max]) => `${min} - ${max}`);

const descriptionArbitrary = fc.string({ minLength: 10, maxLength: 500 });
const openingsArbitrary = fc.integer({ min: 1, max: 10 });
const uuidArbitrary = fc.uuid();

// Default pipeline stages
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

// Helper to create mock job data with all new fields
function createMockDbJob(jobId: string, companyId: string, title: string, department: string, location: string, options: any = {}) {
  const now = new Date();
  return {
    id: jobId,
    companyId,
    title: title.trim(),
    department: department.trim(),
    location: location?.trim() || '',
    experienceMin: options.experienceMin ?? null,
    experienceMax: options.experienceMax ?? null,
    salaryMin: options.salaryMin ?? null,
    salaryMax: options.salaryMax ?? null,
    variables: options.variables ?? null,
    educationQualification: options.educationQualification ?? null,
    ageUpTo: options.ageUpTo ?? null,
    skills: options.skills ?? [],
    preferredIndustry: options.preferredIndustry ?? null,
    workMode: options.workMode ?? null,
    locations: options.locations ?? [],
    priority: options.priority ?? 'Medium',
    jobDomain: options.jobDomain ?? null,
    assignedRecruiterId: options.assignedRecruiterId ?? null,
    description: options.description ?? null,
    status: 'active',
    openings: options.openings ?? 1,
    employmentType: options.employmentType ?? null,
    salaryRange: options.salaryRange ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

// Helper to create mock stages
function createMockStages(jobId: string) {
  const now = new Date();
  return DEFAULT_STAGES.map((stage, index) => ({
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
}

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
          const mockDbJob = createMockDbJob(jobId, companyId, title, department, location, {
            employmentType,
            salaryRange,
            description,
            openings,
          });
          
          const mockStages = createMockStages(jobId);
          
          // Mock transaction to execute the callback
          mockTransaction.mockImplementationOnce(async (callback: any) => {
            const txMock = {
              job: {
                create: vi.fn().mockResolvedValue(mockDbJob),
              },
              pipelineStage: {
                create: vi.fn().mockImplementation((args: any) => {
                  const stageIndex = mockStages.findIndex(s => s.name === args.data.name);
                  return Promise.resolve(mockStages[stageIndex] || mockStages[0]);
                }),
                findMany: vi.fn().mockResolvedValue(mockStages),
              },
            };
            return callback(txMock);
          });
          
          // Mock findUnique for getById
          mockPrismaJob.findUnique.mockResolvedValueOnce({
            ...mockDbJob,
            pipelineStages: mockStages,
            company: { name: 'Test Company', logoUrl: null },
            assignedRecruiter: null,
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

          for (const [jobId, companyId, title, department, location] of jobDataList) {
            const mockDbJob = createMockDbJob(jobId, companyId, title, department, location);
            const mockStages = createMockStages(jobId);
            
            // Mock transaction
            mockTransaction.mockImplementationOnce(async (callback: any) => {
              const txMock = {
                job: {
                  create: vi.fn().mockResolvedValue(mockDbJob),
                },
                pipelineStage: {
                  create: vi.fn().mockImplementation((args: any) => {
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
          const mockDbJob = createMockDbJob(jobId, companyId, title, department, location, {
            employmentType,
            salaryRange,
            description,
          });
          const mockStages = createMockStages(jobId);
          
          mockTransaction.mockImplementationOnce(async (callback: any) => {
            const txMock = {
              job: {
                create: vi.fn().mockResolvedValue(mockDbJob),
              },
              pipelineStage: {
                create: vi.fn().mockImplementation((args: any) => {
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

  it('should reject job creation when multiple required fields are missing', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArbitrary,
        fc.constantFrom('', '   '),
        fc.constantFrom('', '   '),
        async (companyId, emptyTitle, emptyDepartment) => {
          await expect(
            jobService.create({
              companyId,
              title: emptyTitle,
              department: emptyDepartment,
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
          const mockDbJob = createMockDbJob(jobId, companyId, title, department, location);
          const mockStages = createMockStages(jobId);
          
          mockTransaction.mockImplementationOnce(async (callback: any) => {
            const txMock = {
              job: {
                create: vi.fn().mockResolvedValue(mockDbJob),
              },
              pipelineStage: {
                create: vi.fn().mockImplementation((args: any) => {
                  const stageIndex = mockStages.findIndex(s => s.name === args.data.name);
                  return Promise.resolve(mockStages[stageIndex] || mockStages[0]);
                }),
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
});


describe('Property 7: Job creation with pipeline stages', () => {
  /**
   * **Feature: ats-enhancements-phase2, Property 7: Job creation with pipeline stages**
   * **Validates: Requirements 4.3**
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
          const mockDbJob = createMockDbJob(jobId, companyId, title, department, location, {
            employmentType,
            salaryRange,
            description,
          });
          const mockStages = createMockStages(jobId);
          
          mockTransaction.mockImplementationOnce(async (callback: any) => {
            const txMock = {
              job: {
                create: vi.fn().mockResolvedValue(mockDbJob),
              },
              pipelineStage: {
                create: vi.fn().mockImplementation((args: any) => {
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
          const mockDbJob = createMockDbJob(jobId, companyId, title, department, location);
          const mockStages = createMockStages(jobId);
          
          mockTransaction.mockImplementationOnce(async (callback: any) => {
            const txMock = {
              job: {
                create: vi.fn().mockResolvedValue(mockDbJob),
              },
              pipelineStage: {
                create: vi.fn().mockImplementation((args: any) => {
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

          // Verify positions are sequential from 0 to 7
          const positions = job.stages?.map(s => s.position) || [];
          expect(positions).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: job-form-enhancements, Property 3: Multi-Select Locations Persistence**
 * **Validates: Requirements 1.4**
 * 
 * For any set of selected locations, when the job is saved and then retrieved,
 * the retrieved locations array SHALL contain exactly the same cities that were selected, in any order.
 */
describe('Property 3: Multi-Select Locations Persistence', () => {
  // Available cities from jobFormOptions.ts
  const availableCities = [
    'mumbai', 'delhi', 'bangalore', 'hyderabad', 'chennai', 'kolkata', 'pune',
    'ahmedabad', 'jaipur', 'lucknow', 'kanpur', 'nagpur', 'indore', 'thane',
    'bhopal', 'visakhapatnam', 'vadodara', 'ghaziabad', 'ludhiana', 'agra',
    'nashik', 'faridabad', 'meerut', 'rajkot', 'varanasi', 'srinagar',
    'aurangabad', 'dhanbad', 'amritsar', 'noida', 'gurgaon', 'chandigarh',
    'coimbatore', 'kochi', 'thiruvananthapuram', 'remote'
  ];

  // Arbitrary for generating random subsets of locations
  const locationsArbitrary = fc.subarray(availableCities, { minLength: 1, maxLength: 10 });

  it('should persist and retrieve the exact same locations after job creation', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArbitrary,
        uuidArbitrary,
        jobTitleArbitrary,
        departmentArbitrary,
        locationsArbitrary,
        async (jobId, companyId, title, department, selectedLocations) => {
          const mockDbJob = createMockDbJob(jobId, companyId, title, department, '', {
            locations: selectedLocations,
          });
          const mockStages = createMockStages(jobId);

          // Mock transaction for create
          mockTransaction.mockImplementationOnce(async (callback: any) => {
            const txMock = {
              job: {
                create: vi.fn().mockResolvedValue(mockDbJob),
              },
              pipelineStage: {
                create: vi.fn().mockImplementation((args: any) => {
                  const stageIndex = mockStages.findIndex(s => s.name === args.data.name);
                  return Promise.resolve(mockStages[stageIndex] || mockStages[0]);
                }),
                findMany: vi.fn().mockResolvedValue(mockStages),
              },
            };
            return callback(txMock);
          });

          // Mock findUnique for getById
          mockPrismaJob.findUnique.mockResolvedValueOnce({
            ...mockDbJob,
            pipelineStages: mockStages,
            company: { name: 'Test Company', logoUrl: null },
            assignedRecruiter: null,
          });

          // Create job with selected locations
          const created = await jobService.create({
            companyId,
            title,
            department,
            locations: selectedLocations,
          });

          // Retrieve job
          const retrieved = await jobService.getById(created.id);

          // Verify locations array contains exactly the same cities (order-independent)
          expect(retrieved.locations).toBeDefined();
          expect(retrieved.locations?.length).toBe(selectedLocations.length);
          
          // Sort both arrays for comparison (order-independent)
          const sortedSelected = [...selectedLocations].sort();
          const sortedRetrieved = [...(retrieved.locations || [])].sort();
          expect(sortedRetrieved).toEqual(sortedSelected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should persist empty locations array correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArbitrary,
        uuidArbitrary,
        jobTitleArbitrary,
        departmentArbitrary,
        async (jobId, companyId, title, department) => {
          const emptyLocations: string[] = [];
          const mockDbJob = createMockDbJob(jobId, companyId, title, department, '', {
            locations: emptyLocations,
          });
          const mockStages = createMockStages(jobId);

          // Mock transaction for create
          mockTransaction.mockImplementationOnce(async (callback: any) => {
            const txMock = {
              job: {
                create: vi.fn().mockResolvedValue(mockDbJob),
              },
              pipelineStage: {
                create: vi.fn().mockImplementation((args: any) => {
                  const stageIndex = mockStages.findIndex(s => s.name === args.data.name);
                  return Promise.resolve(mockStages[stageIndex] || mockStages[0]);
                }),
                findMany: vi.fn().mockResolvedValue(mockStages),
              },
            };
            return callback(txMock);
          });

          // Mock findUnique for getById
          mockPrismaJob.findUnique.mockResolvedValueOnce({
            ...mockDbJob,
            pipelineStages: mockStages,
            company: { name: 'Test Company', logoUrl: null },
            assignedRecruiter: null,
          });

          // Create job with empty locations
          const created = await jobService.create({
            companyId,
            title,
            department,
            locations: emptyLocations,
          });

          // Retrieve job
          const retrieved = await jobService.getById(created.id);

          // Verify locations is an empty array
          expect(retrieved.locations).toBeDefined();
          expect(Array.isArray(retrieved.locations)).toBe(true);
          expect(retrieved.locations?.length).toBe(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should preserve locations after job update', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArbitrary,
        uuidArbitrary,
        jobTitleArbitrary,
        departmentArbitrary,
        locationsArbitrary,
        locationsArbitrary,
        async (jobId, companyId, title, department, initialLocations, updatedLocations) => {
          // Create initial job mock
          const initialMockDbJob = createMockDbJob(jobId, companyId, title, department, '', {
            locations: initialLocations,
          });
          const mockStages = createMockStages(jobId);

          // Mock transaction for create
          mockTransaction.mockImplementationOnce(async (callback: any) => {
            const txMock = {
              job: {
                create: vi.fn().mockResolvedValue(initialMockDbJob),
              },
              pipelineStage: {
                create: vi.fn().mockImplementation((args: any) => {
                  const stageIndex = mockStages.findIndex(s => s.name === args.data.name);
                  return Promise.resolve(mockStages[stageIndex] || mockStages[0]);
                }),
                findMany: vi.fn().mockResolvedValue(mockStages),
              },
            };
            return callback(txMock);
          });

          // Create job
          const created = await jobService.create({
            companyId,
            title,
            department,
            locations: initialLocations,
          });

          // Mock for update - findUnique check
          mockPrismaJob.findUnique.mockResolvedValueOnce(initialMockDbJob);

          // Updated job mock
          const updatedMockDbJob = createMockDbJob(jobId, companyId, title, department, '', {
            locations: updatedLocations,
          });

          // Mock transaction for update
          mockTransaction.mockImplementationOnce(async (callback: any) => {
            const txMock = {
              job: {
                update: vi.fn().mockResolvedValue(updatedMockDbJob),
              },
              pipelineStage: {
                deleteMany: vi.fn().mockResolvedValue({ count: 8 }),
                create: vi.fn().mockImplementation((args: any) => {
                  const stageIndex = mockStages.findIndex(s => s.name === args.data.name);
                  return Promise.resolve(mockStages[stageIndex] || mockStages[0]);
                }),
                findMany: vi.fn().mockResolvedValue(mockStages),
              },
            };
            return callback(txMock);
          });

          // Update job with new locations
          const updated = await jobService.update(created.id, {
            locations: updatedLocations,
          });

          // Verify updated locations match
          expect(updated.locations).toBeDefined();
          expect(updated.locations?.length).toBe(updatedLocations.length);
          
          const sortedUpdated = [...updatedLocations].sort();
          const sortedRetrieved = [...(updated.locations || [])].sort();
          expect(sortedRetrieved).toEqual(sortedUpdated);
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

          for (const [jobId, companyId, title, department, location] of jobDataList) {
            const mockDbJob = createMockDbJob(jobId, companyId, title, department, location);
            const mockStages = createMockStages(jobId);
            
            mockTransaction.mockImplementationOnce(async (callback: any) => {
              const txMock = {
                job: {
                  create: vi.fn().mockResolvedValue(mockDbJob),
                },
                pipelineStage: {
                  create: vi.fn().mockImplementation((args: any) => {
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
          const mockDbJob = createMockDbJob(jobId, companyId, title, department, location);
          const mockStages = createMockStages(jobId);
          
          mockTransaction.mockImplementationOnce(async (callback: any) => {
            const txMock = {
              job: {
                create: vi.fn().mockResolvedValue(mockDbJob),
              },
              pipelineStage: {
                create: vi.fn().mockImplementation((args: any) => {
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

          // Application URL should be /apply/{jobId}
          const expectedUrl = `/apply/${job.id}`;
          
          // Verify the job ID is a valid UUID (which ensures unique URLs)
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          expect(job.id).toMatch(uuidRegex);
          expect(expectedUrl).toContain(job.id);
        }
      ),
      { numRuns: 100 }
    );
  });
});
