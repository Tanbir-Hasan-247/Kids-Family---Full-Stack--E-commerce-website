import axios from 'axios';

// Get or generate persistent guest session key
export const getSessionKey = () => {
  let key = localStorage.getItem('kf_session_key');
  if (!key) {
    key = 'guest_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('kf_session_key', key);
  }
  return key;
};

export const formatImageUrl = (url) => {
  if (!url) return '';
  if (typeof url !== 'string') return '';
  if (url.includes('127.0.0.1:8000') || url.includes('localhost:8000')) {
    return url.replace(/^https?:\/\/(127\.0\.0\.1|localhost):8000/, '');
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return url.startsWith('/') ? url : `/${url}`;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Authorization header and X-Session-Key
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  const token = localStorage.getItem('kf_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-Session-Key'] = getSessionKey();
  return config;
});

// Interceptor to capture session key if backend generates one
api.interceptors.response.use(
  (response) => {
    const backendSessionKey = response.headers['x-session-key'];
    if (backendSessionKey) {
      localStorage.setItem('kf_session_key', backendSessionKey);
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired, clear it
      localStorage.removeItem('kf_access_token');
      localStorage.removeItem('kf_refresh_token');
    }
    return Promise.reject(error);
  }
);

export default api;

