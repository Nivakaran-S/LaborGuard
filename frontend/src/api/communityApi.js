/**
 * communityApi.js
 *
 * FIXES:
 *  - addComment: was POST /posts/:id/comments → now POST /comments/:postId
 *  - updateProfile: was PATCH /profiles/me → now POST /profiles
 *  - getPosts: was GET /posts (no such route) → now getFeed() uses GET /posts/feed/:userId
 *
 * ADDED (15 missing endpoints now wired up):
 *  getFeed, getTrendingFeed, searchByHashtag, updatePost, sharePost, votePoll,
 *  getComments, deleteComment, reportComment, followUser, unfollowUser,
 *  toggleBookmark, getBookmarks, createStatus, getStatuses, deleteStatus
 */

import { communityClient } from './apiClient';

export const communityApi = {

  // ══ POSTS ════════════════════════════════════════════════════════════════

  getFeed: (userId, page = 1, limit = 20) =>
    communityClient.get(`/posts/feed/${userId}`, { params: { page, limit } }),

  getTrendingFeed: (page = 1, limit = 20) =>
    communityClient.get('/posts/trending', { params: { page, limit } }),

  searchByHashtag: (tag, page = 1, limit = 20) =>
    communityClient.get(`/posts/hashtag/${tag}`, { params: { page, limit } }),

  getPostById: (postId) =>
    communityClient.get(`/posts/${postId}`),

  createPost: (formData) =>
    communityClient.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  updatePost: (postId, formData) =>
    communityClient.put(`/posts/${postId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  deletePost: (postId) =>
    communityClient.delete(`/posts/${postId}`),

  likePost: (postId) =>
    communityClient.post(`/posts/${postId}/like`),

  // [ADDED] was missing
  sharePost: (postId) =>
    communityClient.post(`/posts/${postId}/share`),

  // [ADDED] was missing
  votePoll: (postId, optionIndex) =>
    communityClient.post(`/posts/${postId}/poll`, { optionIndex }),

  reportPost: (postId, reason) =>
    communityClient.post(`/posts/${postId}/report`, { reason }),


  // ══ COMMENTS ════════════════════════════════════════════════════════════

  // [FIX] was POST /posts/:postId/comments — wrong. Backend: POST /comments/:postId
  addComment: (postId, content) =>
    communityClient.post(`/comments/${postId}`, { content }),

  // [ADDED] was missing
  getComments: (postId, page = 1, limit = 20) =>
    communityClient.get(`/comments/${postId}`, { params: { page, limit } }),

  // [ADDED] was missing
  deleteComment: (commentId) =>
    communityClient.delete(`/comments/${commentId}`),

  // [ADDED] was missing
  reportComment: (commentId, reason) =>
    communityClient.post(`/comments/${commentId}/report`, { reason }),


  // ══ USER PROFILES ════════════════════════════════════════════════════════

  getProfile: (userId) =>
    communityClient.get(`/profiles/${userId}`),

  // [FIX] was PATCH /profiles/me — wrong. Backend: POST /profiles
  createOrUpdateProfile: (data) =>
    communityClient.post('/profiles', data),

  // [ADDED] was missing
  followUser: (targetUserId) =>
    communityClient.post('/profiles/follow', { targetUserId }),

  // [ADDED] was missing
  unfollowUser: (targetUserId) =>
    communityClient.post('/profiles/unfollow', { targetUserId }),

  // [ADDED] was missing
  toggleBookmark: (postId) =>
    communityClient.post('/profiles/bookmark', { postId }),

  // [ADDED] was missing
  getBookmarks: (userId, page = 1, limit = 20) =>
    communityClient.get(`/profiles/${userId}/bookmarks`, { params: { page, limit } }),


  // ══ STATUSES ════════════════════════════════════════════════════════════

  // [ADDED] was missing
  createStatus: (formData) =>
    communityClient.post('/statuses', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  // [ADDED] was missing
  getStatuses: (userId) =>
    communityClient.get(`/statuses/${userId}`),

  // [ADDED] was missing
  deleteStatus: (statusId) =>
    communityClient.delete(`/statuses/${statusId}`),
};