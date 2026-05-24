import { useEffect } from "react";
import { INITIAL_MAP_CONFIG } from "../map/config/mapConfig";
import {
  CLUSTER_SOURCE_ID,
  CLUSTER_LAYER_ID,
  HEATMAP_SOURCE_ID,
  HEATMAP_LAYER_ID,
  RAW_TOWER_SOURCE_ID,
  RAW_TOWER_LAYER_ID,
} from "../map/constants/layerIds";
import { MAX_RAW_TOWERS } from "../map/constants/renderConstants";
import { removeGeoJSONLayerResources } from "../map/sources/removeGeoJSONResources";
import { createRenderState } from "../map/state/createRenderState";
import { renderMap } from "../map/rendering/renderMap";
import { hydrateInitialSnapshot } from "../map/bootstrap/hydrateInitialSnapshot";
import { getViewport } from "../utils/getViewport";
import { clustersToGeoJSON } from "../utils/clustersToGeoJSON";
import { towersToGeoJSON } from "../utils/towersToGeoJSON";
import { getTowerClusters, getTowersData } from "../api/towers.api";
import { createViewportController } from "../services/viewport/viewportController";

import { devLog } from "../utils/devLog";

export default function Map({ setMapCenter }) {
  useEffect(() => {
    const mapplsClient = window.mappls;

    if (!mapplsClient) return;

    const renderState = createRenderState();

    const fetchClusters = async ({ bounds, zoom, signal }) => {
      const fetchStart = performance.now();
      const response = await getTowerClusters(bounds, zoom, signal);
      const fetchDuration = performance.now() - fetchStart;

      devLog("PERF cluster_fetch", {
        durationMs: Number(fetchDuration.toFixed(2)),
        clusterCount: response.data.length,
        zoom,
      });

      return response.data;
    };

    const fetchRawTowers = async ({ bounds, signal }) => {
      const fetchStart = performance.now();
      const response = await getTowersData(bounds, MAX_RAW_TOWERS, 0, {
        signal,
      });
      const fetchDuration = performance.now() - fetchStart;
      const towers = Array.isArray(response.data.data)
        ? response.data.data
        : [];
      const cappedTowers = towers.slice(0, MAX_RAW_TOWERS);

      devLog("PERF raw_fetch", {
        durationMs: Number(fetchDuration.toFixed(2)),
        returnedCount: towers.length,
        renderedCount: cappedTowers.length,
      });

      return cappedTowers;
    };

    const map = new mapplsClient.Map("map", INITIAL_MAP_CONFIG);

    const viewportController = createViewportController({
      fetchClusters,
      fetchRawTowers,
      debounceMs: 300,
      onData: ({ mode, data }) => {
        renderState.mode = mode;

        if (mode === "cluster") {
          renderState.clusterGeoJSON = clustersToGeoJSON(data);
          renderMap({
            map,
            renderState,
          });
          return;
        }

        if (mode === "raw") {
          renderState.rawGeoJSON = towersToGeoJSON(data);
          renderMap({
            map,
            renderState,
          });
        }
      },
    });

    const handleMapLoad = () => {
      renderState.mapReady = true;
      hydrateInitialSnapshot({
        renderState,
        viewportController,
      });
      renderMap({
        map,
        renderState,
      });
    };

    const requestViewportData = () => {
      viewportController.handleViewportChange({
        bounds: getViewport(map),
        zoom: map.getZoom(),
      });
    };

    const handleMoveEnd = () => {
      devLog("ZOOM: ", map.getZoom());
      requestViewportData();

      const center = map.getCenter();
      setMapCenter({
        lat: center.lat.toPrecision(6),
        lon: center.lng.toPrecision(6),
      });
    };

    map.on("load", handleMapLoad);
    map.on("moveend", handleMoveEnd);

    return () => {
      viewportController.destroy();
      map.off("load", handleMapLoad);
      map.off("moveend", handleMoveEnd);
      removeGeoJSONLayerResources(map, CLUSTER_SOURCE_ID, CLUSTER_LAYER_ID);
      removeGeoJSONLayerResources(map, HEATMAP_SOURCE_ID, HEATMAP_LAYER_ID);
      removeGeoJSONLayerResources(map, RAW_TOWER_SOURCE_ID, RAW_TOWER_LAYER_ID);
    };
  }, [setMapCenter]);

  return (
    <div
      id="map"
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    />
  );
}
