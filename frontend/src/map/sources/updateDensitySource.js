import { DENSITY_SOURCE_ID } from "../constants/layerIds";

export function updateDensitySource(map, data) {
  if (!map) return;

  const source = map.getSource(DENSITY_SOURCE_ID);

  if (!source) return;

  source.setData(data);
}
