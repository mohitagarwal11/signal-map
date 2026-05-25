import { EMPTY_GEOJSON } from "../constants/renderConstants";

export function createRenderState() {
  const state = {
    mapReady: false,
    layersInitialized: false,
    fetchMode: "density",
    densityAvailable: false,
    rawAvailable: false,

    densityGeoJSON: EMPTY_GEOJSON,
    rawGeoJSON: EMPTY_GEOJSON,

    rendererWeights: {
      density: 0,
      heatmap: 0,
      raw: 0,
    },
    rendererPolicy: {},
  };

  return state;
}
