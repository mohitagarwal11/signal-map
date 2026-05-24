import { getMapLayer } from "../sources/getMapLayer";

export function getLayerVisibility(map, layerId) {
  if (!map || !getMapLayer(map, layerId)) {
    return "missing";
  }

  if (typeof map.getLayoutProperty === "function") {
    return map.getLayoutProperty(layerId, "visibility") ?? "unknown";
  }

  return "unknown";
}
