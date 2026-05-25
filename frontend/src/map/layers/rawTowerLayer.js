import {
  RAW_TOWER_LAYER_ID,
  RAW_TOWER_SOURCE_ID,
} from "../constants/layerIds.js";

export const RAW_TOWER_LAYER = {
  id: RAW_TOWER_LAYER_ID,
  type: "circle",
  source: RAW_TOWER_SOURCE_ID,
  minzoom: 12,
  paint: {
    "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 3, 12, 3, 15, 4],
    "circle-color": "#ff5a5a",
    "circle-opacity": [
      "interpolate",
      ["linear"],
      ["zoom"],
      10,
      0,
      11,
      0.35,
      12,
      1,
    ],
    "circle-stroke-color": "#ffffff",
    "circle-stroke-width": 0.8,
    "circle-stroke-opacity": 0.7,
  },
  layout: {
    visibility: "visible",
  },
};
