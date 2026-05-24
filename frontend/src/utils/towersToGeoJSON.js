export function towersToGeoJSON(towers) {
  return {
    type: "FeatureCollection",
    features: towers
      .filter((tower) => tower.latitude != null && tower.longitude != null)
      .map((tower) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [Number(tower.longitude), Number(tower.latitude)],
        },
        properties: {
          radio: tower.radio,
          mcc: tower.mcc,
          mnc: tower.mnc,
          range: tower.range,
          avg_signal: tower.avg_signal,
          operator_name: tower.operator_name,
        },
      })),
  };
}
