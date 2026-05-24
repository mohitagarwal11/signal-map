import { useEffect, useRef } from "react";
import { getViewport } from "../utils/getViewport";
import { clustersToGeoJSON } from "../utils/clustersToGeoJSON";
import { towersToGeoJSON } from "../utils/towersToGeoJSON";
import {
  INITIAL_VIEWPORT_BOUNDS,
  INITIAL_VIEWPORT_ZOOM,
} from "../constants/initialViewport";
import { getInitialClusterSnapshot } from "../api/bootstrap.api";
import { getTowerClusters, getTowersData } from "../api/towers.api";
import { createViewportController } from "../services/viewport/viewportController";
import { devLog } from "../utils/devLog";

const CLUSTER_SOURCE_ID = "tower-clusters-source";
const CLUSTER_LAYER_ID = "tower-clusters-layer";
const HEATMAP_SOURCE_ID = "tower-heatmap-source";
const HEATMAP_LAYER_ID = "tower-heatmap-layer";
const RAW_TOWER_SOURCE_ID = "raw-towers-source";
const RAW_TOWER_LAYER_ID = "raw-towers-layer";

// Render bottlenecks show up before network bottlenecks on dense map views.
// Keep high-zoom raw rendering bounded even though the backend can return more.
const MAX_RAW_TOWERS = 1500;

const EMPTY_GEOJSON = {
  type: "FeatureCollection",
  features: [],
};

const CLUSTER_OPACITY_WITH_HEATMAP = 0.9;

const CLUSTER_LAYER = {
  id: CLUSTER_LAYER_ID,
  type: "circle",
  source: CLUSTER_SOURCE_ID,
  paint: {
    // At national scale this behaves like a soft density field; as users zoom
    // in, the same layer sharpens into discrete regional infrastructure groups.
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["zoom"],
      3,
      [
        "interpolate",
        ["linear"],
        ["get", "tower_count"],
        1,
        2.5,
        500,
        4.5,
        5000,
        8.5,
        50000,
        17,
      ],
      5,
      [
        "interpolate",
        ["linear"],
        ["get", "tower_count"],
        1,
        3.5,
        500,
        7,
        5000,
        15,
        50000,
        28,
      ],
      7,
      [
        "interpolate",
        ["linear"],
        ["get", "tower_count"],
        1,
        5,
        500,
        13,
        5000,
        30,
        50000,
        44,
      ],
      10,
      [
        "interpolate",
        ["linear"],
        ["get", "tower_count"],
        1,
        7,
        500,
        22,
        5000,
        46,
        50000,
        64,
      ],
    ],
    "circle-color": [
      "interpolate",
      ["linear"],
      ["zoom"],
      3,
      [
        "interpolate",
        ["linear"],
        ["get", "tower_count"],
        1,
        "#a4e5dd",
        5000,
        "#5fcfc4",
        50000,
        "#2d9d97",
      ],
      7,
      [
        "interpolate",
        ["linear"],
        ["get", "tower_count"],
        1,
        "#42d6c4",
        500,
        "#18b7a8",
        5000,
        "#078f86",
        50000,
        "#045f67",
      ],
    ],
    "circle-opacity": CLUSTER_OPACITY_WITH_HEATMAP,
    "circle-blur": 0,
    "circle-stroke-color": "#ffffff",
    "circle-stroke-width": 2,
    "circle-stroke-opacity": 1,
  },
  layout: {
    visibility: "none",
  },
};

const CLUSTER_LAYER_FALLBACK = {
  ...CLUSTER_LAYER,
  paint: {
    "circle-radius": 16,
    "circle-color": "#18b7a8",
    "circle-opacity": 0.9,
    "circle-blur": 0,
    "circle-stroke-color": "#ffffff",
    "circle-stroke-width": 2,
    "circle-stroke-opacity": 1,
  },
};

