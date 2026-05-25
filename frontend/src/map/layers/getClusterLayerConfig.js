import { CLUSTER_SOURCE_ID, CLUSTER_LAYER_ID } from "../constants/layerIds";
import { CLUSTER_LAYER } from "./clusterLayer";

export function getClusterLayerConfig(map) {
  return {
    map,
    sourceId: CLUSTER_SOURCE_ID,
    layerId: CLUSTER_LAYER_ID,
    layer: CLUSTER_LAYER,
    logLabel: "cluster",
  };
}
