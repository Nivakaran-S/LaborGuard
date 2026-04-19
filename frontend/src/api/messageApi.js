import { messageClient, authClient } from './apiClient';

export const messageApi = {
  createConversation: (data) => messageClient.post('/conversations', data),
  getConversations : ()     => messageClient.get('/conversations'),
  getMessages      : (conversationId) => messageClient.get(`/messages/${conversationId}`),
  sendMessage      : (data) => messageClient.post('/messages', data),
  markAsRead       : (conversationId) => messageClient.patch(`/messages/${conversationId}/read`),
  deleteMessage    : (messageId)      => messageClient.delete(`/messages/${messageId}`),

  // User search — hits auth-service GET /api/users/search?q=
  searchUsers      : (q) => authClient.get('/users/search', { params: { q } }),
};