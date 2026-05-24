import { devLog } from "../../utils/devLog";

import { EMPTY_GEOJSON } from "../constants/renderConstants";

import { getMapLayer } from "../sources/getMapLayer";
import { getMapSource } from "../sources/getMapSource";

import { isMapStyleReady } from "../utils/isMapStyleReady";

export function addMapLayer(map, layer, fallbackLayer) {
  try {
    map.addLayer(layer);
  } catch (error) {
    if (!fallbackLayer) {
      throw error;
    }

    devLog("Falling back to static map layer styling:", error);

    map.addLayer(fallbackLayer);
  }
}

export function ensureGeoJSONLayer({
  map,
  sourceId,
  layerId,
  layer,
  fallbackLayer,
  data = EMPTY_GEOJSON,
}) {
  if (
    !map ||
    typeof map.addSource !== "function" ||
    typeof map.addLayer !== "function" ||
    !isMapStyleReady(map)
  ) {
    return false;
  }

  if (!getMapSource(map, sourceId)) {
    map.addSource(sourceId, {
      type: "geojson",
      data,
    });
  }

  if (!getMapLayer(map, layerId)) {
    addMapLayer(map, layer, fallbackLayer);
  }

  return Boolean(getMapSource(map, sourceId));
}
