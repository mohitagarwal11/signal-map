import { useEffect } from "react";
import { INITIAL_MAP_CONFIG } from "../map/config/mapConfig";
import {
  HEATMAP_SOURCE_ID,
  HEATMAP_LAYER_ID,
  RAW_TOWER_SOURCE_ID,
  RAW_TOWER_LAYER_ID,
} from "../map/constants/layerIds";
import {
  EMPTY_GEOJSON,
  MAX_RAW_TOWERS,
} from "../map/constants/renderConstants";
import { removeGeoJSONLayerResources } from "../map/sources/removeGeoJSONResources";
import { createRenderState } from "../map/state/createRenderState";
import { renderMap } from "../map/rendering/renderMap";
import { hydrateInitialSnapshot } from "../map/bootstrap/hydrateInitialSnapshot";
import { getViewport } from "../utils/getViewport";
import { heatmapPointsToGeoJSON } from "../utils/heatmapPointsToGeoJSON";
import { towersToGeoJSON } from "../utils/towersToGeoJSON";
import {
  getTowerCount,
  getTowersData,
  getHeatmapPoints,
} from "../api/towers.api";
import { createViewportController } from "../services/viewport/viewportController";

import { devLog } from "../utils/devLog";

export default function Map({ setMapCenter, setTowerCount }) {
  useEffect(() => {
    const mapplsClient = window.mappls;

    if (!mapplsClient) return;

    const renderState = createRenderState();

    const fetchHeatmapPoints = async ({ bounds, zoom, signal }) => {
      const fetchStart = performance.now();
      const response = await getHeatmapPoints(bounds, zoom, signal);
      const fetchDuration = performance.now() - fetchStart;

      devLog("PERF heatmap_fetch", {
        durationMs: Number(fetchDuration.toFixed(2)),
        pointCount: response.data.length,
        zoom,
      });

      return response.data;
    };

    const fetchTowers = async ({ bounds, zoom, towerLimit, signal }) => {
      const fetchStart = performance.now();
      const requestedLimit = Number.isFinite(towerLimit)
        ? towerLimit
        : MAX_RAW_TOWERS;
      const response = await getTowersData(bounds, requestedLimit, 0, {
        signal,
      });
      const fetchDuration = performance.now() - fetchStart;
      const towers = Array.isArray(response.data.data)
        ? response.data.data
        : [];
      const cappedTowers = towers.slice(0, requestedLimit);

      devLog("PERF raw_fetch", {
        durationMs: Number(fetchDuration.toFixed(2)),
        returnedCount: towers.length,
        renderedCount: cappedTowers.length,
        zoom,
        requestedLimit,
      });

      return cappedTowers;
    };

    const fetchViewportTowerCount = async (bounds) => {
      const fetchStart = performance.now();
      const response = await getTowerCount(bounds);
      const fetchDuration = performance.now() - fetchStart;
      const count = Number(response.data?.count ?? 0);

      devLog("PERF tower_count_fetch", {
        durationMs: Number(fetchDuration.toFixed(2)),
        count,
      });

      setTowerCount(count);

      return count;
    };

    const map = new mapplsClient.Map("map", INITIAL_MAP_CONFIG);

    const viewportController = createViewportController({
      fetchHeatmapPoints,
      fetchTowers,
      debounceMs: 300,
      onData: ({ mode, data }) => {
        renderState.fetchMode = mode;

        if (mode === "heatmap") {
          renderState.heatmapGeoJSON = heatmapPointsToGeoJSON(data);
          renderState.heatmapAvailable = true;
          renderState.towersAvailable = false;
          renderState.towersGeoJSON = EMPTY_GEOJSON;

          renderMap({ map, renderState });

          return;
        }

        if (mode === "towers") {
          renderState.heatmapAvailable = false;
          renderState.heatmapGeoJSON = EMPTY_GEOJSON;
          renderState.towersAvailable = Array.isArray(data) && data.length > 0;
          renderState.towersGeoJSON = towersToGeoJSON(data);
          renderMap({
            map,
            renderState,
          });
          return;
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

      requestViewportData();
    };

    const requestViewportData = async () => {
      const bounds = getViewport(map);
      const zoom = map.getZoom();
      const isMaxZoomTowerView = zoom >= 15;
      let towerLimit = MAX_RAW_TOWERS;

      if (isMaxZoomTowerView) {
        try {
          towerLimit = await fetchViewportTowerCount(bounds);
        } catch (error) {
          devLog("Error fetching max-zoom tower count:", error);
        }
      }

      viewportController.handleViewportChange({
        bounds,
        zoom,
        towerLimit,
      });

      if (!isMaxZoomTowerView) {
        fetchViewportTowerCount(bounds).catch((error) => {
          devLog("Error fetching tower count:", error);
        });
      }
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
      removeGeoJSONLayerResources(map, HEATMAP_SOURCE_ID, HEATMAP_LAYER_ID);
      removeGeoJSONLayerResources(map, RAW_TOWER_SOURCE_ID, RAW_TOWER_LAYER_ID);
    };
  }, [setMapCenter, setTowerCount]);

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
