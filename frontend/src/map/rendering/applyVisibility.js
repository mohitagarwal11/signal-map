import { devLog } from "../../utils/devLog";
import {
  CLUSTER_LAYER_ID,
  HEATMAP_LAYER_ID,
  RAW_TOWER_LAYER_ID,
} from "../constants/layerIds";
import { deriveVisibility } from "./deriveVisibility";
import { setLayerVisibility } from "./setLayerVisibility";
import { getMapLayer } from "../sources/getMapLayer";
import { getZoomValue } from "../utils/getZoomValue";

export function applyVisibility({ map, renderState }) {
  const zoom = getZoomValue(map);

  const { clusterVisible, heatmapVisible, rawVisible } = deriveVisibility({
    zoom,
    heatmapAvailable: renderState.heatmapAvailable,
  });

  setLayerVisibility(map, CLUSTER_LAYER_ID, clusterVisible, 0.9);

  if (renderState.heatmapAvailable) {
    setLayerVisibility(
      map,
      HEATMAP_LAYER_ID,
      heatmapVisible,
      0.85,
      "heatmap-opacity",
    );
  }

  setLayerVisibility(map, RAW_TOWER_LAYER_ID, rawVisible, 0.95);

  devLog("VISIBILITY_STATE", {
    mode: renderState.mode,
    zoom,
    clusterVisible,
    heatmapVisible,
    rawVisible,
    rawLayerPresent: Boolean(getMapLayer(map, RAW_TOWER_LAYER_ID)),
  });
}
