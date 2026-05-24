export function getZoomValue(map) {
  if (!map || typeof map.getZoom !== "function") {
    return null;
  }

  return Number(map.getZoom().toFixed(2));
}
