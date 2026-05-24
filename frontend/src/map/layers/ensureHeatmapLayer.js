import { devLog } from "../../utils/devLog";

import { EMPTY_GEOJSON } from "../constants/renderConstants";

import { CLUSTER_LAYER_ID } from "../constants/layerIds";

import { getMapLayer } from "../sources/getMapLayer";
import { getMapSource } from "../sources/getMapSource";

import { isMapStyleReady } from "../utils/isMapStyleReady";

export function ensureHeatmapLayer({
  map,
  sourceId,
  layerId,
  layer,
  data = EMPTY_GEOJSON,
}) {
  if (
    !map ||
    typeof map.addSource !== "function" ||
    typeof map.addLayer !== "function" ||
    !isMapStyleReady(map)
  ) {
    return null;
  }

  if (!getMapSource(map, sourceId)) {
    map.addSource(sourceId, {
      type: "geojson",
      data,
    });
  }

  if (!getMapLayer(map, layerId)) {
    try {
      const beforeLayerId = getMapLayer(map, CLUSTER_LAYER_ID)
        ? CLUSTER_LAYER_ID
        : undefined;

      map.addLayer(layer, beforeLayerId);
    } catch (error) {
      devLog("Heatmap layer unsupported; falling back to clusters only.", {
        error: error?.message ?? error,
      });

      return false;
    }
  }

  const heatmapLayer = getMapLayer(map, layerId);

  if (!heatmapLayer || heatmapLayer.type !== "heatmap") {
    devLog("Heatmap layer unsupported; unexpected layer type.", {
      detectedType: heatmapLayer?.type ?? "none",
    });

    if (heatmapLayer && typeof map.removeLayer === "function") {
      map.removeLayer(layerId);
    }

    return false;
  }

  return Boolean(getMapSource(map, sourceId));
}
