// frontend/src/api/registryApi.js
//
// Registry API — Officer/Lawyer registry management.
// All routes live inside complaint-service, mounted at /api/registry.
// All routes are admin-only (enforced by backend middleware).
//
// Backend routes reference:
//   backend/services/complaint-service/src/routes/registryRoutes.js

import { complaintClient } from './apiClient';

export const registryApi = {
  /**
   * GET /api/registry/stats
   * Returns summary stats about all registered officers.
   * Role: admin
   */
  getStats: () =>
    complaintClient.get('/registry/stats'),

  /**
   * GET /api/registry
   * Returns a paginated list of all registered officers.
   * Role: admin
   * @param {Object} params - Query params: page, limit, status, search, etc.
   */
  getAllOfficers: (params) =>
    complaintClient.get('/registry', { params }),

  /**
   * POST /api/registry
   * Register a new officer/lawyer in the labor registry.
   * Role: admin
   * @param {Object} data - Officer details (name, email, specialization, etc.)
   */
  registerOfficer: (data) =>
    complaintClient.post('/registry', data),

  /**
   * GET /api/registry/:officerId
   * Get full details of a single officer by their ID.
   * Role: admin
   * @param {string} officerId - MongoDB ObjectId of the officer
   */
  getOfficerById: (officerId) =>
    complaintClient.get(`/registry/${officerId}`),

  /**
   * PATCH /api/registry/:officerId
   * Update an officer's profile details.
   * Role: admin
   * @param {string} officerId - MongoDB ObjectId of the officer
   * @param {Object} data - Fields to update
   */
  updateOfficer: (officerId, data) =>
    complaintClient.patch(`/registry/${officerId}`, data),

  /**
   * PATCH /api/registry/:officerId/deactivate
   * Deactivate (soft-delete) an officer from the registry.
   * Role: admin
   * @param {string} officerId - MongoDB ObjectId of the officer
   */
  deactivateOfficer: (officerId) =>
    complaintClient.patch(`/registry/${officerId}/deactivate`),
};