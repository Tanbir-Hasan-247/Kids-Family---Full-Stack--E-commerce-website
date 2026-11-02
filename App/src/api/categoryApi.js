// Category Catalog & Admin Management Endpoints
import api from './axiosInstance';

export const categoryApi = {
  // Get categories (hierarchical roots with nested children, or ?all=true for flat list) (GET /api/categories/)
  async getCategories(all = false) {
    const url = all ? '/categories/?all=true' : '/categories/';
    const res = await api.get(url);
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  },

  // Alias for flat list of all categories
  async getAllCategories() {
    return this.getCategories(true);
  },

  // Get single category by slug or id (GET /api/categories/{slug_or_id}/)
  async getCategoryDetail(slugOrId) {
    const res = await api.get(`/categories/${slugOrId}/`);
    return res.data;
  },

  // Create new category (Admin/Staff only) (POST /api/categories/)
  async createCategory(categoryData) {
    const res = await api.post('/categories/', categoryData);
    return res.data;
  },

  // Partial update existing category (Admin/Staff only) (PATCH /api/categories/{slug_or_id}/)
  async updateCategory(slugOrId, data) {
    const res = await api.patch(`/categories/${slugOrId}/`, data);
    return res.data;
  },

  // Full update existing category (Admin/Staff only) (PUT /api/categories/{slug_or_id}/)
  async putCategory(slugOrId, data) {
    const res = await api.put(`/categories/${slugOrId}/`, data);
    return res.data;
  },

  // Delete category (Admin/Staff only) (DELETE /api/categories/{slug_or_id}/)
  async deleteCategory(slugOrId) {
    const res = await api.delete(`/categories/${slugOrId}/`);
    return res.data;
  },
};

export default categoryApi;
