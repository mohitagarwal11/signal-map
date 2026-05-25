import { HEATMAP_LAYER_ID, HEATMAP_SOURCE_ID } from "../constants/layerIds";

export const HEATMAP_LAYER = {
  id: HEATMAP_LAYER_ID,
  type: "heatmap",
  source: HEATMAP_SOURCE_ID,
  minzoom: 0,
  maxzoom: 9,
  paint: {
    "heatmap-weight": 1,

    // Main visual energy
    "heatmap-intensity": [
      "interpolate",
      ["linear"],
      ["zoom"],
      4,
      1.4,
      5,
      1.9,
      6,
      2.3,
      8,
      2.6,
    ],

    // Controls smoothing
    "heatmap-radius": [
      "interpolate",
      ["linear"],
      ["zoom"],
      4,
      18,
      6,
      32,
      8,
      50,
    ],

    // Fade into clusters
    "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 6, 1, 8, 0],

    // Density ramp
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
