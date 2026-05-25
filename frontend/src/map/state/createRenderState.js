import { EMPTY_GEOJSON } from "../constants/renderConstants";

export function createRenderState() {
  return {
    mapReady: false,
    layersInitialized: false,

    mode: "heatmap",
    heatmapAvailable: false,

    heatmapGeoJSON: EMPTY_GEOJSON,
    densityGeoJSON: EMPTY_GEOJSON,
    rawGeoJSON: EMPTY_GEOJSON,
  };
}
