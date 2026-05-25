import { densityToGeoJSON } from "../../utils/densityToGeoJSON";
import { heatmapPointsToGeoJSON } from "../../utils/heatmapPointsToGeoJSON";
import { INITIAL_HEATMAP_SNAPSHOT } from "../../constants/initialHeatmap";

export function hydrateInitialSnapshot({ renderState, viewportController }) {
  // Initial snapshot represents aggregated density data. Set canonical
  // fetch mode and populate density dataset.
  renderState.fetchMode = "density";

  const useDensityConverter =
    Array.isArray(INITIAL_HEATMAP_SNAPSHOT.points) &&
    INITIAL_HEATMAP_SNAPSHOT.points.length > 0 &&
    Object.prototype.hasOwnProperty.call(
      INITIAL_HEATMAP_SNAPSHOT.points[0],
      "tower_count",
    );

  renderState.densityGeoJSON = useDensityConverter
    ? densityToGeoJSON(INITIAL_HEATMAP_SNAPSHOT.points)
    : heatmapPointsToGeoJSON(INITIAL_HEATMAP_SNAPSHOT.points);

  // Mark density dataset as available for initial snapshot.
  renderState.densityAvailable = true;

  viewportController.hydrateViewport({
    bounds: INITIAL_HEATMAP_SNAPSHOT.bounds,
    zoom: INITIAL_HEATMAP_SNAPSHOT.zoom,
    mode: "density",
    data: INITIAL_HEATMAP_SNAPSHOT.points,
  });
}
