import { updateHeatmapSource } from "../sources/updateHeatmapSource";
import { updateDensitySource } from "../sources/updateDensitySource";
import { updateRawSource } from "../sources/updateRawSource";

export function applyGeoJSONSources({ map, renderState }) {
  updateHeatmapSource(map, renderState.densityGeoJSON);

  updateDensitySource(map, renderState.densityGeoJSON);

  updateRawSource(map, renderState.rawGeoJSON);
}
