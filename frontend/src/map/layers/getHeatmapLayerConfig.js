import { HEATMAP_SOURCE_ID, HEATMAP_LAYER_ID } from "../constants/layerIds";
import { HEATMAP_LAYER } from "./heatmapLayer";

export function getHeatmapLayerConfig(map) {
  return {
    map,
    sourceId: HEATMAP_SOURCE_ID,
    layerId: HEATMAP_LAYER_ID,
    layer: HEATMAP_LAYER,
  };
}
