/**
 * Integration Test: Interview Scheduling with Round Type
 * **Validates: Requirements 6.5, 6.6**
 * 
 * Tests the interview scheduling flow with round type:
 * 1. Schedule interview with round type
 * 2. Verify round type is stored in database
 * 3. Verify round type is returned when retrieving interview
 * 4. Verify round type can be updated
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../../lib/prisma.js';
import { interviewService } from '../../services/interview.service.js';
import type { CreateInterviewInput } from '../../types/index.js';

// Test data
let testCompanyId: string;
let testUserId: string;
let testJobId: string;
let testCandidateId: string;
let testJobCandidateId: string;
let testInterviewId: string;

beforeAll(async () => {
  // Create a test company
  const company = await prisma.company.create({
    data: {
      name: 'Interview Round Test Company',
      contactEmail: 'test@interviewround.com',
    },
  });
  testCompanyId = company.id;

  // Create a test user (scheduler and panel member)
  const user = await prisma.user.create({
    data: {
      name: 'Test Scheduler',
      email: `scheduler-${Date.now()}@interviewround.com`,
      passwordHash: 'hashedpassword',
      role: 'admin',
      companyId: testCompanyId,
      isActive: true,
    },
  });
  testUserId = user.id;

  // Create a test job with pipeline stages
  const job = await prisma.job.create({
    data: {
      companyId: testCompanyId,
      title: 'Interview Round Test Job',
      department: 'Engineering',
      location: 'Remote',
      employmentType: 'Full-time',
      description: 'Test job for interview round integration testing',
      status: 'active',
    },
  });
  testJobId = job.id;

  // Create pipeline stages including Interview
  await prisma.pipelineStage.createMany({
    data: [
      { jobId: testJobId, name: 'Applied', position: 0, isDefault: true },
      { jobId: testJobId, name: 'Screening', position: 1, isDefault: true },
      { jobId: testJobId, name: 'Interview', position: 2, isDefault: true },
      { jobId: testJobId, name: 'Hired', position: 3, isDefault: true },
    ],
  });

  // Get the Interview stage for creating job candidate
  const interviewStage = await prisma.pipelineStage.findFirst({
    where: { jobId: testJobId, name: 'Interview' },
  });

  // Create a test candidate
  const candidate = await prisma.candidate.create({
    data: {
      companyId: testCompanyId,
      name: 'Interview Round Test Candidate',
      email: `candidate-${Date.now()}@interviewround.com`,
      location: 'Test Location',
      source: 'Integration Test',
      experienceYears: 5,
      skills: ['JavaScript', 'TypeScript'],
    },
  });
  testCandidateId = candidate.id;

  // Create job candidate association
  const jobCandidate = await prisma.jobCandidate.create({
    data: {
      jobId: testJobId,
      candidateId: candidate.id,
      currentStageId: interviewStage!.id,
    },
  });
  testJobCandidateId = jobCandidate.id;
}, 60000);

afterAll(async () => {
  // Clean up in reverse order of creation
  try {
    // Delete calendar events for the interview
    if (testInterviewId) {
      await prisma.calendarEvent.deleteMany({
        where: { interviewId: testInterviewId },
      });
    }

    // Delete interview feedback
    if (testInterviewId) {
      await prisma.interviewFeedback.deleteMany({
        where: { interviewId: testInterviewId },
      });
    }

    // Delete interview panel members
    if (testInterviewId) {
      await prisma.interviewPanel.deleteMany({
        where: { interviewId: testInterviewId },
      });
    }

    // Delete interviews
    if (testInterviewId) {
      await prisma.interview.delete({
        where: { id: testInterviewId },
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

    // Delete user
    if (testUserId) {
      await prisma.user.delete({
        where: { id: testUserId },
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

describe('Integration: Interview Scheduling with Round Type', () => {
  /**
   * Test scheduling an interview with a round type
   * Requirements: 6.5
   */
  it('should schedule interview with round type and store it', async () => {
    const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
    const roundType = 'Technical Round';

    const input: CreateInterviewInput = {
      jobCandidateId: testJobCandidateId,
      scheduledAt: scheduledAt.toISOString(),
      duration: 60,
      timezone: 'America/New_York',
      mode: 'google_meet',
      panelMemberIds: [testUserId],
      scheduledBy: testUserId,
      roundType: roundType,
    };

    const interview = await interviewService.createInterview(input);
    testInterviewId = interview.id;

    // Verify interview was created with round type (Requirements 6.5)
    expect(interview.id).toBeDefined();
    expect(interview.roundType).toBe(roundType);
    expect(interview.duration).toBe(60);
    expect(interview.mode).toBe('google_meet');
    expect(interview.status).toBe('scheduled');
  }, 30000);

  /**
   * Test retrieving interview shows round type
   * Requirements: 6.6
   */
  it('should return round type when retrieving interview', async () => {
    // Retrieve the interview (Requirements 6.6)
    const interview = await interviewService.getInterview(testInterviewId);

    expect(interview).not.toBeNull();
    expect(interview!.id).toBe(testInterviewId);
    expect(interview!.roundType).toBe('Technical Round');
  }, 30000);

  /**
   * Test round type is stored correctly in database
   * Requirements: 6.5
   */
  it('should persist round type in database', async () => {
    // Directly query database to verify persistence
    const dbInterview = await prisma.interview.findUnique({
      where: { id: testInterviewId },
    });

    expect(dbInterview).not.toBeNull();
    expect(dbInterview!.roundType).toBe('Technical Round');
  }, 30000);

  /**
   * Test updating interview round type
   * Requirements: 6.5
   */
  it('should update interview round type', async () => {
    const newRoundType = 'HR Round';

    const updatedInterview = await interviewService.updateInterview(testInterviewId, {
      roundType: newRoundType,
    });

    expect(updatedInterview.roundType).toBe(newRoundType);

    // Verify in database
    const dbInterview = await prisma.interview.findUnique({
      where: { id: testInterviewId },
    });
    expect(dbInterview!.roundType).toBe(newRoundType);
  }, 30000);

  /**
   * Test listing interviews includes round type
   * Requirements: 6.6
   */
  it('should include round type when listing interviews', async () => {
    const interviews = await interviewService.listInterviews({
      jobCandidateId: testJobCandidateId,
    });

    expect(interviews.length).toBeGreaterThan(0);
    
    const interview = interviews.find(i => i.id === testInterviewId);
    expect(interview).toBeDefined();
    expect(interview!.roundType).toBe('HR Round'); // Updated in previous test
  }, 30000);

  /**
   * Test scheduling interview without round type (optional field)
   * Requirements: 6.5
   */
  it('should allow scheduling interview without round type', async () => {
    const scheduledAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // Day after tomorrow

    const input: CreateInterviewInput = {
      jobCandidateId: testJobCandidateId,
      scheduledAt: scheduledAt.toISOString(),
      duration: 45,
      timezone: 'UTC',
      mode: 'in_person',
      location: 'Office Building A',
      panelMemberIds: [testUserId],
      scheduledBy: testUserId,
      // No roundType specified
    };

    const interview = await interviewService.createInterview(input);

    expect(interview.id).toBeDefined();
    expect(interview.roundType).toBeUndefined();
    expect(interview.mode).toBe('in_person');
    expect(interview.location).toBe('Office Building A');

    // Clean up this additional interview
    await prisma.interviewPanel.deleteMany({
      where: { interviewId: interview.id },
    });
    await prisma.interview.delete({
      where: { id: interview.id },
    });
  }, 30000);

  /**
   * Test getting interview round options for a job
   * Requirements: 6.2, 6.3, 6.4
   */
  it('should return default round options when no custom sub-stages defined', async () => {
    const roundOptions = await interviewService.getInterviewRoundOptions(testJobId);

    expect(roundOptions.length).toBe(4);
    expect(roundOptions.map(o => o.name)).toContain('Technical Round');
    expect(roundOptions.map(o => o.name)).toContain('HR Round');
    expect(roundOptions.map(o => o.name)).toContain('Managerial Round');
    expect(roundOptions.map(o => o.name)).toContain('Final Round');
    
    // All should be marked as not custom
    expect(roundOptions.every(o => o.isCustom === false)).toBe(true);
  }, 30000);

  /**
   * Test getting interview round options with custom sub-stages
   * Requirements: 6.2, 6.3
   */
  it('should return custom sub-stages as round options when defined', async () => {
    // Get the Interview stage
    const interviewStage = await prisma.pipelineStage.findFirst({
      where: { jobId: testJobId, name: 'Interview', parentId: null },
    });

    // Create custom sub-stages for the Interview stage with unique positions (100+)
    await prisma.pipelineStage.createMany({
      data: [
        { jobId: testJobId, name: 'Coding Challenge', position: 100, parentId: interviewStage!.id },
        { jobId: testJobId, name: 'System Design', position: 101, parentId: interviewStage!.id },
        { jobId: testJobId, name: 'Culture Fit', position: 102, parentId: interviewStage!.id },
      ],
    });

    const roundOptions = await interviewService.getInterviewRoundOptions(testJobId);

    expect(roundOptions.length).toBe(3);
    expect(roundOptions.map(o => o.name)).toContain('Coding Challenge');
    expect(roundOptions.map(o => o.name)).toContain('System Design');
    expect(roundOptions.map(o => o.name)).toContain('Culture Fit');
    
    // All should be marked as custom
    expect(roundOptions.every(o => o.isCustom === true)).toBe(true);

    // Clean up sub-stages
    await prisma.pipelineStage.deleteMany({
      where: { jobId: testJobId, parentId: interviewStage!.id },
    });
  }, 30000);
});
