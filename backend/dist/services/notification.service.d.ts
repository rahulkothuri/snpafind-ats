/**
 * Notification type enum
 * Requirements: 8.1, 11.1
 */
export type NotificationType = 'stage_change' | 'feedback_pending' | 'sla_breach' | 'interview_scheduled' | 'offer_pending';
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
export declare const notificationService: {
    /**
     * Create a new notification
     * Requirements: 8.1
     */
    createNotification(data: CreateNotificationData): Promise<Notification>;
    /**
     * Get notifications for a user with optional unread filter
     * Requirements: 8.2, 8.3
     */
    getNotifications(userId: string, options?: GetNotificationsOptions): Promise<NotificationsResponse>;
    /**
     * Mark a notification as read
     * Requirements: 8.5
     */
    markAsRead(notificationId: string, userId: string): Promise<Notification>;
    /**
     * Mark all notifications as read for a user
     * Requirements: 8.5
     */
    markAllAsRead(userId: string): Promise<{
        count: number;
    }>;
    /**
     * Get unread notification count for a user
     * Requirements: 8.2
     */
    getUnreadCount(userId: string): Promise<number>;
    /**
     * Delete a notification
     */
    deleteNotification(notificationId: string, userId: string): Promise<void>;
    /**
     * Create notifications for stage change event
     * Notifies relevant users (recruiter, hiring manager)
     * Requirements: 8.1
     */
    createStageChangeNotifications(params: {
        candidateId: string;
        candidateName: string;
        jobId: string;
        jobTitle: string;
        fromStageName: string;
        toStageName: string;
        movedByUserId?: string;
    }): Promise<Notification[]>;
};
export default notificationService;
//# sourceMappingURL=notification.service.d.ts.map