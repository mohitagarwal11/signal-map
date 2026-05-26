import { useEffect, useRef } from "react";
import { INITIAL_MAP_CONFIG } from "../map/config/mapConfig";
import { INITIAL_VIEWPORT_BOUNDS } from "../constants/initialViewport";
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
import { getViewport } from "../utils/getViewport";
import { heatmapPointsToGeoJSON } from "../utils/heatmapPointsToGeoJSON";
import { towersToGeoJSON } from "../utils/towersToGeoJSON";
import {
  getTowerCount,
  getTowersData,
  getHeatmapPoints,
  getOperatorDistribution,
} from "../api/towers.api";
import { createViewportController } from "../services/viewport/viewportController";

import { devLog } from "../utils/devLog";

export default function Map({
  setMapCenter,
  setTowerCount,
  setOperatorDistribution,
  selectedNetwork,
  selectedOperator,
}) {
  const selectedNetworkRef = useRef(selectedNetwork);
  const selectedOperatorRef = useRef(selectedOperator);
  const mapRef = useRef(null);
  const requestViewportDataRef = useRef(null);

  useEffect(() => {
    selectedNetworkRef.current = selectedNetwork;
    selectedOperatorRef.current = selectedOperator;

    if (requestViewportDataRef.current) {
      requestViewportDataRef.current();
    }
  }, [selectedNetwork, selectedOperator]);

  useEffect(() => {
    const mapplsClient = window.mappls;

    if (!mapplsClient) return;

    const renderState = createRenderState();

    const fetchHeatmapPoints = async ({
      bounds,
      zoom,
      signal,
      network,
      operator,
    }) => {
      const fetchStart = performance.now();
      const response = await getHeatmapPoints(bounds, zoom, {
        signal,
        network,
        operator,
      });
      const fetchDuration = performance.now() - fetchStart;

      devLog("PERF heatmap_fetch", {
        durationMs: Number(fetchDuration.toFixed(2)),
        pointCount: response.data.length,
        zoom,
        network,
        operator,
      });

      return response.data;
    };

    const fetchTowers = async ({
      bounds,
      zoom,
      towerLimit,
      signal,
      network,
      operator,
    }) => {
      const fetchStart = performance.now();
      const requestedLimit = Number.isFinite(towerLimit)
        ? towerLimit
        : MAX_RAW_TOWERS;
      const response = await getTowersData(bounds, requestedLimit, 0, {
        signal,
        network,
        operator,
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
        operator,
      });

      return cappedTowers;
    };

    const fetchViewportTowerCount = async (bounds, network, operator) => {
      const fetchStart = performance.now();
      const response = await getTowerCount(bounds, { network, operator });
      const fetchDuration = performance.now() - fetchStart;
      const count = Number(response.data?.count ?? 0);

      devLog("PERF tower_count_fetch", {
        durationMs: Number(fetchDuration.toFixed(2)),
        count,
        network,
        operator,
      });

      setTowerCount(count);

      return count;
    };

    const fetchViewportOperatorDistribution = async (
      bounds,
      network,
      operator,
    ) => {
      const fetchStart = performance.now();
      const response = await getOperatorDistribution(bounds, {
        network,
        operator,
      });
      const fetchDuration = performance.now() - fetchStart;
      const operators = Array.isArray(response.data?.operators)
        ? response.data.operators
        : [];

      devLog("PERF operator_distribution_fetch", {
        durationMs: Number(fetchDuration.toFixed(2)),
        operatorCount: operators.length,
        network,
        operator,
      });

      setOperatorDistribution(operators);

      return operators;
    };

    const map = new mapplsClient.Map("map", INITIAL_MAP_CONFIG);
    mapRef.current = map;

    const { min_lat, max_lat, min_lon, max_lon } = INITIAL_VIEWPORT_BOUNDS;
    const sw = [min_lon, min_lat];
    const ne = [max_lon, max_lat];

    map.setMaxBounds([sw, ne]);

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

    const requestViewportData = async () => {
      const currentMap = mapRef.current;

      if (!currentMap) {
        return;
      }

      const bounds = getViewport(currentMap);
      const zoom = currentMap.getZoom();
      const network = selectedNetworkRef.current;
      const operator = selectedOperatorRef.current;
      const isMaxZoomTowerView = zoom >= 15;
      let towerLimit = MAX_RAW_TOWERS;

      if (isMaxZoomTowerView) {
        try {
          towerLimit = await fetchViewportTowerCount(bounds, network, operator);
        } catch (error) {
          devLog("Error fetching max-zoom tower count:", error);
        }
      }

      viewportController.handleViewportChange({
        bounds,
        zoom,
        towerLimit,
        network,
        operator,
      });

      if (!isMaxZoomTowerView) {
        fetchViewportTowerCount(bounds, network, operator).catch((error) => {
          devLog("Error fetching tower count:", error);
        });
      }

      fetchViewportOperatorDistribution(bounds, network, operator).catch(
        (error) => {
          devLog("Error fetching operator distribution:", error);
        },
      );
    };

    const syncCenterToDashboard = () => {
      const center = map.getCenter();
      setMapCenter({
        lat: center.lat.toPrecision(6),
        lon: center.lng.toPrecision(6),
      });
    };

    requestViewportDataRef.current = requestViewportData;

    const handleMapLoad = () => {
      devLog("ZOOM: ", map.getZoom());
      renderState.mapReady = true;

      renderMap({
        map,
        renderState,
      });

      syncCenterToDashboard();

      requestViewportData();
    };

    const handleMoveEnd = () => {
      devLog("ZOOM: ", map.getZoom());
      requestViewportData();

      syncCenterToDashboard();
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
  }, [setMapCenter, setTowerCount, setOperatorDistribution]);

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
