// Wishlist API Endpoints
import api from './axiosInstance';

export const wishlistApi = {
  // Get all favorited products
  async getWishlist() {
    const res = await api.get('/wishlist/');
    return res.data;
  },

  // Toggle favorite for a product
  async toggleWishlist(productId) {
    const res = await api.post(`/wishlist/toggle/${productId}/`);
    return res.data;
  },

  // Check if a product is in wishlist
  async checkWishlist(productId) {
    const res = await api.get(`/wishlist/check/${productId}/`);
    return res.data;
  },
};

export default wishlistApi;

