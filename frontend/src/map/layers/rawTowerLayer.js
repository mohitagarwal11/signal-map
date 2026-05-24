import {
  RAW_TOWER_LAYER_ID,
  RAW_TOWER_SOURCE_ID,
} from "../constants/layerIds.js";

export const RAW_TOWER_LAYER = {
  id: RAW_TOWER_LAYER_ID,
  type: "circle",
  source: RAW_TOWER_SOURCE_ID,
  paint: {
    "circle-radius": 6,
    "circle-color": "#ff2d2d",
    "circle-opacity": 0.95,
    "circle-stroke-color": "#000000",
    "circle-stroke-width": 1.5,
    "circle-stroke-opacity": 1,
  },
  layout: {
    visibility: "none",
  },
};
