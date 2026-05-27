export function getLayerVisibility(map, layerId) {
  if (!map || (typeof map.getLayer === "function" && !map.getLayer(layerId))) {
    return "missing";
  }

  if (typeof map.getLayoutProperty === "function") {
    return map.getLayoutProperty(layerId, "visibility") ?? "unknown";
  }

  return "unknown";
}
