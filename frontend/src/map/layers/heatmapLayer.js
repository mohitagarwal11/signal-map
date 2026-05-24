import { HEATMAP_LAYER_ID, HEATMAP_SOURCE_ID } from "../constants/layerIds";

export const HEATMAP_LAYER = {
  id: HEATMAP_LAYER_ID,
  type: "heatmap",
  source: HEATMAP_SOURCE_ID,
  maxzoom: 5.2,

  paint: {
    "heatmap-weight": [
      "interpolate",
      ["linear"],
      ["ln", ["+", ["get", "tower_count"], 1]],

      0,
      0,
      2,
      0.1,
      4,
      0.25,
      6,
      0.5,
      8,
      0.78,
      10,
      1,
    ],

    // Main visual energy
    "heatmap-intensity": [
      "interpolate",
      ["linear"],
      ["zoom"],

      4,
      1.6,
      4.5,
      2,
      5,
      2.5,
    ],

    // Controls smoothing
    "heatmap-radius": [
      "interpolate",
      ["linear"],
      ["zoom"],

      4,
      40,
      4.5,
      58,
      5,
      76,
    ],

    // Fade into clusters
    "heatmap-opacity": [
      "interpolate",
      ["linear"],
      ["zoom"],

      4,
      0.92,
      4.7,
      0.72,
      5,
      0,
    ],

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
