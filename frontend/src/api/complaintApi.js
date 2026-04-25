import { complaintClient } from './apiClient';

export const complaintApi = {
  // Complaints
  createComplaint:   (data)          => complaintClient.post('/complaints', data),
  getMyComplaints:   (params)        => complaintClient.get('/complaints/my', { params }),
  // FIX: added — useComplaints hook calls complaintApi.getAllComplaints(params) but old file had no such method
  getAllComplaints:   (params)        => complaintClient.get('/complaints', { params }),
  getComplaintById:  (id)            => complaintClient.get(`/complaints/${id}`),
  updateComplaint:   (id, data)      => complaintClient.patch(`/complaints/${id}`, data),
  // FIX: renamed updateStatus → updateComplaintStatus to match useComplaints hook call
  // useComplaints: complaintApi.updateComplaintStatus(complaintId, { status, reason })
  updateComplaintStatus: (id, data)  => complaintClient.patch(`/complaints/${id}/status`, data),
  assignComplaint:   (id, officerId) => complaintClient.patch(`/complaints/${id}/assign`, { officerId }),
  deleteComplaint:   (id)            => complaintClient.delete(`/complaints/${id}`),
  uploadAttachment:  (id, formData)  => complaintClient.post(`/complaints/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getStats:          ()              => complaintClient.get('/complaints/stats'),
  // FIX: added — useComplaints hook calls complaintApi.downloadReport(complaintId)
  downloadReport:    (id)            => complaintClient.get(`/complaints/${id}/report`, { responseType: 'blob' }),
  shareToCommunity:  (id)            => complaintClient.post(`/complaints/${id}/share-to-community`),

  // Appointments (co-located in complaint-service, mounted at /api/appointments)
  // FIX: added — useComplaints hook calls complaintApi.getMyAppointments(params) but old file had no such method
  getMyAppointments:       (params)           => complaintClient.get('/appointments/my', { params }),
  getAssignedAppointments: (params)           => complaintClient.get('/appointments/assigned', { params }),
  getAllAppointments:       (params)           => complaintClient.get('/appointments', { params }),
  getAppointmentById:      (id)               => complaintClient.get(`/appointments/${id}`),
  // FIX: added — useComplaints hook calls complaintApi.confirmAppointment(id, data)
  confirmAppointment:      (id, data)         => complaintClient.patch(`/appointments/${id}/confirm`, data),
  // FIX: added — useComplaints hook calls complaintApi.rescheduleAppointment(id, data)
  rescheduleAppointment:   (id, data)         => complaintClient.patch(`/appointments/${id}/reschedule`, data),
  // FIX: added — useComplaints hook calls complaintApi.cancelAppointment(id, { reason })
  cancelAppointment:       (id, data)         => complaintClient.patch(`/appointments/${id}/cancel`, data),

  // Worker requests appointment for a specific complaint (W20)
  requestAppointment:      (data)             => complaintClient.post('/appointments/request', data),

  // Lawyer records post-meeting outcome (L5)
  recordAppointmentOutcome:(id, data)         => complaintClient.patch(`/appointments/${id}/outcome`, data),

  // NGO impact PDF report (N9)
  downloadNgoReport:       (params)           => complaintClient.get('/complaints/ngo-report', {
    params,
    responseType: 'blob',
  }),

  // NGO org-scoped endpoints (N6/N7)
  getMonitoredComplaints:  (params)           => complaintClient.get('/complaints/ngo/monitored', { params }),
  getNgoScopedStats:       ()                 => complaintClient.get('/complaints/ngo/stats'),
  monitorComplaint:        (id)               => complaintClient.post(`/complaints/${id}/monitor`),
  unmonitorComplaint:      (id)               => complaintClient.post(`/complaints/${id}/unmonitor`),
};