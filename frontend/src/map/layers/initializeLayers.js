import { ensureSourceLayer } from "./ensureSourceLayer";
import { getHeatmapLayerConfig } from "./getHeatmapLayerConfig";
import { getRawTowerLayerConfig } from "./getRawTowerLayerConfig";

export function initializeLayers({ map, renderState }) {
  if (!map) {
    return false;
  }

  const heatmapReady = ensureSourceLayer({
    ...getHeatmapLayerConfig(map),
    data: renderState.heatmapGeoJSON,
  });

  const rawReady = ensureSourceLayer({
    ...getRawTowerLayerConfig(map),
    data: renderState.towersGeoJSON,
  });

  renderState.layersInitialized = rawReady && heatmapReady;

  return renderState.layersInitialized;
}
