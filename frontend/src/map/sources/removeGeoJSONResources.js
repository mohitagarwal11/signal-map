import { getMapLayer } from "./getMapLayer";

import { getMapSource } from "./getMapSource";

export function removeGeoJSONLayerResources(map, sourceId, layerId) {
  if (!map) {
    return;
  }

  if (getMapLayer(map, layerId) && typeof map.removeLayer === "function") {
    map.removeLayer(layerId);
  }

  if (getMapSource(map, sourceId) && typeof map.removeSource === "function") {
    map.removeSource(sourceId);
  }
}
