import { getFetchMode } from "./fetchMode";
import { createViewportKey } from "./viewportKey";
import { createViewportCache } from "./viewportCache";

const DEFAULT_DEBOUNCE_MS = 300;

function isAbortError(error) {
  return (
    error?.name === "AbortError" ||
    error?.name === "CanceledError" ||
    error?.code === "ERR_CANCELED"
  );
}

export function createViewportController(config) {
  const {
    fetchTowerCount,
    fetchClusters,
    fetchRawTowers,
    onData,
    debounceMs = DEFAULT_DEBOUNCE_MS,
  } = config;

  let debounceTimer = null;
  let activeRequest = null;
  let lastCacheKey = null;
  let requestId = 0;
  const viewportCache = createViewportCache();
  const inFlightRequests = new Map();

  const fetchByMode = {
    count: fetchTowerCount,
    cluster: fetchClusters,
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

  async function executeRequest({ bounds, zoom, mode, cacheKey }) {
    const fetchViewportData = fetchByMode[mode];

    if (!fetchViewportData) {
      return;
    }

    if (viewportCache.has(cacheKey)) {
      console.log("CACHE HIT", cacheKey);
      requestId += 1;
      cancelActiveRequest();
      onData({
        mode,
        data: viewportCache.get(cacheKey),
      });
      return;
    }

    console.log("CACHE MISS", cacheKey);

    if (inFlightRequests.has(cacheKey)) {
      console.log("REQUEST REUSED", cacheKey);

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
      const viewportKey = createViewportKey(bounds);
      const mode = getFetchMode(zoom);
      const cacheKey = createCacheKey(mode, viewportKey);

      if (cacheKey === lastCacheKey && viewportCache.has(cacheKey)) {
        return;
      }

      lastCacheKey = cacheKey;
      executeRequest({ bounds, zoom, mode, cacheKey }).catch((error) => {
        console.log("Error fetching viewport data:", error);
      });
    }, debounceMs);
  }

  function destroy() {
    clearDebounce();
    cancelActiveRequest();
    inFlightRequests.clear();
    viewportCache.clear();
  }

  return {
    handleViewportChange,
    destroy,
  };
}
