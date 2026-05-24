import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const getTowersData = async (bounds, limit, offset, options = {}) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/towers`, {
      signal: options.signal,
      params: {
        min_lat: bounds.min_lat,
        max_lat: bounds.max_lat,
        min_lon: bounds.min_lon,
        max_lon: bounds.max_lon,
        limit,
        offset,
      },
    });
    return response;
  } catch (error) {
    console.log("Error fetching towers:", error);
    throw error;
  }
};

export const getTowerCount = async (bounds, options = {}) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/towers/count`, {
      signal: options.signal,
      params: {
        min_lat: bounds.min_lat,
        max_lat: bounds.max_lat,
        min_lon: bounds.min_lon,
        max_lon: bounds.max_lon,
      },
    });
    return response;
  } catch (error) {
    console.log("Error fetching tower count:", error);
    throw error;
  }
};

export const getTowerClusters = async (bounds, zoom, signal) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/towers/clusters`, {
      signal,
      params: {
        min_lat: bounds.min_lat,
        max_lat: bounds.max_lat,
        min_lon: bounds.min_lon,
        max_lon: bounds.max_lon,
        zoom,
      },
    });
    return response;
  } catch (error) {
    console.log("Error fetching tower clusters:", error);
    throw error;
  }
};
