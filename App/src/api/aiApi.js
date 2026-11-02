// AI Shopping Assistant & Root API Endpoints
import api from './axiosInstance';

export const aiApi = {
  // Check root API metadata (GET /api/)
  async getRootApi() {
    const res = await api.get('/');
    return res.data;
  },

  // Send conversational chat turn (recommender, tracking, order modification, add-to-cart) (POST /api/ai/chat/)
  async sendChatMessage(message, history = [], sessionKey = null) {
    const payload = {
      message,
      history,
    };
    if (sessionKey) {
      payload.session_key = sessionKey;
    }
    const res = await api.post('/ai/chat/', payload);
    return res.data;
  },

  // Semantic natural language product search (GET /api/ai/search/?q=...)
  async searchAiProducts(query) {
    const res = await api.get(`/ai/search/?q=${encodeURIComponent(query)}`);
    return res.data;
  },

  // Semantic natural language product search via POST (POST /api/ai/search/)
  async searchAiProductsPost(queryOrPayload) {
    const payload =
      typeof queryOrPayload === 'string'
        ? { query: queryOrPayload, q: queryOrPayload }
        : queryOrPayload;
    const res = await api.post('/ai/search/', payload);
    return res.data;
  },

  // 1-Click AI Product Description generator (Staff only) (POST /api/ai/generate-description/)
  async generateProductDescription(name, categoryName = '', features = '') {
    const res = await api.post('/ai/generate-description/', {
      name,
      category: categoryName,
      category_name: categoryName,
      notes: features,
      features,
    });
    return res.data;
  },
};

export default aiApi;
