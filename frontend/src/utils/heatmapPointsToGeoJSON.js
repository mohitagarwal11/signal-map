export function heatmapPointsToGeoJSON(points) {
  return {
    type: "FeatureCollection",
    features: points
      .filter((point) => point.latitude != null && point.longitude != null)
      .map((point) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [Number(point.longitude), Number(point.latitude)],
        },
      })),
  };
}
