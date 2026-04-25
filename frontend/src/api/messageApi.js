import { messageClient, authClient } from './apiClient';

export const messageApi = {
  createConversation: (data) => messageClient.post('/conversations', data),
  getConversations : ()     => messageClient.get('/conversations'),
  getMessages      : (conversationId) => messageClient.get(`/messages/${conversationId}`),
  // sendMessage accepts either a plain JSON body or { conversationId, content,
  // files: File[] }. When files are present we switch to multipart/form-data
  // so the backend's multer middleware picks them up under "media".
  sendMessage      : (data) => {
    if (data && Array.isArray(data.files) && data.files.length > 0) {
      const fd = new FormData();
      fd.append('conversationId', data.conversationId);
      if (data.content) fd.append('content', data.content);
      data.files.forEach((f) => fd.append('media', f));
      return messageClient.post('/messages', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return messageClient.post('/messages', data);
  },
  markAsRead       : (conversationId) => messageClient.patch(`/messages/${conversationId}/read`),
  deleteMessage    : (messageId)      => messageClient.delete(`/messages/${messageId}`),

  // User search — hits auth-service GET /api/users/search?q=
  searchUsers      : (q) => authClient.get('/users/search', { params: { q } }),
};