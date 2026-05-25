import { DENSITY_LAYER_ID, DENSITY_SOURCE_ID } from "../constants/layerIds.js";

export const DENSITY_LAYER = {
  id: DENSITY_LAYER_ID,
  type: "circle",
  source: DENSITY_SOURCE_ID,
  minzoom: 5,
  maxzoom: 13,
  paint: {
    // Phase 11 — mass-oriented density styling
    // Strategy: make individual points almost invisible, increase radii
    // dramatically, use high blur at mid/low zooms and very low per-point
    // opacity so overlaps accumulate into perceptual masses.
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["zoom"],
      // At low zooms we create wide, soft blobs even for small counts.
      4,
      [
        "interpolate",
        ["linear"],
        ["get", "tower_count"],
        1,
        6,
        10,
        18,
        100,
        36,
        1000,
        72,
      ],
      // Mid zoom: stronger massing, large radii for clusters
      7,
      [
        "interpolate",
        ["linear"],
        ["get", "tower_count"],
        1,
        10,
        10,
        28,
        100,
        56,
        1000,
        110,
      ],
      // High-mid zoom: reveal structure while keeping collective feel
      11,
      [
        "interpolate",
        ["linear"],
        ["get", "tower_count"],
        1,
        18,
        10,
        44,
        100,
        88,
        1000,
        160,
      ],
    ],
    "circle-color": "#42d4c8",
    // Very low per-feature opacity to de-emphasize point identity. Overlap
    // of many low-alpha blurred circles creates the perceptual mass.
    "circle-opacity": [
      "interpolate",
      ["linear"],
      ["zoom"],
      4,
      0.02,
      6,
      0.04,
      8,
      0.06,
      10,
      0.09,
      13,
      0.14,
    ],
    // Strong blur at low-mid zooms so adjacent circles merge smoothly.
    "circle-blur": [
      "interpolate",
      ["linear"],
      ["zoom"],
      4,
      2.0,
      7,
      1.2,
      11,
      0.35,
    ],
    // Minimize stroke prominence so edges do not read as marks.
    "circle-stroke-color": "#ffffff",
    "circle-stroke-width": [
      "interpolate",
      ["linear"],
      ["zoom"],
      6,
      0.2,
      10,
      0.6,
    ],
    "circle-stroke-opacity": [
      "interpolate",
      ["linear"],
      ["zoom"],
      6,
      0,
      10,
      0.15,
    ],
  },
  layout: {
    visibility: "visible",
  },
};
