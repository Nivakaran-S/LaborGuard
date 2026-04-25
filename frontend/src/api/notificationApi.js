import { notificationClient } from './apiClient';

export const notificationApi = {
  getNotifications  : ()     => notificationClient.get('/notifications'),
  getUnreadCount    : ()     => notificationClient.get('/notifications/unread-count'),
  markAsRead        : (id)   => notificationClient.patch(`/notifications/${id}/read`),
  markAllAsRead     : ()     => notificationClient.patch('/notifications/read-all'),
  deleteNotification: (id)   => notificationClient.delete(`/notifications/${id}`),
  getPreferences    : ()     => notificationClient.get('/notifications/preferences'),
  updatePreferences : (data) => notificationClient.patch('/notifications/preferences', data),
};