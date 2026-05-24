export function getMapLayer(map, layerId) {
  if (!map) {
    return null;
  }
  return map.getLayer(layerId);
}
