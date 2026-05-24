// trying to get rid of this bs AI slop
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const getInitialClusterSnapshot = async () => {
  const response = await axios.get(`${BACKEND_URL}/static/initial_clusters.json`, {
    responseType: "text",
    transformResponse: [(data) => data],
  });
  const rawText = response.data;

  return {
    snapshot: JSON.parse(rawText),
    rawBytes: new Blob([rawText]).size,
    contentEncoding: response.headers["content-encoding"],
  };
};
