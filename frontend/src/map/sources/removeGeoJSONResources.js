export function removeGeoJSONLayerResources(map, sourceId, layerId) {
  if (!map) {
    return;
  }

  if (map.getLayer && map.getLayer(layerId)) {
    map.removeLayer(layerId);
  }

  if (map.getSource && map.getSource(sourceId)) {
    map.removeSource(sourceId);
  }
}
