import { DENSITY_SOURCE_ID, DENSITY_LAYER_ID } from "../constants/layerIds";
import { DENSITY_LAYER } from "./densityLayer";

export function getDensityLayerConfig(map) {
  return {
    map,
    sourceId: DENSITY_SOURCE_ID,
    layerId: DENSITY_LAYER_ID,
    layer: DENSITY_LAYER,
    logLabel: "density",
  };
}
