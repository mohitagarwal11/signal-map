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

const CLUSTER_OPACITY_WITH_HEATMAP = [
  "interpolate",
  ["linear"],
  ["zoom"],
  3,
  0,
  5,
  0,
  6,
  0.22,
  7,
  0.48,
  10,
  0.72,
];

const CLUSTER_OPACITY_FALLBACK = [
  "interpolate",
  ["linear"],
  ["zoom"],
  3,
  0.14,
  5,
  0.26,
  7,
  0.48,
  10,
  0.72,
];

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
    "circle-blur": [
      "interpolate",
      ["linear"],
      ["zoom"],
      3,
      0.8,
      5,
      0.55,
      7,
      0.18,
      10,
      0,
    ],
    "circle-stroke-color": "#ffffff",
    "circle-stroke-width": [
      "interpolate",
      ["linear"],
      ["zoom"],
      3,
      0,
      5,
      0,
      7,
      0.45,
      10,
      1.4,
    ],
    "circle-stroke-opacity": [
      "interpolate",
      ["linear"],
      ["zoom"],
      3,
      0,
      5,
      0,
      7,
      0.35,
      10,
      0.82,
    ],
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
    "circle-opacity": 0.42,
    "circle-stroke-color": "#ffffff",
    "circle-stroke-width": 0.5,
    "circle-stroke-opacity": 0.35,
  },
};

const HEATMAP_LAYER = {
  id: HEATMAP_LAYER_ID,
  type: "heatmap",
  source: HEATMAP_SOURCE_ID,
  maxzoom: 6,
  paint: {
    "heatmap-weight": [
      "interpolate",
      ["linear"],
      ["get", "tower_count"],
      1,
      0,
      500,
      0.35,
      5000,
      0.7,
      50000,
      1,
    ],
    "heatmap-intensity": [
      "interpolate",
      ["linear"],
      ["zoom"],
      3,
      0.6,
      5,
      0.9,
      6,
      1.05,
    ],
    "heatmap-radius": [
      "interpolate",
      ["linear"],
      ["zoom"],
      3,
      14,
      5,
      26,
      6,
      34,
    ],
    "heatmap-opacity": [
      "interpolate",
      ["linear"],
      ["zoom"],
      3,
      0.32,
      5,
      0.46,
      6,
      0,
    ],
    "heatmap-color": [
      "interpolate",
      ["linear"],
      ["heatmap-density"],
      0,
      "rgba(0,0,0,0)",
      0.2,
      "#a4e5dd",
      0.45,
      "#5fcfc4",
      0.7,
      "#2d9d97",
      1,
      "#0b5f67",
    ],
  },
  layout: {
    visibility: "none",
  },
};

