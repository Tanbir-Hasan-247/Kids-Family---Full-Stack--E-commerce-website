// Centralized Axios Instance with Token & Session Interceptors
import axios from 'axios';
import { API_BASE_URL, TIMEOUT, STORAGE_KEYS } from '../constants/config';
import storage from '../utils/storage';

// In-memory cache for guest session key
let cachedSessionKey = null;

export const getSessionKey = async () => {
  if (cachedSessionKey) return cachedSessionKey;
  let key = await storage.getItem(STORAGE_KEYS.SESSION_KEY);
  if (!key) {
    key =
      'guest_' +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    await storage.setItem(STORAGE_KEYS.SESSION_KEY, key);
  }
  cachedSessionKey = key;
  return key;
};

export const setSessionKey = async (newKey) => {
  if (!newKey) return;
  cachedSessionKey = newKey;
  await storage.setItem(STORAGE_KEYS.SESSION_KEY, newKey);
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Auth Token and X-Session-Key
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const accessToken = await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }

      const sessionKey = await getSessionKey();
      if (sessionKey) {
        config.headers['X-Session-Key'] = sessionKey;
      }
    } catch (err) {
      console.warn('[axiosInstance.request] Interceptor error:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Capture updated X-Session-Key and handle Token Refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  async (response) => {
    // Capture backend cryptographic guest session key if sent
    const serverSessionKey =
      response.headers?.['x-session-key'] || response.headers?.['X-Session-Key'];
    if (serverSessionKey) {
      await setSessionKey(serverSessionKey);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Capture session key even on error responses if present
    const errSessionKey =
      error.response?.headers?.['x-session-key'] ||
      error.response?.headers?.['X-Session-Key'];
    if (errSessionKey) {
      await setSessionKey(errSessionKey);
    }

    // Handle 401 Unauthorized - Attempt Refresh
    if (
      error.response &&
      error.response.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login/') &&
      !originalRequest.url?.includes('/auth/token/refresh/')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const refreshRes = await axios.post(
          `${API_BASE_URL}/auth/token/refresh/`,
          { refresh: refreshToken },
          { timeout: TIMEOUT }
        );

        const newAccessToken = refreshRes.data?.access;
        const newRefreshToken = refreshRes.data?.refresh || refreshToken;

        if (newAccessToken) {
          await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

          axiosInstance.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);
          return axiosInstance(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        // Wipe stored tokens if refresh fails
        await storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        await storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
