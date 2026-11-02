// Store Settings & Delivery Configuration API
import api from './axiosInstance';
import { DEFAULT_SETTINGS } from '../constants/config';

export const settingsApi = {
  // Get shop settings (GET /api/dashboard/settings/)
  async getShopSettings() {
    try {
      const res = await api.get('/dashboard/settings/');
      return { ...DEFAULT_SETTINGS, ...res.data };
    } catch (e) {
      console.warn('Could not load remote shop settings, using default configuration.');
      return DEFAULT_SETTINGS;
    }
  },

  // Update shop settings (PATCH /api/dashboard/settings/)
  async updateShopSettings(data) {
    const res = await api.patch('/dashboard/settings/', data);
    return res.data;
  },
};

export default settingsApi;
