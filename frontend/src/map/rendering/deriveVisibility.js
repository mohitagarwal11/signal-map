export function deriveVisibility({ zoom, heatmapAvailable }) {
  const numericZoom = typeof zoom === "number" ? zoom : 0;

  const isHeatmapZoom = numericZoom < 5;

  const isClusterZoom = numericZoom >= 5 && numericZoom < 11;

  const isRawZoom = numericZoom >= 11;

  const heatmapVisible = heatmapAvailable && isHeatmapZoom;

  return {
    clusterVisible: (!heatmapAvailable && isHeatmapZoom) || isClusterZoom,

    heatmapVisible,

    rawVisible: isRawZoom,
  };
}
