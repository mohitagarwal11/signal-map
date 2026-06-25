import { getFetchMode } from './getFetchMode';
import { createViewportKey } from './viewportKey';
import { createViewportCache } from './viewportCache';
import { expandViewport } from '../../utils/expandViewport';
import { quantizeViewport } from '../../utils/quantizeViewport';

import { FETCH_DEBOUNCE_MS } from '../../constants/initialViewport';
import { debounceAsync } from '../../utils/debounceAsync';

const VIEWPORT_EXPANSION_FACTOR = {
  heatmap: 0.3,
  towers: 0.15,
};

const VIEWPORT_QUANTIZATION_STEP = {
  heatmap: 0.1,
  towers: 0.02,
  operator: 0.1,
  network: 0.1,
};

const DEBUG = false;

function isAbortError(error) {
  return (
    error?.name === 'AbortError' ||
    error?.name === 'CanceledError' ||
    error?.code === 'ERR_CANCELED'
  );
}

export function createViewportController(config) {
  const {
    fetchHeatmapPoints,
    fetchTowers,
    fetchOperatorDistribution,
    fetchNetworkDistribution,
    onData,
    debounceMs = FETCH_DEBOUNCE_MS,
  } = config;

  let activeRequest = null;
  const viewportCache = createViewportCache();
  const inFlightRequests = new Map();

  const fetchByMode = {
    heatmap: fetchHeatmapPoints,
    towers: fetchTowers,
  };

  function createDistributionCacheKey(mode, bounds, network, operator) {
    const quantized = quantizeViewport(bounds, VIEWPORT_QUANTIZATION_STEP[mode]);
    const viewportKey = createViewportKey(quantized);
    return `${mode}:${network}:${operator}:${viewportKey}`;
  }

  function createCachedDistributionFetcher(mode, fetchFn) {
    const debouncedFetch = debounceAsync(fetchFn, debounceMs);

    return async (bounds, network = 'all', operator = 'all') => {
      const cacheKey = createDistributionCacheKey(mode, bounds, network, operator);

      if (viewportCache.has(cacheKey)) {
        if (DEBUG) console.log('CACHE HIT', cacheKey);
        return viewportCache.get(cacheKey);
      }

      const data = await debouncedFetch(bounds, network, operator);
      viewportCache.set(cacheKey, data);
      return data;
    };
  }

  const debouncedFetchOperatorDistribution = createCachedDistributionFetcher(
    'operator',
    fetchOperatorDistribution,
  );
  const debouncedFetchNetworkDistribution = createCachedDistributionFetcher(
    'network',
    fetchNetworkDistribution,
  );
  
  // Same debounce mechanism now drives viewport data fetches, so there's a single debounce implementation
  const debouncedExecuteRequest = debounceAsync(executeRequest, debounceMs);

  function cancelActiveRequest() {
    if (activeRequest) {
      activeRequest.abort();
      activeRequest = null;
    }
  }

  function createCacheKey(mode, viewportKey, towerLimit, network = 'all', operator = 'all') {
    if (mode === 'towers' && typeof towerLimit === 'number') {
      return `${mode}:${network}:${operator}:${viewportKey}:${towerLimit}`;
    }

    return `${mode}:${network}:${operator}:${viewportKey}`;
  }

  function getFetchDescriptor({
    bounds,
    zoom,
    mode = getFetchMode(zoom),
    towerLimit,
    network = 'all',
    operator = 'all',
  }) {
    const fetchBounds = createFetchBounds(bounds, mode, zoom);
    const viewportKey = createViewportKey(fetchBounds);
    const cacheKey = createCacheKey(mode, viewportKey, towerLimit, network, operator);

    return {
      bounds: fetchBounds,
      mode,
      cacheKey,
      towerLimit,
      network,
      operator,
    };
  }

  function createFetchBounds(bounds, mode, zoom) {
    if (mode === 'towers' && typeof zoom === 'number' && zoom >= 15) {
      return bounds;
    }

    const bufferedBounds = expandViewport(bounds, VIEWPORT_EXPANSION_FACTOR[mode]);
    const quantizedBounds = quantizeViewport(bufferedBounds, VIEWPORT_QUANTIZATION_STEP[mode]);
    return quantizedBounds;
  }

  async function executeRequest({ bounds, zoom, mode, cacheKey, towerLimit, network, operator }) {
    const fetchViewportData = fetchByMode[mode];

    if (!fetchViewportData) {
      return;
    }

    if (viewportCache.has(cacheKey)) {
      if (DEBUG) console.log('CACHE HIT', cacheKey);
      cancelActiveRequest();
      onData({
        mode,
        data: viewportCache.get(cacheKey),
      });
      return;
    }

    if (DEBUG) console.log('CACHE MISS', cacheKey);

    if (inFlightRequests.has(cacheKey)) {
      if (DEBUG) console.log('REQUEST REUSED', cacheKey);

      try {
        const data = await inFlightRequests.get(cacheKey);

        onData({
          mode,
          data,
        });
      } catch (error) {
        if (!isAbortError(error)) {
          throw error;
        }
      }

      return;
    }

    cancelActiveRequest();

    const controller = new AbortController();

    activeRequest = controller;

    const requestPromise = fetchViewportData({
      bounds,
      zoom,
      towerLimit,
      network,
      operator,
      signal: controller.signal,
    })
      .then((data) => {
        viewportCache.set(cacheKey, data);
        return data;
      })
      .finally(() => {
        inFlightRequests.delete(cacheKey);
      });

    inFlightRequests.set(cacheKey, requestPromise);

    try {
      const data = await requestPromise;

      if (controller.signal.aborted) {
        return;
      }

      onData({
        mode,
        data,
      });
    } catch (error) {
      if (!isAbortError(error)) {
        throw error;
      }
    } finally {
      if (activeRequest === controller) {
        activeRequest = null;
      }
    }
  }

  function handleViewportChange({ bounds, zoom, towerLimit, network = 'all', operator = 'all' }) {
    const descriptor = getFetchDescriptor({
      bounds,
      zoom,
      towerLimit,
      network,
      operator,
    });

    debouncedExecuteRequest({ ...descriptor, zoom }).catch((error) => {
      if (!isAbortError(error)) {
        console.log('Error fetching viewport data:', error);
      }
    });
  }

  function hydrateViewport({ bounds, zoom, mode, data, network = 'all' }) {
    const { cacheKey } = getFetchDescriptor({ bounds, zoom, mode, network });
    viewportCache.set(cacheKey, data);
    if (DEBUG) console.log('CACHE HYDRATED', cacheKey);
  }

  function destroy() {
    cancelActiveRequest();
    inFlightRequests.clear();
    viewportCache.clear();
  }

  return {
    handleViewportChange,
    debouncedFetchOperatorDistribution,
    debouncedFetchNetworkDistribution,
    hydrateViewport,
    destroy,
  };
}
