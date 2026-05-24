import { getMapLayer } from "../sources/getMapLayer";

export function setLayerVisibility(
  map,
  layerId,
  visible,
  visibleOpacity,
  opacityProperty = "circle-opacity",
) {
  if (!map || !getMapLayer(map, layerId)) {
    return;
  }

  if (typeof map.setLayoutProperty === "function") {
    map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");

    return;
  }

  if (typeof map.setPaintProperty === "function") {
    map.setPaintProperty(
      layerId,
      opacityProperty,
      visible ? visibleOpacity : 0,
    );
  }
}
