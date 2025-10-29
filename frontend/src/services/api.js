import axios from "axios";

// API Base URLs
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const FLASK_URL =
  import.meta.env.VITE_FLASK_API_URL || "http://127.0.0.1:10000";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// API service object
const apiService = {
  /**
   * Fetch single vessel data by IMO
   * @param {string|number} imo - IMO number
   * @returns {Promise} Vessel data with map information
   */
  getSingleVessel: async (imo) => {
    try {
      const response = await api.get(`/api/vessel/${imo}`);
      return response.data;
    } catch (error) {
      throw {
        message: error.response?.data?.error || "Failed to fetch vessel data",
        status: error.response?.status || 500,
        details: error.response?.data?.details || error.message,
      };
    }
  },

  /**
   * Fetch multiple vessels data by IMO array
   * @param {Array<string|number>} imos - Array of IMO numbers
   * @returns {Promise} Batch vessel data with map information
   */
  getBatchVessels: async (imos) => {
    try {
      const response = await api.post("/api/vessels/batch", { imos });
      return response.data;
    } catch (error) {
      throw {
        message:
          error.response?.data?.error || "Failed to fetch batch vessel data",
        status: error.response?.status || 500,
        details: error.response?.data?.details || error.message,
      };
    }
  },

  /**
   * Health check for backend
   * @returns {Promise} API status
   */
  healthCheck: async () => {
    try {
      const response = await api.get("/");
      return response.data;
    } catch (error) {
      throw new Error("Backend API is not reachable");
    }
  },

  /**
   * Initialize chatbot session (Flask backend)
   * @returns {Promise} Greeting message
   */
  initChatbot: async () => {
    try {
      const response = await axios.get(`${FLASK_URL}/api/chat/init`);
      return response.data;
    } catch (error) {
      throw new Error("Failed to initialize chatbot");
    }
  },

  /**
   * Send message to chatbot (Flask backend)
   * @param {string} message - User message
   * @returns {Promise} AI response
   */
  sendChatMessage: async (message) => {
    try {
      const response = await axios.post(`${FLASK_URL}/api/chat`, { message });
      return response.data;
    } catch (error) {
      throw new Error("Failed to send message");
    }
  },
};

export default apiService;
