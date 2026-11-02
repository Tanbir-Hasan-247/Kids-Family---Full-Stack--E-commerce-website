// Promotions & Sliders API Endpoints
import api from './axiosInstance';

export const bannerApi = {
  // Active promotional hero carousel banners (Public) (GET /api/promotions/banners/live/)
  async getLiveBanners() {
    const res = await api.get('/promotions/banners/live/');
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  },

  // Hero carousel responsive sliders (Public) (GET /api/promotions/sliders/)
  async getHeroSliders() {
    const res = await api.get('/promotions/sliders/');
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  },

  // Get single hero slider detail (GET /api/promotions/sliders/{id}/)
  async getSliderDetail(id) {
    const res = await api.get(`/promotions/sliders/${id}/`);
    return res.data;
  },

  // Get all promotional banners (Admin/Staff only) (GET /api/promotions/banners/)
  async getAllBanners() {
    const res = await api.get('/promotions/banners/');
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  },

  // Get single banner detail (GET /api/promotions/banners/{id}/)
  async getBannerDetail(id) {
    const res = await api.get(`/promotions/banners/${id}/`);
    return res.data;
  },

  // Create new banner (Admin/Staff only) (POST /api/promotions/banners/)
  async createBanner(formData) {
    const isFormData = formData instanceof FormData;
    const res = await api.post(
      '/promotions/banners/',
      formData,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return res.data;
  },

  // Partial update existing banner (Admin/Staff only) (PATCH /api/promotions/banners/{id}/)
  async updateBanner(id, data) {
    const isFormData = data instanceof FormData;
    const res = await api.patch(
      `/promotions/banners/${id}/`,
      data,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return res.data;
  },

  // Full update existing banner (Admin/Staff only) (PUT /api/promotions/banners/{id}/)
  async putBanner(id, data) {
    const isFormData = data instanceof FormData;
    const res = await api.put(
      `/promotions/banners/${id}/`,
      data,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return res.data;
  },

  // Toggle banner active status on/off (Admin/Staff only) (POST /api/promotions/banners/{id}/toggle/)
  async toggleBanner(id) {
    const res = await api.post(`/promotions/banners/${id}/toggle/`);
    return res.data;
  },

  // Delete banner (Admin/Staff only) (DELETE /api/promotions/banners/{id}/)
  async deleteBanner(id) {
    const res = await api.delete(`/promotions/banners/${id}/`);
    return res.data;
  },

  // Get all hero sliders (Admin/Staff only) (GET /api/promotions/sliders/all/)
  async getAllSliders() {
    const res = await api.get('/promotions/sliders/all/');
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  },

  // Create new hero slider (Admin/Staff only) (POST /api/promotions/sliders/all/)
  async createSlider(sliderData) {
    const isFormData = sliderData instanceof FormData;
    const res = await api.post(
      '/promotions/sliders/all/',
      sliderData,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return res.data;
  },

  // Partial update hero slider (Admin/Staff only) (PATCH /api/promotions/sliders/{id}/)
  async updateSlider(id, data) {
    const isFormData = data instanceof FormData;
    const res = await api.patch(
      `/promotions/sliders/${id}/`,
      data,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return res.data;
  },

  // Full update hero slider (Admin/Staff only) (PUT /api/promotions/sliders/{id}/)
  async putSlider(id, data) {
    const isFormData = data instanceof FormData;
    const res = await api.put(
      `/promotions/sliders/${id}/`,
      data,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return res.data;
  },

  // Delete hero slider (Admin/Staff only) (DELETE /api/promotions/sliders/{id}/)
  async deleteSlider(id) {
    const res = await api.delete(`/promotions/sliders/${id}/`);
    return res.data;
  },

  // Toggle hero slider active status on/off (Admin/Staff only) (POST /api/promotions/sliders/{id}/toggle/)
  async toggleSlider(id) {
    const res = await api.post(`/promotions/sliders/${id}/toggle/`);
    return res.data;
  },
};

export default bannerApi;
