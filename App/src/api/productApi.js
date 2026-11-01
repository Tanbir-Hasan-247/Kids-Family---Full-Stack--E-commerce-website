// Product Catalog & Admin Management API Endpoints
import api from './axiosInstance';

export const productApi = {
  // List products with pagination, search, category, sort, and filters
  async getProducts(params = {}) {
    const query = new URLSearchParams();

    if (params.page) query.append('page', params.page);
    if (params.page_size) query.append('page_size', params.page_size);
    if (params.cat) {
      if (Array.isArray(params.cat)) {
        params.cat.forEach((c) => query.append('cat', c));
      } else {
        query.append('cat', params.cat);
      }
    }
    if (params.q) query.append('q', params.q);
    if (params.search) query.append('search', params.search);
    if (params.ordering) query.append('ordering', params.ordering);
    if (params.sort) query.append('sort', params.sort);
    if (params.min_price) query.append('min_price', params.min_price);
    if (params.max_price) query.append('max_price', params.max_price);
    if (params.in_stock) query.append('in_stock', 'true');
    if (params.on_sale) query.append('on_sale', 'true');
    if (params.featured) query.append('featured', 'true');
    if (params.all) query.append('all', 'true');
    if (params.include_inactive) query.append('include_inactive', 'true');

    const qs = query.toString();
    const url = qs ? `/products/?${qs}` : '/products/';
    const res = await api.get(url);
    return res.data;
  },

  // Get featured products
  async getFeaturedProducts(pageSize = 6) {
    return this.getProducts({ featured: true, page_size: pageSize });
  },

  // Get single product details including variants, attributes & image gallery
  async getProductDetail(id) {
    const res = await api.get(`/products/${id}/`);
    return res.data;
  },

  // Get curated sale/discounted products
  async getSaleProducts() {
    const res = await api.get('/products/sale/');
    return res.data;
  },

  // Variant lookup by color and size
  async getVariantLookup(productId, colorId, sizeId) {
    const query = new URLSearchParams();
    if (colorId) query.append('color', colorId);
    if (sizeId) query.append('size', sizeId);
    const res = await api.get(`/products/${productId}/variant/?${query.toString()}`);
    return res.data;
  },

  // Alias for variant lookup
  async getVariant(productId, colorId, sizeId) {
    return this.getVariantLookup(productId, colorId, sizeId);
  },

  // Product reviews
  async getProductReviews(productId) {
    const res = await api.get(`/products/${productId}/reviews/`);
    return res.data;
  },

  // Add a new product review / comment
  async addReview(productId, reviewData) {
    const isFormData = reviewData instanceof FormData;
    const res = await api.post(
      `/products/${productId}/reviews/`,
      reviewData,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return res.data;
  },

  // Featured photo reviews for social proof
  async getPhotoReviews() {
    const res = await api.get('/products/photo-reviews/');
    return res.data;
  },

  // AI-assisted Natural Language Product Search (fallback if standard query has 0 matches)
  async searchAiProducts(queryText) {
    const res = await api.get(`/ai/search/?q=${encodeURIComponent(queryText)}`);
    return res.data;
  },

  // Create new product (Admin/Staff only)
  async createProduct(productData) {
    const res = await api.post('/products/', productData);
    return res.data;
  },

  // Update product (Admin/Staff only)
  async updateProduct(id, data) {
    const res = await api.patch(`/products/${id}/`, data);
    return res.data;
  },

  // Delete product (Admin/Staff only)
  async deleteProduct(id) {
    const res = await api.delete(`/products/${id}/`);
    return res.data;
  },

  // Create product variant (Admin/Staff only)
  async createVariant(variantData) {
    const isFormData = variantData instanceof FormData;
    const res = await api.post(
      '/products/variants/',
      variantData,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return res.data;
  },

  // Fetch product attribute types (Color, Size, etc.)
  async getAttributeTypes() {
    const res = await api.get('/products/attributes/types/');
    return res.data;
  },

  // AI generate product description
  async generateAiDescription(payload) {
    const res = await api.post('/ai/generate-description/', payload);
    return res.data;
  },
};

export default productApi;
