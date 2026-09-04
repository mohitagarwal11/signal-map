import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

/**
 * @param {string} message
 * @param {string} [sessionId]
 * @returns {Promise<Object>}
 */
export const queryLLM = async (message, sessionId = null) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/llm/query`, {
      message,
      session_id: sessionId,
    });

    return response.data;
  } catch (error) {
    console.error('Error querying LLM:', error);
    throw error;
  }
};
