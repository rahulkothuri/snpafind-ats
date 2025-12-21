import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsService } from '../services/notifications.service';
import type { Notification, NotificationType } from '../services/notifications.service';

/**
 * NotificationBell Component - Requirements 8.2, 8.3, 8.4, 8.5
 * 
 * Features:
 * - Display bell icon with unread count badge
 * - Show dropdown on click with recent notifications
 * - Mark as read on click
 * - Navigate to related entity
 */

export interface NotificationBellProps {
  userId?: string;
}

// Helper to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Helper to get icon for notification type
function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'stage_change':
      return '🔄';
    case 'feedback_pending':
      return '📝';
    case 'sla_breach':
      return '⚠️';
    case 'interview_scheduled':
      return '📅';
    case 'offer_pending':
      return '📋';
    default:
      return '🔔';
  }
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await notificationsService.getNotifications({ limit: 10 });
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Fetch notifications on mount and when userId changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle notification click - mark as read and navigate
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read if not already
      if (!notification.isRead) {
        await notificationsService.markAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Navigate to related entity
      if (notification.entityType && notification.entityId) {
        setIsOpen(false);
        switch (notification.entityType) {
          case 'candidate':
            navigate(`/candidates/${notification.entityId}`);
            break;
          case 'job':
            navigate(`/jobs/${notification.entityId}`);
            break;
          case 'interview':
            // Navigate to candidate profile for interview-related notifications
            navigate(`/candidates/${notification.entityId}`);
            break;
        }
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={toggleDropdown}
        className="relative px-3 py-1.5 rounded-full hover:bg-[#f3f4f6] transition-colors text-[#64748b] hover:text-[#374151]"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-[#e2e8f0] z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#e2e8f0] bg-[#f8fafc]">
            <h3 className="font-semibold text-[#111827]">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-[#0b6cf0] hover:text-[#0952b8] font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0b6cf0]"></div>
              </div>
            ) : error ? (
              <div className="px-4 py-8 text-center text-[#64748b]">
                <p>{error}</p>
                <button
                  onClick={fetchNotifications}
                  className="mt-2 text-sm text-[#0b6cf0] hover:text-[#0952b8]"
                >
                  Try again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-[#64748b]">
                <span className="text-3xl mb-2 block">🔔</span>
                <p>No notifications yet</p>
              </div>
            ) : (
              <ul>
                {notifications.map(notification => (
                  <li key={notification.id}>
                    <button
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left px-4 py-3 hover:bg-[#f8fafc] transition-colors border-b border-[#f1f5f9] last:border-b-0 ${
                        !notification.isRead ? 'bg-[#f0f7ff]' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <span className="text-lg flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notification.isRead ? 'font-semibold text-[#111827]' : 'text-[#374151]'}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-[#64748b] mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-[#94a3b8] mt-1">
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-[#0b6cf0] rounded-full flex-shrink-0 mt-1.5"></span>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-[#e2e8f0] bg-[#f8fafc]">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Could navigate to a full notifications page if one exists
                }}
                className="w-full text-center text-xs text-[#64748b] hover:text-[#374151]"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
