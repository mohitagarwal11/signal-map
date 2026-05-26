import { getFetchMode } from "./getFetchMode";
import { createViewportKey } from "./viewportKey";
import { createViewportCache } from "./viewportCache";
import { expandViewport } from "../../utils/expandViewport";
import { quantizeViewport } from "../../utils/quantizeViewport";

import { devLog } from "../../utils/devLog";

const DEFAULT_DEBOUNCE_MS = 300;

const VIEWPORT_EXPANSION_FACTOR = {
  heatmap: 0.3,
  towers: 0.15,
};

const VIEWPORT_QUANTIZATION_STEP = {
  heatmap: 0.1,
  towers: 0.02,
};

function isAbortError(error) {
  return (
    error?.name === "AbortError" ||
    error?.name === "CanceledError" ||
    error?.code === "ERR_CANCELED"
  );
}

export function createViewportController(config) {
  const {
    fetchHeatmapPoints,
    fetchTowers,
    onData,
    debounceMs = DEFAULT_DEBOUNCE_MS,
  } = config;

  let debounceTimer = null;
  let activeRequest = null;
  let requestId = 0;
  const viewportCache = createViewportCache();
  const inFlightRequests = new Map();

  const fetchByMode = {
    heatmap: fetchHeatmapPoints,
    towers: fetchTowers,
  };

  function clearDebounce() {
    if (debounceTimer) {
      window.clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  }

  function cancelActiveRequest() {
    if (activeRequest) {
      activeRequest.abort();
      activeRequest = null;
    }
  }

  function createCacheKey(mode, viewportKey, towerLimit, network = "all") {
    if (mode === "towers" && typeof towerLimit === "number") {
      return `${mode}:${network}:${viewportKey}:${towerLimit}`;
    }

    return `${mode}:${network}:${viewportKey}`;
  }

  function getFetchDescriptor({
    bounds,
    zoom,
    mode = getFetchMode(zoom),
    towerLimit,
    network = "all",
  }) {
    const fetchBounds = createFetchBounds(bounds, mode, zoom);
    const viewportKey = createViewportKey(fetchBounds);
    const cacheKey = createCacheKey(mode, viewportKey, towerLimit, network);

    return {
      bounds: fetchBounds,
      mode,
      cacheKey,
      towerLimit,
      network,
    };
  }

  function createFetchBounds(bounds, mode, zoom) {
    if (mode === "towers" && typeof zoom === "number" && zoom >= 15) {
      return bounds;
    }

    const bufferedBounds = expandViewport(
      bounds,
      VIEWPORT_EXPANSION_FACTOR[mode],
    );
    const quantizedBounds = quantizeViewport(
      bufferedBounds,
      VIEWPORT_QUANTIZATION_STEP[mode],
    );
    return quantizedBounds;
  }

  async function executeRequest({
    bounds,
    zoom,
    mode,
    cacheKey,
    towerLimit,
    network,
  }) {
    const fetchViewportData = fetchByMode[mode];

    if (!fetchViewportData) {
      return;
    }

    if (viewportCache.has(cacheKey)) {
      devLog("CACHE HIT", cacheKey);
      requestId += 1;
      cancelActiveRequest();
      onData({
        mode,
        data: viewportCache.get(cacheKey),
      });
      return;
    }

    devLog("CACHE MISS", cacheKey);

    if (inFlightRequests.has(cacheKey)) {
      devLog("REQUEST REUSED", cacheKey);

      const currentRequestId = requestId + 1;
      requestId = currentRequestId;

      try {
        const data = await inFlightRequests.get(cacheKey);

        if (currentRequestId !== requestId) {
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
      }

      return;
    }

    cancelActiveRequest();

    const controller = new AbortController();
    const currentRequestId = requestId + 1;

    activeRequest = controller;
    requestId = currentRequestId;

    const requestPromise = fetchViewportData({
      bounds,
      zoom,
      towerLimit,
      network,
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

      if (controller.signal.aborted || currentRequestId !== requestId) {
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

  function handleViewportChange({ bounds, zoom, towerLimit, network = "all" }) {
    clearDebounce();

    debounceTimer = window.setTimeout(() => {
      const descriptor = getFetchDescriptor({
        bounds,
        zoom,
        towerLimit,
        network,
      });

      executeRequest({ ...descriptor, zoom }).catch((error) => {
        devLog("Error fetching viewport data:", error);
      });
    }, debounceMs);
  }

  function hydrateViewport({ bounds, zoom, mode, data, network = "all" }) {
    const { cacheKey } = getFetchDescriptor({ bounds, zoom, mode, network });
    viewportCache.set(cacheKey, data);
    devLog("CACHE HYDRATED", cacheKey);
  }

  function destroy() {
    clearDebounce();
    cancelActiveRequest();
    inFlightRequests.clear();
    viewportCache.clear();
  }

  return {
    handleViewportChange,
    hydrateViewport,
    destroy,
  };
}
