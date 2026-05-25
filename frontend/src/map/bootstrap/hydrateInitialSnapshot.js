import { heatmapPointsToGeoJSON } from "../../utils/heatmapPointsToGeoJSON";
import { INITIAL_HEATMAP_SNAPSHOT } from "../../constants/initialHeatmap";

export function hydrateInitialSnapshot({
  renderState,
  viewportController,
  network = "all",
}) {
  if (network !== "all") {
    return;
  }

  renderState.fetchMode = "heatmap";

  renderState.heatmapGeoJSON = heatmapPointsToGeoJSON(
    INITIAL_HEATMAP_SNAPSHOT.points,
  );

  renderState.heatmapAvailable = true;

  viewportController.hydrateViewport({
    bounds: INITIAL_HEATMAP_SNAPSHOT.bounds,
    zoom: INITIAL_HEATMAP_SNAPSHOT.zoom,
    mode: "heatmap",
    data: INITIAL_HEATMAP_SNAPSHOT.points,
    network,
  });
}
