export function getMapLayer(map, layerId) {
  if (!map || typeof map.getLayer !== "function") {
    return null;
  }

  return map.getLayer(layerId);
}
