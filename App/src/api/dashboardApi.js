// Admin Dashboard Analytics & Business Intelligence API Endpoints
import api from './axiosInstance';

export const dashboardApi = {
  // Get sales performance analytics (revenue, orders, 14-day sales chart, low stock) (GET /api/dashboard/stats/)
  async getStats() {
    const res = await api.get('/dashboard/stats/');
    return res.data;
  },

  // Get live notification count for pending orders (GET /api/dashboard/notifications/count/)
  async getNotificationCount() {
    const res = await api.get('/dashboard/notifications/count/');
    return res.data;
  },

  // Get inventory variants running low on stock (<= threshold, default 5) (GET /api/dashboard/low-stock/)
  async getLowStockAlert(threshold = 5) {
    const res = await api.get(`/dashboard/low-stock/?threshold=${threshold}`);
    return res.data;
  },

  // Get shop settings (delivery fee, hotline, bkash number, etc.) (GET /api/dashboard/settings/)
  async getShopSettings() {
    const res = await api.get('/dashboard/settings/');
    return res.data;
  },

  // Partial update shop settings (Admin/Staff only) (PATCH /api/dashboard/settings/)
  async updateShopSettings(data) {
    const res = await api.patch('/dashboard/settings/', data);
    return res.data;
  },

  // Full update shop settings (Admin/Staff only) (PUT /api/dashboard/settings/)
  async putShopSettings(data) {
    const res = await api.put('/dashboard/settings/', data);
    return res.data;
  },

  // Legacy/Alternate endpoint: GET /api/dashboard/shop-settings/
  async getShopSettingsAlt() {
    const res = await api.get('/dashboard/shop-settings/');
    return res.data;
  },

  // Legacy/Alternate endpoint: PUT /api/dashboard/shop-settings/
  async putShopSettingsAlt(data) {
    const res = await api.put('/dashboard/shop-settings/', data);
    return res.data;
  },

  // Legacy/Alternate endpoint: PATCH /api/dashboard/shop-settings/
  async patchShopSettingsAlt(data) {
    const res = await api.patch('/dashboard/shop-settings/', data);
    return res.data;
  },

  // Export orders to CSV spreadsheet (GET /api/dashboard/export-orders-csv/)
  async exportOrdersCsv() {
    const res = await api.get('/dashboard/export-orders-csv/');
    return res.data;
  },
};

export default dashboardApi;
