import { ensureSourceLayer } from "./ensureSourceLayer";
import { getDensityLayerConfig } from "./getDensityLayerConfig";
import { getHeatmapLayerConfig } from "./getHeatmapLayerConfig";
import { getRawTowerLayerConfig } from "./getRawTowerLayerConfig";

export function initializeLayers({ map, renderState }) {
  if (!map) {
    return false;
  }

  const heatmapReady = ensureSourceLayer({
    ...getHeatmapLayerConfig(map),
    // Heatmap renderer consumes the canonical `densityGeoJSON` dataset.
    data: renderState.densityGeoJSON,
  });

  const densityReady = ensureSourceLayer({
    ...getDensityLayerConfig(map),
    data: renderState.densityGeoJSON,
  });

  const rawReady = ensureSourceLayer({
    ...getRawTowerLayerConfig(map),
    data: renderState.rawGeoJSON,
  });

  renderState.layersInitialized = densityReady && rawReady && heatmapReady;

  return renderState.layersInitialized;
}
