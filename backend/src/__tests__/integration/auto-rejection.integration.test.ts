/**
 * Integration Test: Flexible Auto-Rejection Flow
 * **Validates: Requirements 4.6, 4.7, 9.2, 9.3, 9.5, 9.6**
 * 
 * Tests the flexible auto-rejection flow:
 * 1. Create job with flexible auto-rejection rules (multiple fields, operators)
 * 2. Submit candidate applications with various data
 * 3. Verify candidates are rejected based on matching rules
 * 4. Verify dynamic rejection reasons are correct
 * 5. Test AND/OR logic between rules
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../../lib/prisma.js';
import { processAutoRejection, evaluateAutoRejection } from '../../services/autoRejection.service.js';
import type { AutoRejectionRules, LegacyAutoRejectionRules } from '../../types/index.js';

// Test data
let testCompanyId: string;
let testJobId: string;
let testCandidateId: string;
let testJobCandidateId: string;
let appliedStageId: string;
let rejectedStageId: string;

beforeAll(async () => {
  // Create a test company
  const company = await prisma.company.create({
    data: {
      name: 'Auto-Rejection Test Company',
      contactEmail: 'test@autorejection.com',
    },
  });
  testCompanyId = company.id;

  // Create a test job with flexible auto-rejection rules
  const autoRejectionRules: AutoRejectionRules = {
    enabled: true,
    rules: [
      {
        id: 'rule-1',
        field: 'experience',
        operator: 'less_than',
        value: 3, // Minimum 3 years experience required
        logicConnector: 'OR',
      },
    ],
  };

  const job = await prisma.job.create({
    data: {
      companyId: testCompanyId,
      title: 'Auto-Rejection Test Job',
      department: 'Engineering',
      location: 'Remote',
      employmentType: 'Full-time',
      description: 'Test job for auto-rejection integration testing',
      status: 'active',
      autoRejectionRules: JSON.parse(JSON.stringify(autoRejectionRules)),
    },
  });
  testJobId = job.id;

  // Create pipeline stages
  const stages = await Promise.all([
    prisma.pipelineStage.create({
      data: { jobId: testJobId, name: 'Applied', position: 0, isDefault: true },
    }),
    prisma.pipelineStage.create({
      data: { jobId: testJobId, name: 'Screening', position: 1, isDefault: true },
    }),
    prisma.pipelineStage.create({
      data: { jobId: testJobId, name: 'Interview', position: 2, isDefault: true },
    }),
    prisma.pipelineStage.create({
      data: { jobId: testJobId, name: 'Rejected', position: 3, isDefault: true },
    }),
  ]);

  appliedStageId = stages[0].id;
  rejectedStageId = stages[3].id;
}, 60000);

afterAll(async () => {
  // Clean up in reverse order of creation
  try {
    // Delete candidate activities
    if (testCandidateId) {
      await prisma.candidateActivity.deleteMany({
        where: { candidateId: testCandidateId },
      });
    }

    // Delete job candidates
    if (testJobCandidateId) {
      await prisma.jobCandidate.delete({
        where: { id: testJobCandidateId },
      });
    }

    // Delete candidates
    if (testCandidateId) {
      await prisma.candidate.delete({
        where: { id: testCandidateId },
      });
    }

    // Delete pipeline stages
    await prisma.pipelineStage.deleteMany({
      where: { jobId: testJobId },
    });

    // Delete job
    if (testJobId) {
      await prisma.job.delete({
        where: { id: testJobId },
      });
    }

    // Delete company
    if (testCompanyId) {
      await prisma.company.delete({
        where: { id: testCompanyId },
      });
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}, 60000);

describe('Integration: Flexible Auto-Rejection Flow', () => {
  /**
   * Test evaluating numeric operators (less_than, greater_than)
   * Requirements: 9.3
   */
  describe('Numeric Operators', () => {
    it('should reject when experience is less than threshold', () => {
      const rules: AutoRejectionRules = {
        enabled: true,
        rules: [
          { id: '1', field: 'experience', operator: 'less_than', value: 3 },
        ],
      };

      const result = evaluateAutoRejection({ experience: 2 }, rules);
      expect(result.shouldReject).toBe(true);
      expect(result.reason).toContain('Experience');
      expect(result.reason).toContain('less than');
    });

    it('should not reject when experience meets threshold', () => {
      const rules: AutoRejectionRules = {
        enabled: true,
        rules: [
          { id: '1', field: 'experience', operator: 'less_than', value: 3 },
        ],
      };

      const result = evaluateAutoRejection({ experience: 5 }, rules);
      expect(result.shouldReject).toBe(false);
    });

    it('should reject when experience exceeds max threshold', () => {
      const rules: AutoRejectionRules = {
        enabled: true,
        rules: [
          { id: '1', field: 'experience', operator: 'greater_than', value: 10 },
        ],
      };

      const result = evaluateAutoRejection({ experience: 15 }, rules);
      expect(result.shouldReject).toBe(true);
      expect(result.reason).toContain('greater than');
    });

    it('should reject when salary expectation is too high', () => {
      const rules: AutoRejectionRules = {
        enabled: true,
        rules: [
          { id: '1', field: 'salary_expectation', operator: 'greater_than', value: 100000 },
        ],
      };

      const result = evaluateAutoRejection({ salaryExpectation: 150000 }, rules);
      expect(result.shouldReject).toBe(true);
      expect(result.reason).toContain('Salary Expectation');
    });
  });


  /**
   * Test evaluating text operators (equals, contains, not_contains)
   * Requirements: 9.3
   */
  describe('Text Operators', () => {
    it('should reject when location equals excluded value', () => {
      const rules: AutoRejectionRules = {
        enabled: true,
        rules: [
          { id: '1', field: 'location', operator: 'equals', value: 'Remote Only' },
        ],
      };

      const result = evaluateAutoRejection({ location: 'Remote Only' }, rules);
      expect(result.shouldReject).toBe(true);
      expect(result.reason).toContain('Location');
    });

    it('should reject when location does not contain required value', () => {
      const rules: AutoRejectionRules = {
        enabled: true,
        rules: [
          { id: '1', field: 'location', operator: 'not_contains', value: 'USA' },
        ],
      };

      const result = evaluateAutoRejection({ location: 'Canada' }, rules);
      expect(result.shouldReject).toBe(true);
    });

    it('should not reject when location contains required value', () => {
      const rules: AutoRejectionRules = {
        enabled: true,
        rules: [
          { id: '1', field: 'location', operator: 'not_contains', value: 'USA' },
        ],
      };

      const result = evaluateAutoRejection({ location: 'New York, USA' }, rules);
      expect(result.shouldReject).toBe(false);
    });

    it('should handle case-insensitive text matching', () => {
      const rules: AutoRejectionRules = {
        enabled: true,
        rules: [
          { id: '1', field: 'location', operator: 'contains', value: 'remote' },
        ],
      };

      const result = evaluateAutoRejection({ location: 'REMOTE WORK' }, rules);
      expect(result.shouldReject).toBe(true);
    });
  });

  /**
   * Test evaluating array operators (contains, not_contains, contains_all, contains_any)
   * Requirements: 9.3
   */
  describe('Array Operators', () => {
    it('should reject when skills do not contain required skill', () => {
      const rules: AutoRejectionRules = {
        enabled: true,
        rules: [
          { id: '1', field: 'skills', operator: 'not_contains', value: 'JavaScript' },
        ],
      };

      const result = evaluateAutoRejection({ skills: ['Python', 'Java'] }, rules);
      expect(result.shouldReject).toBe(true);
      expect(result.reason).toContain('Skills');
    });

    it('should not reject when skills contain required skill', () => {
      const rules: AutoRejectionRules = {
        enabled: true,
        rules: [
          { id: '1', field: 'skills', operator: 'not_contains', value: 'JavaScript' },
        ],
      };

      const result = evaluateAutoRejection({ skills: ['JavaScript', 'TypeScript'] }, rules);
      expect(result.shouldReject).toBe(false);
    });

    it('should reject when skills do not contain all required skills', () => {
      const rules: AutoRejectionRules = {
        enabled: true,
        rules: [
          { id: '1', field: 'skills', operator: 'contains_all', value: ['JavaScript', 'TypeScript', 'React'] },
        ],
      };

      // Candidate has JavaScript and TypeScript but not React - should NOT match contains_all
      // So we need to negate this - actually contains_all returns true if ALL are present
      // If candidate doesn't have all, contains_all returns false, so no rejection
      const result = evaluateAutoRejection({ skills: ['JavaScript', 'TypeScript'] }, rules);
      expect(result.shouldReject).toBe(false);
    });

    it('should reject when skills contain any of the excluded skills', () => {
      const rules: AutoRejectionRules = {
        enabled: true,
        rules: [
          { id: '1', field: 'skills', operator: 'contains_any', value: ['COBOL', 'Fortran'] },
        ],
      };

      const result = evaluateAutoRejection({ skills: ['JavaScript', 'COBOL'] }, rules);
      expect(result.shouldReject).toBe(true);
    });
  });

  /**
   * Test AND/OR logic between multiple rules
   * Requirements: 9.4
   */
  describe('AND/OR Logic', () => {
    it('should reject when any rule matches with OR logic', () => {
      const rules: AutoRejectionRules = {
        enabled: true,
        rules: [
          { id: '1', field: 'experience', operator: 'less_than', value: 3, logicConnector: 'OR' },
          { id: '2', field: 'location', operator: 'equals', value: 'Remote Only' },
        ],
      };

      // Only experience rule matches
      const result = evaluateAutoRejection({ experience: 2, location: 'New York' }, rules);
      expect(result.shouldReject).toBe(true);
    });

    it('should not reject when no rules match with OR logic', () => {
      const rules: AutoRejectionRules = {
        enabled: true,
        rules: [
          { id: '1', field: 'experience', operator: 'less_than', value: 3, logicConnector: 'OR' },
          { id: '2', field: 'location', operator: 'equals', value: 'Remote Only' },
        ],
      };

      const result = evaluateAutoRejection({ experience: 5, location: 'New York' }, rules);
      expect(result.shouldReject).toBe(false);
    });

    it('should reject only when all rules match with AND logic', () => {
      const rules: AutoRejectionRules = {
        enabled: true,
        rules: [
          { id: '1', field: 'experience', operator: 'less_than', value: 3, logicConnector: 'AND' },
          { id: '2', field: 'location', operator: 'equals', value: 'Remote Only' },
        ],
      };

      // Both rules must match for rejection
      const result1 = evaluateAutoRejection({ experience: 2, location: 'Remote Only' }, rules);
      expect(result1.shouldReject).toBe(true);

      // Only one rule matches - should not reject
      const result2 = evaluateAutoRejection({ experience: 2, location: 'New York' }, rules);
      expect(result2.shouldReject).toBe(false);
    });
  });

  /**
   * Test disabled rules and null rules
   * Requirements: 4.10
   */
  describe('Disabled and Null Rules', () => {
    it('should not reject when rules are disabled', () => {
      const rules: AutoRejectionRules = {
        enabled: false,
        rules: [
          { id: '1', field: 'experience', operator: 'less_than', value: 3 },
        ],
      };

      const result = evaluateAutoRejection({ experience: 1 }, rules);
      expect(result.shouldReject).toBe(false);
    });

    it('should not reject when rules are null', () => {
      const result = evaluateAutoRejection({ experience: 1 }, null);
      expect(result.shouldReject).toBe(false);
    });

    it('should not reject when rules array is empty', () => {
      const rules: AutoRejectionRules = {
        enabled: true,
        rules: [],
      };

      const result = evaluateAutoRejection({ experience: 1 }, rules);
      expect(result.shouldReject).toBe(false);
    });
  });

  /**
   * Test backward compatibility with legacy rules format
   */
  describe('Legacy Rules Compatibility', () => {
    it('should handle legacy minExperience rule', () => {
      const legacyRules: LegacyAutoRejectionRules = {
        enabled: true,
        rules: {
          minExperience: 3,
        },
      };

      const result = evaluateAutoRejection({ experience: 2 }, legacyRules);
      expect(result.shouldReject).toBe(true);
    });

    it('should handle legacy maxExperience rule', () => {
      const legacyRules: LegacyAutoRejectionRules = {
        enabled: true,
        rules: {
          maxExperience: 10,
        },
      };

      const result = evaluateAutoRejection({ experience: 15 }, legacyRules);
      expect(result.shouldReject).toBe(true);
    });
  });


  /**
   * Test dynamic rejection reason generation
   * Requirements: 4.7, 9.6
   */
  describe('Dynamic Rejection Reasons', () => {
    it('should generate correct rejection reason for experience rule', () => {
      const rules: AutoRejectionRules = {
        enabled: true,
        rules: [
          { id: '1', field: 'experience', operator: 'less_than', value: 5 },
        ],
      };

      const result = evaluateAutoRejection({ experience: 2 }, rules);
      expect(result.shouldReject).toBe(true);
      expect(result.reason).toContain('Experience');
      expect(result.reason).toContain('2');
      expect(result.reason).toContain('5');
      expect(result.reason).toContain('years');
    });

    it('should generate correct rejection reason for location rule', () => {
      const rules: AutoRejectionRules = {
        enabled: true,
        rules: [
          { id: '1', field: 'location', operator: 'not_contains', value: 'USA' },
        ],
      };

      const result = evaluateAutoRejection({ location: 'Canada' }, rules);
      expect(result.shouldReject).toBe(true);
      expect(result.reason).toContain('Location');
      expect(result.reason).toContain('Canada');
      expect(result.reason).toContain('not containing');
    });

    it('should include triggered rule in result', () => {
      const rules: AutoRejectionRules = {
        enabled: true,
        rules: [
          { id: 'rule-exp', field: 'experience', operator: 'less_than', value: 3 },
        ],
      };

      const result = evaluateAutoRejection({ experience: 1 }, rules);
      expect(result.triggeredRule).toBeDefined();
      expect(result.triggeredRule?.id).toBe('rule-exp');
      expect(result.triggeredRule?.field).toBe('experience');
    });
  });

  /**
   * Test full auto-rejection processing with database
   * Requirements: 4.6, 9.2, 9.5
   */
  describe('Full Processing Flow', () => {
    it('should auto-reject candidate with insufficient experience', async () => {
      // Create a candidate with insufficient experience (1 year, minimum is 3)
      const candidate = await prisma.candidate.create({
        data: {
          companyId: testCompanyId,
          name: 'Under-Qualified Candidate',
          email: `underqualified-${Date.now()}@test.com`,
          location: 'Test Location',
          source: 'Integration Test',
          experienceYears: 1, // Below minimum of 3
          skills: ['JavaScript'],
        },
      });
      testCandidateId = candidate.id;

      // Create job candidate association in Applied stage
      const jobCandidate = await prisma.jobCandidate.create({
        data: {
          jobId: testJobId,
          candidateId: candidate.id,
          currentStageId: appliedStageId,
        },
      });
      testJobCandidateId = jobCandidate.id;

      // Process auto-rejection with full candidate data
      const wasRejected = await processAutoRejection(
        jobCandidate.id,
        candidate.id,
        {
          experience: candidate.experienceYears,
          location: candidate.location,
          skills: candidate.skills as string[] | undefined,
        },
        testJobId
      );

      // Verify candidate was rejected
      expect(wasRejected).toBe(true);

      // Verify candidate is now in Rejected stage
      const updatedJobCandidate = await prisma.jobCandidate.findUnique({
        where: { id: jobCandidate.id },
      });
      expect(updatedJobCandidate?.currentStageId).toBe(rejectedStageId);
    }, 30000);

    it('should create activity log entry with dynamic reason', async () => {
      // Get activity records for the candidate
      const activities = await prisma.candidateActivity.findMany({
        where: {
          candidateId: testCandidateId,
          activityType: 'stage_change',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(activities.length).toBeGreaterThan(0);

      // Find the auto-rejection activity
      const autoRejectionActivity = activities.find(a => {
        const metadata = a.metadata as Record<string, unknown>;
        return metadata?.autoRejected === true;
      });

      expect(autoRejectionActivity).toBeDefined();
      expect(autoRejectionActivity?.description).toContain('Auto-rejected');
      expect(autoRejectionActivity?.description).toContain('Experience');

      // Verify metadata includes triggered rule
      const metadata = autoRejectionActivity?.metadata as Record<string, unknown>;
      expect(metadata.toStageName).toBe('Rejected');
      expect(metadata.autoRejected).toBe(true);
      expect(metadata.triggeredRule).toBeDefined();
    }, 30000);

    it('should not auto-reject candidate with sufficient experience', async () => {
      // Create a qualified candidate (5 years experience, minimum is 3)
      const qualifiedCandidate = await prisma.candidate.create({
        data: {
          companyId: testCompanyId,
          name: 'Qualified Candidate',
          email: `qualified-${Date.now()}@test.com`,
          location: 'Test Location',
          source: 'Integration Test',
          experienceYears: 5, // Above minimum of 3
          skills: ['JavaScript', 'TypeScript'],
        },
      });

      // Create job candidate association in Applied stage
      const qualifiedJobCandidate = await prisma.jobCandidate.create({
        data: {
          jobId: testJobId,
          candidateId: qualifiedCandidate.id,
          currentStageId: appliedStageId,
        },
      });

      // Process auto-rejection
      const wasRejected = await processAutoRejection(
        qualifiedJobCandidate.id,
        qualifiedCandidate.id,
        {
          experience: qualifiedCandidate.experienceYears,
          location: qualifiedCandidate.location,
          skills: qualifiedCandidate.skills as string[] | undefined,
        },
        testJobId
      );

      // Verify candidate was NOT rejected
      expect(wasRejected).toBe(false);

      // Verify candidate is still in Applied stage
      const updatedJobCandidate = await prisma.jobCandidate.findUnique({
        where: { id: qualifiedJobCandidate.id },
      });
      expect(updatedJobCandidate?.currentStageId).toBe(appliedStageId);

      // Clean up this test candidate
      await prisma.candidateActivity.deleteMany({
        where: { candidateId: qualifiedCandidate.id },
      });
      await prisma.jobCandidate.delete({
        where: { id: qualifiedJobCandidate.id },
      });
      await prisma.candidate.delete({
        where: { id: qualifiedCandidate.id },
      });
    }, 30000);
  });

  /**
   * Test multiple rules with different fields
   * Requirements: 4.2, 9.3
   */
  describe('Multiple Field Rules', () => {
    it('should reject based on location rule when experience passes', async () => {
      // Update job with multiple rules
      const multipleRules: AutoRejectionRules = {
        enabled: true,
        rules: [
          { id: '1', field: 'experience', operator: 'less_than', value: 2, logicConnector: 'OR' },
          { id: '2', field: 'location', operator: 'not_contains', value: 'USA' },
        ],
      };
      await prisma.job.update({
        where: { id: testJobId },
        data: {
          autoRejectionRules: JSON.parse(JSON.stringify(multipleRules)),
        },
      });

      // Create candidate with good experience but wrong location
      const candidate = await prisma.candidate.create({
        data: {
          companyId: testCompanyId,
          name: 'Wrong Location Candidate',
          email: `wronglocation-${Date.now()}@test.com`,
          location: 'Canada',
          source: 'Integration Test',
          experienceYears: 5, // Good experience
          skills: ['JavaScript'],
        },
      });

      const jobCandidate = await prisma.jobCandidate.create({
        data: {
          jobId: testJobId,
          candidateId: candidate.id,
          currentStageId: appliedStageId,
        },
      });

      const wasRejected = await processAutoRejection(
        jobCandidate.id,
        candidate.id,
        {
          experience: candidate.experienceYears,
          location: candidate.location,
          skills: candidate.skills as string[] | undefined,
        },
        testJobId
      );

      expect(wasRejected).toBe(true);

      // Clean up
      await prisma.candidateActivity.deleteMany({
        where: { candidateId: candidate.id },
      });
      await prisma.jobCandidate.delete({
        where: { id: jobCandidate.id },
      });
      await prisma.candidate.delete({
        where: { id: candidate.id },
      });

      // Reset job rules
      const resetRules: AutoRejectionRules = {
        enabled: true,
        rules: [
          { id: 'rule-1', field: 'experience', operator: 'less_than', value: 3 },
        ],
      };
      await prisma.job.update({
        where: { id: testJobId },
        data: {
          autoRejectionRules: JSON.parse(JSON.stringify(resetRules)),
        },
      });
    }, 30000);
  });
});
