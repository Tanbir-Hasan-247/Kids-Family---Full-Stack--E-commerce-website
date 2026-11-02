// Product Catalog & Admin Management API Endpoints
import api from './axiosInstance';

export const productApi = {
  // List products with pagination, search, category, sort, and filters (GET /api/products/)
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

  // Get single product details including variants, attributes & image gallery (GET /api/products/{id}/)
  async getProductDetail(id) {
    const res = await api.get(`/products/${id}/`);
    return res.data;
  },

  // Create new product (Admin/Staff only) (POST /api/products/)
  async createProduct(productData) {
    const isFormData = productData instanceof FormData;
    const res = await api.post(
      '/products/',
      productData,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return res.data;
  },

  // Partial update product (Admin/Staff only) (PATCH /api/products/{id}/)
  async updateProduct(id, data) {
    const isFormData = data instanceof FormData;
    const res = await api.patch(
      `/products/${id}/`,
      data,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return res.data;
  },

  // Full update product (Admin/Staff only) (PUT /api/products/{id}/)
  async putProduct(id, data) {
    const isFormData = data instanceof FormData;
    const res = await api.put(
      `/products/${id}/`,
      data,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return res.data;
  },

  // Delete product (Admin/Staff only) (DELETE /api/products/{id}/)
  async deleteProduct(id) {
    const res = await api.delete(`/products/${id}/`);
    return res.data;
  },

  // Get curated sale/discounted products (GET /api/products/sale/)
  async getSaleProducts() {
    const res = await api.get('/products/sale/');
    return res.data;
  },

  // Variant lookup by color and size (GET /api/products/{id}/variant/)
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

  // Product reviews (GET /api/products/{product_id}/reviews/)
  async getProductReviews(productId) {
    const res = await api.get(`/products/${productId}/reviews/`);
    return res.data;
  },

  // Add a new product review / comment (POST /api/products/{product_id}/reviews/)
  async addReview(productId, reviewData) {
    const isFormData = reviewData instanceof FormData;
    const res = await api.post(
      `/products/${productId}/reviews/`,
      reviewData,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return res.data;
  },

  // Featured photo reviews for social proof (GET /api/products/photo-reviews/)
  async getPhotoReviews() {
    const res = await api.get('/products/photo-reviews/');
    return res.data;
  },

  // Fetch product attribute types (Color, Size, etc.) (GET /api/products/attributes/types/)
  async getAttributeTypes() {
    const res = await api.get('/products/attributes/types/');
    return res.data;
  },

  // Create product attribute type (POST /api/products/attributes/types/)
  async createAttributeType(data) {
    const res = await api.post('/products/attributes/types/', data);
    return res.data;
  },

  // Fetch product attribute values (Red, XL, etc.) (GET /api/products/attributes/values/)
  async getAttributeValues(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `/products/attributes/values/?${query}` : '/products/attributes/values/';
    const res = await api.get(url);
    return res.data;
  },

  // Create product attribute value (POST /api/products/attributes/values/)
  async createAttributeValue(data) {
    const res = await api.post('/products/attributes/values/', data);
    return res.data;
  },

  // Delete product attribute value (DELETE /api/products/attributes/values/{id}/)
  async deleteAttributeValue(id) {
    const res = await api.delete(`/products/attributes/values/${id}/`);
    return res.data;
  },

  // List product variants (GET /api/products/variants/)
  async getVariants(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `/products/variants/?${query}` : '/products/variants/';
    const res = await api.get(url);
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  },

  // Create product variant (Admin/Staff only) (POST /api/products/variants/)
  async createVariant(variantData) {
    const isFormData = variantData instanceof FormData;
    const res = await api.post(
      '/products/variants/',
      variantData,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return res.data;
  },

  // Retrieve single product variant (GET /api/products/variants/{id}/)
  async getVariantDetail(id) {
    const res = await api.get(`/products/variants/${id}/`);
    return res.data;
  },

  // Partial update variant (PATCH /api/products/variants/{id}/)
  async updateVariant(id, variantData) {
    const isFormData = variantData instanceof FormData;
    const res = await api.patch(
      `/products/variants/${id}/`,
      variantData,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return res.data;
  },

  // Full update variant (PUT /api/products/variants/{id}/)
  async putVariant(id, variantData) {
    const isFormData = variantData instanceof FormData;
    const res = await api.put(
      `/products/variants/${id}/`,
      variantData,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return res.data;
  },

  // Delete product variant (DELETE /api/products/variants/{id}/)
  async deleteVariant(id) {
    const res = await api.delete(`/products/variants/${id}/`);
    return res.data;
  },

  // AI-assisted Natural Language Product Search (GET /api/ai/search/?q=...)
  async searchAiProducts(queryText) {
    const res = await api.get(`/ai/search/?q=${encodeURIComponent(queryText)}`);
    return res.data;
  },

  // AI generate product description (POST /api/ai/generate-description/)
  async generateAiDescription(payload) {
    const res = await api.post('/ai/generate-description/', payload);
    return res.data;
  },
};

export default productApi;
