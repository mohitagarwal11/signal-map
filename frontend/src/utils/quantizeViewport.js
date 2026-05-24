function getPrecision(step) {
  const [, decimals = ""] = String(step).split(".");
  return decimals.length;
}

function snapDown(value, step) {
  return Number((Math.floor(value / step) * step).toFixed(getPrecision(step)));
}

function snapUp(value, step) {
  return Number((Math.ceil(value / step) * step).toFixed(getPrecision(step)));
}

export function quantizeViewport(bounds, step) {
  return {
    min_lat: snapDown(bounds.min_lat, step),
    max_lat: snapUp(bounds.max_lat, step),
    min_lon: snapDown(bounds.min_lon, step),
    max_lon: snapUp(bounds.max_lon, step),
  };
}
