import { devLog } from "../../utils/devLog";
import { getMapLayer } from "../sources/getMapLayer";
import { getMapSource } from "../sources/getMapSource";
import { getLayerVisibility } from "../utils/getLayerVisibility";
import { getZoomValue } from "../utils/getZoomValue";
import { HEATMAP_LAYER_ID, HEATMAP_SOURCE_ID } from "../constants/layerIds";

export function logHeatmapLayerStatus({ map, renderState }) {
  const heatmapLayer = getMapLayer(map, HEATMAP_LAYER_ID);

  devLog("HEATMAP_LAYER_STATUS", {
    sourcePresent: Boolean(getMapSource(map, HEATMAP_SOURCE_ID)),

    layerPresent: Boolean(heatmapLayer),

    featureCount: renderState.clusterGeoJSON.features.length,

    layerType: heatmapLayer?.type ?? "none",

    visibility: getLayerVisibility(map, HEATMAP_LAYER_ID),

    zoom: getZoomValue(map),
  });
}
