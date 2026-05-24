import { getMapSource } from "./getMapSource";

export function updateGeoJSONSource(config, geoJSON) {
  const source = getMapSource(config.map, config.sourceId);

  if (source) {
    source.setData(geoJSON);
  }
}