const RAW_TOWER_LAYER = {
  id: RAW_TOWER_LAYER_ID,
  type: "circle",
  source: RAW_TOWER_SOURCE_ID,
  paint: {
    "circle-radius": 3,
    "circle-color": "#f15b5b",
    "circle-opacity": 0.8,
    "circle-stroke-color": "#ffffff",
    "circle-stroke-width": 0.5,
    "circle-stroke-opacity": 0.6,
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
  if (!map || typeof map.getLayoutProperty !== "function") {
    return "unknown";
  }

  try {
    return map.getLayoutProperty(layerId, "visibility");
  } catch (error) {
    devLog("Layer visibility check failed:", error);
    return "unknown";
  }
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
      devLog("Heatmap layer unsupported; falling back to clusters only.", error);
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
  if (!ensureGeoJSONLayer({ ...config, data: geoJSON })) {
    return;
  }

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

function applyClusterOpacityFallback(map) {
  if (!map || !getMapLayer(map, CLUSTER_LAYER_ID)) {
    return;
  }

  if (typeof map.setPaintProperty === "function") {
    map.setPaintProperty(
      CLUSTER_LAYER_ID,
      "circle-opacity",
      CLUSTER_OPACITY_FALLBACK,
    );
  }
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

    let latestClusterGeoJSON = EMPTY_GEOJSON;
    let latestRawTowerGeoJSON = EMPTY_GEOJSON;
    let latestMode = "cluster";
    let latestLayerMode = null;
    let heatmapSupported = true;
    let clusterOpacityFallbackApplied = false;

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
      if (!heatmapSupported) {
        return;
      }

      const heatmapReady = ensureHeatmapLayer({
        ...getHeatmapLayerConfig(map),
        data: geoJSON,
      });

      if (heatmapReady === false) {
        heatmapSupported = false;
        clusterOpacityFallbackApplied = false;
        devLog("Heatmap disabled; using cluster circles only.", {
          zoom: getZoomValue(map),
        });
        return;
      }

      if (!heatmapReady) {
        return;
      }

      const source = getMapSource(map, HEATMAP_SOURCE_ID);

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

    const updateClusterSources = (map, geoJSON) => {
      updateHeatmapSource(map, geoJSON);
      updateGeoJSONSource(getClusterLayerConfig(map), geoJSON);

      if (!heatmapSupported && !clusterOpacityFallbackApplied) {
        applyClusterOpacityFallback(map);
        clusterOpacityFallbackApplied = true;
      }

      devLog("VIS cluster_state", {
        heatmapSupported,
        clusterLayerExists: Boolean(getMapLayer(map, CLUSTER_LAYER_ID)),
        heatmapLayerExists: Boolean(getMapLayer(map, HEATMAP_LAYER_ID)),
        clusterFeatureCount: geoJSON.features.length,
        zoom: getZoomValue(map),
        clusterVisibility: getLayerVisibility(map, CLUSTER_LAYER_ID),
        heatmapVisibility: getLayerVisibility(map, HEATMAP_LAYER_ID),
      });
    };

    const updateLayerVisibility = (map, mode) => {
      if (!map || mode === latestLayerMode) {
        return;
      }

      const transitionStart = performance.now();
      const isClusterMode = mode === "cluster";
      const isRawMode = mode === "raw";

      if (!heatmapSupported && !clusterOpacityFallbackApplied) {
        applyClusterOpacityFallback(map);
        clusterOpacityFallbackApplied = true;
      }

      setLayerVisibility(map, CLUSTER_LAYER_ID, isClusterMode, 0.7);
      if (heatmapSupported) {
        setLayerVisibility(
          map,
          HEATMAP_LAYER_ID,
          isClusterMode,
          0.45,
          "heatmap-opacity",
        );
      }
      setLayerVisibility(map, RAW_TOWER_LAYER_ID, isRawMode, 0.8);

      const transitionDuration = performance.now() - transitionStart;
      devLog("PERF layer_transition", {
        from: latestLayerMode ?? "none",
        to: mode,
        zoom: Number(map.getZoom().toFixed(2)),
        durationMs: Number(transitionDuration.toFixed(2)),
        heatmapSupported,
      });
      devLog("VIS layer_visibility", {
        zoom: Number(map.getZoom().toFixed(2)),
        heatmapSupported,
        clusterVisibility: getLayerVisibility(map, CLUSTER_LAYER_ID),
        heatmapVisibility: getLayerVisibility(map, HEATMAP_LAYER_ID),
        rawVisibility: getLayerVisibility(map, RAW_TOWER_LAYER_ID),
      });

      latestLayerMode = mode;
    };

    const viewportController = createViewportController({
      fetchClusters,
      fetchRawTowers,
      debounceMs: 300,
      onData: ({ mode, data }) => {
        const map = mapRef.current;
        latestMode = mode;

        if (mode === "cluster") {
          latestClusterGeoJSON = clustersToGeoJSON(data);
          updateClusterSources(map, latestClusterGeoJSON);
          updateLayerVisibility(map, "cluster");
          return;
        }

        if (mode === "raw") {
          latestRawTowerGeoJSON = towersToGeoJSON(data);
          updateGeoJSONSource(
            getRawTowerLayerConfig(map),
            latestRawTowerGeoJSON,
          );
          updateLayerVisibility(map, "raw");
        }
      },
    });

    const map = new mapplsClient.Map("map", {
      center: getInitialViewportCenter(),
      zoom: INITIAL_VIEWPORT_ZOOM,
      minZoom: 3.75,
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

        latestMode = "cluster";
        latestClusterGeoJSON = clustersToGeoJSON(snapshot.clusters);
        viewportController.hydrateViewport({
          bounds: snapshot.bounds,
          zoom: snapshot.zoom,
          mode: "cluster",
          data: snapshot.clusters,
        });

        updateClusterSources(map, latestClusterGeoJSON);
        updateLayerVisibility(map, "cluster");

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
      updateClusterSources(map, latestClusterGeoJSON);
      updateGeoJSONSource(getRawTowerLayerConfig(map), latestRawTowerGeoJSON);

      updateLayerVisibility(map, latestMode);
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
