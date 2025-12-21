import prisma from '../lib/prisma.js';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';

/**
 * Notification type enum
 * Requirements: 8.1, 11.1
 */
export type NotificationType = 
  | 'stage_change'
  | 'feedback_pending'
  | 'sla_breach'
  | 'interview_scheduled'
  | 'offer_pending';

/**
 * Notification interface
 * Requirements: 8.1, 8.2, 8.5, 11.1
 */
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
  /**
   * Create a new notification
   * Requirements: 8.1
   */
  async createNotification(data: CreateNotificationData): Promise<Notification> {
    // Validate required fields
    const errors: Record<string, string[]> = {};
    if (!data.userId) {
      errors.userId = ['User ID is required'];
    }
    if (!data.type) {
      errors.type = ['Notification type is required'];
    }
    if (!data.title || data.title.trim() === '') {
      errors.title = ['Title is required'];
    }
    if (!data.message || data.message.trim() === '') {
      errors.message = ['Message is required'];
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError(errors);
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Create the notification
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
      type: notification.type,
      title: notification.title,
      message: notification.message,
      entityType: notification.entityType ?? undefined,
      entityId: notification.entityId ?? undefined,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    };
  },

  /**
   * Get notifications for a user with optional unread filter
   * Requirements: 8.2, 8.3
   */
  async getNotifications(
    userId: string,
    options: GetNotificationsOptions = {}
  ): Promise<NotificationsResponse> {
    const { unreadOnly = false, limit = 50 } = options;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Build where clause
    const where: { userId: string; isRead?: boolean } = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    // Get notifications
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return {
      notifications: notifications.map((n: {
        id: string;
        userId: string;
        type: NotificationType;
        title: string;
        message: string;
        entityType: string | null;
        entityId: string | null;
        isRead: boolean;
        createdAt: Date;
      }) => ({
        id: n.id,
        userId: n.userId,
        type: n.type,
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

  /**
   * Mark a notification as read
   * Requirements: 8.5
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    // Find the notification
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundError('Notification');
    }

    // Verify the notification belongs to the user
    if (notification.userId !== userId) {
      throw new NotFoundError('Notification');
    }

    // Update the notification
    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      type: updated.type,
      title: updated.title,
      message: updated.message,
      entityType: updated.entityType ?? undefined,
      entityId: updated.entityId ?? undefined,
      isRead: updated.isRead,
      createdAt: updated.createdAt,
    };
  },

  /**
   * Mark all notifications as read for a user
   * Requirements: 8.5
   */
  async markAllAsRead(userId: string): Promise<{ count: number }> {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Update all unread notifications
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { count: result.count };
  },

  /**
   * Get unread notification count for a user
   * Requirements: 8.2
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundError('Notification');
    }

    // Verify the notification belongs to the user
    if (notification.userId !== userId) {
      throw new NotFoundError('Notification');
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });
  },

  /**
   * Create notifications for stage change event
   * Notifies relevant users (recruiter, hiring manager)
   * Requirements: 8.1
   */
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

    // Get the job to find assigned recruiter
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        assignedRecruiter: true,
        company: {
          include: {
            users: {
              where: {
                role: { in: ['admin', 'hiring_manager'] },
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!job) {
      return [];
    }

    const notifications: Notification[] = [];
    const usersToNotify = new Set<string>();

    // Add assigned recruiter if exists and not the one who moved
    if (job.assignedRecruiterId && job.assignedRecruiterId !== movedByUserId) {
      usersToNotify.add(job.assignedRecruiterId);
    }

    // Add hiring managers and admins (except the one who moved)
    for (const user of job.company.users) {
      if (user.id !== movedByUserId) {
        usersToNotify.add(user.id);
      }
    }

    // Create notifications for each user
    for (const userId of usersToNotify) {
      const notification = await this.createNotification({
        userId,
        type: 'stage_change',
        title: `Candidate Stage Changed`,
        message: `${candidateName} moved from ${fromStageName} to ${toStageName} for ${jobTitle}`,
        entityType: 'candidate',
        entityId: candidateId,
      });
      notifications.push(notification);
    }

    return notifications;
  },
};

export default notificationService;
