import { heatmapPointsToGeoJSON } from "../../utils/heatmapPointsToGeoJSON";
import { EMPTY_GEOJSON } from "../../map/constants/renderConstants";

export function hydrateInitialSnapshot({
  renderState,
  viewportController,
  snapshot,
  network = "all",
}) {
  if (network !== "all" || !snapshot) {
    return;
  }

  renderState.fetchMode = "heatmap";

  renderState.heatmapGeoJSON = heatmapPointsToGeoJSON(snapshot.points);

  renderState.heatmapAvailable = true;
  renderState.towersAvailable = false;
  renderState.towersGeoJSON = EMPTY_GEOJSON;

  viewportController.hydrateViewport({
    bounds: snapshot.bounds,
    zoom: snapshot.zoom,
    mode: "heatmap",
    data: snapshot.points,
    network,
  });
}
