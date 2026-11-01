// Promotions & Sliders API Endpoints
import api from './axiosInstance';

export const bannerApi = {
  // Active promotional hero carousel banners (Public)
  async getLiveBanners() {
    const res = await api.get('/promotions/banners/live/');
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  },

  // Hero carousel responsive sliders (Public)
  async getHeroSliders() {
    const res = await api.get('/promotions/sliders/');
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  },

  // Get all promotional banners (Admin/Staff only)
  async getAllBanners() {
    const res = await api.get('/promotions/banners/');
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  },

  // Create new banner (Admin/Staff only)
  async createBanner(formData) {
    const res = await api.post('/promotions/banners/', formData);
    return res.data;
  },

  // Update existing banner (Admin/Staff only)
  async updateBanner(id, data) {
    const res = await api.patch(`/promotions/banners/${id}/`, data);
    return res.data;
  },
};

export default bannerApi;
