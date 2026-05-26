import { EMPTY_GEOJSON } from "../constants/renderConstants";

export function createRenderState() {
  const state = {
    mapReady: false,
    layersInitialized: false,
    fetchMode: "heatmap",
    heatmapAvailable: false,
    towersAvailable: false,

    heatmapGeoJSON: EMPTY_GEOJSON,
    towersGeoJSON: EMPTY_GEOJSON,
  };

  return state;
}
