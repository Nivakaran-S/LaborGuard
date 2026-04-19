/**
 * appointmentApi.js
 *
 * SERVICE COUPLING NOTE:
 * ─────────────────────────────────────────────────────────────────────────────
 * There is NO dedicated appointment-service microservice. Appointment logic is
 * intentionally co-located inside the complaint-service because appointments
 * are tightly coupled to complaint cases (a worker books a consultation on a
 * specific complaint; a legal officer confirms/reschedules it).
 *
 * Backend location: backend/services/complaint-service/src/routes/appointmentRoutes.js
 * Mounted at:       /api/appointments  (inside complaint-service, port 3003)
 * API Client used:  complaintClient  (VITE_COMPLAINT_SERVICE_URL in .env)
 *
 * If appointments ever need to be decoupled into their own service in the
 * future, this file only needs its import changed from complaintClient to a
 * new appointmentClient — no other frontend file needs to change.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { complaintClient } from './apiClient';

export const appointmentApi = {
  /** Worker: fetch own appointments — GET /api/appointments/my */
  getMyAppointments: (params) =>
    complaintClient.get('/appointments/my', { params }),

  /** Legal Officer: fetch assigned appointments — GET /api/appointments/assigned */
  getAssignedAppointments: (params) =>
    complaintClient.get('/appointments/assigned', { params }),

  /** Admin: fetch all appointments — GET /api/appointments */
  getAllAppointments: (params) =>
    complaintClient.get('/appointments', { params }),

  /** Any authenticated user — GET /api/appointments/:id */
  getAppointmentById: (id) =>
    complaintClient.get(`/appointments/${id}`),

  /** Admin: confirm appointment — PATCH /api/appointments/:id/confirm
   *  Body: { scheduledDate: ISOString, notes?: string }
   */
  confirmAppointment: (id, data) =>
    complaintClient.patch(`/appointments/${id}/confirm`, data),

  /** Admin | Legal Officer: reschedule — PATCH /api/appointments/:id/reschedule
   *  Body: { scheduledDate: ISOString, reason: string }
   */
  rescheduleAppointment: (id, data) =>
    complaintClient.patch(`/appointments/${id}/reschedule`, data),

  /** Admin: cancel appointment — PATCH /api/appointments/:id/cancel
   *  Body: { reason: string }
   */
  cancelAppointment: (id, data) =>
    complaintClient.patch(`/appointments/${id}/cancel`, data),
};