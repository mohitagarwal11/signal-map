import { devLog } from "../../utils/devLog";

import { getMapSource } from "./getMapSource";

export function updateGeoJSONSource(config, geoJSON) {
  const source = getMapSource(config.map, config.sourceId);

  if (source && typeof source.setData === "function") {
    const setDataStart = performance.now();

    source.setData(geoJSON);

    const setDataDuration = performance.now() - setDataStart;

    devLog("PERF geojson_source_set_data", {
      layerId: config.layerId,

      featureCount: geoJSON.features.length,

      durationMs: Number(setDataDuration.toFixed(2)),
    });

    if (config.logLabel) {
      devLog(`PERF ${config.logLabel}_source_set_data`, {
        layerId: config.layerId,

        featureCount: geoJSON.features.length,

        durationMs: Number(setDataDuration.toFixed(2)),
      });
    }
  }
}
