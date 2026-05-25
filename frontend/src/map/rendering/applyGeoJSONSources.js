import { updateHeatmapSource } from "../sources/updateHeatmapSource";
import { updateRawSource } from "../sources/updateRawSource";

export function applyGeoJSONSources({ map, renderState }) {
  updateHeatmapSource(map, renderState.heatmapGeoJSON);

  updateRawSource(map, renderState.towersGeoJSON);
}
