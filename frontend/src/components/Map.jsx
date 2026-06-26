import { useEffect, useRef } from 'react';
import { INITIAL_MAP_CONFIG } from '../map/config/mapConfig';
import {
  INITIAL_VIEWPORT_BOUNDS,
  INITIAL_VIEWPORT_ZOOM,
  FETCH_DEBOUNCE_MS,
} from '../constants/initialViewport';
import {
  HEATMAP_SOURCE_ID,
  HEATMAP_LAYER_ID,
  RAW_TOWER_SOURCE_ID,
  RAW_TOWER_LAYER_ID,
} from '../map/constants/layerIds';
import { EMPTY_GEOJSON, MAX_RAW_TOWERS } from '../map/constants/renderConstants';
import { removeGeoJSONLayerResources } from '../map/sources/removeGeoJSONResources';
import { createRenderState } from '../map/state/createRenderState';
import { renderMap } from '../map/rendering/renderMap';
import { getViewport } from '../utils/getViewport';
import { heatmapPointsToGeoJSON } from '../utils/heatmapPointsToGeoJSON';
import { towersToGeoJSON } from '../utils/towersToGeoJSON';
import {
  getTowersData,
  getHeatmapPoints,
  getOperatorDistribution,
  getNetworkDistribution,
} from '../api/towers.api';
import { createViewportController } from '../services/viewport/viewportController';
import { getAreaKm2 } from '../utils/getAreaKm2.js';
import { INITIAL_HEATMAP_POINTS } from '../data/InitialHeatmap.js';

// Flip to true to log fetch timings/counts when profiling backend perf.
const DEBUG_PERF = false;

