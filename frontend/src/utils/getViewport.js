export function getViewport(map) {
  const bounds = map.getBounds();

  const min_lat = bounds._sw.lat;
  const min_lon = bounds._sw.lng;

  const max_lat = bounds._ne.lat;
  const max_lon = bounds._ne.lng;

  // console.log("Viewport bounds:", {
  //   min_lat,
  //   min_lon,
  //   max_lat,
  //   max_lon,
  // });

  return {
    min_lat,
    max_lat,
    min_lon,
    max_lon,
  };
}
