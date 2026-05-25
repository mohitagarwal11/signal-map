import { useEffect } from "react";
import { INITIAL_MAP_CONFIG } from "../map/config/mapConfig";
import {
  DENSITY_SOURCE_ID,
  DENSITY_LAYER_ID,
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
import { densityToGeoJSON } from "../utils/densityToGeoJSON";
import { heatmapPointsToGeoJSON } from "../utils/heatmapPointsToGeoJSON";
import { towersToGeoJSON } from "../utils/towersToGeoJSON";
import { getTowersData, getHeatmapPoints } from "../api/towers.api";
import { createViewportController } from "../services/viewport/viewportController";

import { devLog } from "../utils/devLog";

export default function Map({ setMapCenter, setTowerCount }) {
  useEffect(() => {
    const mapplsClient = window.mappls;

    if (!mapplsClient) return;

    const renderState = createRenderState();

    const fetchDensityPoints = async ({ bounds, zoom, signal }) => {
      const fetchStart = performance.now();
      // Backend endpoint currently named /towers/heatmap; this wrapper names
      // the operation correctly as a density fetch while reusing the existing
      // API until backend renames are made.
      const response = await getHeatmapPoints(bounds, zoom, signal);
      const fetchDuration = performance.now() - fetchStart;

      devLog("PERF density_fetch", {
        durationMs: Number(fetchDuration.toFixed(2)),
        pointCount: response.data.length,
        zoom,
      });

      return response.data;
    };

    // name for the time being
    // const fetchClusters = async ({ bounds, zoom, signal }) => {
    //   const fetchStart = performance.now();
    //   const response = await getHeatmapPoints(bounds, zoom, signal);
    //   const fetchDuration = performance.now() - fetchStart;

    //   devLog("PERF density_fetch", {
    //     durationMs: Number(fetchDuration.toFixed(2)),
    //     pointCount: response.data.length,
    //     zoom,
    //   });

    //   return response.data;
    // };

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

      setTowerCount(towers.length);

      return cappedTowers;
    };

    const map = new mapplsClient.Map("map", INITIAL_MAP_CONFIG);

    const viewportController = createViewportController({
      fetchDensityPoints,
      fetchRawTowers,
      debounceMs: 300,
      onData: ({ mode, data }) => {
        // `mode` here is the fetch type emitted by the viewport controller
        // (now either 'density' or 'raw'). Record it in the canonical
        // `fetchMode` property rather than conflating with renderer `mode`.
        renderState.fetchMode = mode;

        if (mode === "density") {
          // Prefer densityToGeoJSON when incoming data contains aggregated
          // density properties; otherwise fall back to the legacy converter.
          const useDensityConverter =
            Array.isArray(data) &&
            data.length > 0 &&
            Object.prototype.hasOwnProperty.call(data[0], "tower_count");

          renderState.densityGeoJSON = useDensityConverter
            ? densityToGeoJSON(data)
            : heatmapPointsToGeoJSON(data);

          renderState.densityAvailable = true;
          renderState.rawAvailable = false;

          renderMap({ map, renderState });

          return;
        }

        if (mode === "raw") {
          renderState.rawAvailable = Array.isArray(data) && data.length > 0;
          renderState.rawGeoJSON = towersToGeoJSON(data);
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
      removeGeoJSONLayerResources(map, DENSITY_SOURCE_ID, DENSITY_LAYER_ID);
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
