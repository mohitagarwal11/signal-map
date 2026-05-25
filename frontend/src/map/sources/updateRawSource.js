import { RAW_TOWER_SOURCE_ID } from "../constants/layerIds";

export function updateRawSource(map, data) {
  if (!map) return;

  const source = map.getSource(RAW_TOWER_SOURCE_ID);

  if (!source) return;

  source.setData(data);
}
