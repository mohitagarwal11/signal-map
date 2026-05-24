export function getMapSource(map, sourceId) {
  if (!map || typeof map.getSource !== "function") {
    return null;
  }

  return map.getSource(sourceId);
}
