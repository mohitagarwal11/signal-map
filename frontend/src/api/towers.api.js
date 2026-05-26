import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const getInitialHeatmapSnapshot = async () => {
  try {
    const response = await axios.get(
      `${BACKEND_URL}/bootstrap/initial-heatmap`,
    );
    return response;
  } catch (error) {
    console.log("Error fetching initial heatmap snapshot:", error);
    throw error;
  }
};

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
        network: options.network ?? "all",
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
        network: options.network ?? "all",
      },
    });
    return response;
  } catch (error) {
    console.log("Error fetching tower count:", error);
    throw error;
  }
};

export const getHeatmapPoints = async (bounds, zoom, options = {}) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/towers/heatmap`, {
      signal: options.signal,
      params: {
        min_lat: bounds.min_lat,
        max_lat: bounds.max_lat,
        min_lon: bounds.min_lon,
        max_lon: bounds.max_lon,
        zoom,
        network: options.network ?? "all",
      },
    });

    return response;
  } catch (error) {
    console.log("Error fetching heatmap points:", error);
    throw error;
  }
};
