import { communityClient } from './apiClient';

export const campaignsApi = {
  list: (params = {}) => communityClient.get('/campaigns', { params }),
  get: (id) => communityClient.get(`/campaigns/${id}`),
  create: (formData) =>
    communityClient.post('/campaigns', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id, data) => communityClient.put(`/campaigns/${id}`, data),
  remove: (id) => communityClient.delete(`/campaigns/${id}`),
  support: (id) => communityClient.post(`/campaigns/${id}/support`),
  unsupport: (id) => communityClient.post(`/campaigns/${id}/unsupport`),
  supporters: (id) => communityClient.get(`/campaigns/${id}/supporters`),
  updates: (id, params = {}) =>
    communityClient.get(`/campaigns/${id}/updates`, { params }),
  postUpdate: (id, formData) =>
    communityClient.post(`/campaigns/${id}/updates`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
