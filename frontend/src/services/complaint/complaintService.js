import { complaintClient } from '../../api/apiClient';

export const getComplaintStats = () => complaintClient.get('/complaints/stats');
export const getMyComplaints = (params) => complaintClient.get('/complaints/my', { params });
export const getAllComplaints = (params) => complaintClient.get('/complaints', { params });
export const getAssignedComplaints = (params) => complaintClient.get('/complaints', { params });
export const getComplaintById = (complaintId) => complaintClient.get(`/complaints/${complaintId}`);
export const createComplaint = (payload) => complaintClient.post('/complaints', payload);
export const updateComplaint = (complaintId, payload) =>
  complaintClient.patch(`/complaints/${complaintId}`, payload);
export const updateComplaintStatus = (complaintId, payload) =>
  complaintClient.patch(`/complaints/${complaintId}/status`, payload);
export const assignComplaint = (complaintId, payload) =>
  complaintClient.patch(`/complaints/${complaintId}/assign`, payload);
