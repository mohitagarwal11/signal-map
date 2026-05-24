import { devLog } from "../../utils/devLog";
import { RAW_TOWER_LAYER_ID, RAW_TOWER_SOURCE_ID } from "../constants/layerIds";
import { initializeLayers } from "../layers/initializeLayers";
import { applyGeoJSONSources } from "./applyGeoJSONSources";
import { applyVisibility } from "./applyVisibility";
import { getMapLayer } from "../sources/getMapLayer";
import { getMapSource } from "../sources/getMapSource";
import { logHeatmapLayerStatus } from "../debug/logHeatmapLayerStatus";
import { getZoomValue } from "../utils/getZoomValue";
import { isMapStyleReady } from "../utils/isMapStyleReady";

export function renderMap({ map, renderState }) {
  if (!map || !renderState.mapReady || !isMapStyleReady(map)) {
    return;
  }

  initializeLayers({
    map,
    renderState,
  });

  devLog("RAW_LAYER_STATUS", {
    mode: renderState.mode,

    zoom: getZoomValue(map),

    rawFeatureCount: renderState.rawGeoJSON.features.length,

    rawSourcePresent: Boolean(getMapSource(map, RAW_TOWER_SOURCE_ID)),

    rawLayerPresent: Boolean(getMapLayer(map, RAW_TOWER_LAYER_ID)),
  });

  applyGeoJSONSources({
    map,
    renderState,
  });

  applyVisibility({
    map,
    renderState,
  });

  logHeatmapLayerStatus({
    map,
    renderState,
  });
}
