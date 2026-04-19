import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// ── Request interceptor: attach Bearer token ──────────────────────────────────
const attachAuthToken = (config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
};

// ── Response interceptor: silent token refresh on 401 ────────────────────────
const handleTokenRefresh = async (error) => {
  const originalRequest = error.config;

  if (error.response?.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;

    try {
      const { refreshToken, setTokens, logout } = useAuthStore.getState();
      if (!refreshToken) throw new Error('No refresh token available');

      const response = await axios.post(
        `${import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:5001'}/api/auth/refresh`,
        { refreshToken }
      );

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        response.data.data;

      // FIX: Backend POST /auth/refresh only returns { accessToken } — no new refreshToken.
      // Old code: setTokens(newAccessToken, newRefreshToken) where newRefreshToken = undefined
      // → stored refreshToken gets wiped to undefined → next refresh fails immediately.
      // Fix: fall back to the CURRENT refreshToken when backend doesn't rotate it.
      setTokens(newAccessToken, newRefreshToken || refreshToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return axios(originalRequest);
    } catch (err) {
      useAuthStore.getState().logout();
      return Promise.reject(err);
    }
  }

  return Promise.reject(error);
};

// ── Service clients ───────────────────────────────────────────────────────────
export const authClient = axios.create({
  baseURL: `${import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:5001'}/api`,
});

export const communityClient = axios.create({
  baseURL: `${import.meta.env.VITE_COMMUNITY_SERVICE_URL || 'http://localhost:5002'}/api`,
});

export const complaintClient = axios.create({
  baseURL: `${import.meta.env.VITE_COMPLAINT_SERVICE_URL || 'http://localhost:5003'}/api`,
});

export const jobClient = axios.create({
  baseURL: `${import.meta.env.VITE_JOB_SERVICE_URL || 'http://localhost:5006'}/api`,
});

export const messageClient = axios.create({
  baseURL: `${import.meta.env.VITE_MESSAGING_SERVICE_URL || 'http://localhost:5005'}/api`,
});

export const notificationClient = axios.create({
  baseURL: `${import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:3004'}/api`,
});

// ── Attach interceptors to every client ──────────────────────────────────────
const clients = [
  authClient,
  communityClient,
  complaintClient,
  jobClient,
  messageClient,
  notificationClient,
];

clients.forEach((client) => {
  client.interceptors.request.use(attachAuthToken, (error) => Promise.reject(error));
  client.interceptors.response.use((response) => response, handleTokenRefresh);
});