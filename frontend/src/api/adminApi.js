// NEW FILE — adminApi.js
// FIX: No admin API layer existed. The backend has full admin routes
// in auth-service at /api/admin. All routes require role: admin.
// Backend routes reference: backend/services/auth-service/src/routes/adminRoutes.js

import { authClient } from './apiClient';

export const adminApi = {
  /**
   * GET /api/admin/users
   * Fetch all users
   */
  getAllUsers: (params) => authClient.get('/admin/users', { params }),

  /**
   * PUT /api/admin/users/:id/role
   * Update a user's role
   * Body: { role }
   */
  updateUserRole: (id, role) =>
    authClient.put(`/admin/users/${id}/role`, { role }),

  /**
   * PUT /api/admin/users/:id/approve
   * Approve a user (e.g., lawyer/NGO verification)
   */
  approveUser: (id) => authClient.put(`/admin/users/${id}/approve`),

  /**
   * PUT /api/admin/users/:id/reject
   * Reject a user
   */
  rejectUser: (id, reason) => authClient.put(`/admin/users/${id}/reject`, { reason }),

  /**
   * PUT /api/admin/users/:id/status
   * Activate or deactivate a user account
   * Body: { isActive }
   */
  updateUserStatus: (id, isActive) =>
    authClient.put(`/admin/users/${id}/status`, { isActive }),

  /**
   * DELETE /api/admin/users/:id
   * Delete a user
   */
  deleteUser: (id) => authClient.delete(`/admin/users/${id}`),

  /**
   * GET /api/admin/users/:id/analyze
   * Trigger AI document scanning
   */
  analyzeUserDocuments: (id) => authClient.get(`/admin/users/${id}/analyze`),
};
