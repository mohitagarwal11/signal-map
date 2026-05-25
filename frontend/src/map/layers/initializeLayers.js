import { ensureSourceLayer } from "./ensureSourceLayer";
import { getClusterLayerConfig } from "./getClusterLayerConfig";
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

  const clusterReady = ensureSourceLayer({
    ...getClusterLayerConfig(map),
    data: renderState.clusterGeoJSON,
    sourceOptions: {
      cluster: true,
      clusterRadius: 50,
      clusterMaxZoom: 10,
    },
  });

  const rawReady = ensureSourceLayer({
    ...getRawTowerLayerConfig(map),
    data: renderState.rawGeoJSON,
  });

  renderState.layersInitialized = clusterReady && rawReady && heatmapReady;

  return renderState.layersInitialized;
}
