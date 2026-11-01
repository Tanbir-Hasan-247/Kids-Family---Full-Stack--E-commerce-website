// Authentication API Endpoints
import api from './axiosInstance';

export const authApi = {
  // Login with email and password (or payload object)
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

  // Google OAuth verification / token handshake
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

  // Register new customer account
  async register(formData) {
    const res = await api.post('/auth/register/', formData);
    return res.data;
  },

  // Logout on server
  async logout() {
    try {
      const res = await api.post('/auth/logout/');
      return res.data;
    } catch (e) {
      return { success: true };
    }
  },

  // Refresh JWT access token
  async refreshToken(refreshToken) {
    const res = await api.post('/auth/token/refresh/', { refresh: refreshToken });
    return res.data;
  },

  // Get current user profile
  async getProfile() {
    const res = await api.get('/auth/profile/');
    return res.data;
  },

  // Update profile
  async updateProfile(data) {
    const res = await api.patch('/auth/profile/', data);
    return res.data;
  },

  // Change password
  async changePassword(oldPassword, newPassword) {
    const res = await api.post('/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return res.data;
  },

  // Dashboard summary metrics (orders, pending, wishlist)
  async getDashboardSummary() {
    const res = await api.get('/auth/dashboard-summary/');
    return res.data;
  },
};

export default authApi;
