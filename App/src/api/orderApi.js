// Order & Checkout API Endpoints
import api from './axiosInstance';

export const orderApi = {
  // Place order from current cart (Cash on Delivery) (POST /api/orders/checkout/)
  async checkout(orderData) {
    const res = await api.post('/orders/checkout/', orderData);
    return res.data;
  },

  // List customer past orders (GET /api/orders/)
  async getOrders() {
    const res = await api.get('/orders/');
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  },

  // Get single order detail by order number (GET /api/orders/{order_number}/)
  async getOrderDetail(orderNumber) {
    const res = await api.get(`/orders/${orderNumber}/`);
    return res.data;
  },

  // Track order by order number or mobile phone (GET /api/orders/track/?query=...)
  async trackOrder(query) {
    const res = await api.get(`/orders/track/?query=${encodeURIComponent(query.trim())}`);
    return res.data;
  },

  // Track order via POST payload (POST /api/orders/track/)
  async trackOrderPost(payloadOrQuery) {
    const payload =
      typeof payloadOrQuery === 'string'
        ? { query: payloadOrQuery, order_number: payloadOrQuery }
        : payloadOrQuery;
    const res = await api.post('/orders/track/', payload);
    return res.data;
  },

  // Payment confirmation / payment stub (POST /api/orders/{order_number}/pay/)
  async confirmPayment(orderNumber, paymentData = {}) {
    const res = await api.post(`/orders/${orderNumber}/pay/`, paymentData);
    return res.data;
  },

  // Staff view of all orders with optional status, payment_status, and search query (GET /api/orders/admin/all/)
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

  // Staff get single order detail (GET /api/orders/admin/{order_number}/)
  async getAdminOrderDetail(orderNumber) {
    const res = await api.get(`/orders/admin/${orderNumber}/`);
    return res.data;
  },

  // Staff partial update order status and/or payment status (PATCH /api/orders/admin/{order_number}/)
  async updateAdminOrderStatus(orderNumber, statusOrPayload, paymentStatus = null) {
    let payload;
    if (typeof statusOrPayload === 'object' && statusOrPayload !== null) {
      payload = statusOrPayload;
    } else {
      payload = {};
      if (statusOrPayload) payload.status = statusOrPayload;
      if (paymentStatus) payload.payment_status = paymentStatus;
    }
    const res = await api.patch(`/orders/admin/${orderNumber}/`, payload);
    return res.data;
  },

  // Staff full update order (PUT /api/orders/admin/{order_number}/)
  async putAdminOrder(orderNumber, data) {
    const res = await api.put(`/orders/admin/${orderNumber}/`, data);
    return res.data;
  },
};

export default orderApi;
