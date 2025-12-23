import prisma from '../lib/prisma.js';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';
import { emailService } from './email.service.js';
import type { Interview, User } from '../types/index.js';

export type NotificationType = 'stage_change' | 'feedback_pending' | 'sla_breach' | 'interview_scheduled' | 'offer_pending';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  createdAt: Date;
}

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}

export interface GetNotificationsOptions {
  unreadOnly?: boolean;
  limit?: number;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export const notificationService = {
  async createNotification(data: CreateNotificationData): Promise<Notification> {
    const errors: Record<string, string[]> = {};
    if (!data.userId) errors.userId = ['User ID is required'];
    if (!data.type) errors.type = ['Notification type is required'];
    if (!data.title || data.title.trim() === '') errors.title = ['Title is required'];
    if (!data.message || data.message.trim() === '') errors.message = ['Message is required'];
    if (Object.keys(errors).length > 0) throw new ValidationError(errors);

    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) throw new NotFoundError('User');

    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title.trim(),
        message: data.message.trim(),
        entityType: data.entityType,
        entityId: data.entityId,
        isRead: false,
      },
    });

    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type as NotificationType,
      title: notification.title,
      message: notification.message,
      entityType: notification.entityType ?? undefined,
      entityId: notification.entityId ?? undefined,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    };
  },

  async getNotifications(userId: string, options: GetNotificationsOptions = {}): Promise<NotificationsResponse> {
    const { unreadOnly = false, limit = 50 } = options;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');

    const where: { userId: string; isRead?: boolean } = { userId };
    if (unreadOnly) where.isRead = false;

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    const unreadCount = await prisma.notification.count({ where: { userId, isRead: false } });

    return {
      notifications: notifications.map((n) => ({
        id: n.id,
        userId: n.userId,
        type: n.type as NotificationType,
        title: n.title,
        message: n.message,
        entityType: n.entityType ?? undefined,
        entityId: n.entityId ?? undefined,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
      unreadCount,
    };
  },

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) throw new NotFoundError('Notification');
    if (notification.userId !== userId) throw new NotFoundError('Notification');

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
    return {
      id: updated.id,
      userId: updated.userId,
      type: updated.type as NotificationType,
      title: updated.title,
      message: updated.message,
      entityType: updated.entityType ?? undefined,
      entityId: updated.entityId ?? undefined,
      isRead: updated.isRead,
      createdAt: updated.createdAt,
    };
  },

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { count: result.count };
  },

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, isRead: false } });
  },

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) throw new NotFoundError('Notification');
    if (notification.userId !== userId) throw new NotFoundError('Notification');
    await prisma.notification.delete({ where: { id: notificationId } });
  },

  async createStageChangeNotifications(params: {
    candidateId: string;
    candidateName: string;
    jobId: string;
    jobTitle: string;
    fromStageName: string;
    toStageName: string;
    movedByUserId?: string;
  }): Promise<Notification[]> {
    const { candidateId, candidateName, jobId, jobTitle, fromStageName, toStageName, movedByUserId } = params;
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        assignedRecruiter: true,
        company: { include: { users: { where: { role: { in: ['admin', 'hiring_manager'] }, isActive: true } } } },
      },
    });
    if (!job) return [];

    const notifications: Notification[] = [];
    const usersToNotify = new Set<string>();
    if (job.assignedRecruiterId && job.assignedRecruiterId !== movedByUserId) usersToNotify.add(job.assignedRecruiterId);
    for (const user of job.company.users) {
      if (user.id !== movedByUserId) usersToNotify.add(user.id);
    }

    for (const uId of usersToNotify) {
      const notif = await this.createNotification({
        userId: uId,
        type: 'stage_change',
        title: 'Candidate Stage Changed',
        message: `${candidateName} moved from ${fromStageName} to ${toStageName} for ${jobTitle}`,
        entityType: 'candidate',
        entityId: candidateId,
      });
      notifications.push(notif);
    }
    return notifications;
  },

  async getPendingFeedbackInterviews(companyId: string) {
    const interviews = await prisma.interview.findMany({
      where: {
        OR: [{ status: 'completed' }, { status: 'scheduled', scheduledAt: { lt: new Date() } }],
        jobCandidate: { job: { companyId } },
      },
      include: {
        jobCandidate: { include: { candidate: true, job: true } },
        panelMembers: true,
        feedback: true,
      },
      orderBy: { scheduledAt: 'desc' },
    });

    const result: Array<{
      interviewId: string;
      candidateName: string;
      jobTitle: string;
      scheduledAt: Date;
      feedbackPercentage: number;
      pendingCount: number;
    }> = [];

    for (const interview of interviews) {
      const total = interview.panelMembers.length;
      const submitted = interview.feedback.length;
      const pending = total - submitted;
      if (pending > 0) {
        result.push({
          interviewId: interview.id,
          candidateName: interview.jobCandidate?.candidate?.name || 'Unknown',
          jobTitle: interview.jobCandidate?.job?.title || 'Unknown',
          scheduledAt: interview.scheduledAt,
          feedbackPercentage: total > 0 ? Math.round((submitted / total) * 100) : 0,
          pendingCount: pending,
        });
      }
    }
    return result;
  },

  async getFeedbackCompletionStatus(interviewId: string) {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { panelMembers: { include: { user: true } }, feedback: true },
    });
    if (!interview) throw new NotFoundError('Interview');

    const total = interview.panelMembers.length;
    const submitted = interview.feedback.length;
    const pending = total - submitted;
    const percentage = total > 0 ? Math.round((submitted / total) * 100) : 0;

    const feedbackSubmitterIds = new Set(interview.feedback.map((fb) => fb.panelMemberId));
    const pendingMembers = interview.panelMembers
      .filter((pm) => !feedbackSubmitterIds.has(pm.userId))
      .map((pm) => ({ id: pm.user.id, name: pm.user.name, email: pm.user.email }));

    return { total, submitted, pending, percentage, pendingMembers };
  },


  mapInterviewForEmail(interview: {
    id: string;
    scheduledAt: Date;
    duration: number;
    timezone: string;
    mode: string;
    meetingLink: string | null;
    location: string | null;
    jobCandidate?: {
      candidate?: { name: string; email: string } | null;
      job?: { title: string; companyId?: string; company?: { name: string } | null } | null;
    } | null;
    panelMembers?: Array<{ user: { name: string; email: string } }>;
  }): Interview {
    return {
      id: interview.id,
      jobCandidateId: '',
      scheduledAt: interview.scheduledAt,
      duration: interview.duration,
      timezone: interview.timezone,
      mode: interview.mode as 'google_meet' | 'microsoft_teams' | 'in_person',
      meetingLink: interview.meetingLink ?? undefined,
      location: interview.location ?? undefined,
      status: 'scheduled',
      scheduledBy: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      jobCandidate: {
        id: '',
        jobId: '',
        candidateId: '',
        currentStageId: '',
        appliedAt: new Date(),
        updatedAt: new Date(),
        candidate: {
          id: '',
          companyId: '',
          name: interview.jobCandidate?.candidate?.name || 'Candidate',
          email: interview.jobCandidate?.candidate?.email || '',
          experienceYears: 0,
          location: '',
          source: '',
          skills: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        job: {
          id: '',
          companyId: interview.jobCandidate?.job?.companyId || '',
          title: interview.jobCandidate?.job?.title || 'Position',
          department: '',
          description: '',
          status: 'active',
          openings: 1,
          skills: [],
          locations: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      panelMembers: (interview.panelMembers || []).map((pm, index) => ({
        id: `temp-${index}`,
        interviewId: interview.id,
        userId: '',
        createdAt: new Date(),
        user: {
          id: '',
          companyId: '',
          name: pm.user.name,
          email: pm.user.email,
          role: 'recruiter' as const,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })),
    };
  },

  async processFeedbackPendingNotifications(hoursThreshold: number = 24): Promise<{
    notificationsCreated: number;
    emailsSent: number;
    errors: string[];
  }> {
    const result = { notificationsCreated: 0, emailsSent: 0, errors: [] as string[] };
    const cutoffTime = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);

    try {
      const interviews = await prisma.interview.findMany({
        where: {
          OR: [{ status: 'completed' }, { status: 'scheduled', scheduledAt: { lt: cutoffTime } }],
        },
        include: {
          jobCandidate: { include: { candidate: true, job: true } },
          panelMembers: { include: { user: true } },
          feedback: true,
        },
      });

      for (const interview of interviews) {
        const submittedFeedbackUserIds = new Set(interview.feedback.map((f) => f.panelMemberId));
        const pendingPanelMembers = interview.panelMembers.filter((pm) => !submittedFeedbackUserIds.has(pm.userId));
        const interviewEndTime = new Date(interview.scheduledAt.getTime() + interview.duration * 60 * 1000);

        if (pendingPanelMembers.length > 0 && interviewEndTime < cutoffTime) {
          const candidateName = interview.jobCandidate?.candidate?.name || 'Candidate';
          const jobTitle = interview.jobCandidate?.job?.title || 'Position';

          for (const pm of pendingPanelMembers) {
            try {
              const existingNotification = await prisma.notification.findFirst({
                where: { userId: pm.userId, type: 'feedback_pending', entityType: 'interview', entityId: interview.id },
              });

              if (!existingNotification) {
                await this.createNotification({
                  userId: pm.userId,
                  type: 'feedback_pending',
                  title: 'Interview Feedback Pending',
                  message: `Your feedback for the interview with ${candidateName} for ${jobTitle} is overdue.`,
                  entityType: 'interview',
                  entityId: interview.id,
                });
                result.notificationsCreated++;

                const interviewData = this.mapInterviewForEmail(interview);
                const panelMemberUser: User = {
                  id: pm.user.id,
                  companyId: pm.user.companyId,
                  name: pm.user.name,
                  email: pm.user.email,
                  role: pm.user.role as 'admin' | 'hiring_manager' | 'recruiter',
                  isActive: pm.user.isActive,
                  createdAt: pm.user.createdAt,
                  updatedAt: pm.user.updatedAt,
                };
                const emailResult = await emailService.sendFeedbackReminder(interviewData, panelMemberUser);
                if (emailResult.success) result.emailsSent++;
                else result.errors.push(`Failed to send email to ${pm.user.email}: ${emailResult.error}`);
              }
            } catch (error) {
              result.errors.push(`Error processing panel member ${pm.userId}: ${error instanceof Error ? error.message : 'Unknown'}`);
            }
          }
        }
      }
    } catch (error) {
      result.errors.push(`Error fetching interviews: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
    return result;
  },

  async checkAndMarkFeedbackComplete(interviewId: string): Promise<{ isComplete: boolean; markedComplete: boolean }> {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { panelMembers: true, feedback: true },
    });
    if (!interview) throw new NotFoundError('Interview');

    const panelMemberIds = new Set(interview.panelMembers.map((pm) => pm.userId));
    const feedbackSubmitterIds = new Set(interview.feedback.map((fb) => fb.panelMemberId));

    let allFeedbackSubmitted = true;
    for (const panelMemberId of panelMemberIds) {
      if (!feedbackSubmitterIds.has(panelMemberId)) {
        allFeedbackSubmitted = false;
        break;
      }
    }

    if (allFeedbackSubmitted && panelMemberIds.size > 0) {
      if (interview.status !== 'completed') {
        await prisma.interview.update({ where: { id: interviewId }, data: { status: 'completed' } });
        return { isComplete: true, markedComplete: true };
      }
      return { isComplete: true, markedComplete: false };
    }
    return { isComplete: false, markedComplete: false };
  },
};

export default notificationService;
