// Order & Checkout API Endpoints
import api from './axiosInstance';

export const orderApi = {
  // Place order from current cart (Cash on Delivery)
  async checkout(orderData) {
    const res = await api.post('/orders/checkout/', orderData);
    return res.data;
  },

  // List customer past orders
  async getOrders() {
    const res = await api.get('/orders/');
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  },

  // Get single order detail by order number
  async getOrderDetail(orderNumber) {
    const res = await api.get(`/orders/${orderNumber}/`);
    return res.data;
  },

  // Track order by order number or mobile phone
  async trackOrder(query) {
    const res = await api.get(`/orders/track/?query=${encodeURIComponent(query.trim())}`);
    return res.data;
  },

  // Payment confirmation / payment stub
  async confirmPayment(orderNumber, paymentData = {}) {
    const res = await api.post(`/orders/${orderNumber}/pay/`, paymentData);
    return res.data;
  },

  // Staff view of all orders with optional status, payment_status, and search query
  async getAdminOrders(params = null) {
    let url = '/orders/admin/all/';
    if (typeof params === 'string') {
      url = `/orders/admin/all/?status=${params}`;
    } else if (params && typeof params === 'object') {
      const q = new URLSearchParams();
      if (params.status && params.status !== 'all') q.append('status', params.status);
      if (params.payment_status) q.append('payment_status', params.payment_status);
      if (params.q) q.append('q', params.q);
      const qs = q.toString();
      if (qs) url += `?${qs}`;
    }
    const res = await api.get(url);
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  },

  // Staff update order status and/or payment status
  async updateAdminOrderStatus(orderNumber, status, paymentStatus = null) {
    const payload = {};
    if (status) payload.status = status;
    if (paymentStatus) payload.payment_status = paymentStatus;
    const res = await api.patch(`/orders/admin/${orderNumber}/`, payload);
    return res.data;
  },
};

export default orderApi;
