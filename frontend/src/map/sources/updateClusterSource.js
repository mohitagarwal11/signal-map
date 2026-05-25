import { CLUSTER_SOURCE_ID } from "../constants/layerIds";

export function updateClusterSource(map, data) {
  if (!map) return;

  const source = map.getSource(CLUSTER_SOURCE_ID);

  if (!source) return;

  source.setData(data);
}
