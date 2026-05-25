import { updateHeatmapSource } from "../sources/updateHeatmapSource";
import { updateDensitySource } from "../sources/updateDensitySource";
import { updateRawSource } from "../sources/updateRawSource";

export function applyGeoJSONSources({ map, renderState }) {
  // Both heatmap and density renderers consume the canonical density dataset.
  // Keep separate MapLibre sources, but feed them the same underlying data.
  updateHeatmapSource(map, renderState.densityGeoJSON);

  updateDensitySource(map, renderState.densityGeoJSON);

  updateRawSource(map, renderState.rawGeoJSON);
}
