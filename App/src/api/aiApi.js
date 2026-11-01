// AI Shopping Assistant API Endpoints
import api from './axiosInstance';

export const aiApi = {
  // Send conversational chat turn (recommender, tracking, order modification, add-to-cart)
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

  // Semantic natural language product search
  async searchAiProducts(query) {
    const res = await api.get(`/ai/search/?q=${encodeURIComponent(query)}`);
    return res.data;
  },

  // 1-Click AI Product Description generator (Staff only)
  async generateProductDescription(name, categoryName = '', features = '') {
    const res = await api.post('/ai/generate-description/', {
      name,
      category_name: categoryName,
      features,
    });
    return res.data;
  },
};

export default aiApi;

