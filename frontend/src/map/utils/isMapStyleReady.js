export function isMapStyleReady(map) {
  if (!map) {
    return false;
  }

  return typeof map.isStyleLoaded !== "function" || map.isStyleLoaded();
}
