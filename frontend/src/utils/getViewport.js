export function getViewport(map) {
  const bounds = map.getBounds();

  const min_lat = bounds._sw.lat;
  const min_lng = bounds._sw.lon;

  const max_lat = bounds._ne.lat;
  const max_lng = bounds._ne.lon;

  // console.log("Viewport bounds:", {
  //   min_lat,
  //   min_lon,
  //   max_lat,
  //   max_lon,
  // });

  return {
    min_lat,
    min_lng,
    max_lat,
    max_lng,
  };
}
