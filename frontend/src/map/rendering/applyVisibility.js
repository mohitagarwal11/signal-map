import { devLog } from "../../utils/devLog";
import { HEATMAP_LAYER_ID, RAW_TOWER_LAYER_ID } from "../constants/layerIds";
import { deriveVisibility } from "./deriveVisibility";
import { setLayerVisibility } from "./setLayerVisibility";
import { getMapLayer } from "../sources/getMapLayer";
import { getZoomValue } from "../utils/getZoomValue";

export function applyVisibility({ map, renderState }) {
  const zoom = getZoomValue(map);

  const { heatmapWeight, towersWeight, rendererPolicy, rendererDiagnostics } =
    deriveVisibility({
      zoom,
      heatmapAvailable: renderState.heatmapAvailable,
      towersAvailable: renderState.towersAvailable,
    });

  // Persist the calculated renderer policy into render state for future
  // renderer composition work (crossfade, blending, etc.). The policy is
  // active (contains fade ranges) and the evaluator above produced numeric
  // weights for each renderer.
  renderState.rendererPolicy = rendererPolicy;

  renderState.rendererWeights = {
    heatmap: heatmapWeight,
    towers: towersWeight,
  };

  renderState.rendererDiagnostics = rendererDiagnostics;

  const MAX_OPACITY = {
    heatmap: 0.8,
    towers: 0.95,
  };

  setLayerVisibility(
    map,
    HEATMAP_LAYER_ID,
    heatmapWeight,
    MAX_OPACITY.heatmap,
    "heatmap-opacity",
  );

  setLayerVisibility(map, RAW_TOWER_LAYER_ID, towersWeight, MAX_OPACITY.towers);

  devLog("VISIBILITY_STATE", {
    fetchMode: renderState.fetchMode,
    zoom,
    heatmapWeight,
    towersWeight,
    rendererDiagnostics,
    rawLayerPresent: Boolean(getMapLayer(map, RAW_TOWER_LAYER_ID)),
  });
}
