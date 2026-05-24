import { ensureGeoJSONLayer } from "./ensureGeoJSONLayer";
import { ensureHeatmapLayer } from "./ensureHeatmapLayer";
import { getClusterLayerConfig } from "./getClusterLayerConfig";
import { getHeatmapLayerConfig } from "./getHeatmapLayerConfig";
import { getRawTowerLayerConfig } from "./getRawTowerLayerConfig";

export function initializeLayers({ map, renderState }) {
  if (!map) {
    return false;
  }

  const clusterReady = ensureGeoJSONLayer({
    ...getClusterLayerConfig(map),

    data: renderState.clusterGeoJSON,
  });

  const rawReady = ensureGeoJSONLayer({
    ...getRawTowerLayerConfig(map),

    data: renderState.rawGeoJSON,
  });

  let heatmapReady = true;

  if (renderState.heatmapAvailable) {
    heatmapReady = ensureHeatmapLayer({
      ...getHeatmapLayerConfig(map),

      data: renderState.clusterGeoJSON,
    });

    if (heatmapReady === false) {
      renderState.heatmapAvailable = false;
    }
  }

  renderState.layersInitialized =
    clusterReady &&
    rawReady &&
    (!renderState.heatmapAvailable || heatmapReady === true);

  return renderState.layersInitialized;
}
