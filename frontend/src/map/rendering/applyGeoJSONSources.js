import { updateHeatmapSource } from "../sources/updateHeatmapSource";
import { updateClusterSource } from "../sources/updateClusterSource";
import { updateRawSource } from "../sources/updateRawSource";

export function applyGeoJSONSources({ map, renderState }) {
  updateHeatmapSource(map, renderState.heatmapGeoJSON);

  updateClusterSource(map, renderState.clusterGeoJSON);

  updateRawSource(map, renderState.rawGeoJSON);
}
