export function densityToGeoJSON(density) {
  return {
    type: "FeatureCollection",
    features: density
      .filter((density) => density.latitude != null && density.longitude != null)
      .map((density) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [Number(density.longitude), Number(density.latitude)],
        },
        properties: {
          tower_count: Number(density.tower_count) || 0,
        },
      })),
  };
}
