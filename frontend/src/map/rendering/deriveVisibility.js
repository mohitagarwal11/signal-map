export function deriveVisibility({ zoom, heatmapAvailable }) {
  const numericZoom = typeof zoom === "number" ? zoom : 0;
  const isHeatmapZoom = numericZoom < 5;
  const isDensityZoom = numericZoom >= 5 && numericZoom < 11;
  const isRawZoom = numericZoom >= 11;
  const heatmapVisible = heatmapAvailable && isHeatmapZoom;

  return {
    densityVisible: (!heatmapAvailable && isHeatmapZoom) || isDensityZoom,
    heatmapVisible,
    rawVisible: isRawZoom,
  };
}
