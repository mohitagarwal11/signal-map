import { getMapLayer } from "../sources/getMapLayer";

export function setLayerVisibility(
  map,
  layerId,
  weight,
  maxOpacity,
  opacityProperty = "circle-opacity",
) {
  if (!map || !getMapLayer(map, layerId)) {
    return;
  }

  // Epsilon threshold to avoid flicker from tiny floating point weights.
  const EPSILON = 0.001;

  const clamped = Math.max(0, Math.min(1, weight || 0));
  const appliedOpacity =
    clamped * (typeof maxOpacity === "number" ? maxOpacity : 1);

  // Always apply paint opacity when possible — composition is driven by
  // opacity interpolation rather than layout visibility toggles.
  if (typeof map.setPaintProperty === "function") {
    map.setPaintProperty(layerId, opacityProperty, appliedOpacity);
  }

  // Use layout visibility only as a coarse control with an epsilon threshold
  // to avoid layer popping. Layers remain mounted during overlap zones when
  // their weight is above EPSILON.
  if (typeof map.setLayoutProperty === "function") {
    const visibility = clamped > EPSILON ? "visible" : "none";
    map.setLayoutProperty(layerId, "visibility", visibility);
  }
}
