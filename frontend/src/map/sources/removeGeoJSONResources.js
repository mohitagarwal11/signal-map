import { getMapLayer } from "./getMapLayer";
import { getMapSource } from "./getMapSource";

export function removeGeoJSONLayerResources(map, sourceId, layerId) {
  if (!map) {
    return;
  }

  if (getMapLayer(map, layerId)) {
    map.removeLayer(layerId);
  }

  if (getMapSource(map, sourceId)) {
    map.removeSource(sourceId);
  }
}
