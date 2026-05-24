import { RAW_TOWER_SOURCE_ID, RAW_TOWER_LAYER_ID } from "../constants/layerIds";
import { RAW_TOWER_LAYER } from "./rawTowerLayer";

export function getRawTowerLayerConfig(map) {
  return {
    map,
    sourceId: RAW_TOWER_SOURCE_ID,
    layerId: RAW_TOWER_LAYER_ID,
    layer: RAW_TOWER_LAYER,
    logLabel: "raw",
  };
}
