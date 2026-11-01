// Admin Dashboard Analytics & Business Intelligence API Endpoints
import api from './axiosInstance';

export const dashboardApi = {
  // Get sales performance analytics (revenue, orders, 14-day sales chart, low stock)
  async getStats() {
    const res = await api.get('/dashboard/stats/');
    return res.data;
  },

  // Get live notification count for pending orders
  async getNotificationCount() {
    const res = await api.get('/dashboard/notifications/count/');
    return res.data;
  },

  // Get inventory variants running low on stock (<= threshold, default 5)
  async getLowStockAlert(threshold = 5) {
    const res = await api.get(`/dashboard/low-stock/?threshold=${threshold}`);
    return res.data;
  },

  // Get shop settings (delivery fee, hotline, bkash number, etc.)
  async getShopSettings() {
    const res = await api.get('/dashboard/settings/');
    return res.data;
  },

  // Update shop settings (Admin/Staff only)
  async updateShopSettings(data) {
    const res = await api.patch('/dashboard/settings/', data);
    return res.data;
  },

  // Export orders to CSV spreadsheet
  async exportOrdersCsv() {
    const res = await api.get('/dashboard/export-orders-csv/');
    return res.data;
  },
};

export default dashboardApi;
