const VIEWPORT_PRECISION = 3;

function roundCoordinate(value) {
  return Number(value).toFixed(VIEWPORT_PRECISION);
}

export function createViewportKey(bounds) {
  return [
    roundCoordinate(bounds.min_lat),
    roundCoordinate(bounds.max_lat),
    roundCoordinate(bounds.min_lon),
    roundCoordinate(bounds.max_lon),
  ].join("_");
}
