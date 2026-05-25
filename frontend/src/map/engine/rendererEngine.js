import { devLog } from "../../utils/devLog";
import { initializeLayers } from "../layers/initializeLayers";
import { applyGeoJSONSources } from "../rendering/applyGeoJSONSources";
import { applyVisibility } from "../rendering/applyVisibility";
import { logHeatmapLayerStatus } from "../debug/logHeatmapLayerStatus";
import { RAW_TOWER_LAYER_ID, RAW_TOWER_SOURCE_ID } from "../constants/layerIds";
import { getMapLayer } from "../sources/getMapLayer";
import { getMapSource } from "../sources/getMapSource";
import { getZoomValue } from "../utils/getZoomValue";

// Lightweight renderer engine that centralizes layer initialization,
// source updates, and visibility application. This file exists to isolate
// rendering ownership from the map wiring code and make it easier to
// introduce a field renderer in the future.
export function runRenderer({ map, renderState }) {
  if (!map || !renderState || !renderState.mapReady) return false;

  // Ensure layers and sources are mounted and receive their data.
  initializeLayers({ map, renderState });

  // Debug status for raw layer (moved here from renderMap to consolidate
  // render-related logging).
  devLog("RAW_LAYER_STATUS", {
    fetchMode: renderState.fetchMode,
    zoom: getZoomValue(map),
    rawFeatureCount: renderState.rawGeoJSON.features.length,
    rawSourcePresent: Boolean(getMapSource(map, RAW_TOWER_SOURCE_ID)),
    rawLayerPresent: Boolean(getMapLayer(map, RAW_TOWER_LAYER_ID)),
  });

  // Push GeoJSON into sources used by renderers.
  applyGeoJSONSources({ map, renderState });

  // Compute & apply renderer visibility/weights and write diagnostics.
  applyVisibility({ map, renderState });

  // Additional render-time diagnostics for the heatmap layer.
  logHeatmapLayerStatus({ map, renderState });

  return true;
}
