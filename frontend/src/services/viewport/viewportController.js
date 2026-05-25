import { getFetchMode } from "./getFetchMode";
import { createViewportKey } from "./viewportKey";
import { createViewportCache } from "./viewportCache";
import { expandViewport } from "../../utils/expandViewport";
import { quantizeViewport } from "../../utils/quantizeViewport";

import { devLog } from "../../utils/devLog";

const DEFAULT_DEBOUNCE_MS = 300;

const VIEWPORT_EXPANSION_FACTOR = {
  heatmap: 0.4,
  density: 0.3,
  raw: 0.15,
};

const VIEWPORT_QUANTIZATION_STEP = {
  heatmap: 0.25,
  density: 0.1,
  raw: 0.02,
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
    fetchRawTowers,
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
    raw: fetchRawTowers,
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

  function createCacheKey(mode, viewportKey) {
    return `${mode}:${viewportKey}`;
  }

  function getFetchDescriptor({ bounds, zoom, mode = getFetchMode(zoom) }) {
    const fetchBounds = createFetchBounds(bounds, mode);
    const viewportKey = createViewportKey(fetchBounds);
    const cacheKey = createCacheKey(mode, viewportKey);

    return {
      bounds: fetchBounds,
      mode,
      cacheKey,
    };
  }

  function createFetchBounds(bounds, mode) {
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

  async function executeRequest({ bounds, zoom, mode, cacheKey }) {
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

  function handleViewportChange({ bounds, zoom }) {
    clearDebounce();

    debounceTimer = window.setTimeout(() => {
      const descriptor = getFetchDescriptor({ bounds, zoom });

      executeRequest({ ...descriptor, zoom }).catch((error) => {
        devLog("Error fetching viewport data:", error);
      });
    }, debounceMs);
  }

  function hydrateViewport({ bounds, zoom, mode, data }) {
    const { cacheKey } = getFetchDescriptor({ bounds, zoom, mode });
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