const HEATMAP_LAYER = {
  id: HEATMAP_LAYER_ID,
  type: "heatmap",
  source: HEATMAP_SOURCE_ID,
  maxzoom: 5.2,

  paint: {
    "heatmap-weight": [
      "interpolate",
      ["linear"],
      ["ln", ["+", ["get", "tower_count"], 1]],

      0,
      0,
      2,
      0.1,
      4,
      0.25,
      6,
      0.5,
      8,
      0.78,
      10,
      1,
    ],

    // Main visual energy
    "heatmap-intensity": [
      "interpolate",
      ["linear"],
      ["zoom"],

      4,
      1.6,
      4.5,
      2,
      5,
      2.5,
    ],

    // Controls smoothing
    "heatmap-radius": [
      "interpolate",
      ["linear"],
      ["zoom"],

      4,
      40,
      4.5,
      58,
      5,
      76,
    ],

    // Fade into clusters
    "heatmap-opacity": [
      "interpolate",
      ["linear"],
      ["zoom"],

      4,
      0.92,
      4.7,
      0.72,
      5,
      0,
    ],

    // Density ramp
    "heatmap-color": [
      "interpolate",
      ["linear"],
      ["heatmap-density"],

      0.0,
      "rgba(0,0,0,0)",
      0.08,
      "rgba(90,90,255,0.20)",
      0.2,
      "#4f6df5",
      0.38,
      "#42d4c8",
      0.56,
      "#6fe35b",
      0.74,
      "#d7ea46",
      0.88,
      "#ffb340",
      1.0,
      "#ff4d4d",
    ],
  },

  layout: {
    visibility: "visible",
  },
};

const RAW_TOWER_LAYER = {
  id: RAW_TOWER_LAYER_ID,
  type: "circle",
  source: RAW_TOWER_SOURCE_ID,
  paint: {
    "circle-radius": 6,
    "circle-color": "#ff2d2d",
    "circle-opacity": 0.95,
    "circle-stroke-color": "#000000",
    "circle-stroke-width": 1.5,
    "circle-stroke-opacity": 1,
  },
  layout: {
    visibility: "none",
  },
};

function getMapSource(map, sourceId) {
  if (!map || typeof map.getSource !== "function") {
    return null;
  }

  return map.getSource(sourceId);
}

function getMapLayer(map, layerId) {
  if (!map || typeof map.getLayer !== "function") {
    return null;
  }

  return map.getLayer(layerId);
}

function getLayerVisibility(map, layerId) {
  if (!map || !getMapLayer(map, layerId)) {
    return "missing";
  }

  if (typeof map.getLayoutProperty === "function") {
    return map.getLayoutProperty(layerId, "visibility") ?? "unknown";
  }

  return "unknown";
}

function getZoomValue(map) {
  if (!map || typeof map.getZoom !== "function") {
    return null;
  }

  return Number(map.getZoom().toFixed(2));
}

function isMapStyleReady(map) {
  if (!map) {
    return false;
  }

  return typeof map.isStyleLoaded !== "function" || map.isStyleLoaded();
}

function addMapLayer(map, layer, fallbackLayer) {
  try {
    map.addLayer(layer);
  } catch (error) {
    if (!fallbackLayer) {
      throw error;
    }

    devLog("Falling back to static map layer styling:", error);
    map.addLayer(fallbackLayer);
  }
}

function ensureGeoJSONLayer({
  map,
  sourceId,
  layerId,
  layer,
  fallbackLayer,
  data = EMPTY_GEOJSON,
}) {
  if (
    !map ||
    typeof map.addSource !== "function" ||
    typeof map.addLayer !== "function" ||
    !isMapStyleReady(map)
  ) {
    return false;
  }

  if (!getMapSource(map, sourceId)) {
    map.addSource(sourceId, {
      type: "geojson",
      data,
    });
  }

  if (!getMapLayer(map, layerId)) {
    addMapLayer(map, layer, fallbackLayer);
  }

  return Boolean(getMapSource(map, sourceId));
}

