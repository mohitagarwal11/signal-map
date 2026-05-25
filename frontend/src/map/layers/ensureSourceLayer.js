import { EMPTY_GEOJSON } from "../constants/renderConstants";
import { getMapLayer } from "../sources/getMapLayer";
import { getMapSource } from "../sources/getMapSource";

export function ensureSourceLayer({
  map,
  sourceId,
  layerId,
  layer,
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
      map.addLayer(layer);
    }
  } catch (error) {
    console.log(error);
    return false;
  }

  return Boolean(getMapSource(map, sourceId));
}
