import { heatmapPointsToGeoJSON } from "../../utils/heatmapPointsToGeoJSON";
import { INITIAL_HEATMAP_SNAPSHOT } from "../../constants/initialHeatmap";

export function hydrateInitialSnapshot({ renderState, viewportController }) {
  renderState.mode = "heatmap";

  renderState.heatmapGeoJSON = heatmapPointsToGeoJSON(
    INITIAL_HEATMAP_SNAPSHOT.points,
  );

  viewportController.hydrateViewport({
    bounds: INITIAL_HEATMAP_SNAPSHOT.bounds,
    zoom: INITIAL_HEATMAP_SNAPSHOT.zoom,
    mode: "heatmap",
    data: INITIAL_HEATMAP_SNAPSHOT.points,
  });
}
