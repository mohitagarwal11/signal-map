import { EMPTY_GEOJSON } from "../constants/renderConstants";

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
    if (!map.getSource || !map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "geojson",
        data,
      });
    }

    if (!map.getLayer || !map.getLayer(layerId)) {
      map.addLayer(layer);
    }
  } catch (error) {
    console.log(error);
    return false;
  }

  return Boolean(map.getSource && map.getSource(sourceId));
}
