// Category Catalog & Admin Management Endpoints
import api from './axiosInstance';

export const categoryApi = {
  // Get categories (hierarchical roots with nested children, or ?all=true for flat list)
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

  // Get single category by slug or id
  async getCategoryDetail(slugOrId) {
    const res = await api.get(`/categories/${slugOrId}/`);
    return res.data;
  },

  // Create new category (Admin/Staff only)
  async createCategory(categoryData) {
    const res = await api.post('/categories/', categoryData);
    return res.data;
  },

  // Update existing category (Admin/Staff only)
  async updateCategory(slug, data) {
    const res = await api.patch(`/categories/${slug}/`, data);
    return res.data;
  },

  // Delete category (Admin/Staff only)
  async deleteCategory(slug) {
    const res = await api.delete(`/categories/${slug}/`);
    return res.data;
  },
};

export default categoryApi;
