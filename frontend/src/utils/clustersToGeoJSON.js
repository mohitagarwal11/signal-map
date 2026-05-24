export function clustersToGeoJSON(clusters) {
  return {
    type: "FeatureCollection",
    features: clusters
      .filter((cluster) => cluster.latitude != null && cluster.longitude != null)
      .map((cluster) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [Number(cluster.longitude), Number(cluster.latitude)],
        },
        properties: {
          tower_count: Number(cluster.tower_count) || 0,
        },
      })),
  };
}
