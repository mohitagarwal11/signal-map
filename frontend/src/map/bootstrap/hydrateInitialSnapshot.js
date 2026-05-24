import { clustersToGeoJSON } from "../../utils/clustersToGeoJSON";
import { INITIAL_CLUSTER_SNAPSHOT } from "../../constants/initialClusters";

export function hydrateInitialSnapshot({ renderState, viewportController }) {
  renderState.mode = "cluster";

  renderState.clusterGeoJSON = clustersToGeoJSON(
    INITIAL_CLUSTER_SNAPSHOT.clusters,
  );

  viewportController.hydrateViewport({
    bounds: INITIAL_CLUSTER_SNAPSHOT.bounds,
    zoom: INITIAL_CLUSTER_SNAPSHOT.zoom,
    mode: "cluster",
    data: INITIAL_CLUSTER_SNAPSHOT.clusters,
  });
}
