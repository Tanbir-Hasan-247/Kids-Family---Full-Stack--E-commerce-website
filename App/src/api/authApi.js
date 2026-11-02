// Authentication & Account API Endpoints
import api from './axiosInstance';

export const authApi = {
  // Login with email and password (POST /api/auth/login/)
  async login(emailOrPayload, maybePassword = null) {
    let payload;
    if (typeof emailOrPayload === 'object' && emailOrPayload !== null) {
      payload = {
        email: emailOrPayload.email || emailOrPayload.username,
        password: emailOrPayload.password,
      };
    } else {
      payload = {
        email: emailOrPayload,
        password: maybePassword,
      };
    }
    const res = await api.post('/auth/login/', payload);
    return res.data;
  },

  // Google OAuth verification / token handshake (POST /api/auth/google/)
  async googleLogin(credentialOrAccessToken) {
    let payload = {};
    if (typeof credentialOrAccessToken === 'object' && credentialOrAccessToken !== null) {
      payload = credentialOrAccessToken;
    } else if (typeof credentialOrAccessToken === 'string') {
      if (credentialOrAccessToken.startsWith('ya29.')) {
        payload = { access_token: credentialOrAccessToken };
      } else {
        payload = { credential: credentialOrAccessToken };
      }
    }
    const res = await api.post('/auth/google/', payload);
    return res.data;
  },

  // Google OAuth initiation redirect URLs (GET /api/auth/google/login/ or GET /accounts/google/login/)
  getGoogleLoginUrl(useAccountsPrefix = false) {
    const base = api.defaults.baseURL || '';
    return useAccountsPrefix ? `${base}/accounts/google/login/` : `${base}/auth/google/login/`;
  },

  // Google OAuth callback verification (GET /api/auth/google/callback/ or GET /accounts/google/login/callback/)
  async googleCallback(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `/auth/google/callback/?${query}` : '/auth/google/callback/';
    const res = await api.get(url);
    return res.data;
  },

  // Register new customer account (POST /api/auth/register/)
  async register(formData) {
    const res = await api.post('/auth/register/', formData);
    return res.data;
  },

  // Logout on server (POST /api/auth/logout/)
  async logout() {
    try {
      const res = await api.post('/auth/logout/');
      return res.data;
    } catch (e) {
      return { success: true };
    }
  },

  // Refresh JWT access token (POST /api/auth/token/refresh/)
  async refreshToken(refreshToken) {
    const res = await api.post('/auth/token/refresh/', { refresh: refreshToken });
    return res.data;
  },

  // Get current user profile (GET /api/auth/profile/)
  async getProfile() {
    const res = await api.get('/auth/profile/');
    return res.data;
  },

  // Partial update profile (PATCH /api/auth/profile/)
  async updateProfile(data) {
    const res = await api.patch('/auth/profile/', data);
    return res.data;
  },

  // Full update profile (PUT /api/auth/profile/)
  async putProfile(data) {
    const res = await api.put('/auth/profile/', data);
    return res.data;
  },

  // Change password (POST /api/auth/change-password/)
  async changePassword(oldPassword, newPassword) {
    const res = await api.post('/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return res.data;
  },

  // Dashboard summary metrics (orders, pending, wishlist) (GET /api/auth/dashboard-summary/)
  async getDashboardSummary() {
    const res = await api.get('/auth/dashboard-summary/');
    return res.data;
  },
};

export default authApi;
