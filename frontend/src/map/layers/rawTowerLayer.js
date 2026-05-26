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
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["zoom"],
      10,
      2.2,
      12,
      3.2,
      15,
      4.5,
    ],

    "circle-color": "#ff6262",

    "circle-opacity": [
      "interpolate",
      ["linear"],
      ["zoom"],
      10,
      0,
      11,
      0.18,
      11.5,
      0.35,
      12,
      0.68,
      12.5,
      0.9,
      15,
      0.96,
    ],

    "circle-stroke-color": "#ffffff",

    "circle-stroke-width": [
      "interpolate",
      ["linear"],
      ["zoom"],
      10,
      0.4,
      12,
      0.7,
      15,
      1.0,
    ],

    "circle-stroke-opacity": 0.55,
  },
};
