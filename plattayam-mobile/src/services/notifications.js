import { apiRequest } from './api';

/**
 * Fetch all notifications and unread count for current user
 */
export function listNotifications() {
  return apiRequest('/notifications');
}

/**
 * Mark a single notification as read
 */
export function markNotificationAsRead(notificationId) {
  return apiRequest(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
  });
}

/**
 * Mark all notifications for the current user as read
 */
export function markAllNotificationsAsRead() {
  return apiRequest('/notifications/read-all', {
    method: 'POST',
  });
}
