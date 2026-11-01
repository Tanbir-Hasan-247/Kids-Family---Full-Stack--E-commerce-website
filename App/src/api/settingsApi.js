// Store Settings & Delivery Configuration API
import api from './axiosInstance';
import { DEFAULT_SETTINGS } from '../constants/config';

export const settingsApi = {
  async getShopSettings() {
    try {
      const res = await api.get('/dashboard/settings/');
      return { ...DEFAULT_SETTINGS, ...res.data };
    } catch (e) {
      console.warn('Could not load remote shop settings, using default configuration.');
      return DEFAULT_SETTINGS;
    }
  },
};

export default settingsApi;
