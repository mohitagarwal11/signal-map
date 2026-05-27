import { initializeLayers } from "../layers/initializeLayers";
import { applyGeoJSONSources } from "./applyGeoJSONSources";

export function renderMap({ map, renderState }) {
  if (!map || !renderState.mapReady) {
    return;
  }
  initializeLayers({ map, renderState });

  applyGeoJSONSources({ map, renderState });

  return true;
}
