import { devLog } from "../../utils/devLog";
import {
  DENSITY_LAYER_ID,
  HEATMAP_LAYER_ID,
  RAW_TOWER_LAYER_ID,
} from "../constants/layerIds";
import { deriveVisibility } from "./deriveVisibility";
import { setLayerVisibility } from "./setLayerVisibility";
import { getMapLayer } from "../sources/getMapLayer";
import { getZoomValue } from "../utils/getZoomValue";

export function applyVisibility({ map, renderState }) {
  const zoom = getZoomValue(map);

  const {
    densityWeight,
    heatmapWeight,
    rawWeight,
    rendererPolicy,
    rendererDiagnostics,
  } = deriveVisibility({
    zoom,
    densityAvailable: renderState.densityAvailable,
    rawAvailable: renderState.rawAvailable,
  });

  // Persist the calculated renderer policy into render state for future
  // renderer composition work (crossfade, blending, etc.). The policy is
  // active (contains fade ranges) and the evaluator above produced numeric
  // weights for each renderer.
  renderState.rendererPolicy = rendererPolicy;

  // Store both a numeric weights snapshot and a boolean snapshot derived from
  // weights. Consumers should prefer `rendererWeights` for composition logic.
  renderState.rendererWeights = {
    density: densityWeight,
    heatmap: heatmapWeight,
    raw: rawWeight,
  };

  // boolean visibility snapshot intentionally omitted; consumers should
  // rely on `renderState.rendererWeights` and `rendererDiagnostics`.

  renderState.rendererDiagnostics = rendererDiagnostics;

  // Apply weights by mapping them onto a layer's max opacity. This keeps
  // existing paint styles intact while enabling smooth crossfades and
  // overlapping renderers via fractional opacities.
  // Tuned max opacities to improve perceptual hierarchy. These are still
  // conservative to avoid visual regressions while allowing density to be
  // slightly more dominant during handoffs.
  const MAX_OPACITY = {
    heatmap: 0.8,
    density: 0.95,
    raw: 0.95,
  };

  setLayerVisibility(map, DENSITY_LAYER_ID, densityWeight, MAX_OPACITY.density);

  setLayerVisibility(
    map,
    HEATMAP_LAYER_ID,
    heatmapWeight,
    MAX_OPACITY.heatmap,
    "heatmap-opacity",
  );

  setLayerVisibility(map, RAW_TOWER_LAYER_ID, rawWeight, MAX_OPACITY.raw);

  devLog("VISIBILITY_STATE", {
    fetchMode: renderState.fetchMode,
    zoom,
    densityWeight,
    heatmapWeight,
    rawWeight,
    rendererDiagnostics,
    rawLayerPresent: Boolean(getMapLayer(map, RAW_TOWER_LAYER_ID)),
  });
}
