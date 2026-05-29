import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const getSearchResults = async (searchVal) => {
  try {
    const response = await axios.get(
      `${BACKEND_URL}/search/fgeocode?q=${encodeURIComponent(searchVal.trim())}`,
    );
    return response.data;
  } catch (err) {
    console.error("Search failed:", err);
  }
};
