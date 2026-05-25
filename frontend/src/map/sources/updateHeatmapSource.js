import { HEATMAP_SOURCE_ID } from "../constants/layerIds";

export function updateHeatmapSource(map, data) {
  if (!map) return;

  const source = map.getSource(HEATMAP_SOURCE_ID);

  if (!source) return;

  source.setData(data);
}

