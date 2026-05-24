export function getMapSource(map, sourceId) {
  if (!map) {
    return null;
  }
  return map.getSource(sourceId);
}