function ensureHeatmapLayer({
  map,
  sourceId,
  layerId,
  layer,
  data = EMPTY_GEOJSON,
}) {
  if (
    !map ||
    typeof map.addSource !== "function" ||
    typeof map.addLayer !== "function" ||
    !isMapStyleReady(map)
  ) {
    return null;
  }

  if (!getMapSource(map, sourceId)) {
    map.addSource(sourceId, {
      type: "geojson",
      data,
    });
  }

  if (!getMapLayer(map, layerId)) {
    try {
      const beforeLayerId = getMapLayer(map, CLUSTER_LAYER_ID)
        ? CLUSTER_LAYER_ID
        : undefined;
      map.addLayer(layer, beforeLayerId);
    } catch (error) {
      devLog("Heatmap layer unsupported; falling back to clusters only.", {
        error: error?.message ?? error,
      });
      return false;
    }
  }

  const heatmapLayer = getMapLayer(map, layerId);
  if (!heatmapLayer || heatmapLayer.type !== "heatmap") {
    devLog("Heatmap layer unsupported; unexpected layer type.", {
      detectedType: heatmapLayer?.type ?? "none",
    });
    if (heatmapLayer && typeof map.removeLayer === "function") {
      map.removeLayer(layerId);
    }
    return false;
  }

  return Boolean(getMapSource(map, sourceId));
}

function updateGeoJSONSource(config, geoJSON) {
  const source = getMapSource(config.map, config.sourceId);

  if (source && typeof source.setData === "function") {
    const setDataStart = performance.now();
    source.setData(geoJSON);
    const setDataDuration = performance.now() - setDataStart;

    devLog("PERF geojson_source_set_data", {
      layerId: config.layerId,
      featureCount: geoJSON.features.length,
      durationMs: Number(setDataDuration.toFixed(2)),
    });

    if (config.logLabel) {
      devLog(`PERF ${config.logLabel}_source_set_data`, {
        layerId: config.layerId,
        featureCount: geoJSON.features.length,
        durationMs: Number(setDataDuration.toFixed(2)),
      });
    }
  }
}

function setLayerVisibility(
  map,
  layerId,
  visible,
  visibleOpacity,
  opacityProperty = "circle-opacity",
) {
  if (!map || !getMapLayer(map, layerId)) {
    return;
  }

  if (typeof map.setLayoutProperty === "function") {
    map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
    return;
  }

  if (typeof map.setPaintProperty === "function") {
    map.setPaintProperty(
      layerId,
      opacityProperty,
      visible ? visibleOpacity : 0,
    );
  }
}

function deriveVisibility({ zoom, heatmapAvailable }) {
  const numericZoom = typeof zoom === "number" ? zoom : 0;
  const isHeatmapZoom = numericZoom < 5;
  const isClusterZoom = numericZoom >= 5 && numericZoom < 11;
  const isRawZoom = numericZoom >= 11;
  const heatmapVisible = heatmapAvailable && isHeatmapZoom;

  return {
    clusterVisible: (!heatmapAvailable && isHeatmapZoom) || isClusterZoom,
    heatmapVisible,
    rawVisible: isRawZoom,
  };
}

function removeGeoJSONLayerResources(map, sourceId, layerId) {
  if (!map) {
    return;
  }

  if (getMapLayer(map, layerId) && typeof map.removeLayer === "function") {
    map.removeLayer(layerId);
  }

  if (getMapSource(map, sourceId) && typeof map.removeSource === "function") {
    map.removeSource(sourceId);
  }
}

function getClusterLayerConfig(map) {
  return {
    map,
    sourceId: CLUSTER_SOURCE_ID,
    layerId: CLUSTER_LAYER_ID,
    layer: CLUSTER_LAYER,
    fallbackLayer: CLUSTER_LAYER_FALLBACK,
    logLabel: "cluster",
  };
}

function getHeatmapLayerConfig(map) {
  return {
    map,
    sourceId: HEATMAP_SOURCE_ID,
    layerId: HEATMAP_LAYER_ID,
    layer: HEATMAP_LAYER,
  };
}

function getRawTowerLayerConfig(map) {
  return {
    map,
    sourceId: RAW_TOWER_SOURCE_ID,
    layerId: RAW_TOWER_LAYER_ID,
    layer: RAW_TOWER_LAYER,
    logLabel: "raw",
  };
}

function getInitialViewportCenter() {
  return [
    (INITIAL_VIEWPORT_BOUNDS.min_lat + INITIAL_VIEWPORT_BOUNDS.max_lat) / 2,
    (INITIAL_VIEWPORT_BOUNDS.min_lon + INITIAL_VIEWPORT_BOUNDS.max_lon) / 2,
  ];
}

