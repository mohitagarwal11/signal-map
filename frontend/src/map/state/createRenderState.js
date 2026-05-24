import { EMPTY_GEOJSON } from "../constants/renderConstants";

export function createRenderState() {
  return {
    mapReady: false,
    layersInitialized: false,
    mode: "cluster",
    heatmapAvailable: true,
    clusterGeoJSON: EMPTY_GEOJSON,
    rawGeoJSON: EMPTY_GEOJSON,
  };
}
