import type { Interview } from '../types/index.js';
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
export declare const notificationService: {
    createNotification(data: CreateNotificationData): Promise<Notification>;
    getNotifications(userId: string, options?: GetNotificationsOptions): Promise<NotificationsResponse>;
    markAsRead(notificationId: string, userId: string): Promise<Notification>;
    markAllAsRead(userId: string): Promise<{
        count: number;
    }>;
    getUnreadCount(userId: string): Promise<number>;
    deleteNotification(notificationId: string, userId: string): Promise<void>;
    createStageChangeNotifications(params: {
        candidateId: string;
        candidateName: string;
        jobId: string;
        jobTitle: string;
        fromStageName: string;
        toStageName: string;
        movedByUserId?: string;
    }): Promise<Notification[]>;
    getPendingFeedbackInterviews(companyId: string): Promise<{
        interviewId: string;
        candidateName: string;
        jobTitle: string;
        scheduledAt: Date;
        feedbackPercentage: number;
        pendingCount: number;
    }[]>;
    getFeedbackCompletionStatus(interviewId: string): Promise<{
        total: number;
        submitted: number;
        pending: number;
        percentage: number;
        pendingMembers: {
            id: string;
            name: string;
            email: string;
        }[];
    }>;
    mapInterviewForEmail(interview: {
        id: string;
        scheduledAt: Date;
        duration: number;
        timezone: string;
        mode: string;
        meetingLink: string | null;
        location: string | null;
        jobCandidate?: {
            candidate?: {
                name: string;
                email: string;
            } | null;
            job?: {
                title: string;
                companyId?: string;
                company?: {
                    name: string;
                } | null;
            } | null;
        } | null;
        panelMembers?: Array<{
            user: {
                name: string;
                email: string;
            };
        }>;
    }): Interview;
    processFeedbackPendingNotifications(hoursThreshold?: number): Promise<{
        notificationsCreated: number;
        emailsSent: number;
        errors: string[];
    }>;
    checkAndMarkFeedbackComplete(interviewId: string): Promise<{
        isComplete: boolean;
        markedComplete: boolean;
    }>;
};
export default notificationService;
//# sourceMappingURL=notification.service.d.ts.map