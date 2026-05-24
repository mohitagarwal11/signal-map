import { HEATMAP_SOURCE_ID } from "../constants/layerIds";
import { getClusterLayerConfig } from "../layers/getClusterLayerConfig";
import { getRawTowerLayerConfig } from "../layers/getRawTowerLayerConfig";
import { getMapSource } from "../sources/getMapSource";
import { updateGeoJSONSource } from "../sources/updateGeoJSONSource";
import { updateHeatmapSource } from "../sources/updateHeatmapSource";

export function applyGeoJSONSources({ map, renderState }) {
  updateGeoJSONSource(getClusterLayerConfig(map), renderState.clusterGeoJSON);
  updateGeoJSONSource(getRawTowerLayerConfig(map), renderState.rawGeoJSON);

  const heatmapSourcePresent = Boolean(getMapSource(map, HEATMAP_SOURCE_ID));

  if (renderState.heatmapAvailable || heatmapSourcePresent) {
    updateHeatmapSource({
      map,
      geoJSON: renderState.clusterGeoJSON,
    });
  }
}
