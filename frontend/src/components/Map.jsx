import { useEffect, useRef } from "react";
import { getViewport } from "../utils/getViewport";
import { clustersToGeoJSON } from "../utils/clustersToGeoJSON";
import { towersToGeoJSON } from "../utils/towersToGeoJSON";
import {
  getTowerClusters,
  getTowerCount,
  getTowersData,
} from "../api/towers.api";
import { createViewportController } from "../services/viewport/viewportController";

const CLUSTER_SOURCE_ID = "tower-clusters-source";
const CLUSTER_LAYER_ID = "tower-clusters-layer";
const RAW_TOWER_SOURCE_ID = "raw-towers-source";
const RAW_TOWER_LAYER_ID = "raw-towers-layer";

// Render bottlenecks show up before network bottlenecks on dense map views.
// Keep high-zoom raw rendering bounded even though the backend can return more.
const MAX_RAW_TOWERS = 1500;

const EMPTY_GEOJSON = {
  type: "FeatureCollection",
  features: [],
};

const CLUSTER_LAYER = {
  id: CLUSTER_LAYER_ID,
  type: "circle",
  source: CLUSTER_SOURCE_ID,
  paint: {
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["get", "tower_count"],
      1,
      5,
      25,
      8,
      100,
      13,
      500,
      20,
      2000,
      28,
    ],
    "circle-color": "#18b7a8",
    "circle-opacity": 0.7,
    "circle-stroke-color": "#ffffff",
    "circle-stroke-width": 1,
    "circle-stroke-opacity": 0.75,
  },
  layout: {
    visibility: "none",
  },
};

const CLUSTER_LAYER_FALLBACK = {
  ...CLUSTER_LAYER,
  paint: {
    ...CLUSTER_LAYER.paint,
    "circle-radius": 9,
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

    console.log("Falling back to static map layer styling:", error);
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

function updateGeoJSONSource(config, geoJSON) {
  if (!ensureGeoJSONLayer({ ...config, data: geoJSON })) {
    return;
  }

  const source = getMapSource(config.map, config.sourceId);

  if (source && typeof source.setData === "function") {
    source.setData(geoJSON);
  }
}

function setLayerVisibility(map, layerId, visible, visibleOpacity) {
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
      "circle-opacity",
      visible ? visibleOpacity : 0
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
  };
}

function getRawTowerLayerConfig(map) {
  return {
    map,
    sourceId: RAW_TOWER_SOURCE_ID,
    layerId: RAW_TOWER_LAYER_ID,
    layer: RAW_TOWER_LAYER,
  };
}

function hideViewportLayers(map) {
  setLayerVisibility(map, CLUSTER_LAYER_ID, false, 0.7);
  setLayerVisibility(map, RAW_TOWER_LAYER_ID, false, 0.8);
}

export default function Map({ setTowerCount, setMapCenter }) {
  const mapRef = useRef(null);

  useEffect(() => {
    const mapplsClient = window.mappls;

    if (!mapplsClient) return;

    let latestClusterGeoJSON = EMPTY_GEOJSON;
    let latestRawTowerGeoJSON = EMPTY_GEOJSON;
    let latestMode = "count";

    const fetchTowerCount = async ({ bounds, signal }) => {
      const response = await getTowerCount(bounds, { signal });
      return response.data.count;
    };

    const fetchClusters = async ({ bounds, zoom, signal }) => {
      const response = await getTowerClusters(bounds, zoom, signal);
      return response.data;
    };

    const fetchRawTowers = async ({ bounds, signal }) => {
      const response = await getTowersData(bounds, MAX_RAW_TOWERS, 0, {
        signal,
      });
      const towers = Array.isArray(response.data.data) ? response.data.data : [];

      return towers.slice(0, MAX_RAW_TOWERS);
    };

    const viewportController = createViewportController({
      fetchTowerCount,
      fetchClusters,
      fetchRawTowers,
      debounceMs: 300,
      onData: ({ mode, data }) => {
        const map = mapRef.current;
        latestMode = mode;

        if (mode === "count") {
          hideViewportLayers(map);
          setTowerCount(data);
          return;
        }

        if (mode === "cluster") {
          latestClusterGeoJSON = clustersToGeoJSON(data);
          updateGeoJSONSource(getClusterLayerConfig(map), latestClusterGeoJSON);
          setLayerVisibility(map, CLUSTER_LAYER_ID, true, 0.7);
          setLayerVisibility(map, RAW_TOWER_LAYER_ID, false, 0.8);
          return;
        }

        if (mode === "raw") {
          latestRawTowerGeoJSON = towersToGeoJSON(data);
          updateGeoJSONSource(
            getRawTowerLayerConfig(map),
            latestRawTowerGeoJSON
          );
          setLayerVisibility(map, CLUSTER_LAYER_ID, false, 0.7);
          setLayerVisibility(map, RAW_TOWER_LAYER_ID, true, 0.8);
        }
      },
    });

    const map = new mapplsClient.Map("map", {
      center: [23, 85],
      zoom: 3.75,
      minZoom: 3.75,
      maxZoom: 15,
      fullscreenControl: false,
      rotateControl: false,
    });

    mapRef.current = map;

    const handleMapLoad = () => {
      updateGeoJSONSource(getClusterLayerConfig(map), latestClusterGeoJSON);
      updateGeoJSONSource(getRawTowerLayerConfig(map), latestRawTowerGeoJSON);

      setLayerVisibility(map, CLUSTER_LAYER_ID, latestMode === "cluster", 0.7);
      setLayerVisibility(map, RAW_TOWER_LAYER_ID, latestMode === "raw", 0.8);
    };

    const requestViewportData = () => {
      viewportController.handleViewportChange({
        bounds: getViewport(map),
        zoom: map.getZoom(),
      });
    };

    const handleMoveEnd = () => {
      requestViewportData();

      const center = map.getCenter();
      setMapCenter({
        lat: center.lat.toPrecision(6),
        lon: center.lng.toPrecision(6),
      });
    };

    map.on("load", handleMapLoad);
    map.on("moveend", handleMoveEnd);

    requestViewportData();

    return () => {
      viewportController.destroy();
      map.off("load", handleMapLoad);
      map.off("moveend", handleMoveEnd);
      removeGeoJSONLayerResources(map, CLUSTER_SOURCE_ID, CLUSTER_LAYER_ID);
      removeGeoJSONLayerResources(map, RAW_TOWER_SOURCE_ID, RAW_TOWER_LAYER_ID);
      mapRef.current = null;
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
