import { heatmapPointsToGeoJSON } from "../../utils/heatmapPointsToGeoJSON";
import { INITIAL_HEATMAP_SNAPSHOT } from "../../constants/initialHeatmap";

export function hydrateInitialSnapshot({ renderState, viewportController }) {
  renderState.fetchMode = "density";

  renderState.densityGeoJSON = heatmapPointsToGeoJSON(INITIAL_HEATMAP_SNAPSHOT.points);

  renderState.densityAvailable = true;

  viewportController.hydrateViewport({
    bounds: INITIAL_HEATMAP_SNAPSHOT.bounds,
    zoom: INITIAL_HEATMAP_SNAPSHOT.zoom,
    mode: "density",
    data: INITIAL_HEATMAP_SNAPSHOT.points,
  });
}
