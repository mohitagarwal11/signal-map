import { useEffect, useRef } from "react";
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
  getInitialHeatmapSnapshot,
  getTowerCount,
  getTowersData,
  getHeatmapPoints,
} from "../api/towers.api";
import { createViewportController } from "../services/viewport/viewportController";

import { devLog } from "../utils/devLog";

export default function Map({ setMapCenter, setTowerCount, selectedNetwork }) {
  const selectedNetworkRef = useRef(selectedNetwork);
  const mapRef = useRef(null);
  const requestViewportDataRef = useRef(null);

  useEffect(() => {
    selectedNetworkRef.current = selectedNetwork;

    if (requestViewportDataRef.current) {
      requestViewportDataRef.current();
    }
  }, [selectedNetwork]);

  useEffect(() => {
    const mapplsClient = window.mappls;

    if (!mapplsClient) return;

    const renderState = createRenderState();
    let initialHeatmapSnapshot = null;

    const fetchHeatmapPoints = async ({ bounds, zoom, signal, network }) => {
      const fetchStart = performance.now();
      const response = await getHeatmapPoints(bounds, zoom, {
        signal,
        network,
      });
      const fetchDuration = performance.now() - fetchStart;

      devLog("PERF heatmap_fetch", {
        durationMs: Number(fetchDuration.toFixed(2)),
        pointCount: response.data.length,
        zoom,
        network,
      });

      return response.data;
    };

    const fetchTowers = async ({
      bounds,
      zoom,
      towerLimit,
      signal,
      network,
    }) => {
      const fetchStart = performance.now();
      const requestedLimit = Number.isFinite(towerLimit)
        ? towerLimit
        : MAX_RAW_TOWERS;
      const response = await getTowersData(bounds, requestedLimit, 0, {
        signal,
        network,
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
        network,
      });

      return cappedTowers;
    };

    const fetchViewportTowerCount = async (bounds, network) => {
      const fetchStart = performance.now();
      const response = await getTowerCount(bounds, { network });
      const fetchDuration = performance.now() - fetchStart;
      const count = Number(response.data?.count ?? 0);

      devLog("PERF tower_count_fetch", {
        durationMs: Number(fetchDuration.toFixed(2)),
        count,
        network,
      });

      setTowerCount(count);

      return count;
    };

    const map = new mapplsClient.Map("map", INITIAL_MAP_CONFIG);
    mapRef.current = map;

    const viewportController = createViewportController({
      fetchHeatmapPoints,
      fetchTowers,
      getInitialHeatmapSnapshot: () => initialHeatmapSnapshot,
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

    const requestViewportData = async () => {
      const currentMap = mapRef.current;

      if (!currentMap) {
        return;
      }

      const bounds = getViewport(currentMap);
      const zoom = currentMap.getZoom();
      const network = selectedNetworkRef.current;
      const isMaxZoomTowerView = zoom >= 15;
      let towerLimit = MAX_RAW_TOWERS;

      if (isMaxZoomTowerView) {
        try {
          towerLimit = await fetchViewportTowerCount(bounds, network);
        } catch (error) {
          devLog("Error fetching max-zoom tower count:", error);
        }
      }

      viewportController.handleViewportChange({
        bounds,
        zoom,
        towerLimit,
        network,
      });

      if (!isMaxZoomTowerView) {
        fetchViewportTowerCount(bounds, network).catch((error) => {
          devLog("Error fetching tower count:", error);
        });
      }
    };

    requestViewportDataRef.current = requestViewportData;

    const handleMapLoad = async () => {
      renderState.mapReady = true;

      if (selectedNetworkRef.current === "all") {
        try {
          const response = await getInitialHeatmapSnapshot();
          initialHeatmapSnapshot = response.data;

          hydrateInitialSnapshot({
            renderState,
            viewportController,
            snapshot: initialHeatmapSnapshot,
            network: selectedNetworkRef.current,
          });
        } catch (error) {
          devLog("Error fetching initial heatmap snapshot:", error);
        }
      }

      renderMap({
        map,
        renderState,
      });

      requestViewportData();
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
      requestViewportDataRef.current = null;
      mapRef.current = null;
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
