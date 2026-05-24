import { devLog } from "../../utils/devLog";

import { HEATMAP_LAYER_ID, HEATMAP_SOURCE_ID } from "../constants/layerIds";

import { getMapSource } from "./getMapSource";

import { getZoomValue } from "../utils/getZoomValue";

export function updateHeatmapSource({ map, geoJSON }) {
  const source = getMapSource(map, HEATMAP_SOURCE_ID);

  if (!source) {
    devLog("HEATMAP_SOURCE_MISSING", {
      layerId: HEATMAP_LAYER_ID,

      featureCount: geoJSON.features.length,

      zoom: getZoomValue(map),
    });

    return;
  }

  if (typeof source.setData === "function") {
    const setDataStart = performance.now();

    source.setData(geoJSON);

    const setDataDuration = performance.now() - setDataStart;

    devLog("PERF heatmap_source_set_data", {
      layerId: HEATMAP_LAYER_ID,

      featureCount: geoJSON.features.length,

      durationMs: Number(setDataDuration.toFixed(2)),
    });
  }
}
