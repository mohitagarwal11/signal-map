import { HEATMAP_LAYER_ID, HEATMAP_SOURCE_ID } from "../constants/layerIds";

export const HEATMAP_LAYER = {
  id: HEATMAP_LAYER_ID,
  type: "heatmap",
  source: HEATMAP_SOURCE_ID,
  minzoom: 4,
  maxzoom: 7,
  paint: {
    "heatmap-weight": 1,

    "heatmap-intensity": [
      "interpolate",
      ["linear"],
      ["zoom"],
      4,
      3,
      5,
      2,
      6,
      1,
    ],

    "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 4, 14],

    "heatmap-opacity": [
      "interpolate",
      ["linear"],
      ["zoom"],
      4,
      0.9,
      5,
      0.75,
      6,
      0.5,
      7,
      0,
    ],

    "heatmap-color": [
      "interpolate",
      ["linear"],
      ["heatmap-density"],
      0.0,
      "rgba(0,0,0,0)",
      0.08,
      "rgba(90,90,255,0.20)",
      0.2,
      "#4f6df5",
      0.38,
      "#42d4c8",
      0.56,
      "#6fe35b",
      0.74,
      "#d7ea46",
      0.88,
      "#ffb340",
      1.0,
      "#ff4d4d",
    ],
  },

  layout: {
    visibility: "visible",
  },
};
