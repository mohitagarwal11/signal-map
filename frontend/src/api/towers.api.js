import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const getTowers = async (
  min_lat,
  max_lat,
  min_lon,
  max_lon,
  limit,
  offset,
) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/towers`, {
      params: {
        min_lat,
        max_lat,
        min_lon,
        max_lon,
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

export const getTowerCount = async (min_lat, max_lat, min_lon, max_lon) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/towers/count`, {
      params: {
        min_lat,
        max_lat,
        min_lon,
        max_lon,
      },
    });
    return response;
  } catch (error) {
    console.log("Error fetching tower count:", error);
    throw error;
  }
};
