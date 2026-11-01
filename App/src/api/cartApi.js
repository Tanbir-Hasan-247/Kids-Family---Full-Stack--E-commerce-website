// Shopping Cart API Endpoints
import api from './axiosInstance';

export const cartApi = {
  // Get active cart (resolves by auth token or X-Session-Key)
  async getCart() {
    const res = await api.get('/cart/');
    return res.data;
  },

  // Add variant to cart
  async addToCart(variantId, quantity = 1) {
    const res = await api.post('/cart/add/', {
      variant_id: variantId,
      quantity,
    });
    return res.data;
  },

  // Update item quantity ('increase', 'decrease', or numeric direct quantity)
  async updateCartItem(itemId, actionOrQty, quantity = null) {
    let payload;
    if (typeof actionOrQty === 'number') {
      payload = { action: 'set', quantity: actionOrQty };
    } else if (actionOrQty === 'set') {
      payload = { action: 'set', quantity: quantity ?? 1 };
    } else {
      payload = { action: actionOrQty };
    }
    const res = await api.patch(`/cart/items/${itemId}/`, payload);
    return res.data;
  },

  // Remove single item from cart
  async removeCartItem(itemId) {
    const res = await api.delete(`/cart/items/${itemId}/remove/`);
    return res.data;
  },

  // Clear all items in cart
  async clearCart() {
    const res = await api.post('/cart/clear/');
    return res.data;
  },

  // Merge guest cart into authenticated user account
  async mergeGuestCart(guestSessionKey) {
    const res = await api.post('/cart/merge/', {
      guest_session_key: guestSessionKey,
    });
    return res.data;
  },
};

export default cartApi;
