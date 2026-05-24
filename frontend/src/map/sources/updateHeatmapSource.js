import { HEATMAP_SOURCE_ID } from "../constants/layerIds";
import { getMapSource } from "./getMapSource";

export function updateHeatmapSource({ map, geoJSON }) {
  const source = getMapSource(map, HEATMAP_SOURCE_ID);

  if (!source) {
    return;
  }

  if (typeof source.setData === "function") {
    source.setData(geoJSON);
  }
}
