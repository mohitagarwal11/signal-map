export function getZoomValue(map) {
  if (!map) {
    return null;
  }

  return Number(map.getZoom().toFixed(2));
}
