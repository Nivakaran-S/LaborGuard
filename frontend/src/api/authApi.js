import { authClient } from './apiClient';

export const authApi = {
  // ── Auth ──────────────────────────────────────────────────
  login: (data) => authClient.post('/auth/login', data),

  register: (data) => authClient.post('/auth/register', data),

  // FIX 1: was POST /auth/verify-email — backend route is POST /auth/verify
  // Body must include { userId, code, type } where type is 'email' or 'sms'
  verifyEmail: (userId, code) =>
    authClient.post('/auth/verify', { userId, code, type: 'email' }),

  verifySms: (userId, code) =>
    authClient.post('/auth/verify', { userId, code, type: 'sms' }),

  // FIX 2: POST /auth/resend-verification — route now added on backend
  resendVerification: (email) =>
    authClient.post('/auth/resend-verification', { email }),

  forgotPassword: (email) =>
    authClient.post('/auth/forgot-password', { email }),

  // FIX 3: was POST /auth/reset-password/${token} (token in URL)
  // Backend resetPassword(email, code, newPassword) takes everything in body
  resetPassword: (email, code, newPassword) =>
    authClient.post('/auth/reset-password', { email, code, newPassword }),

  // ── Profile (protected) ───────────────────────────────────
  getProfile: () => authClient.get('/auth/me'),

  updateProfile: (data) => authClient.patch('/auth/me', data),

  changePassword: (data) => authClient.post('/auth/change-password', data),

  // ── Token management ─────────────────────────────────────
  refresh: (refreshToken) =>
    authClient.post('/auth/refresh', { refreshToken }),

  logout: (refreshToken) =>
    authClient.post('/auth/logout', { refreshToken }),
};