export default function Map({ setMapCenter }) {
  const mapRef = useRef(null);

  useEffect(() => {
    const mapplsClient = window.mappls;

    if (!mapplsClient) return;

    const renderState = {
      mapReady: false,
      layersInitialized: false,
      mode: "cluster",
      heatmapAvailable: true,
      clusterGeoJSON: EMPTY_GEOJSON,
      rawGeoJSON: EMPTY_GEOJSON,
    };

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

    const updateHeatmapSource = (map, geoJSON) => {
      const source = getMapSource(map, HEATMAP_SOURCE_ID);

      if (!source) {
        devLog("HEATMAP_SOURCE_MISSING", {
          layerId: HEATMAP_LAYER_ID,
          featureCount: geoJSON.features.length,
          zoom: getZoomValue(map),
        });
        return;
      }

      if (source && typeof source.setData === "function") {
        const setDataStart = performance.now();
        source.setData(geoJSON);
        const setDataDuration = performance.now() - setDataStart;

        devLog("PERF heatmap_source_set_data", {
          layerId: HEATMAP_LAYER_ID,
          featureCount: geoJSON.features.length,
          durationMs: Number(setDataDuration.toFixed(2)),
        });
      }
    };

    const initializeLayersOnce = (map) => {
      if (!map || !isMapStyleReady(map)) {
        return false;
      }

      const clusterReady = ensureGeoJSONLayer({
        ...getClusterLayerConfig(map),
        data: renderState.clusterGeoJSON,
      });
      const rawReady = ensureGeoJSONLayer({
        ...getRawTowerLayerConfig(map),
        data: renderState.rawGeoJSON,
      });

      if (renderState.heatmapAvailable) {
        const heatmapReady = ensureHeatmapLayer({
          ...getHeatmapLayerConfig(map),
          data: renderState.clusterGeoJSON,
        });
        if (heatmapReady === false) {
          renderState.heatmapAvailable = false;
          devLog("Heatmap disabled; using cluster circles only.", {
            zoom: getZoomValue(map),
          });
        }
      }

      renderState.layersInitialized = clusterReady && rawReady;
      return renderState.layersInitialized;
    };

    const applyGeoJSONSources = (map) => {
      updateGeoJSONSource(
        getClusterLayerConfig(map),
        renderState.clusterGeoJSON,
      );
      updateGeoJSONSource(getRawTowerLayerConfig(map), renderState.rawGeoJSON);
      const heatmapSourcePresent = Boolean(
        getMapSource(map, HEATMAP_SOURCE_ID),
      );
      if (renderState.heatmapAvailable || heatmapSourcePresent) {
        updateHeatmapSource(map, renderState.clusterGeoJSON);
      } else {
        devLog("HEATMAP_UPDATE_SKIPPED", {
          zoom: getZoomValue(map),
        });
      }
    };

    const applyVisibility = (map) => {
      const zoom = getZoomValue(map);
      const { clusterVisible, heatmapVisible, rawVisible } = deriveVisibility({
        zoom,
        heatmapAvailable: renderState.heatmapAvailable,
      });

      setLayerVisibility(map, CLUSTER_LAYER_ID, clusterVisible, 0.9);
      if (renderState.heatmapAvailable) {
        setLayerVisibility(
          map,
          HEATMAP_LAYER_ID,
          heatmapVisible,
          0.85,
          "heatmap-opacity",
        );
      }
      setLayerVisibility(map, RAW_TOWER_LAYER_ID, rawVisible, 0.95);

      devLog("VISIBILITY_STATE", {
        mode: renderState.mode,
        zoom,
        clusterVisible,
        heatmapVisible,
        rawVisible,
        rawLayerPresent: Boolean(getMapLayer(map, RAW_TOWER_LAYER_ID)),
      });
    };

    const logHeatmapLayerStatus = (map) => {
      const heatmapLayer = getMapLayer(map, HEATMAP_LAYER_ID);
      devLog("HEATMAP_LAYER_STATUS", {
        sourcePresent: Boolean(getMapSource(map, HEATMAP_SOURCE_ID)),
        layerPresent: Boolean(heatmapLayer),
        featureCount: renderState.clusterGeoJSON.features.length,
        layerType: heatmapLayer?.type ?? "none",
        visibility: getLayerVisibility(map, HEATMAP_LAYER_ID),
        zoom: getZoomValue(map),
      });
    };

    const renderMap = () => {
      const map = mapRef.current;
      if (!map || !renderState.mapReady || !isMapStyleReady(map)) {
        return;
      }

      initializeLayersOnce(map);
      devLog("RAW_LAYER_STATUS", {
        mode: renderState.mode,
        zoom: getZoomValue(map),
        rawFeatureCount: renderState.rawGeoJSON.features.length,
        rawSourcePresent: Boolean(getMapSource(map, RAW_TOWER_SOURCE_ID)),
        rawLayerPresent: Boolean(getMapLayer(map, RAW_TOWER_LAYER_ID)),
      });
      applyGeoJSONSources(map);
      applyVisibility(map);
      logHeatmapLayerStatus(map);
    };

    const viewportController = createViewportController({
      fetchClusters,
      fetchRawTowers,
      debounceMs: 300,
      onData: ({ mode, data }) => {
        renderState.mode = mode;

        if (mode === "cluster") {
          renderState.clusterGeoJSON = clustersToGeoJSON(data);
          renderMap();
          return;
        }

        if (mode === "raw") {
          renderState.rawGeoJSON = towersToGeoJSON(data);
          renderMap();
        }
      },
    });

    const map = new mapplsClient.Map("map", {
      center: getInitialViewportCenter(),
      zoom: INITIAL_VIEWPORT_ZOOM,
      minZoom: 4,
      maxZoom: 15,
      fullscreenControl: false,
      rotateControl: false,
    });

    mapRef.current = map;
    let isUnmounted = false;

    const renderInitialSnapshot = async () => {
      const startupStart = performance.now();

      try {
        // The first India-wide view is deterministic and expensive, so it is
        // treated like a pre-generated spatial tile for instant startup.
        const snapshotFetchStart = performance.now();
        const { snapshot, rawBytes, contentEncoding } =
          await getInitialClusterSnapshot();
        const snapshotFetchDuration = performance.now() - snapshotFetchStart;

        devLog("PERF initial_snapshot_fetch", {
          durationMs: Number(snapshotFetchDuration.toFixed(2)),
          rawBytes,
          contentEncoding: contentEncoding || "none",
          clusterCount: snapshot.clusters.length,
        });

        if (isUnmounted) {
          return;
        }

        renderState.mode = "cluster";
        renderState.clusterGeoJSON = clustersToGeoJSON(snapshot.clusters);
        viewportController.hydrateViewport({
          bounds: snapshot.bounds,
          zoom: snapshot.zoom,
          mode: "cluster",
          data: snapshot.clusters,
        });
        renderMap();

        const startupDuration = performance.now() - startupStart;
        devLog("PERF initial_snapshot_render", {
          durationMs: Number(startupDuration.toFixed(2)),
          clusterCount: snapshot.clusters.length,
        });
      } catch (error) {
        devLog("Error loading initial cluster snapshot:", error);
        requestViewportData();
      }
    };

    const handleMapLoad = () => {
      renderState.mapReady = true;
      renderMap();
    };

    const requestViewportData = () => {
      viewportController.handleViewportChange({
        bounds: getViewport(map),
        zoom: map.getZoom(),
      });
    };

    const handleMoveEnd = () => {
      devLog("zoom: ", map.getZoom());
      requestViewportData();

      const center = map.getCenter();
      setMapCenter({
        lat: center.lat.toPrecision(6),
        lon: center.lng.toPrecision(6),
      });
    };

    map.on("load", handleMapLoad);
    map.on("moveend", handleMoveEnd);

    renderInitialSnapshot();

    return () => {
      isUnmounted = true;
      viewportController.destroy();
      map.off("load", handleMapLoad);
      map.off("moveend", handleMoveEnd);
      removeGeoJSONLayerResources(map, CLUSTER_SOURCE_ID, CLUSTER_LAYER_ID);
      removeGeoJSONLayerResources(map, HEATMAP_SOURCE_ID, HEATMAP_LAYER_ID);
      removeGeoJSONLayerResources(map, RAW_TOWER_SOURCE_ID, RAW_TOWER_LAYER_ID);
      mapRef.current = null;
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
