import { EMPTY_GEOJSON } from "../constants/renderConstants";
import { getMapLayer } from "../sources/getMapLayer";
import { getMapSource } from "../sources/getMapSource";

export function addMapLayer(map, layer, fallbackLayer) {
  try {
    map.addLayer(layer);
  } catch (error) {
    if (!fallbackLayer) {
      throw error;
    }

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
  if (!map) {
    return false;
  }

  try {
    if (!getMapSource(map, sourceId)) {
      map.addSource(sourceId, {
        type: "geojson",
        data,
      });
    }

    if (!getMapLayer(map, layerId)) {
      addMapLayer(map, layer, fallbackLayer);
    }
  } catch (error) {
    console.log(error);
    return false;
  }

  return Boolean(getMapSource(map, sourceId));
}
