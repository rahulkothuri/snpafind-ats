/**
 * Notifications Service - Requirements 8.1, 8.2, 8.3, 8.4, 8.5
 * 
 * Handles notification-related API calls
 */

import api from './api';

export type NotificationType = 
  | 'stage_change'
  | 'feedback_pending'
  | 'sla_breach'
  | 'interview_scheduled'
  | 'offer_pending';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: 'candidate' | 'job' | 'interview';
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export interface GetNotificationsOptions {
  unreadOnly?: boolean;
  limit?: number;
}

export const notificationsService = {
  /**
   * Get notifications for the authenticated user
   * Requirements: 8.2, 8.3
   */
  async getNotifications(options: GetNotificationsOptions = {}): Promise<NotificationsResponse> {
    const params = new URLSearchParams();
    if (options.unreadOnly) {
      params.append('unreadOnly', 'true');
    }
    if (options.limit) {
      params.append('limit', options.limit.toString());
    }
    const response = await api.get(`/notifications?${params.toString()}`);
    return response.data;
  },

  /**
   * Mark a notification as read
   * Requirements: 8.5
   */
  async markAsRead(notificationId: string): Promise<{ success: boolean; notification: Notification }> {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   * Requirements: 8.5
   */
  async markAllAsRead(): Promise<{ success: boolean; count: number }> {
    const response = await api.put('/notifications/mark-all-read');
    return response.data;
  },

  /**
   * Get unread notification count
   * Requirements: 8.2
   */
  async getUnreadCount(): Promise<{ unreadCount: number }> {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },
};

export default notificationsService;