export default function Map({
  setMapCenter,
  setOperatorDistribution,
  setNetworkDistribution,
  selectedNetwork,
  selectedOperator,
  setAreaKm2,
  flyTarget,
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

    const fetchHeatmapPoints = async ({ bounds, zoom, signal, network, operator }) => {
      const fetchStart = DEBUG_PERF ? performance.now() : 0;
      const response = await getHeatmapPoints(bounds, zoom, {
        signal,
        network,
        operator,
      });

      if (DEBUG_PERF) {
        console.log('PERF heatmap_fetch', {
          durationMs: Number((performance.now() - fetchStart).toFixed(2)),
          pointCount: response.data.length,
          zoom,
          network,
          operator,
        });
      }

      return response.data;
    };

    const fetchTowers = async ({ bounds, zoom, towerLimit, signal, network, operator }) => {
      const fetchStart = DEBUG_PERF ? performance.now() : 0;
      const requestedLimit = Number.isFinite(towerLimit) ? towerLimit : MAX_RAW_TOWERS;
      const response = await getTowersData(bounds, requestedLimit, 0, {
        signal,
        network,
        operator,
      });
      const towers = Array.isArray(response.data.data) ? response.data.data : [];
      const cappedTowers = towers.slice(0, requestedLimit);

      if (DEBUG_PERF) {
        console.log('PERF raw_fetch', {
          durationMs: Number((performance.now() - fetchStart).toFixed(2)),
          returnedCount: towers.length,
          renderedCount: cappedTowers.length,
          zoom,
          requestedLimit,
          network,
          operator,
        });
      }

      return cappedTowers;
    };

    const fetchViewportOperatorDistribution = async (bounds, network, operator) => {
      const fetchStart = DEBUG_PERF ? performance.now() : 0;
      const response = await getOperatorDistribution(bounds, {
        network,
        operator,
      });
      const operators = Array.isArray(response.data?.operators) ? response.data.operators : [];

      if (DEBUG_PERF) {
        console.log('PERF operator_distribution_fetch', {
          durationMs: Number((performance.now() - fetchStart).toFixed(2)),
          operatorCount: operators.length,
          network,
          operator,
        });
      }

      return operators;
    };

    const fetchViewportNetworkDistribution = async (bounds, network, operator) => {
      const fetchStart = DEBUG_PERF ? performance.now() : 0;
      const response = await getNetworkDistribution(bounds, {
        network,
        operator,
      });
      const networks = Array.isArray(response.data?.networks) ? response.data.networks : [];

      if (DEBUG_PERF) {
        console.log('PERF network_distribution_fetch', {
          durationMs: Number((performance.now() - fetchStart).toFixed(2)),
          networkCount: networks.length,
          network,
          operator,
        });
      }

      return networks;
    };

    const map = new mapplsClient.Map('map', INITIAL_MAP_CONFIG);
    mapRef.current = map;

    const { min_lat, max_lat, min_lon, max_lon } = INITIAL_VIEWPORT_BOUNDS;
    const sw = [min_lon, min_lat];
    const ne = [max_lon, max_lat];

    map.setMaxBounds([sw, ne]);

    const viewportController = createViewportController({
      fetchHeatmapPoints,
      fetchTowers,
      fetchOperatorDistribution: fetchViewportOperatorDistribution,
      fetchNetworkDistribution: fetchViewportNetworkDistribution,
      debounceMs: FETCH_DEBOUNCE_MS,
      onData: ({ mode, data }) => {
        renderState.fetchMode = mode;

        if (mode === 'heatmap') {
          renderState.heatmapGeoJSON = heatmapPointsToGeoJSON(data);
          renderState.heatmapAvailable = true;
          renderState.towersAvailable = false;
          renderState.towersGeoJSON = EMPTY_GEOJSON;

          renderMap({ map, renderState });

          return;
        }

        if (mode === 'towers') {
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

    viewportController.hydrateViewport({
      bounds: INITIAL_VIEWPORT_BOUNDS,
      zoom: INITIAL_VIEWPORT_ZOOM,
      mode: 'heatmap',
      data: INITIAL_HEATMAP_POINTS,
      network: 'all',
      operator: 'all',
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
          const operators = await viewportController.debouncedFetchOperatorDistribution(
            bounds,
            network,
            operator,
          );

          setOperatorDistribution(operators);

          const totalFromOperators = Array.isArray(operators)
            ? operators.reduce((sum, op) => sum + Number(op.tower_count ?? 0), 0)
            : 0;

          if (totalFromOperators > 0) {
            towerLimit = totalFromOperators;
          } else {
            towerLimit = MAX_RAW_TOWERS;
          }
        } catch (error) {
          if (error?.name !== 'CanceledError') {
            console.log('Error fetching operator distribution for towerLimit:', error);
          }
        }
      }

      viewportController
        .debouncedFetchNetworkDistribution(bounds, network, operator)
        .then((networks) => {
          setNetworkDistribution(networks);
        })
        .catch((error) => {
          if (error?.name !== 'CanceledError') {
            console.log('Error fetching network distribution:', error);
          }
        });

      viewportController.handleViewportChange({
        bounds,
        zoom,
        towerLimit,
        network,
        operator,
      });

      if (!isMaxZoomTowerView) {
        viewportController
          .debouncedFetchOperatorDistribution(bounds, network, operator)
          .then((operators) => {
            setOperatorDistribution(operators);
          })
          .catch((error) => {
            if (error?.name !== 'CanceledError') {
              console.log('Error fetching operator distribution:', error);
            }
          });
      }
    };

    const syncDashboard = () => {
      const bounds = getViewport(map);
      const area = getAreaKm2(bounds.min_lat, bounds.max_lat, bounds.min_lon, bounds.max_lon);

      setAreaKm2(Math.round(area * 100) / 100);

      const center = map.getCenter();
      setMapCenter({
        lat: center.lat.toPrecision(6),
        lon: center.lng.toPrecision(6),
      });
    };

    requestViewportDataRef.current = requestViewportData;

    const handleMapLoad = () => {
      renderState.mapReady = true;

      renderMap({
        map,
        renderState,
      });

      renderState.heatmapGeoJSON = heatmapPointsToGeoJSON(INITIAL_HEATMAP_POINTS);

      renderState.heatmapAvailable = true;
      renderMap({
        map,
        renderState,
      });

      syncDashboard();
    };

    const handleMoveEnd = () => {
      requestViewportData();
      syncDashboard();
    };

    map.on('load', handleMapLoad);
    map.on('moveend', handleMoveEnd);

    return () => {
      viewportController.destroy();
      requestViewportDataRef.current = null;
      mapRef.current = null;
      map.off('load', handleMapLoad);
      map.off('moveend', handleMoveEnd);
      removeGeoJSONLayerResources(map, HEATMAP_SOURCE_ID, HEATMAP_LAYER_ID);
      removeGeoJSONLayerResources(map, RAW_TOWER_SOURCE_ID, RAW_TOWER_LAYER_ID);
    };
  }, [setAreaKm2, setMapCenter, setNetworkDistribution, setOperatorDistribution]);

  useEffect(() => {
    if (!flyTarget || !mapRef.current) return;

    mapRef.current.flyTo({
      center: [flyTarget.lon, flyTarget.lat],
      zoom: flyTarget.zoom,
    });
  }, [flyTarget]);

  return (
    <div
      id="map"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    />
  );
}
