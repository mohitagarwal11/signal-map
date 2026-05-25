import { runRenderer } from "../engine/rendererEngine";

export function renderMap({ map, renderState }) {
  if (!map || !renderState.mapReady) {
    return;
  }
  // Delegate to renderer engine which centralizes layer/source/visibility
  // responsibilities. This makes the map wiring simpler and prepares a
  // clean insertion point for a future field renderer or custom WebGL
  // implementation.
  runRenderer({ map, renderState });
}
