// import { runRenderer } from "../engine/rendererEngine";
import { initializeLayers } from "../layers/initializeLayers";
import { applyGeoJSONSources } from "./applyGeoJSONSources";
import { applyVisibility } from "./applyVisibility";
import { logHeatmapLayerStatus } from "../debug/logHeatmapLayerStatus";

export function renderMap({ map, renderState }) {
  if (!map || !renderState.mapReady) {
    return;
  }
  initializeLayers({ map, renderState });

  applyGeoJSONSources({ map, renderState });

  applyVisibility({ map, renderState });

  logHeatmapLayerStatus({ map, renderState });

  return true;
}
