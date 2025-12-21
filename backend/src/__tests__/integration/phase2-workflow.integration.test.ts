/**
 * Integration Test: Phase 2 Pipeline Workflow Engine
 * **Validates: Requirements 1.3, 1.4, 5.1, 5.4, 6.1, 6.4, 8.1, 8.5, 10.1, 10.5**
 * 
 * Tests the complete Phase 2 workflow:
 * 1. Bulk move flow - select candidates, move to stage, verify notifications
 * 2. Candidate profile page - view profile, add notes/attachments, verify timeline
 * 3. Notifications flow - trigger stage change, verify notification, mark as read
 * 4. SLA alerts - configure threshold, create candidate exceeding threshold, verify alert
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../../lib/prisma.js';
import bulkMoveService from '../../services/bulkMove.service.js';
import notificationService from '../../services/notification.service.js';
import notesService from '../../services/notes.service.js';
import attachmentsService from '../../services/attachments.service.js';
import slaService from '../../services/sla.service.js';
import candidateService from '../../services/candidate.service.js';
import { stageHistoryService } from '../../services/stageHistory.service.js';

// Test data
let testCompanyId: string;
let testUserId: string;
let testRecipientUserId: string; // User who receives notifications
let testJobId: string;
let testCandidateIds: string[] = [];
let testJobCandidateIds: string[] = [];
let appliedStageId: string;
let screeningStageId: string;
let interviewStageId: string;

beforeAll(async () => {
  // Create a test company
  const company = await prisma.company.create({
    data: {
      name: 'Phase 2 Integration Test Company',
      contactEmail: 'test@phase2integration.com',
    },
  });
  testCompanyId = company.id;

  // Create a test user (the one who performs actions)
  const user = await prisma.user.create({
    data: {
      name: 'Test User',
      email: `testuser-${Date.now()}@phase2integration.com`,
      passwordHash: 'hashedpassword',
      role: 'admin',
      companyId: testCompanyId,
      isActive: true,
    },
  });
  testUserId = user.id;

  // Create a second user who will receive notifications (hiring manager)
  const recipientUser = await prisma.user.create({
    data: {
      name: 'Notification Recipient',
      email: `recipient-${Date.now()}@phase2integration.com`,
      passwordHash: 'hashedpassword',
      role: 'hiring_manager',
      companyId: testCompanyId,
      isActive: true,
    },
  });
  testRecipientUserId = recipientUser.id;

  // Create a test job with pipeline stages
  const job = await prisma.job.create({
    data: {
      companyId: testCompanyId,
      title: 'Phase 2 Test Job',
      department: 'Engineering',
      location: 'Remote',
      employmentType: 'Full-time',
      description: 'Test job for Phase 2 integration testing',
      status: 'active',
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
  screeningStageId = stages[1].id;
  interviewStageId = stages[2].id;

  // Create test candidates
  for (let i = 0; i < 3; i++) {
    const candidate = await prisma.candidate.create({
      data: {
        companyId: testCompanyId,
        name: `Test Candidate ${i + 1}`,
        email: `candidate${i + 1}-${Date.now()}@test.com`,
        location: 'Test Location',
        source: 'Integration Test',
        experienceYears: 3 + i,
        skills: ['JavaScript', 'TypeScript'],
      },
    });
    testCandidateIds.push(candidate.id);

    // Create job candidate association
    const jobCandidate = await prisma.jobCandidate.create({
      data: {
        jobId: testJobId,
        candidateId: candidate.id,
        currentStageId: appliedStageId,
      },
    });
    testJobCandidateIds.push(jobCandidate.id);

    // Create initial stage history entry
    await stageHistoryService.createStageEntry({
      jobCandidateId: jobCandidate.id,
      stageId: appliedStageId,
      stageName: 'Applied',
      movedBy: testUserId,
    });
  }
}, 60000);

afterAll(async () => {
  // Clean up in reverse order of creation
  try {
    // Delete notifications for both users
    await prisma.notification.deleteMany({
      where: { userId: { in: [testUserId, testRecipientUserId] } },
    });

    // Delete SLA configs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).sLAConfig.deleteMany({
      where: { companyId: testCompanyId },
    });

    // Delete stage history
    await prisma.stageHistory.deleteMany({
      where: { jobCandidateId: { in: testJobCandidateIds } },
    });

    // Delete candidate activities
    await prisma.candidateActivity.deleteMany({
      where: { candidateId: { in: testCandidateIds } },
    });

    // Delete candidate notes
    await prisma.candidateNote.deleteMany({
      where: { candidateId: { in: testCandidateIds } },
    });

    // Delete candidate attachments
    await prisma.candidateAttachment.deleteMany({
      where: { candidateId: { in: testCandidateIds } },
    });

    // Delete job candidates
    await prisma.jobCandidate.deleteMany({
      where: { id: { in: testJobCandidateIds } },
    });

    // Delete candidates
    await prisma.candidate.deleteMany({
      where: { id: { in: testCandidateIds } },
    });

    // Delete pipeline stages
    await prisma.pipelineStage.deleteMany({
      where: { jobId: testJobId },
    });

    // Delete job
    await prisma.job.delete({
      where: { id: testJobId },
    });

    // Delete user
    await prisma.user.delete({
      where: { id: testUserId },
    });

    // Delete recipient user
    await prisma.user.delete({
      where: { id: testRecipientUserId },
    });

    // Delete company
    await prisma.company.delete({
      where: { id: testCompanyId },
    });
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}, 60000);

describe('Integration: 24.1 Test complete bulk move flow', () => {
  /**
   * Test bulk move of multiple candidates
   * Requirements: 1.3, 1.4, 8.1
   */
  it('should move multiple candidates to a new stage with comment', async () => {
    // Select first two candidates for bulk move
    const candidatesToMove = testJobCandidateIds.slice(0, 2);
    const comment = 'Bulk move test - moving to screening';

    // Execute bulk move
    const result = await bulkMoveService.move({
      candidateIds: candidatesToMove,
      targetStageId: screeningStageId,
      jobId: testJobId,
      comment,
      movedBy: testUserId,
    });

    // Verify all candidates were moved (Requirements 1.3)
    expect(result.success).toBe(true);
    expect(result.movedCount).toBe(2);
    expect(result.failedCount).toBe(0);

    // Verify candidates are now in the screening stage
    for (const jobCandidateId of candidatesToMove) {
      const jobCandidate = await prisma.jobCandidate.findUnique({
        where: { id: jobCandidateId },
      });
      expect(jobCandidate?.currentStageId).toBe(screeningStageId);
    }
  }, 30000);

  it('should create activity records for each moved candidate', async () => {
    // Verify activity records were created (Requirements 1.4)
    for (const candidateId of testCandidateIds.slice(0, 2)) {
      const activities = await prisma.candidateActivity.findMany({
        where: {
          candidateId,
          activityType: 'stage_change',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(activities.length).toBeGreaterThan(0);
      const latestActivity = activities[0];
      expect(latestActivity.description).toContain('Screening');
      expect(latestActivity.description).toContain('Bulk move test');
    }
  }, 30000);

  it('should create notifications for stage changes', async () => {
    // Wait a moment for notifications to be created
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify notifications were created for the recipient user (Requirements 8.1)
    // Note: Notifications are sent to OTHER users, not the one who performed the action
    const { notifications } = await notificationService.getNotifications(testRecipientUserId);
    
    // Should have notifications for stage changes
    const stageChangeNotifications = notifications.filter(
      n => n.type === 'stage_change'
    );
    
    expect(stageChangeNotifications.length).toBeGreaterThan(0);
  }, 30000);
});

describe('Integration: 24.2 Test candidate profile page', () => {
  /**
   * Test viewing candidate profile with all sections
   * Requirements: 5.1, 5.4, 6.1, 6.4
   */
  it('should retrieve candidate profile with all details', async () => {
    const candidateId = testCandidateIds[0];

    // Get candidate details (Requirements 5.1)
    const candidate = await candidateService.getById(candidateId);
    
    expect(candidate).toBeDefined();
    expect(candidate.name).toBe('Test Candidate 1');
    expect(candidate.email).toBeDefined();
    expect(candidate.location).toBe('Test Location');
    expect(candidate.skills).toContain('JavaScript');
  }, 30000);

  it('should add notes to candidate profile', async () => {
    const candidateId = testCandidateIds[0];

    // Add a note (Requirements 6.1)
    const note = await notesService.createNote({
      candidateId,
      content: 'Integration test note - candidate shows strong potential',
      createdBy: testUserId,
    });

    expect(note.id).toBeDefined();
    expect(note.content).toBe('Integration test note - candidate shows strong potential');
    expect(note.authorName).toBe('Test User');

    // Verify note appears in notes list
    const notes = await notesService.getNotes(candidateId);
    expect(notes.length).toBeGreaterThan(0);
    expect(notes[0].content).toBe('Integration test note - candidate shows strong potential');
  }, 30000);

  it('should add attachments to candidate profile', async () => {
    const candidateId = testCandidateIds[0];

    // Add an attachment (Requirements 6.4)
    const attachment = await attachmentsService.uploadAttachment({
      candidateId,
      fileName: 'test-document.pdf',
      fileUrl: '/uploads/attachments/test-document.pdf',
      fileType: 'application/pdf',
      fileSize: 1024,
      uploadedBy: testUserId,
    });

    expect(attachment.id).toBeDefined();
    expect(attachment.fileName).toBe('test-document.pdf');
    expect(attachment.uploaderName).toBe('Test User');

    // Verify attachment appears in attachments list
    const attachments = await attachmentsService.getAttachments(candidateId);
    expect(attachments.length).toBeGreaterThan(0);
    expect(attachments[0].fileName).toBe('test-document.pdf');
  }, 30000);

  it('should show all activities in timeline', async () => {
    const candidateId = testCandidateIds[0];

    // Get activity timeline (Requirements 5.4)
    const activities = await candidateService.getActivityTimeline(candidateId);

    expect(activities.length).toBeGreaterThan(0);
    
    // Should include stage change activities
    const stageChangeActivities = activities.filter(
      a => a.activityType === 'stage_change'
    );
    expect(stageChangeActivities.length).toBeGreaterThan(0);

    // Should include note added activities
    const noteActivities = activities.filter(
      a => a.activityType === 'note_added'
    );
    expect(noteActivities.length).toBeGreaterThan(0);
  }, 30000);
});

describe('Integration: 24.3 Test notifications flow', () => {
  /**
   * Test notification creation and management
   * Requirements: 8.1, 8.5
   * 
   * Note: Notifications are sent to OTHER users (hiring managers, admins), 
   * not the user who performed the action. So we check testRecipientUserId.
   */
  it('should create notification on stage change', async () => {
    // Move a candidate to trigger notification
    const jobCandidateId = testJobCandidateIds[2];
    
    await candidateService.changeStage({
      jobCandidateId,
      newStageId: screeningStageId,
      comment: 'Moving to screening for notification test',
      movedBy: testUserId,
    });

    // Wait for notification to be created
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify notification was created for the recipient user (Requirements 8.1)
    // Notifications go to OTHER users, not the one who performed the action
    const { notifications, unreadCount } = await notificationService.getNotifications(testRecipientUserId);
    
    expect(notifications.length).toBeGreaterThan(0);
    expect(unreadCount).toBeGreaterThan(0);
    
    // Verify the notification is about a stage change
    const stageChangeNotification = notifications.find(n => n.type === 'stage_change');
    expect(stageChangeNotification).toBeDefined();
  }, 30000);

  it('should mark notification as read and update count', async () => {
    // Get current notifications for the recipient user
    const { notifications: beforeNotifications, unreadCount: beforeCount } = 
      await notificationService.getNotifications(testRecipientUserId);
    
    expect(beforeNotifications.length).toBeGreaterThan(0);
    
    // Find an unread notification
    const unreadNotification = beforeNotifications.find(n => !n.isRead);
    
    if (unreadNotification) {
      // Mark as read (Requirements 8.5)
      const updatedNotification = await notificationService.markAsRead(
        unreadNotification.id,
        testRecipientUserId
      );
      
      expect(updatedNotification.isRead).toBe(true);

      // Verify unread count decreased
      const { unreadCount: afterCount } = await notificationService.getNotifications(testRecipientUserId);
      expect(afterCount).toBeLessThan(beforeCount);
    }
  }, 30000);

  it('should mark all notifications as read', async () => {
    // Mark all as read for the recipient user
    const result = await notificationService.markAllAsRead(testRecipientUserId);
    
    expect(result.count).toBeGreaterThanOrEqual(0);

    // Verify all are read
    const { unreadCount } = await notificationService.getNotifications(testRecipientUserId);
    expect(unreadCount).toBe(0);
  }, 30000);
});

describe('Integration: 24.4 Test SLA alerts', () => {
  /**
   * Test SLA configuration and breach detection
   * Requirements: 10.1, 10.5
   */
  it('should configure SLA threshold for a stage', async () => {
    // Configure SLA threshold (Requirements 10.5)
    const config = await slaService.updateSLAConfig(testCompanyId, {
      stageName: 'Screening',
      thresholdDays: 1, // 1 day threshold for testing
    });

    expect(config.id).toBeDefined();
    expect(config.stageName).toBe('Screening');
    expect(config.thresholdDays).toBe(1);

    // Verify config is retrievable
    const configs = await slaService.getSLAConfig(testCompanyId);
    expect(configs.length).toBeGreaterThan(0);
    
    const screeningConfig = configs.find(c => c.stageName === 'Screening');
    expect(screeningConfig).toBeDefined();
    expect(screeningConfig?.thresholdDays).toBe(1);
  }, 30000);

  it('should detect SLA breach for candidate exceeding threshold', async () => {
    // Create a candidate that has been in screening for too long
    const oldCandidate = await prisma.candidate.create({
      data: {
        companyId: testCompanyId,
        name: 'SLA Breach Test Candidate',
        email: `sla-breach-${Date.now()}@test.com`,
        location: 'Test Location',
        source: 'SLA Test',
        experienceYears: 5,
      },
    });
    testCandidateIds.push(oldCandidate.id);

    const oldJobCandidate = await prisma.jobCandidate.create({
      data: {
        jobId: testJobId,
        candidateId: oldCandidate.id,
        currentStageId: screeningStageId,
        appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
    });
    testJobCandidateIds.push(oldJobCandidate.id);

    // Create stage history with old entry date
    await prisma.stageHistory.create({
      data: {
        jobCandidateId: oldJobCandidate.id,
        stageId: screeningStageId,
        stageName: 'Screening',
        enteredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
    });

    // Check for SLA breaches (Requirements 10.1)
    const breaches = await slaService.checkSLABreaches(testCompanyId);
    
    expect(breaches.length).toBeGreaterThan(0);
    
    const breach = breaches.find(b => b.candidateId === oldCandidate.id);
    expect(breach).toBeDefined();
    expect(breach?.stageName).toBe('Screening');
    expect(breach?.daysOverdue).toBeGreaterThan(0);
  }, 30000);

  it('should return alerts including SLA breaches', async () => {
    // Get all alerts
    const alerts = await slaService.getAlerts(testCompanyId);
    
    expect(alerts.slaBreaches).toBeDefined();
    expect(alerts.slaBreaches.length).toBeGreaterThan(0);
    
    // Verify breach details
    const breach = alerts.slaBreaches[0];
    expect(breach.candidateName).toBeDefined();
    expect(breach.jobTitle).toBeDefined();
    expect(breach.stageName).toBeDefined();
    expect(breach.daysInStage).toBeGreaterThan(0);
    expect(breach.thresholdDays).toBe(1);
  }, 30000);

  it('should dismiss SLA alert when candidate moves to new stage', async () => {
    // Find the SLA breach candidate
    const breaches = await slaService.checkSLABreaches(testCompanyId);
    const breachCandidate = breaches.find(b => b.candidateName === 'SLA Breach Test Candidate');
    
    if (breachCandidate) {
      // Find the job candidate ID
      const jobCandidate = await prisma.jobCandidate.findFirst({
        where: { candidateId: breachCandidate.candidateId },
      });

      if (jobCandidate) {
        // Move candidate to interview stage (Requirements 10.4)
        await candidateService.changeStage({
          jobCandidateId: jobCandidate.id,
          newStageId: interviewStageId,
          comment: 'Moving to interview - SLA test',
          movedBy: testUserId,
        });

        // Check breaches again - should not include this candidate for Screening
        const newBreaches = await slaService.checkSLABreaches(testCompanyId);
        const stillBreached = newBreaches.find(
          b => b.candidateId === breachCandidate.candidateId && b.stageName === 'Screening'
        );
        
        expect(stillBreached).toBeUndefined();
      }
    }
  }, 30000);
});
