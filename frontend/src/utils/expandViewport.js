export function expandViewport(bounds, factor) {
  const latSpan = bounds.max_lat - bounds.min_lat;
  const lonSpan = bounds.max_lon - bounds.min_lon;
  const latPadding = latSpan * factor;
  const lonPadding = lonSpan * factor;

  return {
    min_lat: bounds.min_lat - latPadding,
    max_lat: bounds.max_lat + latPadding,
    min_lon: bounds.min_lon - lonPadding,
    max_lon: bounds.max_lon + lonPadding,
  };
}
